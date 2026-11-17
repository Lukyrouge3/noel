# Noël 🎄

A small family wishlist app built with SvelteKit, Supabase and Tailwind CSS.

## Local development

```sh
pnpm install
cp .env.example .env      # fill in the values
pnpm db:start
pnpm db:reset             # applies migrations + seed.sql
pnpm dev
```

Supabase Studio: <http://127.0.0.1:53323>

### Seeded accounts

`supabase/seed.sql` creates deterministic local data. Password for every account: `password123`.

| Email                | Username |
| -------------------- | -------- |
| `alice@example.test` | alice    |
| `bob@example.test`   | bob      |
| `carol@example.test` | carol    |

The seed includes normal wishes, reserved wishes, a bought item, and a deleted wish that still
has a buy intention (used by the “Problèmes détectés” panel).

> The seed is for local development only. Never run it against a production database.

## Useful scripts

| Command                          | Description                                        |
| -------------------------------- | -------------------------------------------------- |
| `pnpm dev`                       | Start the dev server                               |
| `pnpm check`                     | Svelte/TypeScript diagnostics                      |
| `pnpm lint`                      | Prettier + ESLint                                  |
| `pnpm build`                     | Production build                                   |
| `pnpm db:start` / `pnpm db:stop` | Start/stop local Supabase                          |
| `pnpm db:reset`                  | Reset the local database and run the seed          |
| `pnpm db:status`                 | Show local Supabase URLs and keys                  |
| `pnpm types:generate`            | Regenerate `src/lib/supabase.ts` from the local DB |

## Environment

```env
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_PUBLISHABLE_KEY=

LLM_BASE_URL=https://api.deepseek.com
LLM_API_KEY=
LLM_MODEL=deepseek-flash
LLM_JSON_MODE=true
LLM_TIMEOUT_MS=30000

READER_PROVIDER=deepseek
```

The importer works with any OpenAI-compatible chat-completions provider. If `LLM_API_KEY` is
missing, URL imports fall back to metadata-only mode instead of failing.
