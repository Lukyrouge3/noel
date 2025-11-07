export const load = async ({ parent, params }) => {
	const { supabase } = await parent();

	const { data: wishes } = await supabase.from('wishes').select('*, buy_intentions(*)').eq('user_id', params.id).eq('deleted', false);

	const { data: profile } = await supabase.from('profiles').select('*').eq('id', params.id).single();


	return {
		wishes, profile
	}
}