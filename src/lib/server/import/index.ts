import { getCachedImport, setCachedImport } from './cache';
import { fetchDirect } from './direct';
import {
	extractImagesFromMarkdown,
	extractMetadata,
	normalizeCurrency,
	normalizeImage,
	pickBestImage
} from './metadata';
import { extractWithLlm, type LlmExtraction } from './llm';
import { fetchWithJinaReader, fetchWithReader, readerConfigured, readerProvider } from './reader';
import { emptyProduct, type ImportResult, type ProductImport } from './schema';
import { assertPublicHttpUrl, ImportUrlError } from './ssrf';

function cleanText(value: string | null, maxLength: number): string | null {
	if (!value) return null;
	const trimmed = value.replace(/\s+/g, ' ').trim();
	return trimmed ? trimmed.slice(0, maxLength) : null;
}

function mergeProduct(base: ProductImport, patch: Partial<ProductImport>): void {
	base.title = base.title ?? cleanText(patch.title ?? null, 300);
	base.price = base.price ?? patch.price ?? null;
	base.currency = base.currency ?? normalizeCurrency(patch.currency) ?? null;
	base.image_url = base.image_url ?? normalizeImage(patch.image_url, base.url);
	base.description = base.description ?? cleanText(patch.description ?? null, 2000);
}

function mergeLlm(base: ProductImport, patch: LlmExtraction): void {
	base.title = base.title ?? cleanText(patch.title, 300);
	base.price = base.price ?? patch.price;
	base.currency = base.currency ?? normalizeCurrency(patch.currency);
	base.image_url = base.image_url ?? normalizeImage(patch.image_url, base.url);
	base.description = base.description ?? cleanText(patch.description, 2000);
}

function isComplete(product: ProductImport): boolean {
	return Boolean(product.title && product.image_url && product.price !== null);
}

function isGenericTitle(title: string | null, url: string): boolean {
	if (!title) return true;

	const normalized = title.toLowerCase().replace(/[^a-z0-9]/g, '');
	const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
	const hostCompact = host.replace(/[^a-z0-9]/g, '');
	const brand = host.split('.')[0].replace(/[^a-z0-9]/g, '');
	const generic = new Set([
		hostCompact,
		brand,
		'amazon',
		'lego',
		'fnac',
		'darty',
		'decathlon',
		'accueil',
		'home',
		'connexion',
		'login',
		'signin',
		'captcha',
		'justamoment',
		'accessdenied',
		'boutique'
	]);

	return normalized.length < 3 || generic.has(normalized);
}

function addWarning(warnings: string[], message: string): void {
	if (!warnings.includes(message)) warnings.push(message);
}

function finish(
	product: ProductImport,
	source: ImportResult['source'],
	warnings: string[]
): ImportResult {
	const ok = Boolean(product.title);

	if (ok && product.price === null) addWarning(warnings, "Le prix n'a pas pu être lu.");
	if (ok && !product.image_url) addWarning(warnings, "L'image n'a pas pu être lue.");
	if (ok && warnings.length > 0) addWarning(warnings, 'Vérifiez les informations avant d’ajouter.');
	if (!ok) addWarning(warnings, 'Essayez une capture d’écran ou remplissez l’article à la main.');

	const complete = ok && isComplete(product);
	const visibleWarnings = complete
		? warnings.filter(
				(warning) =>
					!warning.includes('refuse la lecture automatique') &&
					warning !== 'Vérifiez les informations avant d’ajouter.'
			)
		: warnings;

	const result: ImportResult = {
		ok,
		status: complete ? 'complete' : 'partial',
		product,
		source,
		warnings: visibleWarnings,
		error: ok ? null : 'Impossible de lire les informations de ce produit.'
	};

	setCachedImport(product.url, result);
	return result;
}

export async function importProduct(input: string): Promise<ImportResult> {
	let url: URL;
	try {
		url = await assertPublicHttpUrl(input);
	} catch (error) {
		const message =
			error instanceof ImportUrlError
				? error.message
				: "Ce lien n'est pas valide ou ne peut pas être lu.";
		return {
			ok: false,
			status: 'partial',
			product: emptyProduct(input),
			source: 'none',
			warnings: [],
			error: message
		};
	}

	const key = url.toString();
	const cached = getCachedImport(key);
	if (cached) return cached;

	const product = emptyProduct(key);
	const warnings: string[] = [];
	let source: ImportResult['source'] = 'none';
	let directText = '';
	let readerTitle: string | null = null;

	const direct = await fetchDirect(key);

	if (direct.ok) {
		try {
			const metadata = extractMetadata(direct.html, direct.finalUrl);
			directText = metadata.text;
			mergeProduct(product, {
				title: metadata.title,
				price: metadata.price,
				currency: metadata.currency,
				image_url: metadata.image_url,
				description: metadata.description
			});

			if (product.title) source = 'direct';
		} catch {
			addWarning(warnings, "Les métadonnées de cette page n'ont pas pu être lues.");
		}
	} else if (direct.blocked) {
		addWarning(warnings, 'Ce site refuse la lecture automatique ; on essaie une autre méthode.');
	} else if (direct.reason === 'unsupported-content-type') {
		addWarning(warnings, 'Ce lien ne pointe pas vers une page produit lisible.');
	}

	if (isComplete(product)) return finish(product, source, warnings);

	if (readerConfigured()) {
		const reader = await fetchWithReader(key);

		if (reader) {
			readerTitle = reader.title;

			if (!product.image_url) {
				const image = pickBestImage(extractImagesFromMarkdown(reader.content, key));
				if (image) product.image_url = image;
			}

			if (!product.title && reader.title && !isGenericTitle(reader.title, key)) {
				product.title = cleanText(reader.title, 300);
			}
			if (source === 'none') source = 'reader';

			const llm = await extractWithLlm({
				url: key,
				title: product.title ?? reader.title,
				metadata: JSON.stringify({
					price: product.price,
					currency: product.currency,
					image_url: product.image_url,
					description: product.description
				}),
				text: reader.content
			});

			if (llm) {
				mergeLlm(product, llm);
			}
		} else if (!product.title) {
			addWarning(warnings, "La lecture automatique n'a pas pu récupérer cette page.");
		}
	}

	if (!product.image_url && product.title && readerProvider() === 'deepseek') {
		const imagePage = await fetchWithJinaReader(key);
		if (imagePage) {
			const image = pickBestImage(extractImagesFromMarkdown(imagePage.content, key));
			if (image) product.image_url = image;
		}
	}

	if (!isComplete(product) && directText) {
		const llm = await extractWithLlm({
			url: key,
			title: product.title ?? readerTitle,
			metadata: JSON.stringify({
				price: product.price,
				currency: product.currency,
				image_url: product.image_url,
				description: product.description
			}),
			text: directText
		});

		if (llm) {
			mergeLlm(product, llm);
			if (source === 'none') source = 'llm';
		}
	}

	product.title = cleanText(product.title, 300);
	if (isGenericTitle(product.title, key)) product.title = null;
	product.description = cleanText(product.description, 2000);
	product.currency = normalizeCurrency(product.currency);

	return finish(product, source, warnings);
}
