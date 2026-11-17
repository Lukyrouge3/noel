-- Add a currency to wishes so imported prices are not assumed to be EUR.
ALTER TABLE public.wishes
	ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR';

DO $$
BEGIN
	ALTER TABLE public.wishes
		ADD CONSTRAINT wishes_currency_check CHECK (char_length(currency) = 3);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
