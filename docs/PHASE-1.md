# Phase 1 — Proposals, soft pledging and sharing

**Goal:** someone lands on a shared link from any social platform, sees "Bring {performer} to {city}" with live progress, signs in with one tap, and pledges or offers to take part. Anyone can propose a new show. Shows spread easily across social media. When a Threshold is met, everyone involved is told. No money moves.

**In scope:** formats `CONCERT`, `ORCHESTRAL`, `THEATRE`; performer kinds `SOLO_ARTIST`, `BAND`, `ORCHESTRA`, `ENSEMBLE`, `THEATRE_COMPANY`, `PRODUCTION`. Music is the anchor: it leads the home page and is the default format in forms.

**Out of scope for Phase 1:** other formats (dance, comedy, exhibition matches, competitions, bespoke), performer claiming/verification, Offers, sponsor money pledges, real payments, video uploads, ticketing, auto-posting to social platforms.

Work in order. Each task: meet every acceptance criterion, add tests, tick the box, commit `phase1: <n> <title>`.

---

### - [x] 1. Scaffold the project
- Next.js (App Router, TypeScript strict, `src/` dir), pnpm, Tailwind, shadcn/ui, ESLint + Prettier.
- Prisma 7+: copy `prisma/schema.prisma` in as-is, add `prisma.config.ts` reading `DATABASE_URL`, and create the client with `@prisma/adapter-pg`. First migration, plus a raw SQL migration for the partial unique index noted on `Suggestion`.
- Enabled-formats config: `src/config/formats.ts` lists the `ShowFormat` and `PerformerKind` values switched on (`CONCERT`, `ORCHESTRAL`, `THEATRE` and the six Phase 1 kinds). Every form, filter and validator reads from it; nothing else hard-codes the list.
- Vitest and Playwright configured, one passing smoke test each.
- `.env.example` complete (see file in repo root). `README.md` with local setup steps.
- GitHub Actions: install, typecheck, lint, unit tests on every push.

**Done when:** `pnpm dev` serves a placeholder home page; `pnpm test`, `pnpm typecheck`, `pnpm lint` pass; CI is green.

### - [ ] 2. Money, regions and genres
- `src/lib/money.ts`: `toMinor`, `fromMinor`, `formatMoney(amountMinor, currency, locale)`, `convertForDisplay`. Handle zero-decimal (JPY) and three-decimal (KWD) currencies via `Intl.NumberFormat` resolved options.
- `src/lib/fx.ts` + cron route `/api/cron/fx` that refreshes `FxRate` daily from a free rates API (URL in env). Protected by `CRON_SECRET`.
- Seed Regions from `prisma/seed/regions.json` (country code, IANA time zone, default currency). Start with a small placeholder set of major international cities; the launch list is an open question. No market is privileged in code.
- Seed Genres from `prisma/seed/genres.json`, grouped by format, with sub-genres. Start broad and international: e.g. concert → pop, hip hop, R&B, rock, jazz, gospel, afrobeats, amapiano, reggae/dancehall, Latin, K-pop, country, electronic, folk/traditional, classical crossover; orchestral → symphonic, chamber, film & game scores, opera, choral; theatre → musical, drama, comedy, opera, children's, spoken word.

**Done when:** unit tests cover formatting/rounding for USD, ZAR, GBP, JPY, KWD; both seeds run idempotently.

### - [ ] 3. Auth and roles
- Auth.js v5 with Prisma adapter: email magic link (Resend) + Google.
- Onboarding after first sign-in: name, home Region (searchable), preferred display currency (defaults from region), and "I'm here as…" (multi-select `stakeholderRoles`: fan, performer or management, organiser, sponsor, venue or event service). Fan is pre-selected.
- Route groups: `(public)`, `(fan)` under `/me`, `(hub)` under `/hub/[org]` (a "portals coming soon" page with a waitlist for users whose roles include a stakeholder type), `(admin)` under `/admin`. See USERS-AND-ACCESS.md §2 and §5.
- Access policy module `src/lib/access/`: `can(actor, action, resource)`, default deny, with an `Actor` type that already allows an optional organisation context (unused in Phase 1). `requireUser()` and `requireAdmin()` are built on it. Policies for every Phase 1 action (propose, pledge, withdraw, participate, upload media, hide, edit threshold, merge).
- Pledging and proposing require a verified email (magic link and Google both count).

