import type { Tables } from '$lib/supabase';

export type WishPayload = Pick<
	Tables<'wishes'>,
	'title' | 'price' | 'currency' | 'quantity' | 'url' | 'image_url' | 'description'
>;

export type WishSaveResult = {
	wish: Tables<'wishes'> | null;
	error: string | null;
};
