<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import ImportModal from '$lib/components/ImportModal.svelte';
	import ReservationToggle from '$lib/components/ReservationToggle.svelte';
	import WishModal from '$lib/components/WishModal.svelte';
	import type { ImportResult } from '$lib/import';
	import type { Tables } from '$lib/supabase';
	import type { WishPayload, WishSaveResult } from '$lib/wishes';
	import type { PageData } from './$types';

	type WishWithIntentions = Tables<'wishes'> & {
		buy_intentions: Tables<'buy_intentions'>[];
	};

	let { data, params }: { data: PageData; params: { id: string } } = $props();

	const supabase = $derived(data.supabase);
	const session = $derived(data.session);
	const wishes = $derived((data.wishes ?? []) as WishWithIntentions[]);
	const profile = $derived(data.profile);
	const userIsOwner = $derived(!!session && session.user.id === params.id);

	const PLACEHOLDER = 'https://placehold.co/400x400/e5e7eb/374151?text=Article';

	let showImport = $state(false);
	let showModal = $state(false);
	let importUrl = $state('');
	let draft = $state<Partial<WishPayload> | null>(null);
	let editingWish = $state<Tables<'wishes'> | null>(null);
	let notice = $state<string | null>(null);
	let pendingWishId = $state<number | null>(null);

	const displayName = $derived(profile?.display_name ?? 'Utilisateur');

	onMount(() => {
		const shared = page.url.searchParams.get('import');
		if (shared && userIsOwner) {
			importUrl = shared;
			showImport = true;
		}
	});

	function openImport() {
		editingWish = null;
		draft = null;
		notice = null;
		importUrl = '';
		showImport = true;
	}

	function openManual() {
		showImport = false;
		editingWish = null;
		draft = null;
		showModal = true;
	}

	function openEdit(wish: WishWithIntentions) {
		showImport = false;
		draft = null;
		editingWish = wish;
		notice = null;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		editingWish = null;
		draft = null;
	}

	function handleImported(result: ImportResult) {
		const product = result.product;
		draft = {
			title: product.title ?? '',
			price: product.price ?? undefined,
			currency: product.currency ?? 'EUR',
			quantity: 1,
			url: product.url,
			image_url: product.image_url ?? '',
			description: product.description ?? ''
		};
		showImport = false;
		showModal = true;
		if (result.warnings.length > 0) notice = result.warnings.join(' ');
	}

	async function handleSaved() {
		closeModal();
		await invalidateAll();
	}

	async function saveWish(payload: WishPayload, wishId?: number): Promise<WishSaveResult> {
		if (wishId) {
			const { data, error } = await supabase
				.from('wishes')
				.update(payload)
				.eq('id', wishId)
				.select()
				.single();

			return {
				wish: data,
				error: error ? "Impossible d'enregistrer les modifications : " + error.message : null
			};
		}

		if (!session) {
			return { wish: null, error: 'Votre session a expiré. Reconnectez-vous.' };
		}

		const { data, error } = await supabase
			.from('wishes')
			.insert({ ...payload, user_id: session.user.id })
			.select()
			.single();

		return {
			wish: data,
			error: error ? "Impossible d'ajouter l'article : " + error.message : null
		};
	}

	function formatPrice(wish: Tables<'wishes'>) {
		const amount = Number(wish.price);
		return new Intl.NumberFormat('fr-FR', {
			style: 'currency',
			currency: wish.currency || 'EUR'
		}).format(Number.isFinite(amount) ? amount : 0);
	}

	function formatDate(value: string) {
		return new Date(value).toLocaleDateString('fr-FR', {
			day: '2-digit',
			month: 'short',
			year: 'numeric'
		});
	}

	async function deleteWish(wishId: number) {
		if (!confirm('Supprimer cet article de votre liste ?')) return;

		pendingWishId = wishId;
		const { error } = await supabase.from('wishes').update({ deleted: true }).eq('id', wishId);
		pendingWishId = null;

		if (error) {
			notice = 'Erreur lors de la suppression : ' + error.message;
			return;
		}

		await invalidateAll();
	}

	async function buyIntentToggle(wish: WishWithIntentions) {
		if (!session) return;

		const alreadyIntended = wish.buy_intentions.find(
			(intent) => intent.user_id === session.user.id
		);

		pendingWishId = wish.id;

		if (alreadyIntended) {
			const { error } = await supabase.from('buy_intentions').delete().eq('id', alreadyIntended.id);

			if (error) {
				pendingWishId = null;
				notice = "Erreur lors de la suppression de l'intention d'achat : " + error.message;
				return;
			}
		} else {
			const { error } = await supabase.from('buy_intentions').insert({
				user_id: session.user.id,
				wish_id: wish.id
			});

			if (error) {
				pendingWishId = null;
				notice =
					error.code === '23505'
						? "Quelqu'un vient de réserver cet article."
						: "Erreur lors de l'ajout de l'intention d'achat : " + error.message;
				return;
			}
		}

		pendingWishId = null;
		await invalidateAll();
	}
