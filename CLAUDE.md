# Tunyl — docket to claim

The site photographs the docket. The office gets the claim. A back-office product for civil and
earthworks subcontractors. This repo is the demo (`../site-hazard-ai/docs/demos/tunyl-docket-to-claim.html`)
made real. Read `DESIGN.md` before touching UI.

## Stack
Next.js 16 (App Router, TypeScript, React 19), Tailwind 4 + shadcn/ui (tokens in `src/app/globals.css`),
Drizzle ORM on Neon Postgres (`src/db/schema.ts`), Vercel Blob for photos, OpenAI Responses API
(structured output) with Anthropic fallback in `src/lib/provider.ts`. Deployed on Vercel (project `tunyl`).

## Rules that are product rules, not style
- The reader never invents a number. Unreadable stays blank.
- Nothing enters the ledger silently: a record is `rule` (matched a purchase order with every field read ok)
  or `ticked` by a named person. Everything else waits, is held, or is sent back.
- Anything that moves money (claim, Xero, approval) is a draft until a person confirms.
- Nobody outside the office logs in: the site uses `/site/[token]`, the builder uses `/c/[token]`.
- Units: quantities are stored as on the paper AND in the contract unit (`qtyContract`), with the
  tonnes-per-cubic-metre factor from the purchase order shown, never hidden.

## Routes
Office (passcode cookie, `(office)` group): `/` board, `/queue`, `/projects/[slug]`, `/documents`,
`/formats`, `/waiting`, `/login`. Public: `/site/[token]`, `/c/[token]`. API: `/api/read` (photo → fields),
`/api/whatsapp` (Twilio inbound), `/api/export/*`.

## Commands
`npm run dev` · `npm run db:push` (schema) · `npm run db:seed` (demo data) · `vercel deploy --prod`.
Env: `DATABASE_URL` (Neon via Vercel), `BLOB_READ_WRITE_TOKEN`, `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`),
`APP_PASSCODE` (office login), optional `TUNYL_MODEL`, `TUNYL_PROVIDER`.
