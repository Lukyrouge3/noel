export const load = async ({ parent }) => {
	const { session, supabase } = await parent();

	if (!session) {
		return {
			problems: []
		};
	}

	const { data: problems } = await supabase
		.from('wishes')
		.select('*, buy_intentions!inner(*), profiles(*)')
		.eq('buy_intentions.user_id', session?.user.id)
		.eq('deleted', true);
	return {
		problems: problems || []
	};
};