</script>

<div class="px-4 py-6 sm:px-6">
	<div class="mx-auto max-w-5xl">
		<header class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-xl font-semibold text-slate-900 sm:text-2xl">
					{userIsOwner ? 'Ma wishlist' : `Wishlist de ${displayName}`}
				</h1>
				<p class="mt-1 text-sm text-slate-500">
					{userIsOwner
						? `${wishes.length} article${wishes.length > 1 ? 's' : ''} dans votre liste.`
						: `${wishes.length} article${wishes.length > 1 ? 's' : ''} à découvrir.`}
				</p>
			</div>

			{#if userIsOwner}
				<button
					type="button"
					onclick={openImport}
					class="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
				>
					<svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path
							fill-rule="evenodd"
							d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
							clip-rule="evenodd"
						/>
					</svg>
					Ajouter un article
				</button>
			{/if}
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

		{#if wishes.length === 0}
			<EmptyState
				title={userIsOwner ? 'Votre wishlist est vide' : 'Cette wishlist est vide'}
				description={userIsOwner
					? 'Collez le lien d’un produit pour l’ajouter en quelques secondes.'
					: 'Revenez plus tard pour découvrir les idées de cadeaux.'}
			>
				{#snippet action()}
					{#if userIsOwner}
						<button
							type="button"
							onclick={openImport}
							class="rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
						>
							Ajouter un premier article
						</button>
					{/if}
				{/snippet}
			</EmptyState>
		{:else}
			<!-- Mobile cards -->
			<div class="space-y-3 md:hidden">
				{#each wishes as wish (wish.id)}
					{@const mine = wish.buy_intentions.some((intent) => intent.user_id === session?.user.id)}
					{@const reservedByOther = wish.buy_intentions.length > 0 && !mine}
					<article class="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
						<div class="flex gap-3">
							<img
								src={wish.image_url || PLACEHOLDER}
								alt=""
								loading="lazy"
								class="h-16 w-16 flex-none rounded-xl border border-slate-100 object-cover"
								onerror={(event) => {
									const image = event.currentTarget as HTMLImageElement;
									if (image.src !== PLACEHOLDER) image.src = PLACEHOLDER;
								}}
							/>
							<div class="min-w-0 flex-1">
								<h2 class="font-medium break-words text-slate-900">{wish.title}</h2>
								{#if wish.description}
									<p class="mt-0.5 line-clamp-2 text-sm break-words text-slate-500">
										{wish.description}
									</p>
								{/if}
								<div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
									<span class="font-semibold text-slate-900">{formatPrice(wish)}</span>
									<span class="text-slate-500">Qté {wish.quantity}</span>
									{#if wish.url}
										<a
											href={wish.url}
											target="_blank"
											rel="noopener noreferrer"
											class="font-medium text-red-600 hover:underline">Voir</a
										>
									{/if}
								</div>
							</div>
						</div>

						<div
							class="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3"
						>
							{#if userIsOwner}
								<div class="flex gap-2">
									<button
										type="button"
										class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-60"
										disabled={pendingWishId === wish.id}
										onclick={() => openEdit(wish)}
									>
										Modifier
									</button>
									<button
										type="button"
										class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none disabled:opacity-60"
										disabled={pendingWishId === wish.id}
										onclick={() => deleteWish(wish.id)}
									>
										Supprimer
									</button>
								</div>
							{:else}
								<ReservationToggle
									{mine}
									{reservedByOther}
									pending={pendingWishId === wish.id}
									onToggle={() => buyIntentToggle(wish)}
								/>
							{/if}
						</div>
					</article>
				{/each}
			</div>

			<!-- Desktop table -->
			<div
				class="hidden overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-sm md:block"
			>
				<table class="min-w-full text-sm">
					<caption class="sr-only">
						{userIsOwner ? 'Ma wishlist' : `Wishlist de ${displayName}`}
					</caption>
					<thead class="bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
						<tr>
							<th scope="col" class="px-5 py-3 font-medium">Article</th>
							<th scope="col" class="w-28 px-4 py-3 font-medium">Prix</th>
							<th scope="col" class="w-32 px-4 py-3 font-medium">Lien</th>
							<th scope="col" class="w-16 px-4 py-3 font-medium">Qté</th>
							<th scope="col" class="w-32 px-4 py-3 font-medium">Ajouté le</th>
							<th scope="col" class="w-48 px-5 py-3 text-right font-medium">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-slate-100">
						{#each wishes as wish (wish.id)}
							{@const mine = wish.buy_intentions.some(
								(intent) => intent.user_id === session?.user.id
							)}
							{@const reservedByOther = wish.buy_intentions.length > 0 && !mine}
							<tr class="align-middle hover:bg-slate-50/70">
								<td class="px-5 py-3">
									<div class="flex items-center gap-3">
										<img
											src={wish.image_url || PLACEHOLDER}
											alt=""
											loading="lazy"
											class="h-12 w-12 flex-none rounded-xl border border-slate-100 object-cover"
											onerror={(event) => {
												const image = event.currentTarget as HTMLImageElement;
												if (image.src !== PLACEHOLDER) image.src = PLACEHOLDER;
											}}
										/>
										<div class="min-w-0">
											<div class="font-medium break-words text-slate-900">{wish.title}</div>
											{#if wish.description}
												<div class="line-clamp-1 text-xs break-words text-slate-500">
													{wish.description}
												</div>
											{/if}
										</div>
									</div>
								</td>
								<td class="px-4 py-3 font-semibold whitespace-nowrap text-slate-900">
									{formatPrice(wish)}
								</td>
								<td class="px-4 py-3">
									{#if wish.url}
										<a
											href={wish.url}
											target="_blank"
											rel="noopener noreferrer"
											class="font-medium text-red-600 hover:underline">Voir le produit</a
										>
									{:else}
										<span class="text-slate-400">Pas de lien</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-slate-700">{wish.quantity}</td>
								<td class="px-4 py-3 whitespace-nowrap text-slate-500">
									{formatDate(wish.created_at)}
								</td>
								<td class="px-5 py-3">
									<div class="flex items-center justify-end gap-2">
										{#if userIsOwner}
											<button
												type="button"
												class="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 focus:outline-none disabled:opacity-60"
												disabled={pendingWishId === wish.id}
												onclick={() => openEdit(wish)}
											>
												Modifier
											</button>
											<button
												type="button"
												class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:outline-none disabled:opacity-60"
												disabled={pendingWishId === wish.id}
												onclick={() => deleteWish(wish.id)}
											>
												Supprimer
											</button>
										{:else}
											<ReservationToggle
												{mine}
												{reservedByOther}
												pending={pendingWishId === wish.id}
												onToggle={() => buyIntentToggle(wish)}
											/>
										{/if}
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

{#if showImport}
	<ImportModal
		initialUrl={importUrl}
		onClose={() => {
			showImport = false;
			importUrl = '';
		}}
		onImported={handleImported}
		onManual={openManual}
	/>
{/if}

{#if showModal && session}
	<WishModal
		wish={editingWish}
		initial={draft}
		onClose={closeModal}
		onSaved={handleSaved}
		onSave={saveWish}
	/>
{/if}
