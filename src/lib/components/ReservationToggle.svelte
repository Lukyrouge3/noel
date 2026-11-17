<script lang="ts">
	let {
		mine,
		reservedByOther,
		pending = false,
		onToggle
	}: {
		mine: boolean;
		reservedByOther: boolean;
		pending?: boolean;
		onToggle: () => void;
	} = $props();
</script>

<label class="inline-flex cursor-pointer items-center gap-2 text-sm select-none">
	<input
		type="checkbox"
		class="peer sr-only"
		disabled={reservedByOther || pending}
		checked={mine}
		onchange={onToggle}
	/>
	<span
		class="h-4 w-4 flex-none rounded border border-slate-300 bg-white transition-colors peer-checked:border-green-600 peer-checked:bg-green-600 peer-disabled:cursor-not-allowed peer-disabled:border-slate-200 peer-disabled:bg-slate-100 peer-disabled:opacity-60"
		aria-hidden="true"
	></span>
	<span class="text-sm text-slate-700 peer-disabled:text-slate-400">
		{reservedByOther ? "Réservé par quelqu'un d'autre" : "Je vais l'acheter"}
	</span>
</label>
