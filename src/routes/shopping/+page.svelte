<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import type { Tables } from '$lib/supabase';
	import type { PageData } from './$types';

	type ShoppingItem = Tables<'buy_intentions'> & {
		wish: Tables<'wishes'> & {
			profile: { id: string; display_name: string | null };
		};
	};

	let { data }: { data: PageData } = $props();

	const supabase = $derived(data.supabase);
	const buy_intentions = $derived((data.buy_intentions ?? []) as ShoppingItem[]);
	let notice = $state<string | null>(null);
	let pendingId = $state<number | null>(null);

	const totals = $derived.by(() => {
		let remaining = 0;
		let bought = 0;
		let currency = buy_intentions[0]?.wish.currency ?? 'EUR';
		let mixed = false;

		for (const item of buy_intentions) {
			const itemCurrency = item.wish.currency || 'EUR';
			if (itemCurrency !== currency) mixed = true;
			const amount = Number(item.wish.price) * item.wish.quantity;
			if (item.bought) bought += amount;
			else remaining += amount;
		}

		return { remaining, bought, currency, mixed };
	});

	function formatPrice(amount: number, currency: string | null) {
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: currency || 'EUR'
		}).format(Number.isFinite(amount) ? amount : 0);
	}

	async function buyIntentToggle(item: ShoppingItem) {
		pendingId = item.id;

		const { error } = await supabase
			.from('buy_intentions')
			.update({ bought: !item.bought })
			.eq('id', item.id);

		pendingId = null;

		if (error) {
			notice = "Erreur lors de la mise à jour de l'achat : " + error.message;
			return;
		}

		await invalidateAll();
	}

	async function removeIntention(item: ShoppingItem) {
		if (!confirm(`Retirer « ${item.wish.title} » de votre liste d’achats ?`)) return;

		pendingId = item.id;
		const { error } = await supabase.from('buy_intentions').delete().eq('id', item.id);
		pendingId = null;

		if (error) {
			notice = "Erreur lors de la suppression de l'intention d'achat : " + error.message;
			return;
		}

		await invalidateAll();
	}
</script>

