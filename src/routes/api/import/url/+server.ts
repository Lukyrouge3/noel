import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importProduct } from '$lib/server/import';
import { isRateLimited } from '$lib/server/import/rate-limit';
import { importUrlSchema } from '$lib/server/import/schema';

export const config = {
	bodySizeLimit: '16kb'
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ ok: false, error: 'Connectez-vous pour importer un article.' }, { status: 401 });
	}

	if (isRateLimited('url:' + session.user.id)) {
		return json(
			{ ok: false, error: 'Trop d’imports en peu de temps. Réessayez dans une heure.' },
			{ status: 429 }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Requête invalide.' }, { status: 400 });
	}

	const parsed = importUrlSchema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Ce lien n’est pas valide.' }, { status: 400 });
	}

	try {
		const result = await importProduct(parsed.data.url);
		return json(result);
	} catch (error) {
		console.error('[import] unexpected failure:', error);
		return json(
			{
				ok: false,
				status: 'partial',
				product: {
					title: null,
					price: null,
					currency: null,
					image_url: null,
					url: parsed.data.url,
					description: null
				},
				source: 'none',
				warnings: [],
				error: 'Une erreur inattendue est survenue. Réessayez ou ajoutez l’article à la main.'
			},
			{ status: 500 }
		);
	}
};
