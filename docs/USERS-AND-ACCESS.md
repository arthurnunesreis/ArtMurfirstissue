# HiveConcerts — Users, portals and access

How people use HiveConcerts, what each of them sees, how they work together on shows and other deals, how reputation works, how money, integrity and fees are handled, and how the platform eventually assembles a whole show team with one button.

This document describes the full product. Each section says which phase builds it. **Phase 1 builds only the public area, the fan area and the access foundations (§5).** Everything else is design that later phases implement without reworking Phase 1.

---

## 1. Who uses HiveConcerts

There are two kinds of user, and one person can be both.

**Audience (fans).** Anyone who wants to see a show. They browse, propose shows, pledge, share, follow performers and venues, and later buy tickets. They use their **personal account** only.

**Stakeholders.** Anyone who offers something to a show and stands to earn from it or gain from it. They act on behalf of an **organisation**, and each organisation gets its own **portal**.

| Stakeholder type | Who they are | What they bring to a show |
|---|---|---|
| **Performer** | Solo artists, bands, orchestras, ensembles, theatre companies, productions (later: comedians, dance companies, athletes) | The performance itself |
| **Management** | Managers, booking agents, agencies | Represent one or more performers |
| **Organiser** | Promoters, event companies, festival producers | Run the event end to end |
| **Sponsor** | Brands and businesses | Money, products, marketing reach |
| **Venue** | Arenas, theatres, concert halls, clubs, outdoor sites | The space, plus any in-house services |
| **Service provider** | Companies or freelancers in a service category (§1.1) | A specific part of the production |

### 1.1 Service categories
Data-driven (a seeded table, not an enum), so new categories need no code change:

Sound, lighting, staging and rigging, backline and instrument hire, power and generators, video and screens, security, medical and first aid, ticketing and access control, event staffing, catering and bars, transport and logistics, accommodation, marketing and PR, photography and video, MC and hosting, permits and legal, insurance, merchandise, cleaning and waste, toilets and site facilities, décor and set design, wardrobe, hair and make-up (theatre), piano and orchestral hire (orchestral).

