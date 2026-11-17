import type { Database } from '$lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from '@supabase/supabase-js';

type AppSupabaseClient = SupabaseClient<
	Database,
	'public' | 'graphql_public' | 'pgbouncer' | 'storage'
>;

// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: AppSupabaseClient;
			safeGetSession(): Promise<{ session: Session | null; user?: Session['user'] | null }>;
		}
		interface PageData {
			session: Session | null;
			user?: Session['user'] | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
