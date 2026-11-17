<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import type { Snippet } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
	const supabase = $derived(data.supabase);
	const session = $derived(data.session);

	onMount(() => {
		const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
			if (nextSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>

<svelte:head>
	<title>Noël</title>
</svelte:head>

<div class="min-h-dvh">
	{#if session}
		<AppHeader {session} />
	{/if}
	{@render children()}
</div>
