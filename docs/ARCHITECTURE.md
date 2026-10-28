# HiveConcerts — Architecture

## 1. Stack

Chosen for: a media-heavy, interactive, mobile-first app with an international audience, built by a Node/PostgreSQL developer.

| Layer | Choice | Why |
|---|---|---|
| App framework | **Next.js (App Router, current stable) + React + TypeScript** | One codebase for UI and server logic. Server rendering gives fast first loads and proper link previews when Suggestions are shared on WhatsApp/Instagram/X — the main growth loop. |
| Styling / UI | **Tailwind CSS + shadcn/ui** | Fast to build, accessible primitives, no heavy runtime. |
| Database | **PostgreSQL** (managed: Neon or Supabase) | Relational integrity for pledges/thresholds; full-text and trigram search for performers; branching DBs for previews (Neon). |
| ORM | **Prisma 7+** with the `@prisma/adapter-pg` driver adapter | Typed schema, migrations. Connection URL lives in `prisma.config.ts`, not the schema. Raw SQL migrations allowed where Prisma can't express something (partial unique indexes, generated search columns). |
| Auth | **Auth.js (NextAuth v5) with Prisma adapter** | Email magic link + Google sign-in for Phase 1. Phone/WhatsApp OTP can be added later as another provider. |
| Images | **Cloudflare R2** (storage, no egress fees) + **Next.js Image** with a custom loader (or Cloudflare Images) | Media-heavy pages without bandwidth bills; automatic resizing and modern formats (AVIF/WebP). |
| Video (Phase 2+) | **Mux** (or Cloudflare Stream) | Adaptive HLS streaming that degrades gracefully on slow mobile networks. Phase 1 uses embeds only. |
| Audio / video clips | **Embeds** (YouTube, Spotify, Apple Music, Audiomack, SoundCloud, Vimeo, TikTok via oEmbed) | Legal, zero hosting cost, what fans already use. |
| Email | **Resend** + React Email | Transactional mail (magic links, threshold met). |
| Background jobs / cron | **Vercel Cron** or **Inngest** | Expiring Suggestions, recomputing trending, digests. |
| i18n | **next-intl** | Locale-aware routing and copy from day one; English first. |
| Hosting | **Vercel** (app) + Neon (DB) + Cloudflare (R2, DNS) | Global edge delivery for an international audience; preview deploy per branch. |
| Testing | Vitest + Playwright | Logic + end-to-end flows. |
| Package manager | pnpm | |

## 2. Scope and core object model

### Scope
HiveConcerts is for **any live performance people want to see**, proposed by **anyone with a stake in it**.

- **Who can propose and take part:** fans, performers (or their management), organisers/promoters, sponsors, and providers (venues, sound, staging, security, ticketing). One account can hold several of these roles.
- **What can be proposed:** any performing entity in any format. Music (artists and bands) is the anchor and gets the most prominent placement. **Phase 1 builds concerts, orchestral performances and theatre.** Later formats such as dance, comedy, one-off exhibition matches (e.g. boxing), rivalry competitions and bespoke performances exist in the schema as enum values only.
- **Generic by design:** nothing in code assumes "artist" or "music". UI copy may say "artist" when the performer kind is music-related, and "company", "orchestra" or "show" otherwise. Adding a format later should mean seeding genres, writing copy and enabling the format in config, not changing the data model.

### Objects
```
Region ──< Suggestion >──< SuggestionPerformer >── Performer ──< Offer (Phase 2)
              │  │  │  └──< SuggestionGenre >── Genre (tree, grouped by ShowFormat)
              │  │  └── Threshold (1:1)
              │  └──< Pledge (money: FAN | SPONSOR) >── User
              └──< Participation (non-money: PERFORMER | ORGANIZER | SPONSOR | PROVIDER) >── User
ShareEvent, Media (performerId | suggestionId)
```

