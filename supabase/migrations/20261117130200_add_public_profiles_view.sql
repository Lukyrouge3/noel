-- Public-safe profile data. The app displays display names, never email addresses.
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
SELECT
	id,
	COALESCE(NULLIF(username, ''), split_part(email, '@', 1)) AS display_name
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO authenticated;
