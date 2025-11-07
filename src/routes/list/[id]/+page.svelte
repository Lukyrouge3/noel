<script lang="ts">
	import type { Tables } from '$lib/supabase.js';

	const { data, params } = $props();
	const { supabase, session, wishes, profile } = data;

	const userIsOwner = session && session.user.id === params.id;

	// Modal state and form fields (UI only)
	let showModal = $state(false);
	let url = $state('');
	let title = $state('');
	let price = $state(0);
	let image_url = $state('');
	let quantity = $state(1);
	let description = $state('');

	let loading_url = $state(false);

	async function fetchFromUrl() {
		loading_url = true;
		try {
		const response = await fetch('/api/scrapper', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ url, agent: navigator.userAgent })
		});
		if (!response.ok) {
			alert('Erreur lors de la récupération des données depuis l\'URL.');
			console.error('Erreur lors de la récupération des données depuis l\'URL :', response.statusText);
			loading_url = false;
			return;
		}
		const result = await response.json();
		console.log('Données récupérées depuis l\'URL :', result);
		title = result.product_title;
		price = parseFloat(result.price);
		image_url = result.images && result.images.length > 0 ? result.images[0] : '';
		} catch (err) {
			alert('Erreur lors de la récupération des données depuis l\'URL : ' + err.message);
		} finally {
			loading_url = false;
		}
	}

	async function submitWish(e: Event) {
		e.preventDefault();

		const { error } = await supabase.from('wishes').insert({
			user_id: params.id,
			url,
			title,
			price: price,
			image_url,
			quantity: quantity,
			description
		});
		if (error) {
			alert('Erreur lors de l\'ajout de l\'élément : ' + error.message);
			return;
		}

		// refresh the page for now but should just refresh the wishes list
		window.location.reload();

		showModal = false;
	}

	async function deleteWish(wishId: number) {
		const { error } = await supabase.from('wishes').update({ deleted: true }).eq('id', wishId);
		if (error) {
			alert('Erreur lors de la suppression de l\'élément : ' + error.message);
			return;
		}

		// refresh the page for now but should just refresh the wishes list
		window.location.reload();
	}

	async function buyIntentToggle(wish: Tables<'wishes'> & { buy_intentions: Tables<'buy_intentions'>[]}) {
		console.log(wish);
		const alreadyIntended = wish.buy_intentions.find(intent => intent.user_id === session!.user.id);
		if (alreadyIntended) {
			// Remove intention
			const { error } = await supabase.from('buy_intentions').delete().eq('id', alreadyIntended.id);
			if (error) {
				alert('Erreur lors de la suppression de l\'intention d\'achat : ' + error.message);
				return;
			}
			console.log('Intention removed', alreadyIntended);
		} else {
			// Add intention
			const { error } = await supabase.from('buy_intentions').insert({
				user_id: session!.user.id,
				wish_id: wish.id
			});
			if (error) {
				alert('Erreur lors de l\'ajout de l\'intention d\'achat : ' + error.message);
				return;
			}
			wish.buy_intentions.push({ id: -1, user_id: session!.user.id, wish_id: wish.id, created_at: new Date().toISOString()});
		}
	}

</script>

