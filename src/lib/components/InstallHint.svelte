<script lang="ts">
	import { onMount } from 'svelte';

	let visible = $state(false);

	onMount(() => {
		const standalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(navigator as Navigator & { standalone?: boolean }).standalone === true;

		if (standalone) return;
		if (localStorage.getItem('noel-install-hint') === 'dismissed') return;

		visible = true;
	});

	function dismiss() {
		visible = false;
		try {
			localStorage.setItem('noel-install-hint', 'dismissed');
		} catch {
			// Storage can be unavailable in private mode; the hint simply stays hidden.
		}
	}
</script>

{#if visible}
	<div
		class="mx-4 mt-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800 md:hidden"
	>
		<div class="flex items-start justify-between gap-3">
			<p>
				<strong>Astuce :</strong> ajoutez Noël à votre écran d’accueil pour y accéder plus vite.
			</p>
			<button
				type="button"
				class="flex-none rounded px-2 py-0.5 font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-400 focus:outline-none"
				onclick={dismiss}
			>
				Compris
			</button>
		</div>
	</div>
{/if}
