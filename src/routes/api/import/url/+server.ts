import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { importProduct } from '$lib/server/import';
import { importUrlSchema } from '$lib/server/import/schema';

export const config = {
	bodySizeLimit: '16kb'
};

const WINDOW_MS = 60 * 60 * 1000;
const MAX_IMPORTS_PER_WINDOW = 20;

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimited(userId: string): boolean {
	const now = Date.now();
	const bucket = buckets.get(userId);

	if (!bucket || bucket.resetAt <= now) {
		buckets.set(userId, { count: 1, resetAt: now + WINDOW_MS });
		return false;
	}

	if (bucket.count >= MAX_IMPORTS_PER_WINDOW) return true;

	bucket.count += 1;
	return false;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session } = await locals.safeGetSession();

	if (!session) {
		return json({ ok: false, error: 'Connectez-vous pour importer un article.' }, { status: 401 });
	}

	if (rateLimited(session.user.id)) {
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
