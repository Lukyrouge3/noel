CREATE TABLE buy_intentions (
		id SERIAL PRIMARY KEY,
		user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
		wish_id INTEGER REFERENCES wishes(id) ON DELETE CASCADE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

		UNIQUE(user_id, wish_id)
);


CREATE INDEX idx_buy_intentions_user_id ON buy_intentions(user_id);
CREATE INDEX idx_buy_intentions_wish_id ON buy_intentions(wish_id);

-- CREATE RLS so everyone can read and only the owner can write, update, delete their buy intentions
ALTER TABLE buy_intentions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow logged-in users to read all buy intentions" ON buy_intentions
		FOR SELECT
		USING (auth.role() = 'authenticated');

CREATE POLICY "Allow owners to delete their buy intentions" ON buy_intentions
		FOR DELETE
		USING (auth.uid() = user_id);

CREATE POLICY "Allow owners to insert their buy intentions" ON buy_intentions
		FOR INSERT
		WITH CHECK (auth.uid() = user_id);