- **Region:** a city/metro where an event could happen. `countryCode` (ISO 3166-1 alpha-2) + `timezone` (IANA).
- **Performer:** any performing entity. `kind` = `SOLO_ARTIST | BAND | ORCHESTRA | ENSEMBLE | THEATRE_COMPANY | PRODUCTION` in Phase 1 (more later). Created by anyone as `UNCLAIMED`; Phase 2 lets the real performer claim and verify.
- **Genre:** a data-driven taxonomy (not an enum), grouped by `ShowFormat`, with sub-genres via `parentId`. Seeded for music, orchestral and theatre in Phase 1.
- **Suggestion:** the single unit of demand, "this show, in this place". It has a `format` (`CONCERT | ORCHESTRAL | THEATRE` in Phase 1), a Region, and **one or more performers** on its bill (`SuggestionPerformer` with `billing`: `HEADLINER | CO_HEADLINER | SUPPORT | GUEST | OPPONENT`). Optional custom `title` for collaborations ("{Singer} with the {City} Symphony").
  - `origin` records who proposed it (`FAN | PERFORMER | ORGANIZER | SPONSOR | PROVIDER`). Self-declared in Phase 1 (`originVerified = false`); verified accounts from Phase 2. Fan-led (pull) and performer-led (push, from an `Offer`) demand are the same object.
  - **Dedupe:** `matchKey = sha256(format + regionId + sorted performer ids)`. One *active* Suggestion per key, enforced by a partial unique index. A second person proposing the same show is sent to the existing one.
  - `SuggestionPerformer.response` (`NOT_ASKED | INTERESTED | CONFIRMED | DECLINED`) records what each performer has said. Always `NOT_ASKED` in Phase 1.
- **Threshold:** what "enough demand" means: target amount + currency, optional minimum pledger count, deadline, and who set it.
- **Pledge:** a money commitment, `type = FAN | SPONSOR`. Soft in Phase 1. One per (user, suggestion, type). Carries attribution (`referrerId`, `source`) so we know which shares bring pledges in.
- **Participation:** a non-money commitment from other stakeholders: "I'm this performer and I'm interested", "I'd organise this", "my venue could host it", "we'd sponsor". Phase 1 records and displays these (counts and named organisations); Phase 2+ acts on them.
- **Offer:** a performer's availability (Phase 2): formats, base price, regions, dates, conditions. Responding to an Offer creates a Suggestion with `origin = PERFORMER`.
- **ShareEvent:** each share-button tap or share-image download, by platform.

### Future formats: exhibition matches and competitions
One-off contests (e.g. a boxing exhibition between two public figures) and rivalry formats use the same model: `format = EXHIBITION_MATCH | COMPETITION`, with performers billed as `OPPONENT`. Before these formats are switched on they need a **compliance gate**: combat-sport events usually require a licence or sanctioning body approval, insurance, medical cover and age checks in the host jurisdiction, even for exhibitions. Such Suggestions can collect demand, but cannot move to `BOOKING` until an admin records the approvals. This is design only; nothing is built in Phase 1.

### Suggestion lifecycle
```
DRAFT → OPEN → THRESHOLD_MET → BOOKING → CONFIRMED
          └──→ EXPIRED          └──→ CANCELLED
```
Phase 1 implements `OPEN`, `THRESHOLD_MET`, `EXPIRED` (and `CANCELLED` for admin). `BOOKING`/`CONFIRMED` exist in the enum only.

### Pledge lifecycle
`ACTIVE` → `WITHDRAWN` (by user, while Suggestion is OPEN) | `CONVERTED` (Phase 3+, became a real payment/ticket) | `RELEASED` (Suggestion expired/cancelled).

## 3. Money rules
- Amounts: `BigInt amountMinor` + `String currency` (ISO 4217). `$25.00` → `2500n, "USD"`.
- Each Suggestion has one `currency` (default `USD`). All its pledges and its Threshold use that currency. Users see an approximate conversion into their preferred currency, labelled "≈".
- FX rates live in the `FxRate` table, refreshed daily by cron from a free rates API. Never use FX for stored values.
- Write one `lib/money.ts` with `formatMoney`, `toMinor`, `fromMinor`, `convertForDisplay`, using `Intl.NumberFormat`. Nothing else formats money.

## 4. Denormalised totals
`Suggestion.pledgeTotalMinor` and `Suggestion.pledgeCount` are caches of ACTIVE pledges, updated in the same transaction as any pledge write. A nightly job recomputes them from source and logs any drift.