**Done when:** Playwright flow signs in via a test magic-link route available only in test env; onboarding persists roles; `can()` is covered by a table-driven unit test of allowed and denied cases; no page, action or route checks roles inline.

### - [ ] 4. Performers
- Search across Performers with Postgres full-text + trigram similarity (generated `tsvector` column + GIN indexes via raw SQL migration). Filter by kind and genre.
- "Can't find them? Add them": name, kind, home country, genres, up to 3 external links (Spotify, Instagram, TikTok, YouTube, website…). Creates `status = UNCLAIMED`. Warn on near-duplicate names before creating.
- Performer page `/p/[slug]`: image, kind, genres, bio, links, embeds, and open Suggestions across regions with progress. Copy adapts to kind ("artist", "band", "orchestra", "company", "production").
- **Follow** a performer or a region (`Follow` model). Followed performers and regions shape the home page and trigger "new show proposed" notifications.

**Done when:** search tolerates typos; duplicate warning tested; performer page server-rendered with full OG tags.

### - [ ] 5. Media (images + embeds)
- R2 presigned upload flow as per ARCHITECTURE.md §5; server-side type/size validation; images through Next Image with a custom loader.
- Embed resolver (oEmbed) for YouTube, Spotify, Apple Music, Audiomack, SoundCloud, Vimeo, TikTok. Click-to-load facade: no iframe until tapped.
- Media attachable to Performers and Suggestions (uploads by any signed-in user, hideable by admin).

**Done when:** invalid type/oversize uploads are rejected server-side; the embed facade loads zero third-party JS until tapped (verify in Playwright network log).

