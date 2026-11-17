<script lang="ts">
	import { onMount } from 'svelte';
	import type { ImportResult } from '$lib/import';

	let {
		onClose,
		onImported,
		onManual
	}: {
		onClose: () => void;
		onImported: (result: ImportResult) => void;
		onManual: () => void;
	} = $props();

	let url = $state('');
	let loading = $state(false);
	let error = $state('');
	let warnings = $state<string[]>([]);
	let dialog: HTMLDivElement;
	let input: HTMLInputElement;

	onMount(() => {
		const previous = document.activeElement as HTMLElement | null;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		input?.focus();

		function onKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape') {
				event.preventDefault();
				onClose();
				return;
			}

			if (event.key !== 'Tab' || !dialog) return;

			const focusable = Array.from(
				dialog.querySelectorAll<HTMLElement>(
					'button:not([disabled]), input:not([disabled]), a[href]'
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

	async function pasteFromClipboard() {
		error = '';
		try {
			const text = await navigator.clipboard.readText();
			if (!text.trim()) {
				error = 'Le presse-papiers est vide.';
				return;
			}
			url = text.trim();
			input?.focus();
		} catch {
			error = 'Impossible de lire le presse-papiers. Collez le lien manuellement.';
			input?.focus();
		}
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		warnings = [];

		const cleanUrl = url.trim();
		if (!cleanUrl) {
			error = 'Collez le lien du produit.';
			input?.focus();
			return;
		}

		loading = true;
		try {
			const response = await fetch('/api/import/url', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ url: cleanUrl })
			});

			const result = (await response.json().catch(() => null)) as ImportResult | null;

			if (!response.ok || !result) {
				error = result?.error ?? 'Impossible de lire ce lien pour le moment.';
				return;
			}

			warnings = result.warnings ?? [];

			if (!result.ok || !result.product.title) {
				error =
					result.error ??
					'Impossible de lire les informations de ce produit. Ajoutez-le à la main.';
				return;
			}

			onImported(result);
		} catch {
			error = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
		} finally {
			loading = false;
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
		aria-labelledby="import-modal-title"
		class="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
	>
		<div class="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
			<h2 id="import-modal-title" class="text-lg font-semibold text-slate-900">
				Importer depuis un lien
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
			<p class="text-sm text-slate-600">
				Copiez le lien du produit, collez-le ici, puis appuyez sur Importer.
			</p>

			{#if error}
				<div
					class="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
					role="alert"
					aria-live="polite"
				>
					{error}
				</div>
			{/if}

			{#if warnings.length > 0}
				<ul class="space-y-1 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
					{#each warnings as warning (warning)}
						<li>{warning}</li>
					{/each}
				</ul>
			{/if}

			<div>
				<label for="import-url" class="mb-1 block text-sm font-medium text-slate-700">
					Lien du produit
				</label>
				<input
					id="import-url"
					bind:this={input}
					bind:value={url}
					type="url"
					inputmode="url"
					autocomplete="off"
					placeholder="https://…"
					class="w-full rounded-lg border border-slate-200 px-3 py-3 text-base text-slate-900 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
				/>
			</div>

			<div class="flex flex-col gap-2 sm:flex-row">
				<button
					type="button"
					onclick={pasteFromClipboard}
					class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition hover:bg-slate-200 focus:ring-2 focus:ring-slate-400 focus:outline-none"
				>
					Coller
				</button>
				<button
					type="submit"
					disabled={loading || !url.trim()}
					class="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
				>
					{#if loading}
						<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
						Importation…
					{:else}
						Importer
					{/if}
				</button>
			</div>

			<div class="border-t border-slate-100 pt-4 text-center">
				<button
					type="button"
					onclick={onManual}
					class="text-sm font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline focus:ring-2 focus:ring-slate-400 focus:outline-none"
				>
					Remplir à la main
				</button>
			</div>
		</form>
	</div>
</div>
