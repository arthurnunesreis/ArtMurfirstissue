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
| `scripts/setup-github.sh` | Creates the labels, milestones and Phase 1 issues |

The Next.js app lives at the repository root once Phase 1 task 1 is merged.

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
