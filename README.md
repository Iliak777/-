# THE KLINIQUE booking app (MVP)

A mobile-first web app (PWA) for THE KLINIQUE, Bangkok. Customers book a
treatment in a few taps, usually by taking the **earliest available time**,
and can chat with a clinic consultant. Clinic staff manage appointments,
treatments, practitioners and chats from a simple admin.

- Languages: Thai, English, Simplified Chinese (`src/i18n/messages/*.json`)
- Currency THB, all times in Asia/Bangkok
- No payment in this stage: customers pay at the clinic

## Customer flow

1. Open the app (link or QR). The language follows the phone, switchable at the top.
2. Tap a treatment. The **Earliest available** card shows the soonest time and practitioner.
3. Tap **Book this time** (or pick a day, time, or practitioner).
4. First time only: enter mobile number, the SMS code, and a name. Booking is created right after.
5. Confirmation with a booking reference. **My bookings** lists and cancels bookings.
6. **Consult** opens a chat with the clinic.

A returning customer books in 3 taps: treatment, *Book this time*, *Confirm*.

## Tech stack and why

| Choice | Why |
| --- | --- |
| **Next.js 16 + TypeScript** (App Router) | One codebase for customer app, admin and API. Fast server rendering on phones. |
| **PWA, no app store** | Tourists book from a link or QR without installing anything; can still be added to the home screen. |
| **PostgreSQL + Drizzle ORM** | Reliable, works with Supabase or any managed Postgres. Drizzle is light and keeps SQL visible. |
| **Double-booking guard in the database** | A Postgres exclusion constraint makes it impossible for one practitioner to have overlapping bookings, even when two people tap the same slot at once. |
| **Phone + SMS code (OTP)**, no passwords | Least friction; phone number is also what the clinic needs. Codes are stored only as HMAC hashes, expire in 5 minutes, max 5 guesses, max 3 sends per 15 minutes. |
| **Signed httpOnly cookies** (JWT via `jose`) | Simple, secure sessions without a session store. |
| **Chat via short polling (3 s)** | Works on any host, including serverless, with no extra service. Can be swapped for Supabase Realtime or WebSockets later without UI changes. |
| **Tailwind CSS**, Montserrat + Cormorant Garamond + Noto Sans Thai | Black, white and gold look of thekliniquethailand.com; tokens live in `src/app/globals.css`. Chinese uses the phone's system font (fast, no large download). |

## Run locally

Requires Node 22+ and PostgreSQL 14+ (the `btree_gist` extension must be available, as it is on Supabase).

```bash
npm install
cp .env.example .env.local      # then edit values
createdb klinique               # or point DATABASE_URL at any Postgres
npm run db:migrate
npm run db:seed                 # demo treatments, practitioners, admin account
npm run dev                     # http://localhost:3000
```

- Customer app: `http://localhost:3000` (redirects to `/th`, `/en` or `/zh`)
- Admin: `http://localhost:3000/en/admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`
- With `SMS_PROVIDER=console` the SMS code is printed in the server log, and with `OTP_DEV_ECHO=true` it is also shown on screen (demo only).

## Tests

```bash
npm test          # unit + integration tests (needs a test database, see below)
npm run lint
npm run typecheck
```

Integration tests use `TEST_DATABASE_URL` (default `postgres://klinique:klinique@localhost:5432/klinique_test`),
which must be migrated once: `DATABASE_URL=<test url> npx tsx scripts/migrate.ts`.
They cover the availability engine, booking (including 5 simultaneous bookings of one slot, only one wins),
cancellation, OTP (wrong code, single use, lockout, rate limit) and translation completeness.

## Project layout

```
src/app/[locale]/(shop)/   customer screens: catalog, booking, confirmation, my bookings, chat
src/app/[locale]/admin/    admin: login, appointments, chat inbox, treatments, practitioners
src/app/api/               JSON endpoints used by the client components
src/server/                server-only logic: booking, OTP, chat, admin actions
src/lib/                   pure helpers: availability engine, Bangkok time, phone numbers, sessions
src/i18n/                  locales, dictionaries (th/en/zh), date and THB formatting
src/db/schema.ts           database tables; migrations in drizzle/
scripts/                   migrate and seed
```

## Data and privacy

We store only what booking needs: customer name, phone number, their appointments and chat messages.
No secrets are committed: configuration comes from environment variables (`.env.example` lists them).
Admin passwords are hashed with scrypt.

## Deploying (Vercel + Supabase)

1. **Supabase**: create a project (region Singapore). In *Connect*, copy the **Transaction pooler** connection string (port 6543) and put your database password in it.
2. **Vercel**: import the GitHub repository (name the project `klinique`). Add these environment variables:
   - `DATABASE_URL`: the pooler string from step 1
   - `SESSION_SECRET`: a long random string (`openssl rand -base64 48`)
   - `SMS_PROVIDER=console` and `OTP_DEV_ECHO=true` for demos only. Set `OTP_DEV_ECHO=false` once a real SMS provider is connected.
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` (at least 10 characters): the first admin account
3. Deploy. The `vercel-build` script applies migrations and seeds demo data on every deploy (the catalog is only seeded once; the admin password is re-synced from the variable).

## Next steps

1. **Real SMS provider** for OTP codes and booking confirmations/reminders (for Thailand: ThaiBulkSMS or Twilio). Plug it in `src/lib/sms.ts`.
2. **LINE notifications** (LINE Messaging API) for confirmations and reminders, and LINE login as an alternative to SMS.
3. **Payments** (next stage): PromptPay QR and cards via Omise (Opn) or Stripe, deposits for high-value treatments.
4. **Real logo, brand colors and photos** from the clinic (the website could not be downloaded directly; colors and fonts are close approximations in `globals.css`).
5. **Real durations and prices** per treatment (the website lists none; durations are estimates, prices show "on consultation"). Editable in admin.
6. Native-speaker review of the Thai and Chinese texts.
7. Admin: create bookings for phone or walk-in customers, edit categories, multiple admin accounts, login rate limiting.
8. Chat: push notifications to staff on new messages, image attachments, switch polling to realtime.
9. Booking rules editable in admin (slot step, minimum notice, cancellation window), currently constants in `src/lib/availability.ts`.
10. End-to-end browser tests in CI.
