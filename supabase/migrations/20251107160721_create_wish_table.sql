CREATE TABLE wishes (
		id SERIAL PRIMARY KEY,
		user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
		title TEXT NOT NULL,
		price NUMERIC(10, 2) NOT NULL DEFAULT 0,
		image_url TEXT NOT NULL DEFAULT 'https://placehold.co/800',
		url TEXT,
		quantity INTEGER NOT NULL DEFAULT 1,
		description TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_wishes_user_id ON wishes(user_id);

-- CREATE RLS so everyone can read and only the owner can write, update, delete their wishes
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in users to read all wishes" ON wishes
		FOR SELECT
		USING (auth.role() = 'authenticated');

CREATE POLICY "Allow owners to modify their wishes" ON wishes
		FOR UPDATE
		USING (auth.uid() = user_id);

CREATE POLICY "Allow owners to delete their wishes" ON wishes
		FOR DELETE
		USING (auth.uid() = user_id);

CREATE POLICY "Allow owners to insert their wishes" ON wishes
		FOR INSERT
		WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
	 NEW.updated_at = NOW();
	 RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wishes_updated_at
BEFORE UPDATE ON wishes
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();