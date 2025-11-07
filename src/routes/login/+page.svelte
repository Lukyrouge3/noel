<script lang="ts">
	import { redirect } from '@sveltejs/kit';

	// UI only - no logic

	const { data } = $props();
	const { supabase } = $derived(data);

	let password = $state('');
	let email = $state('');

	async function onSubmit(e: Event) {
		e.preventDefault();
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		if (error) {
			alert('Erreur de connexion : ' + error.message);
		} else {
			window.location.href = '/';
		}
	}

</script>

<main class="min-h-screen bg-slate-50 flex items-center justify-center p-6">
	<div class="max-w-md w-full bg-white rounded-2xl shadow-md p-8">
		<div class="flex items-center justify-center mb-4">
			<div class="relative h-12 w-12 rounded-lg bg-gradient-to-br from-red-600 via-red-500 to-red-400 flex items-center justify-center text-white font-bold">Noël
				<span class="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-white border-2 border-red-600" aria-hidden="true"></span>
			</div>
		</div>

		<h1 class="text-2xl font-semibold text-slate-900 text-center">Se connecter</h1>
		<p class="text-sm text-slate-500 text-center mt-1 mb-6">Connectez‑vous avec votre adresse e‑mail</p>

		<form action="/login" method="post" class="space-y-4" aria-label="Formulaire de connexion" onsubmit={onSubmit}>
			<div>
				<label for="email" class="block text-sm font-medium text-slate-700">Adresse e‑mail</label>
				<div class="mt-1">
					<input id="email" bind:value={email} name="email" type="email" required placeholder="vous@exemple.com"
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent" />
				</div>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-slate-700">Mot de passe</label>
				<div class="mt-1">
					<input id="password" bind:value={password} name="password" type="password" required placeholder="••••••••"
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent" />
				</div>
			</div>

			<div class="flex items-center justify-between">
				<!-- <label class="flex items-center gap-2 text-slate-600 text-sm">
					<input type="checkbox" name="remember" class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
					Se souvenir de moi
				</label> -->

				<a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ" class="text-sm text-red-600 hover:underline">Mot de passe oublié ?</a>
			</div>

			<div>
				<button type="submit" class="w-full inline-flex items-center justify-center gap-2 rounded-md bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold px-4 py-2 shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400">Se connecter</button>
			</div>
		</form>

		<!-- <p class="mt-6 text-center text-sm text-slate-600">Pas de compte ? <a href="/signup" class="text-red-600 hover:underline">Inscription</a></p> -->
	</div>
</main>

