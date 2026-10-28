#!/usr/bin/env bash
# Creates labels, phase milestones and one issue per Phase 1 task in the HiveConcerts repo.
# Uses only the GitHub REST API through the GitHub CLI (`gh auth login` first).
# Safe to re-run: existing labels, milestones and issues (matched by title) are left alone.
#
# Usage: scripts/setup-github.sh owner/repo
set -euo pipefail

REPO="${1:?Usage: scripts/setup-github.sh owner/repo}"
echo "Setting up $REPO"

label() {
  gh api "repos/$REPO/labels" -f name="$1" -f color="$2" -f description="$3" >/dev/null 2>&1 \
    && echo "label: $1" || echo "label exists: $1"
}
label "task"             "1D1838" "Build work from a phase plan"
label "phase-1"          "F0A400" "Phase 1: Demand"
label "phase-2"          "C8A2FF" "Phase 2: Stakeholders"
label "decision"         "D93F0B" "Needs a product decision"
label "blocked"          "B60205" "Waiting on something else"
label "bug"              "D73A4A" "Something isn't working"
label "infra"            "5B5675" "Tooling, CI, hosting"
label "design"           "0E8A16" "UI and copy"
label "good first issue" "7057FF" "Small and self-contained"

milestone_number() {
  gh api "repos/$REPO/milestones?state=all&per_page=100" \
    --jq ".[] | select(.title == \"$1\") | .number"
}
milestone() {
  if [ -z "$(milestone_number "$1")" ]; then
    gh api "repos/$REPO/milestones" -f title="$1" -f description="$2" >/dev/null
    echo "milestone: $1"
  else
    echo "milestone exists: $1"
  fi
}
milestone "Phase 1: Demand"       "Public and fan areas: proposals, soft pledges, participation, sharing, access foundations"
milestone "Phase 2: Stakeholders" "Organisations, portals, Show Rooms, opportunities, Deal Rooms, subscriptions"
milestone "Phase 3: Money"        "Payments, fees, milestones, sponsor matching, reconciliation, cases and appeals"
milestone "Phase 4: Marketplace"  "Venue and provider portals, quotes, reviews and reputation"
milestone "Phase 5: Show Builder" "Format templates and Build my show team"
milestone "Phase 6: Ticketing"    "Native tickets, check-in, post-show surveys"

P1="$(milestone_number "Phase 1: Demand")"
existing_titles="$(gh api "repos/$REPO/issues?state=all&per_page=100" --paginate --jq '.[].title')"

# issue "title" "body" label [label...]
issue() {
  local title="$1" body="$2"; shift 2
  if grep -Fxq "$title" <<<"$existing_titles"; then echo "issue exists: $title"; return; fi
  local args=(-f title="$title" -f body="$body" -F milestone="$P1")
  for l in "$@"; do args+=(-f "labels[]=$l"); done
  gh api "repos/$REPO/issues" "${args[@]}" --jq '"issue #\(.number): \(.title)"'
}

T='See `docs/PHASE-1.md`, task'
issue "Phase 1 · 1. Scaffold the project"            "$T 1. Next.js, Prisma 7, formats config, Vitest, Playwright, CI." task phase-1 infra
issue "Phase 1 · 2. Money, regions and genres"       "$T 2. money.ts, FX cron, region and genre seeds." task phase-1
issue "Phase 1 · 3. Auth and roles"                  "$T 3. Auth.js, onboarding, route groups, can() access module." task phase-1
issue "Phase 1 · 4. Performers"                      "$T 4. Search, add performer, performer page, follows." task phase-1
issue "Phase 1 · 5. Media (images + embeds)"         "$T 5. R2 uploads, oEmbed resolver, click-to-load facade." task phase-1
issue "Phase 1 · 6. Propose a show"                  "$T 6. Create Suggestion with bill, matchKey dedupe, threshold defaults.

Needs decisions first: launch markets, default thresholds and currency." task phase-1 blocked
issue "Phase 1 · 7. Suggestion page"                 "$T 7. The shareable show page and performance budget." task phase-1 design
issue "Phase 1 · 8. Share kit"                       "$T 8. OG tags, share images, share sheet, referral attribution." task phase-1 design
issue "Phase 1 · 9. Soft pledging and participation" "$T 9. Pledges in transactions, threshold transition, participation." task phase-1
issue "Phase 1 · 10. Discovery"                      "$T 10. Home, region pages, explore, trending cron." task phase-1
issue "Phase 1 · 11. Notifications"                  "$T 11. Emails, preferences, expiry cron, follow digests." task phase-1
issue "Phase 1 · 12. My HiveConcerts"                "$T 12. Fan dashboard at /me." task phase-1
issue "Phase 1 · 13. Admin"                          "$T 13. Moderation, threshold edits, merges, audit log." task phase-1
issue "Phase 1 · 14. Embeddable progress card"       "$T 14. /embed/s/[slug] and oEmbed endpoint." task phase-1
issue "Phase 1 · 15. Payment interface stub"         "$T 15. PaymentProvider interface only." task phase-1 "good first issue"
issue "Phase 1 · 16. Launch hardening"               "$T 16. Sentry, analytics, legal pages, reconciliation, production deploy." task phase-1 infra

D='See `docs/OPEN-QUESTIONS.md`.'
issue "Decision: Launch markets"      "Which cities launch first? Blocks seeded Regions and currencies (task 6). $D" decision phase-1
issue "Decision: Default thresholds"  "Target amount, minimum backers and deadline per format and region. Blocks task 6. $D" decision phase-1
issue "Decision: Suggestion currency" "Region currency, or USD everywhere with local approximations? Blocks task 6. $D" decision phase-1
issue "Decision: Pledge limits"       "Minimum and maximum pledge per currency. Needed by task 9. $D" decision phase-1

echo "Done."