### 1.2 Accounts and organisations
- **One login per person.** Every person has one `User` account. A fan never needs more.
- **Organisations are separate from people.** A band, a venue or a sponsor brand is an `Organisation` with its own profile, portal, reputation and team. A person can belong to several (a manager may run three acts; a promoter may also own a venue).
- **Team roles inside an organisation:** `OWNER` (billing, delete, transfer), `ADMIN` (everything except ownership), `MEMBER` (works on shows, can't change settings or team), `VIEWER` (read only, e.g. an accountant).
- **Workspace switcher.** A signed-in person switches between "Me" (fan area) and any organisation they belong to, like switching workspaces in Slack.
- **Performers link to organisations.** The `Performer` profiles fans create in Phase 1 are claimed by a Performer organisation in Phase 2 (§6.1). Management organisations can be granted access to a Performer they represent.
- **Verification.** Organisations start unverified. Verification (§6.1) unlocks a badge, the right to receive bookings and money, and the right to leave reviews that count.

---

## 2. Areas of the site

```
hiveconcerts.com
├── Public area ............ anyone, no sign-in
├── Fan area (/me) ......... any signed-in person
├── Portals (/hub/[org]) ... members of a stakeholder organisation
│   └── Show Rooms ......... organisations working on a specific show
└── Admin console (/admin) . HiveConcerts staff
```

### 2.1 Public area (Phase 1)
Open to everyone, server-rendered, built for sharing.

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Trending shows near you, music first, then orchestra and theatre |
| Explore | `/explore` | Filter shows by format, genre, region, performer kind |
| Show | `/s/[slug]` | The Suggestion: bill, progress, backers, who's taking part, share kit |
| Performer | `/p/[slug]` | Profile, media, open shows across cities |
| Region | `/r/[slug]` | Shows proposed for a city |
| Organisation profile | `/o/[slug]` | Phase 2+: venues, providers, sponsors, organisers; public reputation summary (§7.5) |
| How it works, About, Terms, Privacy | static | |
| Embed card | `/embed/s/[slug]` | Live progress card for other sites |

### 2.2 Fan area (Phase 1)
Any signed-in person, at `/me`.

- **Propose a show** (`/propose`)
- **My shows:** pledges (edit, withdraw), shows I proposed, shows I'm following
- **Following:** performers, venues and cities, which feed the home page and notifications
- **My shares:** how many people my links brought in
- **Notifications** and preferences
- **Profile:** name, home city, display currency, "I'm here as…" roles
- **Tickets** (Phase 6)
- **Create or join an organisation** (Phase 2): the way into the stakeholder side

What fans can do on a show page: pledge, comment publicly, share, follow, report. Fans never see private Show Room content, quotes, budgets or reviews' private details.

### 2.3 Stakeholder portals (Phase 2+)
At `/hub/[orgSlug]`. Every portal shares one shell; modules switch on by organisation type.

**Common to every portal**

| Module | What it does |
|---|---|
| Dashboard | What needs attention: invitations, quote requests, approvals, unread messages, shows nearing threshold |
| Profile | Public profile editor, media, links, verification status |
| Opportunities | Demand relevant to this organisation (see per-type below), with "Join this show" |
| Shows | Every show this organisation is part of, by stage; opens its Show Room |
| Inbox | Messages with other stakeholders, grouped by show and by organisation |
| Reputation | Rating, reviews, endorsements, track record, how to improve |
| Team | Invite members, set roles |
| Analytics | Views, followers, conversions, earnings (later) |
| Settings | Organisation details, notifications, payouts (Phase 3+) |

**Per-type modules**

| Type | Extra modules |
|---|---|
| **Performer** | **Demand map** (where fans want them, by city and size of backing) · **Offers** (availability windows, base fee, formats, regions, conditions) · **Rider** (technical and hospitality requirements, stage plot, input list) · **Audience** (backers and followers by city; aggregates only) · **Build my show team** button (§8) |
| **Management** | All Performer modules for each act they represent, plus a roster view across acts |
| **Organiser** | **Pipeline** (shows from idea to settled) · **Budget builder** (line items vs threshold and ticket projections) · **Sourcing** (find and compare venues and providers, request quotes) · **Build my show team** button |
| **Sponsor** | **Audience finder** (which shows and cities match their target audience) · **Packages** (what they offer: cash, product, media; and what they want back: branding, activations, tickets) · **Co-campaigns** (§4.4) · **Brand assets** · **Reports** (reach, engagement, attributed pledges) |
| **Venue** | **Spaces** (capacity by layout, technical specs, in-house services, restrictions) · **Calendar** (availability and holds) · **Demand near me** (shows proposed within a radius that fit their capacity) · **Pricing** (hire rates, deposits) |
| **Service provider** | **Services and packages** (by category, with price ranges) · **Coverage** (where they work) · **Calendar** · **Quote requests** and **Bids** · **Portfolio** (past shows, media) · **Compliance documents** (insurance, licences, certifications) |

### 2.4 Admin console (Phase 1 basic, grows each phase)
Moderation, merging duplicates, threshold edits (Phase 1); verification queue, disputes, review moderation, compliance gates for regulated formats, reputation adjustments with audit trail (later).

---

## 3. Access rules

### 3.1 Principles
- **One policy module decides everything.** Every page, Server Action and API route calls `can(actor, action, resource)` from `src/lib/access/`. No permission checks written inline. (Built in Phase 1, §5.)
- **The actor is a person acting in a context:** themselves (fan area), or as a member of an organisation with a team role.
- **Default deny.** Anything not granted is refused.
- **Public by default for demand, private by default for business.** Show progress, bills and confirmed teams are public. Quotes, budgets, contracts, internal messages and private review details are visible only to the parties involved.

### 3.2 Show-level visibility

| Information | Public | Backers | Show Room members | That organisation only | Admin |
|---|---|---|---|---|---|
| Title, bill, progress, public comments | ✓ | ✓ | ✓ | ✓ | ✓ |
| Organisations taking part (names) | ✓ once confirmed | ✓ | ✓ | ✓ | ✓ |
| Backer list (non-anonymous) | first names only | ✓ | ✓ | ✓ | ✓ |
| Backer emails | | | | | ✓ |
| Show Room discussion, files, checklist | | | ✓ | ✓ | ✓ |
| Budget and line items | | | owner + organiser, plus each party's own lines | own lines | ✓ |
| A provider's quote | | | requester + organiser | ✓ | ✓ |
| Contracts | | | the two signing parties | ✓ | ✓ |

### 3.3 Who can do what

| Action | Fan | Performer | Management | Organiser | Sponsor | Venue | Provider |
|---|---|---|---|---|---|---|---|
| Propose a show | ✓ | ✓ (own act) | ✓ (acts they manage) | ✓ | ✓ | ✓ | |
| Pledge as a fan | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Pledge as a sponsor | | | | | ✓ | | |
| Express interest in a show | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Open a Show Room | | ✓ | ✓ | ✓ | | | |
| Invite organisations to a Show Room | | owner | owner | owner | | | |
| Request quotes | | ✓ | ✓ | ✓ | | | |
| Submit quotes and bids | | | | | | ✓ | ✓ |
| Accept a show booking | | ✓ (own act only) | ✓ (if authorised by act) | | | | |
| Review another organisation | | after working together on a completed show (§7.2) | | | | | |
| Use "Build my show team" | | ✓ | ✓ | ✓ | | | |

"Owner" means the Show Room owner (§4.1). Unverified organisations can do everything except receive bookings, receive money, and have their reviews count.

---

## 4. Working together: Show Rooms and campaigns (Phase 2+)

### 4.1 The Show Room
Every Suggestion can have one **Show Room**: a private workspace where everyone involved in making that show happen works together. It's the bridge between public demand and a real event.

- **Opening one.** A performer, management or organiser opens the Show Room. They become its **owner** (lead). Ownership can be transferred, and a show can have co-owners (for example, an act's manager and a promoter).
- **Members are organisations, not individuals.** Each member organisation decides which of its people take part.
- **Joining.** By invitation from the owner, or by request (any stakeholder who expressed interest on the public page can ask to join; the owner approves).
- **The team roster.** Slots for each part of the show: the bill (headliner, support, guests), venue, and each service category the show's format needs. Each slot shows its status: `OPEN → INVITED → QUOTED → ACCEPTED → CONFIRMED`, or `DECLINED`.

**What's inside a Show Room**

| Tool | What it does |
|---|---|
| Roster | Who's on the team, slot by slot, with status and contacts |
| Discussion | Threaded conversation for the whole team, plus private threads between any two members |
| Checklist and timeline | Tasks with owners and due dates, generated from a format template (an orchestral concert needs piano tuning; a theatre run needs tech rehearsals) |
| Budget | Line items against the threshold and projected ticket revenue; each party sees the total plus its own lines |
| Quotes | Request, compare and accept quotes from venues and providers |
| Files | Riders, stage plots, contracts, insurance certificates, artwork; with version history |
| Approvals | Sign-offs on key decisions (date, venue, budget, ticket price) by the parties that must agree |
| Activity log | Everything that changed, by whom |

**Public face.** As team members confirm, their names and logos appear on the public show page ("Venue confirmed: …", "Sound by …"). This builds fan confidence and gives providers visibility.

### 4.2 Collaborating before a show exists
Not every partnership starts from fan demand. A sponsor and an artist may want to plan a tour together; a venue may want a residency.

- **Direct messages** between organisations work without a show.
- **Campaigns** group several Suggestions under one effort: a tour across five cities, a season of orchestral concerts, a festival line-up. A campaign has its own owner and members and its own Show Room-style workspace; each city's Suggestion still has its own threshold and public page.

### 4.3 Typical collaborations

| Partnership | How it works on HiveConcerts |
|---|---|
| **Sponsor + performer push a concert in a city** | Both join the show's Show Room. The sponsor runs a **co-campaign** (§4.4): matches fan pledges up to a cap and promotes the show to its audience. The performer posts the shared assets. The public page shows "Presented with {sponsor}". |
| **Venue + performer** | The venue sees the act's demand near it (Demand near me), expresses interest, and offers a date hold. The act accepts the hold in the Show Room, and it shows on the public page. |
| **Organiser + several providers** | The organiser opens the Show Room, requests quotes per slot, compares them, and confirms the team. |
| **Two performers co-headline** | Both are on the bill; both performer organisations co-own the Show Room. |
| **Tour** | A campaign with one Suggestion per city; one sponsor can back the whole tour or individual cities. |

### 4.4 Co-campaigns (Phase 3, needs money features)
Tools for pushing a show together:
- **Pledge matching:** a sponsor adds a set amount for every fan pledge, up to a cap. Shown as a boost on the progress bar.
- **Joint announcements:** one post drafted in the Show Room, approved by each party, published to the show page and as share images for each party's own social accounts.
- **Partner share links:** each party gets its own tracked link, so everyone sees which audience moved the needle.
- **Goals and milestones:** "Unlock a second date at 150%", "Sponsor adds VIP area at 1,000 backers".

---

## 5. What Phase 1 builds for all this

Phase 1 stays focused on the public and fan areas, but lays foundations so portals plug in later without rework:

- **Route groups** in the Next.js app: `(public)`, `(fan)` under `/me`, `(hub)` under `/hub/[org]` (a "coming soon" page in Phase 1), `(admin)`.
- **Access policy module** `src/lib/access/`: `can(actor, action, resource)` with an `Actor` type that already has an optional organisation context. Phase 1 policies cover fan and admin actions. Unit tested as a table of cases.
- **`stakeholderRoles` on the user** (already in the schema) drives what the fan area offers ("Want a portal for your venue? Join the waitlist").
- **Participation** (already in the schema) captures stakeholders' interest in shows. In Phase 2 each `Participation.organisation` string is linked to a real organisation.
- **Follows:** fans can follow performers and regions in Phase 1 (`Follow` model added in Phase 1; organisations become followable in Phase 2).

---

## 6. Data model for later phases (design only)

Sketch for Phases 2 to 5. Names are final; fields may grow. Do **not** add these in Phase 1, apart from `Follow`.

```prisma
model Organisation {
  id           String   @id @default(cuid())
  slug         String   @unique
  name         String
  type         OrgType  // PERFORMER | MANAGEMENT | ORGANIZER | SPONSOR | VENUE | PROVIDER
  verifiedAt   DateTime?
  countryCode  String?
  coverage     Json?    // regions or radius served (venues, providers)
  // relations: members, performers (claimed), services, spaces, reviews…
}

model OrgMember        { orgId, userId, role: OWNER | ADMIN | MEMBER | VIEWER }
model PerformerAccess  { performerId, orgId, level: OWNER | MANAGES }      // act ↔ its org and its managers
model ServiceCategory  { id, slug, name, parentId? }                        // §1.1, seeded
model ServiceListing   { orgId, categoryId, title, priceFromMinor, priceToMinor, currency, regions, specs Json }
model VenueSpace       { orgId, name, capacity Json /* by layout */, techSpecs Json, inHouseServices String[] }
model Availability     { orgId, spaceId?, startsAt, endsAt, kind: AVAILABLE | HOLD | BOOKED }

model ShowRoom         { id, suggestionId? , campaignId?, ownerOrgId }
model ShowRoomMember   { showRoomId, orgId, status: INVITED | REQUESTED | ACTIVE | LEFT, isOwner }
model TeamSlot         { showRoomId, kind: PERFORMER | VENUE | SERVICE, categoryId?, billing?, orgId?, status: OPEN | INVITED | QUOTED | ACCEPTED | CONFIRMED | DECLINED, locked Boolean }
model Quote            { slotId, fromOrgId, amountMinor, currency, terms, validUntil, status }
model Task, BudgetLine, FileAsset, Approval, Thread, Message, ActivityLog   // Show Room tools

model Campaign         { id, title, ownerOrgId, suggestions Suggestion[] }
model SponsorMatch     { suggestionId, sponsorOrgId, ratio, capMinor, currency }   // Phase 3

model Opportunity      { id, postedByOrgId, kind: NEED | OFFER, category, title, details Json, regions, dates, budgetMinor?, currency?, visibility: PUBLIC_TO_STAKEHOLDERS | INVITED, status }  // §10.2
model Match            { opportunityId, candidateOrgId?, candidateOpportunityId?, source: SYSTEM | STAFF | STAKEHOLDER, score?, status }      // §10.2

model Deal             { id, title, origin: HIVE_SOURCED | BROUGHT_IN, suggestionId?, showRoomId?, opportunityId?, status: DRAFT | NEGOTIATING | AGREED | IN_PROGRESS | COMPLETED | CANCELLED | DISPUTED, currency }  // §10.3
model DealParty        { dealId, orgId, role: PAYER | PAYEE | INTRODUCER | WITNESS, acceptedAt?, completedAt?, cancelledBy? }  // a party in a completed Deal is an "engagement" for reputation (§7)
model DealTerm         { dealId, version, summary, terms Json, fileId?, agreedByAll Boolean }
model Milestone        { dealId, title, amountMinor, currency, dueAt?, payerOrgId, payeeOrgId, status: PENDING | FUNDED | RELEASED | REFUNDED | DISPUTED }
model Review           { dealId, fromOrgId, toOrgId, scores Json, comment, publishedAt? }
model Endorsement      { fromOrgId, toOrgId, categoryId?, note }                                  // a recommendation
model ReputationScore  { orgId, categoryId?, score, confidence, components Json, computedAt }       // cached

model FeeSchedule      { id, kind, ratePermille?, fixedMinor?, currency?, tiers Json?, appliesTo Json, validFrom, validTo? }   // §11, versioned, never hard-coded
model FeeLine          { id, ledgerEntryId, feeScheduleId, basisMinor, amountMinor, currency }                               // every fee charged, with the rule that produced it

model Follow           { userId, targetType: PERFORMER | REGION | ORGANISATION, targetId }        // Phase 1 (performer, region)
```

---

## 7. Ratings, track record and reputation (Phase 4)

Every venue and service provider, and in time every organiser, sponsor and performer, has a reputation built from what actually happened on real shows.

### 7.1 What makes up reputation

| Component | Source | Notes |
|---|---|---|
| **Ratings** | Reviews from organisations that worked on the same show | Scored per dimension (§7.3) |
| **Track record** | The platform's own data | Shows completed, cancellations (and by whom), on-time delivery, quote response time, quote acceptance rate, repeat-hire rate |
| **Endorsements** | Recommendations from other stakeholders | "We'd hire them again", optionally per service category; weighted by the endorser's own reputation; a performer recommending their regular sound engineer counts |
| **Verification** | Admin checks | Business registration, insurance, licences and certifications in date; shown as badges |

### 7.2 Who can review whom
- Only organisations that were **parties to the same completed Deal** (§10.3) can review each other, whether the Deal was part of a show or stood alone. That completed role is called an *engagement*. No engagement, no review. This stops fake reviews.
- **Both directions:** an organiser reviews the sound company, and the sound company reviews the organiser (did they pay on time, was the brief accurate).
- **Blind until both submit**, or 14 days pass, so nobody retaliates.
- A response from the reviewed organisation is allowed, once, publicly.
- Fans don't rate providers. Fans' experience feeds in indirectly through a short post-show survey on the show as a whole (Phase 6), weighted lightly.

### 7.3 Rating dimensions
Common to all: **reliability**, **quality of work**, **communication**, **value for money**. Plus category-specific ones from a data table, e.g. security: **safety record**; venue: **accuracy of specs**, **staff**; performer: **punctuality**, **rider reasonableness**.

### 7.4 Turning it into a score
- **Bayesian average** per dimension, so a new provider with one 5-star review doesn't outrank an established one with 200 reviews at 4.8. Confidence is shown alongside ("New", "Established", "Highly rated across 40+ shows").
- **Recent work counts more** (time decay over roughly 24 months).
- **Track-record adjustments:** cancellations by the provider pull the score down; repeat hires pull it up.
- **Per category** where an organisation offers several services.
- **Abuse protection:** reviews from organisations sharing owners are excluded; outliers are flagged for admin review; admin adjustments are always logged with a reason.

### 7.5 Who sees what
- **Any stakeholder** (signed in as a verified organisation) sees the full reputation: scores per dimension, reviews, track record, endorsements, badges.
- **The public** sees a summary on organisation profiles: overall rating, number of shows, badges, and short review excerpts.
- **The organisation itself** sees everything plus improvement tips ("Your quote response time is slower than 70% of sound providers in your area").

---

## 8. "Build my show team" (Phase 5)

An optional button for performers, management and organisers, especially those new to a market. It proposes a complete, workable team for a specific show, which they can then edit before anyone is contacted.

### 8.1 What goes in
- The show: format, genre, city, date window, the performers on the bill and their riders.
- Expected audience size, from pledges, followers and the act's track record elsewhere.
- Budget: the threshold, projected ticket revenue and any sponsor commitments.
- The **format template**: which slots this kind of show needs (a stadium concert needs far more than a jazz club night; an orchestral concert needs acoustic-suited venues and instrument hire).
- Anything the user has already locked in ("we already have our own sound engineer").

### 8.2 How it chooses
1. **Work out the slots** from the format template, removing those covered by locked choices or by the venue's in-house services.
2. **Find candidates** for each slot: verified organisations covering the city, available on the dates, meeting hard requirements (venue capacity at least the expected audience; technical specs that satisfy the rider; licences required for that service in that jurisdiction).
3. **Score each candidate** on: fit to the requirements, reputation, price against that slot's share of the budget, availability certainty, distance and travel cost, and **proven combinations** (organisations that have worked well together before score higher together; this is how the system "connects the dots").
4. **Pick the best overall team**, not just the best per slot: stay within budget, prefer combinations with good shared history, avoid conflicts (one provider can't fill two clashing slots).
5. **Explain the choice:** each pick shows why ("Rated 4.8 across 31 shows, has worked with this venue 6 times, within budget").

### 8.3 What the user can do with it
- See the proposed team with total cost against budget.
- **Swap** any member for one of the next best alternatives (each slot lists two or three).
- **Lock** members they're happy with and **re-run** for the rest.
- **Remove** slots they'll handle themselves, or **add** slots.
- **Send requests:** nothing is sent until they confirm. Then each organisation gets an invitation in its portal, and the slot statuses update in the Show Room as they quote, accept or decline. A declined slot offers the next alternative.

### 8.4 How it's built
- **Version 1 (Phase 5): rules and scoring.** Format templates as data, hard filters as queries, a weighted score, and a simple optimiser (best per slot, then local swaps to fit budget and improve pair history). Transparent and easy to tune.
- **Later:** learn the weights from which proposals users accepted, and from which completed shows got the best reviews.
- It needs real data to be good: enough verified providers with availability and reputation in a city. Switch it on **per city** once there's enough supply, and say so honestly where there isn't ("We know 3 sound providers in this city; you may want to add your own").

---

## 9. Money flows, integrity and appeals (Phase 3+)

**Decision:** because HiveConcerts is built on crowdsourcing, **all money for a show runs through the platform** wherever that's practically possible: fan pledges and tickets, sponsor money, and payments from organisers to performers, venues and providers. Where it isn't possible, the platform relies on integrations, reporting, on-the-ground checks by HiveConcerts representatives, and enforcement.

### 9.1 How money moves
- **Through the payment processor, never held by HiveConcerts directly.** Use a marketplace product such as Stripe Connect: each paid stakeholder organisation completes the processor's identity checks, and the processor splits each payment between the parties and HiveConcerts' fees. This keeps HiveConcerts out of directly holding other people's money.
- **Charge fans late, not early.** Pledges stay soft until a show is confirmed; fans are charged at confirmation or when tickets go on sale. This shortens how long fan money is held before the event.
- **Release money to stakeholders in milestones** (deposit on confirmation, balance after the show), recorded as `Milestone` rows on each `Deal` (§10.3), so the ledger shows exactly who was paid what and when.
- Holding fans' money for weeks before an event is regulated in many countries (consumer protection, event-cancellation refunds). The processor setup and refund rules need checking by a payments lawyer before Phase 3 goes live. See OPEN-QUESTIONS.md.

### 9.2 When money can't run through the platform
Some revenue is collected outside HiveConcerts, mainly **tickets sold by partner ticketing companies** and **sales at the gate**.
- **Integrations first:** ticketing partners connect through an API or reporting feed so HiveConcerts sees pre-show sales live.
- **Declared figures** for anything not integrated (gate sales, bar share if agreed): the responsible party submits them in the Show Room after the show, with supporting evidence.
- **Representatives:** where available, a HiveConcerts representative attends, does spot checks (headcounts, scanner totals) and files a report.
- **Cross-checks from other stakeholders' data:** security headcounts, venue capacity and access-control logs, bar and merchandise takings, sponsor activation counts, and fans' check-ins all pass through the platform for the same show. Gaps between them point to missed revenue.

### 9.3 Detecting leaks and misreporting
- Every show gets a **reconciliation** after it ends: expected revenue (from pledges, ticket feeds, capacity, headcounts) against reported revenue, line by line.
- **Now:** human agents review reconciliations and open cases where figures don't match.
- **Later:** an AI first pass scores every reconciliation, explains each anomaly it found, and queues likely cases. Humans investigate or dismiss. The AI never sanctions anyone on its own.

### 9.4 Cases, sanctions and appeals
- A **case** records the allegation, the evidence (data, reports, representative findings), the parties' responses and the outcome. Parties are told when a case is opened about them and can respond before a decision.
- **Proven** violations or misrepresentation lead to graduated sanctions: a warning, a reputation downgrade, restricted access (for example, no new bookings for a period, or extra checks on future shows), and in serious cases removal. Unproven allegations never affect reputation.
- **Appeals:** any organisation can contest a decision, or raise any issue affecting its standing. An appeal is reviewed by a different person from the one who made the original decision. If it succeeds, the sanction and its reputation effect are reversed and the record shows that.
- Every step is logged in `AuditLog`.

### 9.5 Later-phase data model (design only)
```prisma
model LedgerEntry     { id, showRoomId?, suggestionId?, fromParty, toParty, amountMinor, currency, kind, processorRef?, createdAt }
model RevenueReport   { id, suggestionId, reportedByOrgId, source: TICKETING_API | DECLARED | REPRESENTATIVE, amountMinor, currency, evidence Json, createdAt }
model Reconciliation  { id, suggestionId, expected Json, reported Json, gaps Json, aiScore?, aiNotes?, status, reviewedById? }
model Case            { id, subjectOrgId, suggestionId?, opener: AI | STAFF | STAKEHOLDER, allegation, evidence Json, status: OPEN | RESPONDED | DECIDED | APPEALED | CLOSED, outcome?, sanction? }
model Appeal          { id, caseId?, orgId, reason, status, reviewerId, outcome? }
```

---

## 10. Deals and opportunities: completing any show-business deal (Phase 2–4)

HiveConcerts isn't only for shows that start as crowd proposals. **Anyone in show business can use it to complete a deal**, whether the deal started on the platform, started elsewhere and needs finishing, or needs extra parties brought in. The platform supplies what deals usually lack: the missing partner, a safe way to pay, a clear record of terms, and a track record that follows everyone afterwards.

### 10.1 Examples
- A promoter has agreed a date with an artist by phone but has no venue or sponsor yet. They bring the deal in, post what's missing, and fill the gaps.
- A company wants a band for a private event. No crowd involved; just a performer booking with payment protection.
- A venue has an empty Saturday it wants to fill and posts it.
- An artist touring a region wants local support acts and a backline supplier in each city.
- A sponsor wants a season-long partnership with an orchestra.
- Two parties already agreed everything off-platform but want milestone payments, a signed record and reviews that build their reputation.

### 10.2 Opportunities: posting a need or an offer
- An **Opportunity** is something a stakeholder needs or offers: "Need a 2,000-capacity venue in {city}, 12–14 March", "Seeking a tour sponsor", "Available for corporate bookings in December", "Lighting rig available, {region}, April".
- Opportunities are visible to verified stakeholders (or only to invited organisations), never to the public.
- The platform **connects the dots**: it matches needs with offers and with suitable organisations using the same signals as the Show Builder (§8): fit, availability, location, price, reputation and past collaborations. Staff and other stakeholders can also suggest matches. Each match can be accepted into a Deal.
- Phase 2 shows opportunities as a searchable board with simple matching; smarter matching arrives with the Show Builder in Phase 5.

### 10.3 Deals: the agreement itself
A **Deal** is any agreement between two or more organisations: a booking, a venue hire, a service engagement, a sponsorship, a partnership.
- **Where it lives.** A Deal can belong to a show (inside its Show Room, one Deal per paid relationship), or stand alone in its own **Deal Room** with the same tools: discussion, files, approvals, activity log.
- **Origin.** `HIVE_SOURCED` when the parties met through HiveConcerts (a show, an opportunity match, the Show Builder); `BROUGHT_IN` when they arrive with the deal already agreed or started elsewhere. Origin decides the commission rate (§11.2).
- **Terms.** Versioned terms that all parties accept on the platform, with an optional signed contract file.
- **Milestones.** Payments split into milestones (deposit, balance), each funded by the payer and released to the payee through the payment processor (§9.1). Disputed milestones pause and open a case (§9.4).
- **Adding parties.** A Deal can grow: bring in a sponsor, a venue or a provider, each with their own terms and milestones, inside the same Deal Room.
- **Afterwards.** Each party's completed role counts as an engagement for reviews and reputation (§7), exactly as for a crowd-funded show.

### 10.4 Keeping introduced deals on the platform
When HiveConcerts introduces two parties, repeat business between them should stay on the platform for a period (for example 12 months), as on most professional marketplaces. Low repeat-hire rates, payment protection and reputation make staying the easier choice; the terms of service and the integrity process (§9) cover deliberate circumvention.

---

## 11. Revenue model (Phase 3+)

**Decided: a success fee on every show that happens, plus a commission from everyone who earns through the platform, including performers.** Rates below are starting points; all of them live in a versioned `FeeSchedule` (§6) so they can change without code changes, and every fee charged is recorded as a `FeeLine` against the ledger.

### 11.1 Fees on a crowd-backed show

| Fee | Who bears it | Starting rate |
|---|---|---|
| **Success fee** | The show (comes out of the show owner's margin); charged only when the show is confirmed | 5% of the show's pot: converted pledges, platform ticket sales, reported partner ticket revenue, sponsor money |
| **Earner commission** | Each performer, venue and provider, deducted from their payout | Performers: 5% up to $50,000 per show, 3% above; nothing on a performer's first HiveConcerts show. Venues and providers: 5–8% by category, 3% for repeat hires. The show owner's own profit is exempt, because the success fee covers them. |
| **Fan booking fee** | Fans, added on top, shown upfront | 6% per ticket or converted pledge, with a small fixed minimum |
| **Sponsorship fee** | Sponsors, added on top | 10% of sponsor money placed through the platform, including pledge matching |

**Cap:** success fee plus earner commissions never exceed **10% of a show's pot**. When the cap is reached, commissions are reduced proportionally. Fan and sponsor fees are separate, because they pay those on top.

**Surplus:** money raised above a show's full cost is split between the performer or show owner, a fund that tops up shows that fall just short, and HiveConcerts. Shares to be set (OPEN-QUESTIONS.md).

### 11.2 Fees on deals outside crowd-backed shows (§10)

| Deal origin | Commission on each payee |
|---|---|
| `HIVE_SOURCED` (met through a show, an opportunity match or the Show Builder) | Same as earner commission above |
| `BROUGHT_IN` (deal already agreed elsewhere, completed here) | Lower rate, e.g. 2–3%, because HiveConcerts is adding payment protection and record-keeping rather than finding the business. Any party HiveConcerts later adds to that deal is `HIVE_SOURCED`. |

The payer side of a deal pays nothing extra by default; the platform can later add a small payer fee for payment protection if needed.

### 11.3 Recurring and other income
- **Portal subscriptions:** Free and Pro tiers per organisation, with a higher tier for agencies and promoters running many acts or shows (Phase 2+).
- **Promoted placement** in opportunities and search, always labelled, never used by the Show Builder or matching (Phase 4+).
- **Show Builder fee** when a proposed team is confirmed, or included in Pro (Phase 5).
- **Hive Insights:** anonymised demand reports for labels, promoters, agencies, venues and city or tourism bodies (can start soon after launch).
- **Later:** livestream and recordings revenue share, merchandise commission, optional fan membership.

### 11.4 Worked example
A show with $80,000 of platform ticket sales and $20,000 of sponsor money ($100,000 pot), paying a performer $35,000 and venue and providers $45,000:

| | Amount |
|---|---|
| Success fee, 5% of $100,000 | $5,000 |
| Performer commission, 5% of $35,000 | $1,750 |
| Venue and provider commission, 5% of $45,000 | $2,250 |
| Charged to the show (9% of pot, under the 10% cap) | $9,000 |
| Fan booking fee, 6% of $80,000, on top | $4,800 |
| Sponsorship fee, 10% of $20,000, on top | $2,000 |
| **HiveConcerts total** | **$15,800** |

The organiser keeps $15,000.

---

## 12. Roadmap

| Phase | What it delivers |
|---|---|
| **1. Demand** | Public area, fan area, proposals, soft pledges, participation, sharing, access foundations. *(PHASE-1.md)* |
| **2. Stakeholders** | Organisations, team members, verification, claiming performers, portals for Performer, Management, Organiser and Sponsor, Offers and riders, Show Rooms (roster, discussion, files, checklist), campaigns, direct messages, opportunities board, Deal Rooms without payments, Pro subscriptions |
| **3. Money** | Real payments behind `PaymentProvider` (marketplace split payments), fee schedule and fees (§11), deal milestones and brought-in deals (§10.3), pledge conversion, sponsor pledges and pledge matching, co-campaign tools, budgets and milestone payouts, ticketing-partner integrations, reconciliation, cases and appeals (§9) |
| **4. Marketplace** | Venue and Service provider portals, listings, availability, quotes and bids, engagements, reviews, endorsements, reputation |
| **5. Show Builder** | Format templates and "Build my show team" |
| **6. Ticketing** | Native tickets, check-in, post-show surveys |

Formats beyond concerts, orchestral and theatre can be switched on at any phase once their templates, genres and compliance rules are ready.
