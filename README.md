# LearnChart FX — Phase 1 (User Side Only)

A forex trading education website for **Siam Chowdhury** and **Rex Mizan**.
Built from the LearnChart FX full system prompt (24 sections) and the
UI/UX designer mockup (dark theme, floating pill nav, yellow–orange
gradient accent #FFC531 → #FF9E2C, Poppins / Manrope).

> **Phase 1 = user side only. There is NO admin panel, admin login, admin
> route or admin-only UI in this build.** The structure is admin-ready only:
> courses/services live as database records and every placeholder is driven
> from `src/lib/config.js` / the database seed, so a later admin phase can
> manage them without restructuring the site.

## Quick start

```bash
npm install
npm start          # production server on http://localhost:3000
```

For development: `npm run dev`.

**No setup beyond that.** The database is SQLite via Node 22's built-in
`node:sqlite` — zero extra services, the file is created automatically at
`data/learnchart.db` on first run.

## Stack

- **Next.js 15 (App Router) + React 19 + Node.js** — JavaScript throughout.
  No Java anywhere (Java and JavaScript are different languages; Java is
  never needed for this site).
- **SQLite** via Node's built-in `node:sqlite`. **All database access lives
  in one module, `src/lib/db.js`** — so the database can be swapped for
  Postgres later by changing that single file. Nothing else touches the DB.
- **Auth:** email + password, scrypt-hashed; signed HTTP-only session
  cookies. Course Keys are generated per enrollment, stored SHA-256 hashed,
  with an AES-256-GCM encrypted copy.
- **Images:** `sharp` compresses uploaded profile pictures and post
  pictures (max 1200px wide JPEG).

## Pages

| Route | What it is |
|---|---|
| `/` | Home — exactly the 12 sections of prompt Section 9, in order |
| `/courses` | Courses & Services — the 3 offers of Section 10 |
| `/mentors` | Both mentors, fully open, no profit claims |
| `/faq` | FAQ tabs All (11) / General (2) / Enrollment (9), accordions |
| `/contact` | Contact form → saved to DB |
| `/signup`, `/login`, `/forgot-password`, `/reset-password` | Auth |
| `/profile` | Details, profile picture, My Enrollments, My Posts / My Uploads, Resend-my-key (Forex students) |
| `/enroll/[slug]`, `/enroll/[slug]/success` | Enrollment + confirmation (Course Key is emailed, never shown) |
| `/course-videos` | 10 lessons — locked until Forex enrollment + valid Course Key, asked on EVERY visit |
| `/community` | Members-only feed, composer, Mentor Special Chat (member chat moved to `/chat`) |
| `/chat` | Member chat — member list + one-to-one conversation, its own page |
| `/members/[id]` | A member's profile page — their name, picture, posts/uploads |
| `/live-room` | Live Room — Premium Live Trade Support members only |
| `/consultation` | Trading Consultation — Consultation members only, Coming Soon |

## Access rules (enforced server-side, in `src/lib/access.js`)

| Area | Who can enter |
|---|---|
| Mentors | Everyone |
| Community | Any enrollment |
| Live Room | Premium Live Trade Support enrollment ONLY |
| Consultation | Trading Consultation enrollment ONLY |
| Course Videos | Forex course enrollment + valid Course Key, asked on EVERY visit |
| Member Chat (`/chat`) | Any enrollment (same as Community) |
| Member profiles (`/members/[id]`) | Any enrollment (same as Community) |

Locked pages show a clear locked preview naming exactly which enrollment
unlocks them. Gated pages are `noindex` and excluded from the sitemap.

## Course Videos & Course Keys

- Every Forex enrollment generates **one unique Course Key** for that
  student only — it is **emailed to the student's Gmail** on enrollment
  (see Email below). The key is **never shown anywhere on the site**:
  not on the enrollment confirmation, not on the profile, not in any
  help text. A Forex student who lost the email can ask for it again
  with "Resend my key" on their profile.
- Lessons stay locked until the student enters their key; verification is
  **server-side**; a wrong key shows a clear error. The key is asked on
  **EVERY visit**: a correct key mints one single-use visit token
  (15 minutes) and the lessons render for that visit only — leaving and
  coming back asks for the key again. No unlock is remembered.
- Videos are **YouTube Unlisted embeds only** (never Private, never stored
  on this hosting). Embed URLs are never sent to a user who has not
  unlocked the lessons. YouTube video IDs are `[Placeholder]` in
  `src/lib/config.js` until Siam provides them.

## Email (Course Key delivery)

`src/lib/mail.js` sends the Course Key with **nodemailer + SMTP**, from
environment variables only — no mail account or API key is hard-coded:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@example.com
SMTP_PASS=your-app-password   # e.g. a Gmail App Password
SMTP_FROM=LearnChart FX <you@example.com>   # optional, defaults to SMTP_USER
```

Set these in Render (Environment) for the live site, or in `.env.local`
for local runs. **If SMTP is not configured, enrollment still completes**
— the confirmation page and profile honestly say "Email service is not
connected yet — your key will be emailed once the site owner connects
email", and the key is never shown on the site.

## Binance payments (enroll, automatic — Nov 2026)

The paid course ($250) is paid on Binance — two rails, both automatic,
both **free for the owner** (no merchant application, no paid service).
`src/lib/payments.js` holds the logic; the enroll page renders the
methods from a list (`src/app/enroll/[slug]/page.jsx` → `methods`), one
component per method in `src/components/payments/`. **To add a third
method (e.g. ZiniPay bKash/Nagad): write its component, append one entry
to the methods list — nothing else changes.**

- **Rail 1 — BEP20 USDT:** student sends exactly 250 USDT on BNB Smart
  Chain to `BINANCE_BSC_ADDRESS`, pastes the TxHash; the server reads
  the receipt (BscScan free-tier API when `BSCSCAN_API_KEY` is set,
  otherwise the public BSC JSON-RPC) and checks Success + USDT transfer
  to the merchant address + exact amount + TxHash never used before.
- **Rail 2a — Binance Pay, PRIMARY:** student pays `BINANCE_PAY_ID`
  and pastes the Order ID; the server checks the owner's Pay history
  (`GET /sapi/v1/pay/transactions`) with a **READ-ONLY** Binance API key
  (`BINANCE_API_KEY` + `BINANCE_API_SECRET` — Enable Reading only, never
  trade/withdraw, IP-restricted) and matches Order ID + exact 250 USDT.
  **Geo note:** Binance Spot API returns HTTP 451 from some regions
  (notably US cloud IPs, including Render's default Oregon region). The
  code tries all documented hosts (`api` + `api1`–`api4`) in turn; if
  all are blocked, this rail fails with "try again in a minute" and
  BEP20 stays the working rail. A non-US host, or the merchant API
  (`bpay.binanceapi.com`), avoids the block.
- **Rail 2b — Binance Pay merchant checkout, FUTURE-OPTIONAL:** only if
  the owner is ever approved at merchant.binance.com — Create Order API
  v3 + signature-verified webhook (`/api/payments/binance-pay-webhook`).
  Never required; Rail 2a works without it.

Every accepted payment is recorded in the `payments` table
(`tx_hash` UNIQUE = the double-spend guard), then enrollment + unique
Course Key + key email run exactly like a free enrollment. **If a rail
is not configured, the enroll page says so honestly** ("not connected
yet") instead of showing a fake address. No API key or secret ever
reaches the browser, page source, or an API response. Env vars (all in
`.env.example` with where each value comes from):

```bash
BINANCE_BSC_ADDRESS=0xYourBscWalletAddress
BSCSCAN_API_KEY=YourFreeBscScanApiKey        # optional
BINANCE_PAY_ID=YourBinancePayId
BINANCE_API_KEY=YourReadOnlyBinanceApiKey    # Enable Reading only
BINANCE_API_SECRET=YourReadOnlyBinanceApiSecret
BINANCE_PAY_API_KEY=YourMerchantApiKey       # future-optional only
BINANCE_PAY_SECRET_KEY=YourMerchantSecretKey # future-optional only
SITE_URL=https://learnchart-fx.onrender.com  # optional
```

## Community post rules (enforced in UI and server)

- **Text:** yes. **Picture upload:** yes (images only, ≤ 5 MB, compressed).
- **Video upload: NO anywhere.** There is no video-upload field and the
  server rejects video files.
- **Google Drive video link:** yes — validated as a real Drive link,
  converted to a Drive embed player inside the post, streamed from Drive
  (zero hosting space, lazy-loaded). A non-Drive link is a clear error and
  the post is not published. Posting warns to set the Drive file to
  "Anyone with the link can view".

## Placeholders — everything in `src/lib/config.js` (single source)

Stats numbers, testimonials, social handles/links, broker names/logos/links
(4 cards), mentor photos/bios/tags, curriculum PDF, YouTube video IDs,
lesson titles/durations (beyond "Starting Your Trading Journey" and
"Mastering Trading Psychology"), streaming providers, contact email/phone.
Payment is Binance automation now (see Binance payments above) — the
merchant wallet / Pay ID / keys come from env vars, never invented.
**Nothing is invented and nothing is copied from TradingChart.org** — every
one of those is a marked `[Placeholder]`.

## Deployment (Render — GitHub + Render only)

`render.yaml` is in the repo (free plan, Node 22, `npm install` → `npm run build` → `npm start`).
`SESSION_SECRET` and `KEY_ENCRYPTION_SECRET` are generated by Render.
Set `SITE_URL` to the Render URL for correct SEO links. For Course Key
emails, also set the SMTP variables (see Email above) in Render.

> **Render free tier is ephemeral: the SQLite file resets on redeploy**
> (same as the Nexora Render setup). For persistent data the site needs a
> persistent disk or a hosted Postgres database — a later step, not part
> of Phase 1.

## Project structure

```
src/
  app/            pages + API routes (auth, enroll, community, chat, …)
  components/     Nav, Footer, LockedPreview, Countdown, FaqList, …
  lib/
    config.js     every [Placeholder] in one place
    db.js         THE ONLY file that touches the database (SQLite → Postgres later)
    auth.js       sessions, password hashing, reset tokens
    access.js     the Section 8 access matrix, one reusable place
    keys.js       Course Key generation / verification
    drive.js      Google Drive link validation + embed URLs
    faq-data.js   the 11 FAQ questions
    utils.js      small helpers (time-ago, slugs)
public/uploads/   profile + post pictures (created at runtime)
data/             learnchart.db (created at runtime, git-ignored)
```

## Code style

Clean structure by concern; a short comment above **every file, every
function, and every non-obvious logic block** (what it does + why);
clear English names; no messy/spaghetti code — so any developer can read
and change it.
