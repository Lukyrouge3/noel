<script lang="ts">
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

<main class="flex min-h-screen items-center justify-center bg-slate-50 p-6">
	<div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
		<div class="mb-4 flex items-center justify-center">
			<div
				class="relative flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-red-600 via-red-500 to-red-400 font-bold text-white"
			>
				Noël
				<span
					class="absolute -top-2 -right-2 h-3 w-3 rounded-full border-2 border-red-600 bg-white"
					aria-hidden="true"
				></span>
			</div>
		</div>

		<h1 class="text-center text-2xl font-semibold text-slate-900">Se connecter</h1>
		<p class="mt-1 mb-6 text-center text-sm text-slate-500">
			Connectez‑vous avec votre adresse e‑mail
		</p>

		<form
			action="/login"
			method="post"
			class="space-y-4"
			aria-label="Formulaire de connexion"
			onsubmit={onSubmit}
		>
			<div>
				<label for="email" class="block text-sm font-medium text-slate-700">Adresse e‑mail</label>
				<div class="mt-1">
					<input
						id="email"
						bind:value={email}
						name="email"
						type="email"
						required
						placeholder="vous@exemple.com"
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 placeholder-slate-400 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-slate-700">Mot de passe</label>
				<div class="mt-1">
					<input
						id="password"
						bind:value={password}
						name="password"
						type="password"
						required
						placeholder="••••••••"
						class="w-full rounded-md border border-slate-200 bg-white px-3 py-2 placeholder-slate-400 shadow-sm focus:border-transparent focus:ring-2 focus:ring-red-400 focus:outline-none"
					/>
				</div>
			</div>

			<div class="flex items-center justify-between">
				<!-- <label class="flex items-center gap-2 text-slate-600 text-sm">
					<input type="checkbox" name="remember" class="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500" />
					Se souvenir de moi
				</label> -->

				<a
					href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
					class="text-sm text-red-600 hover:underline">Mot de passe oublié ?</a
				>
			</div>

			<div>
				<button
					type="submit"
					class="inline-flex w-full items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 font-semibold text-white shadow-md hover:bg-red-700 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:outline-none active:bg-red-800"
					>Se connecter</button
				>
			</div>
		</form>

		<!-- <p class="mt-6 text-center text-sm text-slate-600">Pas de compte ? <a href="/signup" class="text-red-600 hover:underline">Inscription</a></p> -->
	</div>
</main>