## 5. Media pipeline (Phase 1)
- Images: client requests a presigned PUT URL from a Server Action → uploads straight to R2 → Server Action records a `Media` row. Validate type (jpeg/png/webp/avif) and size (≤ 8 MB) server-side. Serve via Next Image loader with responsive sizes.
- Embeds: user pastes a YouTube/Spotify/Apple Music/Audiomack URL → server resolves oEmbed → stores a `Media` row `kind = EMBED` with provider + id. Render with a lightweight click-to-load facade (don't load iframes on page load).
- Each Suggestion page gets generated share images (see §8).

## 6. Payments (designed now, built later)

The audience is international, so payment methods must work across jurisdictions. Plan:

- **Primary rail: Stripe** — cards, Apple Pay, Google Pay, and many local methods, accepting payments from customers in most countries. Stripe requires the merchant to be a business registered in a Stripe-supported country, so HiveConcerts needs an operating entity in one (e.g. a US company via Stripe Atlas, or a UK company). This is a business setup task to start early, since it has lead time.
- **Regional rails** where cards are weak (e.g. mobile money): added per market as launch markets are chosen — candidates include **Flutterwave** and **Paystack**.
- **Routing:** pick the provider per payment based on payer country + chosen method.

Code shape (create the interface file in Phase 1, implement nothing):

```ts
// lib/payments/provider.ts
export interface PaymentProvider {
  id: string; // e.g. 'stripe', 'flutterwave', 'paystack'
  supports(input: { payerCountry: string; currency: string; method?: string }): boolean;
  createCheckout(input: {
    pledgeId: string; amountMinor: bigint; currency: string;
    customerEmail: string; returnUrl: string;
  }): Promise<{ redirectUrl: string; providerRef: string }>;
  verifyWebhook(req: Request): Promise<PaymentEvent>;
  refund(providerRef: string, amountMinor?: bigint): Promise<void>;
}
```
Custody/escrow and refunds stay with the processor; HiveConcerts never holds funds itself at MVP.

## 7. Security & integrity
- Rate-limit Suggestion creation and pledge writes per user and IP (Upstash Ratelimit or similar).
- Soft pledges are only meaningful if accounts are real: require verified email before pledging.
- Admin routes behind `role = ADMIN`; every admin action writes an `AuditLog` row.
- Moderation: Suggestions and Performer profiles can be hidden by admins; user-submitted text is escaped, media type-checked.
- Self-declared roles are labelled as such in the UI ("says they're the performer") until verified in Phase 2, so nobody can pass themselves off as an act or a sponsor.

## 8. Social reach and sharing

Demand grows when Suggestions spread on the platforms people already use. Every Suggestion must look good and work well wherever it's shared.

- **Link previews everywhere.** Every public page has complete Open Graph and Twitter Card tags, so a pasted link shows a rich card on WhatsApp, Facebook, Instagram DMs, X, Telegram, LinkedIn, Reddit, Discord, Slack, iMessage and SMS apps.
- **Generated share images per Suggestion** (via `next/og`, cached at the edge, regenerated when progress changes by 5% or more):
  - 1200×630 link preview
  - 1080×1920 story (Instagram, TikTok, Facebook and WhatsApp Status, Snapchat)
  - 1080×1080 square feed post
  Each shows the performer image, the show title, the city, and the honeycomb progress. Story and square images are downloadable from a "Share as image" sheet, because those platforms don't accept web links in posts.
- **Share sheet:** native `navigator.share` on mobile (this reaches every installed app, including Instagram, TikTok and Snapchat). On desktop: WhatsApp, Facebook, X, Telegram, LinkedIn, Reddit, email, copy link.
- **Attribution:** share links carry `?r={user.referralCode}&s={platform}`. A pledge made within 30 days of arriving through a share link records the referrer and source. Taps are logged as `ShareEvent`.
- **Short links:** `/s/{slug}` is already short; keep slugs under 60 characters.
- **Embeds (later in Phase 1):** `/embed/s/{slug}` is a tiny iframe-able progress card with an oEmbed endpoint (`/api/oembed`), so performers, venues and media sites can show live demand on their own pages.
- **Official accounts:** HiveConcerts runs its own accounts on the major platforms. Auto-posting milestones (new Suggestion trending, threshold met) through platform APIs is Phase 2.

## 9. Users, portals and access
See `docs/USERS-AND-ACCESS.md`. In short: fans use a personal account; stakeholders act through **organisations**, each with its own portal at `/hub/[org]`; organisations collaborate on a show in a private **Show Room**; venues and providers earn **reputation** only from completed shows; anyone in show business can complete **deals** on the platform, including ones that started elsewhere (§10); revenue comes from a success fee plus commissions set in a versioned fee schedule (§11); and Phase 5 adds a **"Build my show team"** recommender. Phase 1 builds the public and fan areas plus the access foundations (route groups, the `can()` policy module, follows).
