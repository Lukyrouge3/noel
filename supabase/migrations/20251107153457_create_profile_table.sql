CREATE TABLE public.profiles (
		id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
		email VARCHAR(255) UNIQUE NOT NULL,
		username VARCHAR(50) UNIQUE
);

CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Create a trigger to automatically insert a profile record when a new user is created
CREATE OR REPLACE FUNCTION create_profile()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ensure the function is owned by a privileged role so it can bypass RLS when executed
ALTER FUNCTION public.create_profile() OWNER TO postgres;

CREATE TRIGGER trg_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_profile();

-- Add rls so everyone can read profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;	
CREATE POLICY "Allow read access to all users" ON public.profiles
FOR SELECT
TO public
USING (auth.role() = 'authenticated');

-- Allow users to update and insert their own profile
CREATE POLICY "Allow users to modify their own profile" ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Allow users to insert their own profile" ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);