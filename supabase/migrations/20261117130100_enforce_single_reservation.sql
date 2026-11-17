-- A wish can only be reserved by one person at a time.
-- Deduplicate historic rows first, preferring a row already marked as bought.
WITH ranked AS (
	SELECT
		id,
		row_number() OVER (
			PARTITION BY wish_id
			ORDER BY bought DESC, id ASC
		) AS rn
	FROM public.buy_intentions
	WHERE wish_id IS NOT NULL
)
DELETE FROM public.buy_intentions AS bi
USING ranked
WHERE bi.id = ranked.id
	AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS buy_intentions_wish_id_unique
	ON public.buy_intentions (wish_id)
	WHERE wish_id IS NOT NULL;