<div class="px-4 py-6 sm:px-6">
	<div class="mx-auto max-w-5xl">
		<header class="mb-6">
			<h1 class="text-xl font-semibold text-slate-900 sm:text-2xl">Ma liste d’achats</h1>
			<p class="mt-1 text-sm text-slate-500">Les articles que vous avez prévu d’offrir.</p>
		</header>

		{#if notice}
			<div
				class="mb-4 flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
				role="status"
			>
				<span>{notice}</span>
				<button
					type="button"
					class="flex-none rounded p-1 text-amber-700 hover:bg-amber-100 focus:ring-2 focus:ring-amber-400 focus:outline-none"
					aria-label="Fermer le message"
					onclick={() => (notice = null)}
				>
					✕
				</button>
			</div>
		{/if}

		{#if buy_intentions.length > 0}
			<div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
				<div class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
					<p class="text-sm text-slate-500">Reste à acheter</p>
					<p class="mt-1 text-2xl font-semibold text-slate-900">
						{formatPrice(totals.remaining, totals.currency)}
					</p>
					{#if totals.mixed}
						<p class="mt-1 text-xs text-slate-400">
							Montants convertis approximativement en {totals.currency}.
						</p>
					{/if}
				</div>
				<div class="rounded-2xl border border-green-100 bg-green-50/70 p-4 shadow-sm">
					<p class="text-sm text-green-800">Déjà acheté</p>
					<p class="mt-1 text-2xl font-semibold text-green-900">
						{formatPrice(totals.bought, totals.currency)}
					</p>
				</div>
			</div>
		{/if}

		{#if buy_intentions.length === 0}
			<EmptyState
				title="Votre liste d’achats est vide"
				description="Ouvrez une wishlist et cochez « Je vais l’acheter » pour retrouver les articles ici."
			>
				{#snippet action()}
					<a
						href="/"
						class="rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
					>
						Voir les wishlists
					</a>
				{/snippet}
			</EmptyState>
		{:else}
			<!-- Mobile cards -->
			<div class="space-y-3 md:hidden">
				{#each buy_intentions as item (item.id)}
					<article
						class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm {item.bought
							? 'opacity-70'
							: ''}"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="text-xs font-medium tracking-wide text-red-600 uppercase">
									{item.wish.profile.display_name ?? 'Utilisateur'}
								</p>
								<h2 class="mt-0.5 font-medium break-words text-slate-900">{item.wish.title}</h2>
								{#if item.wish.description}
									<p class="mt-0.5 line-clamp-2 text-sm break-words text-slate-500">
										{item.wish.description}
									</p>
								{/if}
							</div>
							<p class="flex-none text-right font-semibold whitespace-nowrap text-slate-900">
								{formatPrice(item.wish.price, item.wish.currency)}
							</p>
						</div>

						<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
							<span>Qté {item.wish.quantity}</span>
							{#if item.wish.url}
								<a
									href={item.wish.url}
									target="_blank"
									rel="noopener noreferrer"
									class="font-medium text-red-600 hover:underline">Voir le produit</a
								>
							{/if}
							{#if item.wish.deleted}
								<span
									class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
								>
									Article supprimé de la wishlist
								</span>
							{/if}
						</div>

						<div
							class="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
						>
							<label class="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
								<input
									type="checkbox"
									class="peer sr-only"
									disabled={pendingId === item.id}
									checked={item.bought}
									onchange={() => buyIntentToggle(item)}
								/>
								<span
									class="h-4 w-4 flex-none rounded border border-slate-300 bg-white transition-colors peer-checked:border-green-600 peer-checked:bg-green-600 peer-disabled:opacity-60"
									aria-hidden="true"
								></span>
								<span class="text-slate-700 peer-disabled:text-slate-400">Acheté</span>
							</label>

							<button
								type="button"
								disabled={pendingId === item.id}
								onclick={() => removeIntention(item)}
								class="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none disabled:opacity-60"
							>
								Retirer
							</button>
						</div>
					</article>
				{/each}
			</div>

			<!-- Desktop table -->
			<div
				class="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm md:block"
			>
				<table class="min-w-full text-sm">
					<caption class="sr-only">Ma liste d’achats</caption>
					<thead class="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
						<tr>
							<th scope="col" class="w-36 px-5 py-3 font-medium">Destinataire</th>
							<th scope="col" class="px-4 py-3 font-medium">Article</th>
							<th scope="col" class="w-28 px-4 py-3 font-medium">Prix</th>
							<th scope="col" class="w-32 px-4 py-3 font-medium">Lien</th>
							<th scope="col" class="w-16 px-4 py-3 font-medium">Qté</th>
							<th scope="col" class="w-28 px-4 py-3 font-medium">Acheté</th>
							<th scope="col" class="w-24 px-5 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each buy_intentions as item (item.id)}
							<tr class="align-middle hover:bg-slate-50/70 {item.bought ? 'opacity-70' : ''}">
								<td class="px-5 py-3 font-medium text-slate-700 capitalize">
									{item.wish.profile.display_name ?? 'Utilisateur'}
								</td>
								<td class="px-4 py-3">
									<div class="font-medium break-words text-slate-900">{item.wish.title}</div>
									{#if item.wish.description}
										<div class="line-clamp-1 text-xs break-words text-slate-500">
											{item.wish.description}
										</div>
									{/if}
									{#if item.wish.deleted}
										<span
											class="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
										>
											Article supprimé de la wishlist
										</span>
									{/if}
								</td>
								<td class="px-4 py-3 font-semibold whitespace-nowrap text-slate-900">
									{formatPrice(item.wish.price, item.wish.currency)}
								</td>
								<td class="px-4 py-3">
									{#if item.wish.url}
										<a
											href={item.wish.url}
											target="_blank"
											rel="noopener noreferrer"
											class="font-medium text-red-600 hover:underline">Voir</a
										>
									{:else}
										<span class="text-slate-400">—</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-slate-700">{item.wish.quantity}</td>
								<td class="px-4 py-3">
									<label class="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
										<input
											type="checkbox"
											class="peer sr-only"
											disabled={pendingId === item.id}
											checked={item.bought}
											onchange={() => buyIntentToggle(item)}
										/>
										<span
											class="h-4 w-4 flex-none rounded border border-slate-300 bg-white transition-colors peer-checked:border-green-600 peer-checked:bg-green-600 peer-disabled:opacity-60"
											aria-hidden="true"
										></span>
									</label>
								</td>
								<td class="px-5 py-3 text-right">
									<button
										type="button"
										disabled={pendingId === item.id}
										onclick={() => removeIntention(item)}
										class="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-red-600 focus:ring-2 focus:ring-red-400 focus:outline-none disabled:opacity-60"
									>
										Retirer
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
