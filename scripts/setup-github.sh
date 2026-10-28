#!/usr/bin/env bash
# Creates labels, phase milestones and one issue per Phase 1 task in the HiveConcerts repo.
# Needs the GitHub CLI signed in (`gh auth login`). Safe to re-run: existing labels and
# milestones are left alone, and issues are skipped if one with the same title exists.
#
# Usage: scripts/setup-github.sh [owner/repo]   (default: the current repo)
set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "Setting up $REPO"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" 2>/dev/null || true; }
label "task"        "1D1838" "Build work from a phase plan"
label "phase-1"     "F0A400" "Phase 1: Demand"
label "phase-2"     "C8A2FF" "Phase 2: Stakeholders"
label "decision"    "D93F0B" "Needs a product decision"
label "blocked"     "B60205" "Waiting on something else"
label "bug"         "D73A4A" "Something isn't working"
label "infra"       "5B5675" "Tooling, CI, hosting"
label "design"      "0E8A16" "UI and copy"
label "good first issue" "7057FF" "Small and self-contained"

milestone() {
  local title="$1" desc="$2"
  if ! gh api "repos/$REPO/milestones?state=all&per_page=100" -q '.[].title' | grep -Fxq "$title"; then
    gh api "repos/$REPO/milestones" -f title="$title" -f description="$desc" >/dev/null
  fi
}
milestone "Phase 1: Demand"       "Public and fan areas: proposals, soft pledges, participation, sharing, access foundations"
milestone "Phase 2: Stakeholders" "Organisations, portals, Show Rooms, opportunities, Deal Rooms, subscriptions"
milestone "Phase 3: Money"        "Payments, fees, milestones, sponsor matching, reconciliation, cases and appeals"
milestone "Phase 4: Marketplace"  "Venue and provider portals, quotes, reviews and reputation"
milestone "Phase 5: Show Builder" "Format templates and Build my show team"
milestone "Phase 6: Ticketing"    "Native tickets, check-in, post-show surveys"

existing_titles="$(gh issue list --repo "$REPO" --state all --limit 500 --json title -q '.[].title')"
issue() {
  local title="$1" body="$2" labels="$3"
  if grep -Fxq "$title" <<<"$existing_titles"; then echo "skip: $title"; return; fi
  gh issue create --repo "$REPO" --title "$title" --body "$body" --label "$labels" --milestone "Phase 1: Demand" >/dev/null
  echo "created: $title"
}

T='See docs/PHASE-1.md, task'
issue "Phase 1 · 1. Scaffold the project"            "$T 1. Next.js, Prisma 7, formats config, Vitest, Playwright, CI." "task,phase-1,infra"
issue "Phase 1 · 2. Money, regions and genres"       "$T 2. money.ts, FX cron, region and genre seeds." "task,phase-1"
issue "Phase 1 · 3. Auth and roles"                  "$T 3. Auth.js, onboarding, route groups, can() access module." "task,phase-1"
issue "Phase 1 · 4. Performers"                      "$T 4. Search, add performer, performer page, follows." "task,phase-1"
issue "Phase 1 · 5. Media (images + embeds)"         "$T 5. R2 uploads, oEmbed resolver, click-to-load facade." "task,phase-1"
issue "Phase 1 · 6. Propose a show"                  "$T 6. Create Suggestion with bill, matchKey dedupe, threshold defaults.

Needs decisions: launch markets, default thresholds and currency (open questions 8, 1 and 2)." "task,phase-1,blocked"
issue "Phase 1 · 7. Suggestion page"                 "$T 7. The shareable show page and performance budget." "task,phase-1,design"
issue "Phase 1 · 8. Share kit"                       "$T 8. OG tags, share images, share sheet, referral attribution." "task,phase-1,design"
issue "Phase 1 · 9. Soft pledging and participation" "$T 9. Pledges in transactions, threshold transition, participation." "task,phase-1"
issue "Phase 1 · 10. Discovery"                      "$T 10. Home, region pages, explore, trending cron." "task,phase-1"
issue "Phase 1 · 11. Notifications"                  "$T 11. Emails, preferences, expiry cron, follow digests." "task,phase-1"
issue "Phase 1 · 12. My HiveConcerts"                "$T 12. Fan dashboard at /me." "task,phase-1"
issue "Phase 1 · 13. Admin"                          "$T 13. Moderation, threshold edits, merges, audit log." "task,phase-1"
issue "Phase 1 · 14. Embeddable progress card"       "$T 14. /embed/s/[slug] and oEmbed endpoint." "task,phase-1"
issue "Phase 1 · 15. Payment interface stub"         "$T 15. PaymentProvider interface only." "task,phase-1,good first issue"
issue "Phase 1 · 16. Launch hardening"               "$T 16. Sentry, analytics, legal pages, reconciliation, production deploy." "task,phase-1,infra"

decision() { issue "Decision: $1" "$2

See docs/OPEN-QUESTIONS.md." "decision,phase-1"; }
decision "Launch markets"        "Which cities launch first? Blocks seeded Regions and currencies (task 6)."
decision "Default thresholds"    "Target amount, minimum backers and deadline per format and region. Blocks task 6."
decision "Suggestion currency"   "Region currency, or USD everywhere with local approximations? Blocks task 6."
decision "Pledge limits"         "Minimum and maximum pledge per currency. Needed by task 9."

echo "Done."