### - [ ] 6. Propose a show (create a Suggestion)
- Flow: pick format (concert pre-selected) → pick one or more Performers and their billing (first = headliner) → pick Region → optional title and pitch → "I'm proposing this as…" (from the user's roles; sets `origin`, `originVerified = false`).
- Creates `Suggestion { status: OPEN, currency: region.defaultCurrency, matchKey }`, its `SuggestionPerformer` rows, genres (defaulted from the performers, editable), and a `Threshold { source: SYSTEM }`.
- `matchKey = sha256(format + regionId + sorted performerIds)` in `src/lib/suggestions/match-key.ts`, unit tested (order of performers must not change the key).
- Threshold defaults from `src/config/thresholds.ts`, keyed by format then region with a global fallback (`{ targetAmountMinor, minPledgers, deadlineDays }`). Placeholder values: see OPEN-QUESTIONS.md.
- If an active Suggestion with the same `matchKey` exists, send the user there ("People are already asking for this show. Add your support.") Rely on the partial unique index and handle the race by catching the unique violation.
- After creating: fans are prompted to pledge; other roles are prompted to add their Participation (task 9); everyone is shown the share sheet (task 8).
- Rate limit: 5 Suggestions per user per day.

**Done when:** duplicate creation (including two concurrent requests, and performers picked in different orders) always ends with one Suggestion; tests cover it.

### - [ ] 7. Suggestion page (the shareable page)
- Route `/s/[slug]`, server-rendered. Hero: headliner image, title ("Bring {headliner} to {city}" unless a custom title is set), the full bill, format and genres, honeycomb progress (total vs target), pledger count, days left, who has offered to take part ("2 venues and 1 sponsor are interested"), latest public pledge messages.
- Self-declared roles are labelled ("Proposed by someone who says they're the band's manager").
- Amounts in the Suggestion currency, with "≈ {converted}" in the viewer's preferred currency when different.
- Performance budget: Lighthouse mobile ≥ 90 performance; under 150 KB JS on first load.

**Done when:** page passes the budget in CI (Lighthouse CI or Playwright + metrics) and renders correctly for single- and multi-performer Suggestions.

### - [ ] 8. Share kit
See ARCHITECTURE.md §8.
- Complete OG + Twitter Card tags on every public page (home, performer, region, suggestion).
- `next/og` image routes per Suggestion: `/s/[slug]/og` (1200×630), `/s/[slug]/story` (1080×1920), `/s/[slug]/square` (1080×1080). Cached; cache key includes progress rounded to 5%.
- Share sheet: native `navigator.share` on mobile; desktop buttons for WhatsApp, Facebook, X, Telegram, LinkedIn, Reddit, email, copy link; "Share as image" downloads the story or square image with a caption pre-copied to the clipboard.
- Share links append `?r={referralCode}&s={platform}`. Middleware stores referrer + source in a 30-day first-party cookie; pledges record `referrerId` and `source`.
- Log every share action as a `ShareEvent` and increment `Suggestion.shareCount`.

**Done when:** a Playwright test checks OG tags on each page type; the three image routes return correct dimensions; a pledge made after arriving via a share link records the referrer and source.

### - [ ] 9. Soft pledging and participation
- **Pledge** (fans): amount (preset chips + custom), optional public message, anonymous toggle. Copy: "This is a pledge, not a payment. You'll only be asked to pay if the show is confirmed." One `FAN` pledge per user per Suggestion; pledging again edits it; withdraw while `OPEN`. Min/max limits per currency in config. Rate limited.
- Every pledge create/update/withdraw runs in one transaction that updates `pledgeTotalMinor`/`pledgeCount` and checks the Threshold. If met: `status = THRESHOLD_MET`, `thresholdMetAt`, enqueue notifications.
- **Take part** (other roles): "I'm the performer and I'm interested", "I'd organise this", "My venue or service could help", "We'd like to sponsor". Creates a `Participation` with an optional note and organisation name. Shown on the Suggestion page as counts plus organisation names; notes are visible to admins only in Phase 1.

**Done when:** concurrency test (many parallel pledges) leaves totals exactly equal to the sum of ACTIVE pledges; the threshold transition happens exactly once; participation is unique per user, Suggestion and role.

### - [ ] 10. Discovery
- Home page: music first. Trending concert Suggestions near the viewer (home region, or IP country if signed out), then "Orchestra and theatre", "Closest to happening", "Newest".
- Region page `/r/[slug]`; Explore with filters (format, genre, performer kind, region).
- Trending score recomputed by cron: pledges, participations and shares in the last 7 days, weighted by recency.

**Done when:** pages server-rendered, paginated, and covered by a Playwright smoke test.

### - [ ] 11. Notifications
- Email via Resend + React Email: pledge confirmation, participation received, threshold met (to pledgers, participants and creator), expiring in 3 days (to pledgers), expired, new show proposed for a performer or city you follow (daily digest).
- Notification preferences page (opt out per type).
- Expiry cron: OPEN Suggestions past deadline → `EXPIRED`, their pledges → `RELEASED`.

**Done when:** each email has a snapshot test; expiry cron covered by a unit test.

### - [ ] 12. My HiveConcerts (dashboard)
- At `/me`: my pledges (status, edit/withdraw), my participations, shows I proposed, following, my share stats (how many people my links brought in), profile, roles and preferences.

### - [ ] 13. Admin
- `/admin` behind `requireAdmin()`: list/search Suggestions, Performers, Participations, users; hide/unhide; edit a Threshold (`source = ADMIN`); merge duplicate Performers (moves bill entries, genres, media; recomputes `matchKey`s and combines any Suggestions that now collide, moving pledges and recomputing totals); cancel a Suggestion (pledges → `RELEASED`, notify); mark a Participation accepted or declined.
- Every action writes `AuditLog`.

**Done when:** a performer merge preserves all pledges and leaves no two active Suggestions with the same `matchKey`.

### - [ ] 14. Embeddable progress card
- `/embed/s/[slug]`: minimal iframe-safe card (no auth, tiny JS) and `/api/oembed?url=` returning oEmbed JSON, so performers and venues can show live progress on their own sites.

### - [ ] 15. Payment interface stub
- Create `src/lib/payments/provider.ts` with the `PaymentProvider` interface and a `PaymentEvent` type from ARCHITECTURE.md §6. No implementations, no SDKs installed.

### - [ ] 16. Launch hardening
- Error tracking (Sentry), structured logging, privacy-friendly analytics (e.g. Plausible) with share-source breakdowns.
- Terms, privacy policy and "how pledges work" pages.
- Nightly totals reconciliation job (ARCHITECTURE.md §4).
- Deploy: Vercel production + Neon production DB; hiveconcerts.com on Cloudflare DNS.

**Done when:** production is live, and a seeded test Suggestion can be shared to WhatsApp (preview card shows), opened on a phone over a throttled 3G profile, and pledged end to end.
