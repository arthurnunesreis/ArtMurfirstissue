# HiveConcerts

**Bring the show to your city.** HiveConcerts.com is a crowdsourced live-events marketplace. Fans, performers, organisers, sponsors, venues and event services propose the live shows they want in a city, back them, and work together to make them happen.

Music (artists and bands) leads. Phase 1 builds concerts, orchestral performances and theatre.

## What's in this repository

| Path | What it is |
|---|---|
| `CLAUDE.md` | Rules for anyone (human or Claude Code) building the app. Read first. |
| `docs/ARCHITECTURE.md` | Stack, object model, money rules, media, payments, social sharing |
| `docs/USERS-AND-ACCESS.md` | Users, portals, access, Show Rooms, reputation, deals, revenue model, roadmap |
| `docs/PHASE-1.md` | The current build: ordered tasks with acceptance criteria |
| `docs/OPEN-QUESTIONS.md` | Product decisions still needed |
| `prisma/schema.prisma` | Database schema, the source of truth for data shapes |
| `landing/` | The pre-launch page for hiveconcerts.com (Cloudflare Pages), deployed separately |
| `scripts/setup-github.sh` | Creates the labels, milestones and Phase 1 issues (`scripts/setup-github.sh owner/repo`) |

The Next.js app lives at the repository root.

## Local setup

Needs Node 22+, pnpm 10 (`corepack enable`), and PostgreSQL 16+ (local, Docker, or a free Neon database).

```bash
pnpm install
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env   — then set DATABASE_URL
pnpm db:init                  # first time only: creates and applies the migrations, then commit prisma/migrations/
pnpm db:seed                  # loads regions and genres; safe to re-run
pnpm dev                      # http://localhost:3000
```

| Command | Does |
|---|---|
| `pnpm dev` | Run the app locally |
| `pnpm typecheck` / `pnpm lint` / `pnpm test` | The checks CI runs |
| `pnpm test:e2e` | Playwright tests on phone and desktop (first run: `pnpm exec playwright install chromium`) |
| `pnpm format` | Format code with Prettier |
| `pnpm db:migrate` | Create and apply a migration after changing `prisma/schema.prisma` |
| `pnpm db:seed` | Load or refresh regions and genres from `prisma/seed/*.json` |
| `pnpm db:studio` | Browse the database |
| `pnpm admin:grant you@example.com` | Make an account an admin (sign in once first; `--revoke` to undo) |

Signing in locally: without `RESEND_API_KEY`, the sign-in link is printed in the terminal running `pnpm dev`; open it in the browser. Google sign-in appears once `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are set. `pnpm test:e2e` needs a migrated, seeded database.

Add UI components with `pnpm dlx shadcn@latest add <component>`.

## How we work

- Phase 1 is built task by task from `docs/PHASE-1.md`. Each task has a GitHub issue; each issue gets one branch and one pull request.
- Branch names: `phase1/<task-number>-<short-name>`, e.g. `phase1/01-scaffold`.
- Commit messages: `phase1: <task number> <short title>`.
- A pull request is merged when CI is green and the task's acceptance criteria are ticked.
- Product questions go in `docs/OPEN-QUESTIONS.md`, not into guesses in code.

See `CONTRIBUTING.md` for details.

## Roadmap

1. **Demand:** proposals, soft pledges, sharing, fan area *(now)*
2. **Stakeholders:** organisations, portals, Show Rooms, opportunities, deals
3. **Money:** payments, fees, sponsor matching, reconciliation, cases and appeals
4. **Marketplace:** venue and provider portals, quotes, reviews and reputation
5. **Show Builder:** "Build my show team"
6. **Ticketing**

## Licence

All rights reserved. This is private, proprietary code.
