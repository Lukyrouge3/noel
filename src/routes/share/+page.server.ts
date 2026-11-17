import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		redirect(303, '/login');
	}

	const raw = url.searchParams.get('url') ?? url.searchParams.get('text') ?? '';
	const sharedUrl = raw.match(/https?:\/\/\S+/)?.[0] ?? '';

	if (!sharedUrl) {
		redirect(303, `/list/${session.user.id}`);
	}

	redirect(303, `/list/${session.user.id}?import=${encodeURIComponent(sharedUrl)}`);
};
