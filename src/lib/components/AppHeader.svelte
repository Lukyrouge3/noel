<script lang="ts">
	import { page } from '$app/state';
	import type { Session } from '@supabase/supabase-js';

	let { session }: { session: Session } = $props();

	const displayName = $derived(
		(session.user.user_metadata?.username as string | undefined) ??
			session.user.email?.split('@')[0] ??
			'Compte'
	);
	const initial = $derived(displayName.charAt(0).toUpperCase());

	const links = $derived([
		{ href: '/', label: 'Accueil' },
		{ href: `/list/${session.user.id}`, label: 'Ma wishlist' },
		{ href: '/shopping', label: 'Mes achats' }
	]);

	function isActive(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}
</script>

<header class="border-b border-slate-200/70 bg-white/80 backdrop-blur">
	<div class="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
		<a
			href="/"
			class="flex flex-none items-center gap-2 rounded-lg px-1 py-1 focus:ring-2 focus:ring-red-400 focus:outline-none"
			aria-label="Noël — accueil"
		>
			<span
				class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-red-500 text-lg shadow-sm"
				aria-hidden="true">🎄</span
			>
			<span class="text-lg font-semibold tracking-tight text-slate-900">Noël</span>
		</a>

		<nav
			class="ml-2 flex flex-1 items-center gap-1 overflow-x-auto"
			aria-label="Navigation principale"
		>
			{#each links as link (link.href)}
				<a
					href={link.href}
					aria-current={isActive(link.href) ? 'page' : undefined}
					class="flex-none rounded-lg px-3 py-2 text-sm font-medium transition {isActive(link.href)
						? 'bg-red-50 text-red-700'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
				>
					{link.label}
				</a>
			{/each}
		</nav>

		<div class="flex flex-none items-center gap-2">
			<div class="hidden items-center gap-2 sm:flex">
				<span
					class="flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white"
					aria-hidden="true">{initial}</span
				>
				<span class="max-w-28 truncate text-sm font-medium text-slate-700 capitalize"
					>{displayName}</span
				>
			</div>

			<form method="POST" action="/logout">
				<button
					type="submit"
					class="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:ring-2 focus:ring-red-400 focus:outline-none"
					aria-label="Se déconnecter"
					title="Se déconnecter"
				>
					<svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path
							d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l5-5-5-5M15 12H3"
							stroke="currentColor"
							stroke-width="1.8"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</form>
		</div>
	</div>
</header>