<main class="min-h-screen bg-slate-50 p-6">
	<div class="max-w-5xl mx-auto">
		<header class="flex items-center justify-between mb-6">
			<div class="mb-4">
				<a href="/" class="inline-flex items-center gap-2 text-sm text-slate-700 bg-white/60 px-3 py-1 rounded hover:bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-red-400" aria-label="Retour à l'accueil">
					<svg class="h-4 w-4 text-slate-700" viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<path d="M10 3L4 10l6 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Accueil
				</a>
			</div>
			<h1 class="text-2xl font-semibold text-slate-900">
				{userIsOwner ? 'Ma wishlist' : `Wishlist de ${profile?.username || profile?.email.split('@')[0]}`}</h1>
				{#if userIsOwner}
					<div class="flex items-center gap-3">
						<button type="button" onclick={() => showModal = true} class="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400">
							<!-- plus icon -->
							<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
							</svg>
							Ajouter un élément
						</button>
					</div>
				{/if}
		</header>

		<section class="bg-white rounded-lg shadow p-4">
					{#if wishes == null || wishes.length === 0}
						<div class="p-8 text-center text-slate-500">Votre wishlist est vide. Cliquez sur « Ajouter un élément » pour commencer.</div>
					{:else}
						<div class="overflow-x-auto">
							<table class="min-w-full table-fixed text-sm">
								<thead class="bg-slate-50">
									<tr>
										<th class="px-4 py-3 text-left">Titre</th>
										<th class="px-4 py-3 w-28 text-left">Prix</th>
										<th class="px-4 py-3 w-24 text-left">Quantité</th>
										<th class="px-4 py-3 w-40 text-left">Ajouté le</th>
										<th class="px-4 py-3 w-40 text-left">Lien</th>
										<th class="px-4 py-3 w-36">Actions</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									{#each wishes as wish}
										<tr class="hover:bg-slate-50">
											<td class="px-4 py-3">
												<div class="flex items-center gap-3">
													<img src={wish.image_url != "" ? wish.image_url : 'https://placehold.co/400'} alt="" class="h-12 w-12 rounded-md object-cover flex-none" />
													<div class="min-w-0 text-left">
														<div class="font-medium text-slate-900 break-words">{wish.title}</div>
														<div class="text-xs text-slate-500 break-words">{wish.description}</div>
													</div>
												</div>
											</td>
											<td class="px-4 py-3">{wish.price ? `${wish.price}` : '?'} €</td>
											<td class="px-4 py-3">{wish.quantity}</td>
											<td class="px-4 py-3">{new Date(wish.created_at).toLocaleDateString()}</td>
											<td class="px-4 py-3">
												{#if wish.url}
													<a href={wish.url} target="_blank" class="text-blue-600 hover:underline">Voir le produit</a>
												{:else}
													<span class="text-slate-500">Pas de lien</span>
												{/if}
											</td>
											<td class="px-4 py-3">
												<div class="flex items-center justify-end gap-2">
													{#if userIsOwner}
													<!-- <button class="text-sm text-slate-700 bg-slate-100 px-3 py-1 rounded hover:bg-slate-200" onclick={() => {}}>Modifier</button> -->
													<button class="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700" onclick={() => deleteWish(wish.id)}>Supprimer</button>
													{:else}
													<label class="inline-flex items-center gap-2 select-none text-sm cursor-pointer">
														<input
															type="checkbox"
															class="sr-only peer"
															disabled={wish.buy_intentions.length > 0 && !wish.buy_intentions.some(intent => intent.user_id === session?.user.id)}
															checked={wish.buy_intentions.length > 0}
															onchange={() => buyIntentToggle(wish)}
														/>
														<span
															class="w-4 h-4 rounded border border-slate-300 bg-white flex-none transition-colors
															peer-checked:bg-green-600 peer-checked:border-green-600
															peer-disabled:bg-slate-100 peer-disabled:border-slate-200 peer-disabled:opacity-60 peer-disabled:cursor-not-allowed"
															aria-hidden="true"
														></span>
														<span class="text-sm text-slate-700 peer-disabled:text-slate-400">
															{wish.buy_intentions.length > 0 && !wish.buy_intentions.some(intent => intent.user_id === session?.user.id) ? 'Réservé par qqn d\'autre' : 'Je vais l\'acheter'}</span>
													</label>
													{/if}
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
{#if showModal}
		<div class="fixed inset-0 z-40 flex items-center justify-center">
			<div class="absolute inset-0 bg-black/40" onclick={() => showModal = false} aria-hidden="true"></div>
			<div class="relative bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 z-50">
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-4">Ajouter un élément</h3>

					<div class="space-y-4">
										<div class="flex gap-2">
											<label for="modal-url" class="sr-only">URL du produit</label>
											<input id="modal-url" name="url" type="url" placeholder="URL du produit" bind:value={url} class="flex-1 rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
											<button type="button" onclick={fetchFromUrl} class="inline-flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-md hover:bg-slate-200" disabled={loading_url}>
												
												{#if loading_url}
													<!-- Spinner -->
													<svg class="h-4 w-4 animate-spin text-red-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
														<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
														<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
													</svg>
												{:else}
												Charger
												{/if}
												</button>
										</div>

						<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label for="modal-title" class="block text-sm text-slate-700 mb-1">Titre</label>
												<input id="modal-title" name="title" type="text" bind:value={title} class="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
											</div>

											<div>
												<label for="modal-price" class="block text-sm text-slate-700 mb-1">Prix</label>
												<input id="modal-price" name="price" type="number" step="0.01" bind:value={price} class="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" required />
											</div>

											<div>
												<label for="modal-image" class="block text-sm text-slate-700 mb-1">Image URL</label>
												<input id="modal-image" name="image_url" type="url" bind:value={image_url} class="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
											</div>

											<div>
												<label for="modal-quantity" class="block text-sm text-slate-700 mb-1">Quantité</label>
												<input id="modal-quantity" name="quantity" type="number" min="1" bind:value={quantity} class="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400" />
											</div>
						</div>

										<div>
											<label for="modal-description" class="block text-sm text-slate-700 mb-1">Description</label>
											<textarea id="modal-description" name="description" bind:value={description} rows="4" class="w-full rounded-md border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"></textarea>
										</div>
					</div>

					<div class="mt-6 flex items-center justify-end gap-3">
						<button type="button" onclick={() => showModal = false} class="px-4 py-2 rounded-md bg-slate-100 hover:bg-slate-200">Annuler</button>
						<button type="button" onclick={submitWish} class="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700">Ajouter</button>
					</div>
				</div>
			</div>
		</div>
	{/if}