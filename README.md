# THE KLINIQUE booking app (MVP)

A mobile-first web app (PWA) for THE KLINIQUE, Bangkok. Customers book a
treatment in a few taps, usually by taking the **earliest available time**,
and can chat with a clinic consultant. Clinic staff manage appointments,
treatments, practitioners and chats from a simple admin.

- Languages: Thai, English, Simplified Chinese (`src/i18n/messages/*.json`)
- Currency THB, all times in Asia/Bangkok
- No payment in this stage: customers pay at the clinic

## Customer flow

1. Open the app (link or QR). The language follows the phone, switchable at the top (globe).
2. Find a treatment: search, filter by category, or (returning customers) tap **Book again**.
3. The **Earliest available** card shows the soonest time; **Book this time** opens a confirmation sheet.
   Or pick a practitioner, a day and a time (grouped into morning, afternoon, evening).
4. First time only: mobile number, the SMS code (submits itself on the 6th digit), and a name. Booking is created right after.
5. Confirmation with a booking reference, **Add to calendar** (.ics), **Directions** and **Share**.
6. **My bookings**: booking details, **Change time** (moves the booking in one step), cancel, sign out,
   privacy notice and **Delete account**.
7. **Consult** opens a chat with the clinic.

A returning customer books in 3 taps: treatment, *Book this time*, *Confirm*.

## Design system

- Identity "Silk & Halo": the clinic's black, white and gold, with the restraint of leading clinics
  (Clinique La Prairie, Ouronyx, 111 Harley St). Pearl background, Bodoni Moda headlines (Noto Serif Thai
  for Thai), Jost body text, gold hairline rules, and one signature shape: the gold halo (`.halo`), used
  only on brand moments (home hero, earliest time, confirmation). `.silk` is the black panel with a soft
  gold glow; `--sheen` is the champagne foil used on the main gold button.
- Treatments read like a printed menu (`.menu`: one card, hairline rows); categories are underlined
  tabs (`.tab`); the tab bar is a floating black pill.
- Tokens in `src/app/globals.css` (`ink`, `paper`, `cream`, `gold`, ...). Dark mode follows the phone and
  only redefines the tokens; `noir` stays black in both themes.
- Shared pieces in `src/components/`: `icons.tsx` (one inline icon set), `sheet.tsx` (iOS-style bottom
  sheet for confirmations), `toast.tsx` (feedback after actions), `states.tsx` (empty, loading, error).
- Every customer screen has a loading skeleton (`loading.tsx`), an error screen with retry (`error.tsx`)
  and a not-found screen. An offline banner appears when the connection drops (Next.js `useOffline`).
- Mobile: 44pt touch targets, safe areas, 16px inputs (no iOS zoom), the chat follows the keyboard.

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
| **Tailwind CSS**, Jost + Bodoni Moda + Noto Sans/Serif Thai | Black, white and gold of thekliniquethailand.com in KLINIQUE's own "Silk & Halo" style; tokens live in `src/app/globals.css`. Chinese uses the phone's system font (fast, no large download). |

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
cancellation, changing a booking's time, the per-customer booking cap, account deletion, OTP (wrong code,
single use, lockout, rate limit), the calendar file and translation completeness.

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
Customers can delete their account in the app (required by the App Store and in line with Thailand's PDPA):
name, phone and chat are erased, upcoming bookings cancelled, and past appointments kept without personal data.
A customer can hold at most 5 upcoming bookings, so nobody can block the calendar. Admin data is checked
for an admin session in the data layer, not only in the admin layout.
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

1. **Before real customers: turn off `OTP_DEV_ECHO`.** While it is on, the SMS code is shown on screen,
   so anyone could sign in with someone else's number. Needs a real SMS provider first (step 2).
2. **Real SMS provider** for OTP codes and booking confirmations/reminders (for Thailand: ThaiBulkSMS or Twilio). Plug it in `src/lib/sms.ts`.
3. **Run Vercel functions in Tokyo (`hnd1`)**, next to the Supabase database. The default region is in the US,
   so every database query crosses the Pacific; this is the largest speed gain available.
4. **Reminders** by SMS or LINE the day before (LINE Messaging API), and LINE login as an alternative to SMS.
5. **Payments** (next stage): PromptPay QR and cards via Omise (Opn) or Stripe, deposits for high-value treatments.
6. **Abuse limits**: admin login rate limiting, and a per-IP limit on SMS code requests (SMS cost).
7. **Real logo, brand colors and photos** from the clinic (colors and fonts are close approximations in `globals.css`).
8. **Real durations and prices** per treatment (durations are estimates, prices show "on consultation"). Editable in admin.
9. Native-speaker review of the Thai and Chinese texts, and legal review of the privacy notice (`privacy` in `src/i18n/messages`).
10. Admin: create bookings for phone or walk-in customers, simple statistics (bookings, cancellations, popular treatments), multiple admin accounts.
11. Chat: push notifications to staff on new messages, image attachments, switch polling to realtime.
12. Booking rules editable in admin (slot step, minimum notice, cancellation window, booking cap).
13. End-to-end browser tests in CI.
