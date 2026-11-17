export const load = async ({ parent }) => {
	const { supabase, session } = await parent();

	if (!session) {
		return { buy_intentions: [] };
	}

	const { data: buy_intentions } = await supabase
		.from('buy_intentions')
		.select('*, wish:wishes!inner(*, profile:public_profiles!inner(*))')
		.eq('user_id', session.user.id);

	return {
		buy_intentions: buy_intentions ?? []
	};
};
