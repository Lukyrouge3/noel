import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export type ExtractedPage = {
	title: string | null;
	price: number | null;
	currency: string | null;
	image_url: string | null;
	description: string | null;
	text: string;
};

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasProductType(value: unknown): boolean {
	if (typeof value === 'string') return value.toLowerCase() === 'product';
	if (Array.isArray(value)) return value.some((entry) => hasProductType(entry));
	return false;
}

function findProduct(value: unknown, depth = 0): JsonObject | null {
	if (depth > 8 || value === null || value === undefined) return null;

	if (Array.isArray(value)) {
		for (const entry of value) {
			const found = findProduct(entry, depth + 1);
			if (found) return found;
		}
		return null;
	}

	if (!isObject(value)) return null;
	if (hasProductType(value['@type'])) return value;

	for (const key of ['@graph', 'mainEntity', 'item', 'itemListElement', 'hasVariant']) {
		const found = findProduct(value[key], depth + 1);
		if (found) return found;
	}

	return null;
}

export function parsePrice(value: unknown): number | null {
	if (typeof value === 'number') {
		return Number.isFinite(value) && value >= 0 ? value : null;
	}

	if (typeof value === 'string') {
		const raw = value.trim();
		if (!raw) return null;

		const cleaned = raw.replace(/[^\d.,-]/g, '');
		if (!cleaned) return null;

		const hasComma = cleaned.includes(',');
		const hasDot = cleaned.includes('.');

		let normalized = cleaned;
		if (hasComma && hasDot) {
			normalized =
				cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')
					? cleaned.replace(/\./g, '').replace(',', '.')
					: cleaned.replace(/,/g, '');
		} else if (hasComma) {
			const decimals = cleaned.split(',').pop()?.length ?? 0;
			normalized =
				decimals > 0 && decimals <= 2 ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '');
		}

		const parsed = Number.parseFloat(normalized);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
	}

	if (Array.isArray(value)) {
		for (const entry of value) {
			const parsed = parsePrice(entry);
			if (parsed !== null) return parsed;
		}
		return null;
	}

	if (isObject(value)) {
		return parsePrice(value.price ?? value.lowPrice ?? value.value ?? value.amount);
	}

	return null;
}

export function normalizeImage(value: unknown, baseUrl: string): string | null {
	if (Array.isArray(value)) {
		for (const entry of value) {
			const normalized = normalizeImage(entry, baseUrl);
			if (normalized) return normalized;
		}
		return null;
	}

	if (isObject(value)) {
		return normalizeImage(value.url ?? value.contentUrl ?? value['@id'], baseUrl);
	}

	if (typeof value !== 'string') return null;

	const raw = value.trim();
	if (!raw || raw.startsWith('data:')) return null;

	try {
		const url = new URL(raw, baseUrl);
		if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
		return url.toString();
	} catch {
		return null;
	}
}

export function normalizeCurrency(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const code = value.trim().toUpperCase();
	return /^[A-Z]{3}$/.test(code) ? code : null;
}

function metaContent(document: Document, selectors: string[]): string | null {
	for (const selector of selectors) {
		const element = document.querySelector(selector);
		const content = element?.getAttribute('content')?.trim();
		if (content) return content;
	}
	return null;
}

function truncate(value: string | null, maxLength: number): string | null {
	if (!value) return null;
	const trimmed = value.replace(/\s+/g, ' ').trim();
	return trimmed ? trimmed.slice(0, maxLength) : null;
}

export function extractMetadata(html: string, pageUrl: string): ExtractedPage {
	const dom = new JSDOM(html, { url: pageUrl });
	const document = dom.window.document;

	let jsonLdProduct: JsonObject | null = null;

	for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
		const content = script.textContent?.trim();
		if (!content) continue;

		try {
			const parsed: unknown = JSON.parse(content);
			const product = findProduct(parsed);
			if (product) {
				jsonLdProduct = product;
				break;
			}
		} catch {
			// Ignore malformed structured data.
		}
	}

	const offers = jsonLdProduct?.offers;
	const offerObject = Array.isArray(offers) ? offers[0] : offers;

	const title =
		truncate(typeof jsonLdProduct?.name === 'string' ? jsonLdProduct.name : null, 300) ??
		truncate(
			metaContent(document, ['meta[property="og:title"]', 'meta[name="twitter:title"]']),
			300
		) ??
		truncate(document.title, 300);

	const price =
		parsePrice(jsonLdProduct?.offers) ??
		parsePrice(
			metaContent(document, [
				'meta[property="product:price:amount"]',
				'meta[property="og:price:amount"]',
				'meta[itemprop="price"]'
			])
		) ??
		parsePrice(
			document.querySelector('[itemprop="price"]')?.getAttribute('content') ??
				document.querySelector('[itemprop="price"]')?.textContent
		);

	const currency =
		normalizeCurrency(isObject(offerObject) ? offerObject.priceCurrency : null) ??
		normalizeCurrency(
			metaContent(document, [
				'meta[property="product:price:currency"]',
				'meta[property="og:price:currency"]',
				'meta[itemprop="priceCurrency"]'
			])
		) ??
		normalizeCurrency(
			document.querySelector('[itemprop="priceCurrency"]')?.getAttribute('content') ??
				document.querySelector('[itemprop="priceCurrency"]')?.textContent
		);

	const image_url =
		normalizeImage(jsonLdProduct?.image, pageUrl) ??
		normalizeImage(
			metaContent(document, [
				'meta[property="og:image:secure_url"]',
				'meta[property="og:image"]',
				'meta[name="twitter:image"]',
				'meta[name="twitter:image:src"]'
			]),
			pageUrl
		) ??
		normalizeImage(document.querySelector('link[rel="image_src"]')?.getAttribute('href'), pageUrl);

	const description =
		truncate(
			typeof jsonLdProduct?.description === 'string' ? jsonLdProduct.description : null,
			2000
		) ??
		truncate(
			metaContent(document, [
				'meta[property="og:description"]',
				'meta[name="twitter:description"]',
				'meta[name="description"]'
			]),
			2000
		);

	let text = '';
	try {
		const clone = document.cloneNode(true) as Document;
		const article = new Readability(clone, { charThreshold: 80 }).parse();
		text = (article?.textContent ?? document.body?.textContent ?? '')
			.replace(/\s+/g, ' ')
			.trim()
			.slice(0, 12_000);
	} catch {
		text = (document.body?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 12_000);
	}

	return {
		title,
		price,
		currency,
		image_url,
		description,
		text
	};
}

export function extractImagesFromMarkdown(markdown: string, pageUrl: string): string[] {
	const images: string[] = [];
	const markdownImage = /!\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gi;
	const htmlImage = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi;

	for (const regex of [markdownImage, htmlImage]) {
		for (const match of markdown.matchAll(regex)) {
			const normalized = normalizeImage(match[1], pageUrl);
			if (normalized && !images.includes(normalized)) images.push(normalized);
		}
	}

	return images;
}
