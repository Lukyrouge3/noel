<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description = null,
		action = null
	}: {
		title: string;
		description?: string | null;
		action?: Snippet | null;
	} = $props();
</script>

<div
	class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/60 px-6 py-14 text-center"
>
	<div
		class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-2xl"
		aria-hidden="true"
	>
		🎁
	</div>
	<p class="text-lg font-semibold text-slate-800">{title}</p>
	{#if description}
		<p class="mt-1 max-w-md text-sm text-slate-500">{description}</p>
	{/if}
	{#if action}
		<div class="mt-5">{@render action()}</div>
	{/if}
</div>
