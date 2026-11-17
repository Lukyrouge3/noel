<script lang="ts">
	import { onMount } from 'svelte';
	import type { Tables } from '$lib/supabase';
	import type { WishPayload, WishSaveResult } from '$lib/wishes';

	type Wish = Tables<'wishes'>;

	const PLACEHOLDER = 'https://placehold.co/400x400/e5e7eb/374151?text=Article';
	const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'CAD'];

	let {
		wish = null,
		initial = null,
		onClose,
		onSaved,
		onSave
	}: {
		wish?: Wish | null;
		initial?: Partial<WishPayload> | null;
		onClose: () => void;
		onSaved: (wish: Wish) => void;
		onSave: (payload: WishPayload, wishId?: number) => Promise<WishSaveResult>;
	} = $props();

	const isEdit = wish !== null;

	let title = $state(wish?.title ?? initial?.title ?? '');
	let price = $state(
		wish
			? String(wish.price)
			: initial?.price !== undefined && initial?.price !== null
				? String(initial.price)
				: ''
	);
	let currency = $state(wish?.currency ?? initial?.currency ?? 'EUR');
	let quantity = $state(wish?.quantity ?? initial?.quantity ?? 1);
	let url = $state(wish?.url ?? initial?.url ?? '');
	let imageUrl = $state(wish?.image_url ?? initial?.image_url ?? '');
	let description = $state(wish?.description ?? initial?.description ?? '');
	let error = $state('');
	let pending = $state(false);

	let dialog: HTMLDivElement;
	let titleInput: HTMLInputElement;

	onMount(() => {
		const previous = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		titleInput?.focus();

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
				return;
			}

			if (event.key !== 'Tab' || !dialog) return;

			const focusable = Array.from(
				dialog.querySelectorAll<HTMLElement>(
					'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href]'
				)
			).filter((element) => element.offsetParent !== null);

			if (focusable.length === 0) return;

			const first = focusable[0];
			const last = focusable[focusable.length - 1];

			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		}

		window.addEventListener('keydown', onKeydown);

		return () => {
			window.removeEventListener('keydown', onKeydown);
			document.body.style.overflow = previousOverflow;
			previous?.focus();
		};
	});

	function normalizeUrl(value: string): string | null {
		const trimmed = value.trim();
		if (!trimmed) return null;

		const parsed = new URL(trimmed);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			throw new Error('invalid protocol');
		}

		return parsed.toString();
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';

		const cleanTitle = title.trim();
		if (!cleanTitle) {
			error = 'Le titre est obligatoire.';
			titleInput?.focus();
			return;
		}

		const numericPrice = Number(price.replace(',', '.'));
		if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0) {
			error = 'Indiquez un prix valide (0 ou plus).';
			return;
		}

		const numericQuantity = Number(quantity);
		if (!Number.isInteger(numericQuantity) || numericQuantity < 1) {
			error = 'La quantité doit être un nombre entier supérieur ou égal à 1.';
			return;
		}

		let normalizedUrl: string | null;
		let normalizedImage: string;
		try {
			normalizedUrl = normalizeUrl(url);
			normalizedImage = normalizeUrl(imageUrl) ?? PLACEHOLDER;
		} catch {
			error = 'Les liens doivent être des URL http(s) valides.';
			return;
		}

		const payload = {
			title: cleanTitle,
			price: numericPrice,
			currency,
			quantity: numericQuantity,
			url: normalizedUrl,
			image_url: normalizedImage,
			description: description.trim() || null
		};

		pending = true;
		try {
			const result = await onSave(payload, wish?.id);

			if (result.error || !result.wish) {
				error = result.error ?? "Impossible d'enregistrer l'article.";
				return;
			}

			onSaved(result.wish);
		} finally {
			pending = false;
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6"
	role="presentation"
	onclick={(event) => {
		if (event.target === event.currentTarget) onClose();
	}}
>
	<div
		bind:this={dialog}
		role="dialog"
		aria-modal="true"
		aria-labelledby="wish-modal-title"
		class="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
	>
		<div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
			<h2 id="wish-modal-title" class="text-lg font-semibold text-slate-900">
				{isEdit ? "Modifier l'article" : 'Ajouter un article'}
			</h2>
			<button
				type="button"
				class="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:ring-2 focus:ring-red-400 focus:outline-none"
				aria-label="Fermer"
				onclick={onClose}
			>
				<svg class="h-5 w-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path
						d="M5 5l10 10M15 5L5 15"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
					/>
				</svg>
			</button>
		</div>

		<form onsubmit={handleSubmit} class="space-y-4 px-5 py-5 sm:px-6">
			{#if error}
				<div
					class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
					role="alert"
					aria-live="polite"
				>
					{error}
				</div>
			{/if}

			<div>
				<label for="wish-title" class="mb-1 block text-sm font-medium text-slate-700">
					Titre <span class="text-red-600">*</span>
				</label>
				<input
					id="wish-title"
					bind:this={titleInput}
					bind:value={title}
					type="text"
					required
					autocomplete="off"
					class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
				/>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div class="sm:col-span-2">
					<label for="wish-price" class="mb-1 block text-sm font-medium text-slate-700">Prix</label>
					<input
						id="wish-price"
						bind:value={price}
						type="text"
						inputmode="decimal"
						placeholder="0,00"
						class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
				<div>
					<label for="wish-currency" class="mb-1 block text-sm font-medium text-slate-700"
						>Devise</label
					>
					<select
						id="wish-currency"
						bind:value={currency}
						class="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					>
						{#each CURRENCIES as code (code)}
							<option value={code}>{code}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div>
					<label for="wish-quantity" class="mb-1 block text-sm font-medium text-slate-700"
						>Quantité</label
					>
					<input
						id="wish-quantity"
						bind:value={quantity}
						type="number"
						min="1"
						step="1"
						class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
				<div class="sm:col-span-2">
					<label for="wish-url" class="mb-1 block text-sm font-medium text-slate-700"
						>Lien du produit</label
					>
					<input
						id="wish-url"
						bind:value={url}
						type="url"
						placeholder="https://…"
						class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="wish-image" class="mb-1 block text-sm font-medium text-slate-700"
					>Image (URL)</label
				>
				<div class="flex items-center gap-3">
					{#if imageUrl}
						<img
							src={imageUrl}
							alt=""
							class="h-12 w-12 flex-none rounded-lg border border-slate-200 object-cover"
							onerror={(event) => {
								(event.currentTarget as HTMLImageElement).style.visibility = 'hidden';
							}}
						/>
					{/if}
					<input
						id="wish-image"
						bind:value={imageUrl}
						type="url"
						placeholder="https://…"
						class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="wish-description" class="mb-1 block text-sm font-medium text-slate-700"
					>Description</label
				>
				<textarea
					id="wish-description"
					bind:value={description}
					rows="3"
					class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
				></textarea>
			</div>

			<div
				class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"
			>
				<button
					type="button"
					class="w-full rounded-lg bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 focus:outline-none sm:w-auto"
					onclick={onClose}
				>
					Annuler
				</button>
				<button
					type="submit"
					disabled={pending}
					class="w-full rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
				>
					{pending ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Ajouter'}
				</button>
			</div>
		</form>
	</div>
</div>
