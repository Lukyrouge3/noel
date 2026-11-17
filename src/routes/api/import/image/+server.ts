import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { extractFromImage, llmConfigured } from '$lib/server/import/llm';
import { isRateLimited } from '$lib/server/import/rate-limit';

export const config = {
	bodySizeLimit: '8mb'
};

const MAX_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json(
			{ ok: false, error: 'Connectez-vous pour importer une capture d’écran.' },
			{ status: 401 }
		);
	}

	if (!llmConfigured()) {
		return json(
			{ ok: false, error: 'L’import par capture d’écran n’est pas configuré sur ce serveur.' },
			{ status: 503 }
		);
	}

	if (isRateLimited('image:' + session.user.id, 10)) {
		return json(
			{ ok: false, error: 'Trop d’imports en peu de temps. Réessayez dans une heure.' },
			{ status: 429 }
		);
	}

	let form: FormData;
	try {
		form = await request.formData();
	} catch {
		return json({ ok: false, error: 'Image invalide.' }, { status: 400 });
	}

	const file = form.get('image');
	if (!(file instanceof File)) {
		return json({ ok: false, error: 'Aucune image reçue.' }, { status: 400 });
	}

	if (!ALLOWED_TYPES.has(file.type)) {
		return json({ ok: false, error: 'Utilisez une image JPEG, PNG ou WebP.' }, { status: 400 });
	}

	if (file.size > MAX_BYTES) {
		return json(
			{ ok: false, error: 'Cette image est trop lourde (6 Mo maximum).' },
			{ status: 400 }
		);
	}

	try {
		const buffer = Buffer.from(await file.arrayBuffer());
		const extraction = await extractFromImage(
			`data:${file.type};base64,${buffer.toString('base64')}`
		);

		if (!extraction?.title) {
			return json(
				{
					ok: false,
					status: 'partial',
					product: {
						title: null,
						price: null,
						currency: null,
						image_url: null,
						url: '',
						description: null
					},
					source: 'vision',
					warnings: [],
					error:
						'Impossible de lire cette capture. Essayez une capture plus nette ou remplissez l’article à la main.'
				},
				{ status: 422 }
			);
		}

		const warnings: string[] = [];
		if (extraction.price === null) warnings.push("Le prix n'a pas pu être lu.");

		return json({
			ok: true,
			status: extraction.price !== null ? 'complete' : 'partial',
			product: {
				title: extraction.title,
				price: extraction.price,
				currency: extraction.currency,
				image_url: null,
				url: '',
				description: extraction.description
			},
			source: 'vision',
			warnings,
			error: null
		});
	} catch (error) {
		console.error('[import] screenshot failure:', error);
		return json(
			{ ok: false, error: 'Une erreur est survenue pendant la lecture de la capture.' },
			{ status: 500 }
		);
	}
};
