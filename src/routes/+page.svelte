<script lang="ts">
	const {data} = $props();

	const { session, supabase, problems } = $derived(data);

	const wish_lists = $derived(supabase.from('profiles').select('*, wishes(id)'));


	async function removeIntention(wish_id: number) {
		const { error } = await supabase.from('buy_intentions').delete().eq('user_id', session!.user.id).eq('wish_id', wish_id);
		if (error) {
			alert('Erreur lors de la suppression de l\'intention d\'achat : ' + error.message);
			return;
		}
		// Refresh the page to update the problems list
		window.location.reload();
	}
</script>

{#if session}
	<main class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
		<div class="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8 text-center">
			<h1 class="text-3xl font-semibold text-slate-900 mb-4">Bienvenue sur Noël ! 🎄</h1>
			<p class="text-lg text-slate-600 mb-6">Vous êtes connecté en tant que <strong>{session.user.email}</strong>.</p>
			{#if problems.length > 0}
				<div class="mb-6 p-4 bg-yellow-50 text-yellow-700 rounded-md">
					<h2 class="text-lg font-medium mb-2">Problèmes détectés !</h2>
					<p>Certains articles que vous avez prévu d'acheter ne sont plus dans la wishlist.</p>
					<ul class="list-disc list-inside text-left">
						{#each problems as problem}
							<li>L'item "<strong>{problem.title}</strong>" dans la wishlist de <strong>{problem.profiles?.email}</strong> n'existe plus. <button class="text-red-600 hover:text-red-500" onclick={() => removeIntention(problem.id)}>Enlever l'intention d'achat</button></li>
						{/each}
					</ul>
				</div>
			{/if}
			<div class="flex items-center justify-center gap-3">
				<a href="/list/{session.user.id}" class="inline-flex items-center bg-red-600 text-white px-5 py-2.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 transition">
					Ma wishlist
				</a>

				<a
					class="inline-block bg-white text-red-600 border border-red-600 px-6 py-3 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition"
					href="/logout" data-sveltekit-preload-data="false"
				>
					Se déconnecter
				</a>
			</div>

			<section class="mt-8 w-full">
			<h2 class="text-2xl font-semibold mb-4">Les wishlists</h2>
			{#await wish_lists}
				<!-- Spinner -->
				<div class="flex items-center justify-center py-8">
					<div role="status" aria-live="polite" class="flex items-center gap-3">
						<svg class="h-8 w-8 animate-spin text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
						</svg>
						<span class="sr-only">Chargement...</span>
					</div>
				</div>
			{:then result}
				{#if result.error}
					<div class="p-4 bg-red-50 text-red-700 rounded-md">Erreur lors du chargement des wishlists : {result.error.message}</div>
				{:else}
					{#if result.data.length === 0}
						<div class="p-6 text-center text-slate-500">Aucune wishlist trouvée.</div>
					{:else}
						<div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{#each result.data.filter(p => p.id != session.user.id) as profile}
							{@const username = profile.username ? profile.username : profile.email.split('@')[0]}
								<article class="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition">
									<div class="flex items-center justify-between">
										<div class="flex items-center gap-3">
											<div class="h-10 w-10 rounded-full bg-red-600 text-white flex items-center justify-center font-semibold overflow-hidden flex-none">{username.charAt(0).toUpperCase()}</div>
											<div class="text-left">
												<p class="text-sm font-medium text-slate-900 capitalize">{username}</p>
												<p class="text-xs text-slate-500">Nombres d'items: <span class="font-mono text-xs text-slate-400 truncate">{profile.wishes.length}</span></p>
											</div>
										</div>
										<a href="/list/{profile.id}" class="inline-flex items-center text-sm bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 ml-4 shrink-0">Voir</a>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				{/if}
			{/await}
		</section>
		</div>
	</main>
{:else}
	<main class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
		<div class="max-w-3xl w-full bg-white rounded-2xl shadow-md p-8 text-center">
			<h1 class="text-3xl font-semibold text-slate-900 mb-4">Bienvenue sur Noël ! 🎄</h1>
			<p class="text-lg text-slate-600 mb-6">Pour accéder à l'application, veuillez vous connecter.</p>
			<a href="/login" class="inline-block bg-red-600 text-white px-6 py-3 rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition">
				Se connecter
			</a>
		</div>
	</main>
{/if}