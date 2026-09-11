# Tunyl

The site photographs the docket. The office gets the claim.

Docket collection and financing for construction subcontractors. Paper from suppliers, hauliers and
builders comes in as photos, email or a docket-app feed. It leaves as a checked quantities ledger,
a progress claim in the builder's format, the money the claim is waiting on, and one view the
directors can read.

This is its own product and repo. It is not part of the site-hazard app; it shares only the
photo-in, structured-record-out reader pattern.

## Run it

```bash
npm install
vercel env pull .env.local      # DATABASE_URL, BLOB_READ_WRITE_TOKEN, APP_PASSCODE
npm run db:push                 # create tables
npm run db:seed                 # load the example data (invented)
npm run dev                     # http://localhost:3000
```

Sign in at `/login` with the office passcode. The site page needs no login: `/site/kr-gate2-7f3a`.
The builder's claim page needs no login: `/c/kr-claim5-a1b2c3`.

## Deploy

```bash
vercel deploy --prod
```

Environment on Vercel: `DATABASE_URL` (Supabase pooled connection string, Sydney region), `BLOB_READ_WRITE_TOKEN`
(Blob store `tunyl-photos`), `APP_PASSCODE` (office sign in), `OPENAI_API_KEY` (the reader; or
`ANTHROPIC_API_KEY`). Optional: `TUNYL_MODEL`, `TUNYL_PROVIDER`, `OFFICE_EMAIL`, and for WhatsApp
intake `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `WHATSAPP_PROJECT_MAP` (JSON of phone to site token).

## The rules that are product rules

- The reader never invents a number. Unreadable stays blank.
- Nothing enters the ledger silently. A record is matched by rule or ticked by a named person.
- Anything that moves money is a draft until a person confirms it.
- Nobody outside the office logs in. The site uses a token link, the builder uses a token link.

See `CLAUDE.md` for the layout of the code and `DESIGN.md` for the visual lock.

## Also in this repo

- `docs/demos/` the three HTML demos this app was built from (`tunyl-docket-to-claim.html` is the combined one)
- `docs/research/` teardowns of Kynection and Sahova, two adjacent products
