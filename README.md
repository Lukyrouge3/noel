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

`READER_PROVIDER` can be `deepseek` (default), `jina`, or `none`. DeepSeek Fetch is billed per
successful page (about $0.75 per 1,000 fetches); Jina Reader has a free tier. If you use another
provider for the LLM, set `READER_PROVIDER=none` or provide a separate `DEEPSEEK_API_KEY` — the
reader never sends a non-DeepSeek key to DeepSeek.

## Importing a product

There is no browser extension or bookmarklet. The flow is designed to be usable by anyone on a
phone:

1. Tap **Ajouter un article**.
2. Paste the product link (or tap **Coller**), then **Importer**.
3. Check the prefilled fields and tap **Ajouter**.

The server tries, in order:

1. A direct, SSRF-safe fetch with JSON-LD / OpenGraph / microdata / Readability extraction.
2. The configured reader (`DeepSeek Fetch`, or Jina) for pages that refuse the direct request. If the primary reader returns no product image, a free Jina Reader lookup is used just to find one.
3. An OpenAI-compatible LLM call with JSON mode to fill the gaps (title, price, currency, image,
   description).
4. A screenshot fallback: the user picks a screenshot of the product page, which is resized in
   the browser and read by the multimodal model. Nothing is stored.
5. Manual editing in the same form.

No paid unblocker is used. Hard-protected shops (Amazon, Fnac, etc.) should be handled with the
screenshot fallback. Imported URLs are cached in memory for 24 hours (1 hour for partial results)
and rate-limited per user.

## PWA

On Android, the installed app accepts shared links (`Share → Noël`). On iOS, Safari does not
support Web Share Target, so paste the link into the app instead. Both platforms support
**Add to Home Screen** / **Open as Web App**.

## Verification

```sh
pnpm format
pnpm check
pnpm lint
pnpm build
pnpm db:reset
```

The seeded accounts above can be used with `pnpm dev` for manual checks: logged-out redirects,
wishlist create/edit/delete, reservations, URL import, and the shopping list.
