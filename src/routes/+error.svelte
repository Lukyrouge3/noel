<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} — Noël</title>
</svelte:head>

<main
	class="mx-auto flex min-h-[70dvh] w-full max-w-xl flex-col items-center justify-center px-6 py-12 text-center"
>
	<p class="text-6xl font-bold text-red-600">{page.status}</p>
	<h1 class="mt-3 text-2xl font-semibold text-slate-900">
		{page.status === 404 ? 'Page introuvable' : 'Une erreur est survenue'}
	</h1>
	<p class="mt-2 text-sm text-slate-600">
		{page.error?.message ?? 'Réessayez dans un instant.'}
	</p>
	<a
		href="/"
		class="mt-6 rounded-lg bg-red-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none"
	>
		Retour à l’accueil
	</a>
</main>
