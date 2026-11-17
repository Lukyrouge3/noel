<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const session = $derived(data.session);
	const supabase = $derived(data.supabase);
	const problems = $derived(data.problems ?? []);
	const displayName = $derived(
		(session?.user.user_metadata?.username as string | undefined) ??
			session?.user.email?.split('@')[0] ??
			''
	);

	const wish_lists = $derived(
		supabase
			.from('public_profiles')
			.select('id, display_name, wishes(id)')
			.eq('wishes.deleted', false)
			.neq('id', session?.user.id ?? '')
	);

	async function removeIntention(wishId: number) {
		if (!session) return;

		const { error } = await supabase
			.from('buy_intentions')
			.delete()
			.eq('user_id', session.user.id)
			.eq('wish_id', wishId);

		if (error) {
			alert("Erreur lors de la suppression de l'intention d'achat : " + error.message);
			return;
		}

		await invalidateAll();
	}
</script>

{#if session}
	<div class="px-4 py-8 sm:px-6">
		<div class="mx-auto max-w-5xl">
			<section class="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p class="text-sm font-semibold tracking-wide text-red-600 uppercase">Noël approche 🎄</p>
					<h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
						Bonjour {displayName} 👋
					</h1>
					<p class="mt-1 text-slate-600">Choisissez une wishlist à découvrir.</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<a
						href="/list/{session.user.id}"
						class="inline-flex items-center rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
					>
						Ma wishlist
					</a>
					<a
						href="/shopping"
						class="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 focus:ring-2 focus:ring-red-400 focus:outline-none"
					>
						Mes achats
					</a>
				</div>
			</section>

			{#if problems.length > 0}
				<div class="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
					<h2 class="font-semibold">Problèmes détectés</h2>
					<p class="mt-1 text-sm">
						Certains articles que vous avez prévu d'acheter ne sont plus dans la wishlist.
					</p>
					<ul class="mt-3 space-y-2 text-sm">
						{#each problems as problem (problem.id)}
							<li class="flex flex-wrap items-center gap-2">
								<span>
									« <strong>{problem.title}</strong> » dans la wishlist de
									<strong>{problem.profile?.display_name ?? 'quelqu’un'}</strong>
									n'existe plus.
								</span>
								<button
									class="rounded-md px-2 py-1 font-medium text-amber-800 underline underline-offset-2 hover:bg-amber-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
									onclick={() => removeIntention(problem.id)}
								>
									Enlever l'intention
								</button>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<section>
				<h2 class="mb-4 text-xl font-semibold text-slate-900">Les wishlists</h2>
				{#await wish_lists}
					<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
						{#each [1, 2, 3] as skeleton (skeleton)}
							<div class="animate-pulse rounded-2xl border border-slate-100 bg-white p-5">
								<div class="flex items-center gap-3">
									<div class="h-10 w-10 rounded-full bg-slate-200"></div>
									<div class="flex-1 space-y-2">
										<div class="h-3 w-1/2 rounded bg-slate-200"></div>
										<div class="h-3 w-1/3 rounded bg-slate-100"></div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{:then result}
					{#if result.error}
						<div class="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
							Erreur lors du chargement des wishlists : {result.error.message}
						</div>
					{:else if result.data.length === 0}
						<EmptyState
							title="Aucune autre wishlist pour le moment"
							description="Dès que vos proches ajoutent des articles, leurs listes apparaîtront ici."
						/>
					{:else}
						<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each result.data as profile (profile.id)}
								{@const username = profile.display_name ?? 'Utilisateur'}
								{@const count = profile.wishes?.length ?? 0}
								<a
									href="/list/{profile.id}"
									class="group rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-red-100 hover:shadow-md focus:ring-2 focus:ring-red-400 focus:outline-none"
								>
									<div class="flex items-center gap-3">
										<span
											class="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-500 font-semibold text-white shadow-sm"
										>
											{username.charAt(0).toUpperCase()}
										</span>
										<div class="min-w-0 flex-1 text-left">
											<p class="truncate font-medium text-slate-900 capitalize">{username}</p>
											<p class="text-sm text-slate-500">
												{count} article{count > 1 ? 's' : ''}
											</p>
										</div>
										<svg
											class="h-5 w-5 flex-none text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-red-500"
											viewBox="0 0 20 20"
											fill="none"
											aria-hidden="true"
										>
											<path
												d="M8 5l5 5-5 5"
												stroke="currentColor"
												stroke-width="2"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									</div>
								</a>
							{/each}
						</div>
					{/if}
				{/await}
			</section>
		</div>
	</div>
{:else}
	<main class="flex min-h-[80dvh] items-center justify-center px-4 py-10">
		<div
			class="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg"
		>
			<div
				class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-2xl shadow-sm"
			>
				🎄
			</div>
			<h1 class="text-2xl font-semibold text-slate-900">Bienvenue sur Noël</h1>
			<p class="mt-2 text-slate-600">
				Connectez-vous pour voir les wishlists de votre famille et préparer vos cadeaux.
			</p>
			<a
				href="/login"
				class="mt-6 inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
			>
				Se connecter
			</a>
		</div>
	</main>
{/if}
