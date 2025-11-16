<script lang="ts">
	import type { Tables } from '$lib/supabase.js';

	const { data, params } = $props();
	const { supabase, session, buy_intentions } = data;

	async function buyIntentToggle(buy_intention: Tables<'buy_intentions'>) {
		const { error } = await supabase
			.from('buy_intentions')
			.update({
				bought: !buy_intention.bought
			})
			.eq('id', buy_intention.id);
		if (error) {
			alert("Erreur lors de la suppression de l'intention d'achat : " + error.message);
			return;
		}

		buy_intention.bought = !buy_intention.bought;
	}
</script>

<main class="min-h-screen bg-slate-50 p-6">
	<div class="mx-auto max-w-5xl">
		<header class="mb-6 flex items-center justify-between">
			<div class="mb-4">
				<a
					href="/"
					class="inline-flex items-center gap-2 rounded bg-white/60 px-3 py-1 text-sm text-slate-700 hover:bg-white hover:shadow focus:ring-2 focus:ring-red-400 focus:outline-none"
					aria-label="Retour à l'accueil"
				>
					<svg class="h-4 w-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<path
							d="M10 3L4 10l6 7"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
					Accueil
				</a>
			</div>
			<h1 class="text-2xl font-semibold text-slate-900">Ma liste d'achats</h1>
		</header>

		<section class="rounded-lg bg-white p-4 shadow">
			{#if buy_intentions == null || buy_intentions.length === 0}
				<div class="p-8 text-center text-slate-500">
					Votre wishlist est vide. Cliquez sur « Ajouter un élément » pour commencer.
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="min-w-full table-fixed text-sm">
						<thead class="bg-slate-50">
							<tr>
								<th class="w-40 px-4 py-3 text-left">Destinataire</th>
								<th class="px-4 py-3 text-left">Titre</th>
								<th class="w-28 px-4 py-3 text-left">Prix</th>
								<th class="w-40 px-4 py-3 text-left">Lien</th>
								<th class="w-24 px-4 py-3 text-left">Quantité</th>
								<th class="w-36 px-4 py-3">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y">
							{#each buy_intentions as bi}
								<tr class="hover:bg-slate-50">
									<td class="px-4 py-3 capitalize"
										>{bi.wish.profile.username ?? bi.wish.profile.email.split('@')[0]}</td
									>
									<td class="px-4 py-3">
										<div class="flex items-center gap-3">
											<!-- <img src={wish.image_url != "" ? wish.image_url : 'https://placehold.co/400'} alt="" class="h-12 w-12 rounded-md object-cover flex-none" /> -->
											<div class="min-w-[108px] text-left">
												<div class="font-medium wrap-break-word text-slate-900">
													{bi.wish.title}
												</div>
												<div class="text-xs wrap-break-word text-slate-500">
													{bi.wish.description}
												</div>
											</div>
										</div>
									</td>
									<td class="px-4 py-3">{bi.wish.price ? `${bi.wish.price}` : '?'} €</td>
									<td class="px-4 py-3">
										{#if bi.wish.url}
											<a href={bi.wish.url} target="_blank" class="text-blue-600 hover:underline"
												>Voir le produit</a
											>
										{:else}
											<span class="text-slate-500">Pas de lien</span>
										{/if}
									</td>
									<td class="px-4 py-3">{bi.wish.quantity}</td>
									<td class="px-4 py-3">
										<div class="flex items-center justify-end gap-2">
											<label
												class="inline-flex cursor-pointer items-center gap-2 text-sm select-none"
											>
												<input
													type="checkbox"
													class="peer sr-only"
													checked={bi.bought}
													onchange={() => buyIntentToggle(bi)}
												/>
												<span
													class="h-4 w-4 flex-none rounded border border-slate-300 bg-white transition-colors
															peer-checked:border-green-600 peer-checked:bg-green-600
															peer-disabled:cursor-not-allowed peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:opacity-60"
													aria-hidden="true"
												></span>
												<span class="text-sm text-slate-700 peer-disabled:text-slate-400">
													Acheté</span
												>
											</label>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</section>
	</div>
</main>
