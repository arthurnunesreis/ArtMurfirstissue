# HiveConcerts — Claude Code project guide

HiveConcerts.com is a crowdsourced live-events marketplace. Anyone with a stake in a show (fans, performers, organisers, sponsors, venues and event services) can propose a live performance in a city and back it. Every proposal, whoever starts it, is one object: a **Suggestion**. When a Suggestion's **Threshold** is met, it moves toward booking.

The model covers any performing entity and any format. Music (artists and bands) is the anchor and leads the product. **Phase 1 builds concerts, orchestral performances and theatre;** other formats (dance, comedy, exhibition matches, competitions, bespoke shows) exist in the schema only.

The audience is international from day one (diaspora + local markets). Never hard-code a country, currency, language or time zone.

## Read before working
- `docs/ARCHITECTURE.md` — scope, stack, object model, money rules, media pipeline, payment abstraction, social sharing
- `docs/USERS-AND-ACCESS.md` — who uses the site, the public/fan/portal/admin areas, access rules, and the later-phase design for portals, Show Rooms, reputation and the show-team builder. Phase 1 builds §5 only.
- `docs/PHASE-1.md` — the current build, as ordered tasks with acceptance criteria
- `prisma/schema.prisma` — starter schema; the source of truth for data shapes

Work through `docs/PHASE-1.md` task by task, in order. Finish each task's acceptance criteria (including tests) before starting the next. Tick the checkbox in `docs/PHASE-1.md` when a task is done.

## Non-negotiable principles
1. **One object model, not parallel systems.** Every proposal is a `Suggestion`, whoever starts it (`origin`) and whatever its `format`. Do not create separate tables per format or per proposer (no "ArtistListing", "FanRequest", "TheatreShow", "Match").
2. **Core objects keep their names everywhere** (DB, API, code, tests): `Suggestion`, `Performer` (any performing entity), `Offer` (performer availability), `Pledge` (money: `FAN` | `SPONSOR`), `Participation` (non-money commitment from other stakeholders), `Threshold`, `Region`, `Genre`. User-facing copy may say "artist", "band", "orchestra" or "company" depending on `Performer.kind`.
3. **Formats are configuration.** Enabled `ShowFormat` and `PerformerKind` values come from `src/config/formats.ts`. Never hard-code a format or assume music in logic.
4. **Money is integer minor units + ISO 4217 currency.** `BigInt amountMinor` + `String currency`. No floats, no `Decimal` for amounts, no currency-less numbers. FX conversion is display-only.
5. **Phase 1 pledges are soft.** No money moves. Never import a payment SDK in Phase 1. Code that will later charge money goes behind the `PaymentProvider` interface (see ARCHITECTURE.md), which stays unimplemented for now.
6. **Build for later phases without building them.** Enum values and columns for future phases (later formats, SPONSOR pledges, Offers, performer responses) exist in the schema; no UI or endpoints for them yet.
7. **Mobile-first and low-bandwidth friendly.** Most users arrive from a social media link on a phone. Pages must be server-rendered, fast on 3G, and look right when shared on any major platform (see ARCHITECTURE.md §8).
8. **All permission checks go through `can(actor, action, resource)`** in `src/lib/access/`. Default deny. No inline role checks in pages, actions or routes.
9. **No secrets in code.** Everything via env vars, documented in `.env.example`.

## Conventions
- TypeScript strict. No `any` without a comment explaining why.
- Server Actions for mutations from forms; Route Handlers only for webhooks, cron, and public API.
- All DB writes that touch pledge totals run in a single Prisma transaction.
- Validate every input with Zod at the boundary.
- Tests: Vitest for logic, Playwright for the main user flows.
- Commit after each completed task with message `phase1: <task number> <short title>`.

## When unsure
If a task conflicts with these principles, or a product decision is missing, stop and write the question into `docs/OPEN-QUESTIONS.md` instead of guessing. Continue with tasks that don't depend on it.
