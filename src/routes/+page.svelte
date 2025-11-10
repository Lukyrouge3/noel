<script lang="ts">
	const { data } = $props();

	const { session, supabase, problems } = $derived(data);

	const wish_lists = $derived(
		supabase.from('profiles').select('*, wishes(id)').eq('wishes.deleted', false)
	);

	async function removeIntention(wish_id: number) {
		const { error } = await supabase
			.from('buy_intentions')
			.delete()
			.eq('user_id', session!.user.id)
			.eq('wish_id', wish_id);
		if (error) {
			alert("Erreur lors de la suppression de l'intention d'achat : " + error.message);
			return;
		}
		// Refresh the page to update the problems list
		window.location.reload();
	}
</script>

{#if session}
	<main class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
		<div class="w-full max-w-3xl rounded-2xl bg-white p-8 text-center shadow-md">
			<h1 class="mb-4 text-3xl font-semibold text-slate-900">Bienvenue sur Noël ! 🎄</h1>
			<p class="mb-6 text-lg text-slate-600">
				Vous êtes connecté en tant que <strong>{session.user.email}</strong>.
			</p>
			{#if problems.length > 0}
				<div class="mb-6 rounded-md bg-yellow-50 p-4 text-yellow-700">
					<h2 class="mb-2 text-lg font-medium">Problèmes détectés !</h2>
					<p>Certains articles que vous avez prévu d'acheter ne sont plus dans la wishlist.</p>
					<ul class="list-inside list-disc text-left">
						{#each problems as problem}
							<li>
								L'item "<strong>{problem.title}</strong>" dans la wishlist de
								<strong>{problem.profiles?.email}</strong>
								n'existe plus.
								<button
									class="text-red-600 hover:text-red-500"
									onclick={() => removeIntention(problem.id)}>Enlever l'intention d'achat</button
								>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
			<div class="flex items-center justify-center gap-3">
				<a
					href="/list/{session.user.id}"
					class="inline-flex items-center rounded-md bg-red-600 px-5 py-2.5 text-white transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
				>
					Ma wishlist
				</a>

				<a
					class="inline-block rounded-md border border-red-600 bg-white px-6 py-3 text-red-600 transition hover:bg-red-50 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
					href="/logout"
					data-sveltekit-preload-data="false"
				>
					Se déconnecter
				</a>
			</div>

			<section class="mt-8 w-full">
				<h2 class="mb-4 text-2xl font-semibold">Les wishlists</h2>
				{#await wish_lists}
					<!-- Spinner -->
					<div class="flex items-center justify-center py-8">
						<div role="status" aria-live="polite" class="flex items-center gap-3">
							<svg
								class="h-8 w-8 animate-spin text-red-600"
								viewBox="0 0 24 24"
								fill="none"
								aria-hidden="true"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
								></path>
							</svg>
							<span class="sr-only">Chargement...</span>
						</div>
					</div>
				{:then result}
					{#if result.error}
						<div class="rounded-md bg-red-50 p-4 text-red-700">
							Erreur lors du chargement des wishlists : {result.error.message}
						</div>
					{:else if result.data.length === 0}
						<div class="p-6 text-center text-slate-500">Aucune wishlist trouvée.</div>
					{:else}
						<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each result.data.filter((p) => p.id != session.user.id) as profile}
								{@const username = profile.username
									? profile.username
									: profile.email.split('@')[0]}
								<article class="rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-red-600 font-semibold text-white"
											>
												{username.charAt(0).toUpperCase()}
											</div>
											<div class="text-left">
												<p class="text-sm font-medium text-slate-900 capitalize">{username}</p>
												<p class="text-xs text-slate-500">
													Nombres d'items: <span class="truncate font-mono text-xs text-slate-400"
														>{profile.wishes.length}</span
													>
												</p>
											</div>
										</div>
										<a
											href="/list/{profile.id}"
											class="ml-4 inline-flex shrink-0 items-center rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
											>Voir</a
										>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				{/await}
			</section>
		</div>
	</main>
{:else}
	<main class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
		<div class="w-full max-w-3xl rounded-2xl bg-white p-8 text-center shadow-md">
			<h1 class="mb-4 text-3xl font-semibold text-slate-900">Bienvenue sur Noël ! 🎄</h1>
			<p class="mb-6 text-lg text-slate-600">
				Pour accéder à l'application, veuillez vous connecter.
			</p>
			<a
				href="/login"
				class="inline-block rounded-md bg-red-600 px-6 py-3 text-white shadow-md transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
			>
				Se connecter
			</a>
		</div>
	</main>
{/if}
