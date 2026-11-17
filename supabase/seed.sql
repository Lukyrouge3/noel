-- Local development seed.
-- Run with: supabase db reset
-- Accounts (password: password123):
--   alice@example.test  (alice)
--   bob@example.test    (bob)
--   carol@example.test  (carol)

-- ---------------------------------------------------------------------------
-- Users + identities (so password sign-in works locally)
-- ---------------------------------------------------------------------------
INSERT INTO auth.users (
	instance_id,
	id,
	aud,
	role,
	email,
	encrypted_password,
	email_confirmed_at,
	last_sign_in_at,
	raw_app_meta_data,
	raw_user_meta_data,
	created_at,
	updated_at,
	confirmation_token,
	email_change,
	email_change_token_new,
	recovery_token
)
VALUES
	(
		'00000000-0000-0000-0000-000000000000',
		'11111111-1111-1111-1111-111111111111',
		'authenticated',
		'authenticated',
		'alice@example.test',
		extensions.crypt('password123', extensions.gen_salt('bf')),
		now(),
		now(),
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"email_verified":true}'::jsonb,
		now(),
		now(),
		'',
		'',
		'',
		''
	),
	(
		'00000000-0000-0000-0000-000000000000',
		'22222222-2222-2222-2222-222222222222',
		'authenticated',
		'authenticated',
		'bob@example.test',
		extensions.crypt('password123', extensions.gen_salt('bf')),
		now(),
		now(),
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"email_verified":true}'::jsonb,
		now(),
		now(),
		'',
		'',
		'',
		''
	),
	(
		'00000000-0000-0000-0000-000000000000',
		'33333333-3333-3333-3333-333333333333',
		'authenticated',
		'authenticated',
		'carol@example.test',
		extensions.crypt('password123', extensions.gen_salt('bf')),
		now(),
		now(),
		'{"provider":"email","providers":["email"]}'::jsonb,
		'{"email_verified":true}'::jsonb,
		now(),
		now(),
		'',
		'',
		'',
		''
	)
ON CONFLICT (id) DO NOTHING;

INSERT INTO auth.identities (
	id,
	user_id,
	provider_id,
	identity_data,
	provider,
	last_sign_in_at,
	created_at,
	updated_at
)
VALUES
	(
		gen_random_uuid(),
		'11111111-1111-1111-1111-111111111111',
		'11111111-1111-1111-1111-111111111111',
		'{"sub":"11111111-1111-1111-1111-111111111111","email":"alice@example.test","email_verified":true,"phone_verified":false}'::jsonb,
		'email',
		now(),
		now(),
		now()
	),
	(
		gen_random_uuid(),
		'22222222-2222-2222-2222-222222222222',
		'22222222-2222-2222-2222-222222222222',
		'{"sub":"22222222-2222-2222-2222-222222222222","email":"bob@example.test","email_verified":true,"phone_verified":false}'::jsonb,
		'email',
		now(),
		now(),
		now()
	),
	(
		gen_random_uuid(),
		'33333333-3333-3333-3333-333333333333',
		'33333333-3333-3333-3333-333333333333',
		'{"sub":"33333333-3333-3333-3333-333333333333","email":"carol@example.test","email_verified":true,"phone_verified":false}'::jsonb,
		'email',
		now(),
		now(),
		now()
	)
ON CONFLICT DO NOTHING;

-- The auth trigger creates profiles; make their usernames deterministic.
INSERT INTO public.profiles (id, email, username)
VALUES
	('11111111-1111-1111-1111-111111111111', 'alice@example.test', 'alice'),
	('22222222-2222-2222-2222-222222222222', 'bob@example.test', 'bob'),
	('33333333-3333-3333-3333-333333333333', 'carol@example.test', 'carol')
ON CONFLICT (id) DO UPDATE SET username = EXCLUDED.username;

