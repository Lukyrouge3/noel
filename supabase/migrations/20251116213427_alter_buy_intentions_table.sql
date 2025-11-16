-- Migration: add "bought" column to buy_intentions
-- Adds a NOT NULL boolean column with default false
ALTER TABLE public.buy_intentions
	ADD COLUMN IF NOT EXISTS bought boolean NOT NULL DEFAULT false;

-- Revert (if needed):
-- ALTER TABLE public.buy_intentions DROP COLUMN IF EXISTS bought;

CREATE POLICY "Allow owners to update their buy intentions" ON buy_intentions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);