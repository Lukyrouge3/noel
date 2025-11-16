export const load = async ({ parent }) => {
	const { supabase, session } = await parent();


	const { data: buy_intentions } = await supabase.from('buy_intentions').select('*, wish:wishes!inner(*, profile:profiles!inner(*))').eq('user_id', session!.user.id);


	return {
		buy_intentions
	}
}