-- ---------------------------------------------------------------------------
-- Wishes
-- ---------------------------------------------------------------------------
INSERT INTO public.wishes (
	id,
	user_id,
	title,
	price,
	currency,
	image_url,
	url,
	quantity,
	description,
	deleted
)
VALUES
	(
		1,
		'11111111-1111-1111-1111-111111111111',
		'Casque Sony WH-1000XM5',
		299.99,
		'EUR',
		'https://placehold.co/400x400/fee2e2/991b1b?text=Casque',
		'https://www.sony.fr/electronics/casques-bluetooth/wh-1000xm5',
		1,
		'Casque à réduction de bruit, couleur noire.',
		false
	),
	(
		2,
		'11111111-1111-1111-1111-111111111111',
		'Le Petit Prince (poche)',
		12.50,
		'EUR',
		'https://placehold.co/400x400/fef3c7/92400e?text=Livre',
		NULL,
		1,
		'Édition de poche, si possible la couverture bleue.',
		false
	),
	(
		3,
		'11111111-1111-1111-1111-111111111111',
		'Cafetière à piston',
		24.90,
		'EUR',
		'https://placehold.co/400x400/e0e7ff/3730a3?text=Cafeti%C3%A8re',
		NULL,
		1,
		'Une cafetière 1 litre, en verre.',
		false
	),
	(
		4,
		'11111111-1111-1111-1111-111111111111',
		'Ancien article supprimé',
		19.99,
		'EUR',
		'https://placehold.co/400x400/e5e7eb/374151?text=Article',
		NULL,
		1,
		'Cet article a été supprimé mais quelqu''un avait prévu de l''acheter.',
		true
	),
	(
		5,
		'22222222-2222-2222-2222-222222222222',
		'Nintendo Switch 2',
		349.99,
		'EUR',
		'https://placehold.co/400x400/fee2e2/991b1b?text=Switch',
		NULL,
		1,
		'La console seule, sans jeu.',
		false
	),
	(
		6,
		'22222222-2222-2222-2222-222222222222',
		'Chaussettes de Noël',
		9.99,
		'EUR',
		'https://placehold.co/400x400/dcfce7/166534?text=Chaussettes',
		NULL,
		3,
		'Des chaussettes rouges et vertes, taille 39-42.',
		false
	),
	(
		7,
		'22222222-2222-2222-2222-222222222222',
		'Livre de cuisine italienne',
		22.00,
		'EUR',
		'https://placehold.co/400x400/fef3c7/92400e?text=Cuisine',
		NULL,
		1,
		'Un livre avec des recettes de pâtes.',
		false
	),
	(
		8,
		'33333333-3333-3333-3333-333333333333',
		'Appareil photo instantané',
		89.90,
		'EUR',
		'https://placehold.co/400x400/f3e8ff/6b21a8?text=Photo',
		NULL,
		1,
		'Un Instax ou équivalent, avec des recharges.',
		false
	),
	(
		9,
		'33333333-3333-3333-3333-333333333333',
		'Plaid en laine',
		39.00,
		'EUR',
		'https://placehold.co/400x400/fee2e2/991b1b?text=Plaid',
		NULL,
		2,
		'Un plaid doux, couleur crème.',
		false
	),
	(
		10,
		'33333333-3333-3333-3333-333333333333',
		'Thé de Noël',
		8.50,
		'EUR',
		'https://placehold.co/400x400/dcfce7/166534?text=Th%C3%A9',
		NULL,
		2,
		'Thé noir aux épices, en sachets.',
		false
	)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Buy intentions (one per wish; `bought` feeds the shopping page)
-- ---------------------------------------------------------------------------
INSERT INTO public.buy_intentions (id, user_id, wish_id, bought)
VALUES
	(1, '22222222-2222-2222-2222-222222222222', 1, false),
	(2, '33333333-3333-3333-3333-333333333333', 3, false),
	(3, '11111111-1111-1111-1111-111111111111', 5, false),
	(4, '22222222-2222-2222-2222-222222222222', 4, false),
	(5, '33333333-3333-3333-3333-333333333333', 6, true),
	(6, '11111111-1111-1111-1111-111111111111', 9, true)
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- Sequences
-- ---------------------------------------------------------------------------
SELECT setval(
	pg_get_serial_sequence('public.wishes', 'id'),
	COALESCE((SELECT max(id) FROM public.wishes), 1)
);

SELECT setval(
	pg_get_serial_sequence('public.buy_intentions', 'id'),
	COALESCE((SELECT max(id) FROM public.buy_intentions), 1)
);
