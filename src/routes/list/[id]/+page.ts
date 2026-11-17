export const load = async ({ parent, params }) => {
	const { supabase, session } = await parent();

	if (!session) {
		return { wishes: [], profile: null };
	}

	const { data: wishes } = await supabase
		.from('wishes')
		.select('*, buy_intentions(*)')
		.eq('user_id', params.id)
		.eq('deleted', false);

	const { data: profile } = await supabase
		.from('public_profiles')
		.select('*')
		.eq('id', params.id)
		.maybeSingle();

	return {
		wishes: wishes ?? [],
		profile
	};
};
