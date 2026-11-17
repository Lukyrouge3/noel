<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const supabase = $derived(data.supabase);

	let password = $state('');
	let email = $state('');
	let error = $state('');
	let loading = $state(false);

	async function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		loading = true;

		try {
			const { error: authError } = await supabase.auth.signInWithPassword({
				email: email.trim(),
				password
			});

			if (authError) {
				error = authError.message.toLowerCase().includes('invalid login')
					? 'Adresse e-mail ou mot de passe incorrect.'
					: 'Connexion impossible : ' + authError.message;
				return;
			}

			await goto('/');
		} finally {
			loading = false;
		}
	}
</script>

<main class="flex min-h-[85dvh] items-center justify-center px-4 py-10">
	<div class="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-lg">
		<div class="mb-6 flex flex-col items-center text-center">
			<div
				class="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-red-500 text-2xl shadow-sm"
				aria-hidden="true"
			>
				🎄
			</div>
			<h1 class="text-2xl font-semibold text-slate-900">Se connecter</h1>
			<p class="mt-1 text-sm text-slate-500">Connectez-vous avec votre adresse e-mail.</p>
		</div>

		<form onsubmit={onSubmit} class="space-y-4" aria-label="Formulaire de connexion">
			{#if error}
				<div
					class="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
					role="alert"
					aria-live="polite"
				>
					{error}
				</div>
			{/if}

			<div>
				<label for="email" class="mb-1 block text-sm font-medium text-slate-700">
					Adresse e-mail
				</label>
				<input
					id="email"
					bind:value={email}
					name="email"
					type="email"
					required
					autocomplete="email"
					placeholder="vous@exemple.com"
					class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
				/>
			</div>

			<div>
				<label for="password" class="mb-1 block text-sm font-medium text-slate-700">
					Mot de passe
				</label>
				<input
					id="password"
					bind:value={password}
					name="password"
					type="password"
					required
					autocomplete="current-password"
					placeholder="••••••••"
					class="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 placeholder-slate-400 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
			>
				{#if loading}
					<svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
						></path>
					</svg>
					Connexion…
				{:else}
					Se connecter
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-xs text-slate-400">
			Mot de passe oublié ? Demandez à la personne qui gère le site.
		</p>
	</div>
</main>
