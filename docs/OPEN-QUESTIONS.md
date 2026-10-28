# Open questions

Product decisions still needed. Claude Code: add new questions here rather than guessing; don't block unrelated tasks.

1. **Default thresholds.** What target amount, minimum pledger count and deadline should a new Suggestion get, per format (a band, an orchestra and a theatre production cost very different amounts) and per region? (Placeholder values in `src/config/thresholds.ts` until decided.) Long-term, thresholds should come from the artist's Offer or an admin estimate of the real booking cost.
2. **Suggestion currency.** Default is the Region's currency. Should every Suggestion use USD instead, for simplicity, with local currency shown as an approximation?
3. **Pledge limits.** Minimum and maximum pledge per currency?
4. **What happens at THRESHOLD_MET in Phase 1?** Proposal: admin is notified and contacts the performers' management manually; backers get "We're reaching out to {performer}'s team".
5. **Legal entity for payments.** Stripe needs an entity in a supported country (US via Atlas, or UK). Which, and when? Needed before Phase 3.
6. **Performer name/image rights.** User-created performer profiles use the performer's name and images. Policy: fans upload images they have rights to, embeds preferred; artists can request takedown or claim. Confirm before launch.
7. **Pledge-to-payment conversion rate.** Soft pledges will convert at less than 100%. Should thresholds be inflated (e.g. ×1.5) to compensate?
8. **Launch markets.** Which cities/regions does HiveConcerts launch in first? Determines the seeded Regions, default currencies and which regional payment rails come after Stripe.
9. **Verifying roles.** In Phase 1 anyone can say they're a performer, organiser, sponsor or venue, and the page labels it as self-declared. What proof unlocks a verified badge in Phase 2 (official social account link, email from the act's domain, manual review)?
10. **Exhibition matches and competitions.** When these formats are switched on, which jurisdictions come first, and who handles licensing and sanctioning approvals (HiveConcerts, or a licensed promoter who takes the booking)? Combat events generally need approvals even when outside professional leagues.
11. **Official social accounts.** Which handles to secure now (Instagram, TikTok, X, Facebook, YouTube, Threads)? Needed for the share images' footer and for Phase 2 auto-posting.
12. ~~**Revenue from stakeholders.**~~ **Decided:** success fee on confirmed shows plus a commission from everyone paid through the platform, including performers, with a 10% cap per show; fan booking fee; sponsorship fee; lower commission on brought-in deals; subscriptions and insights. See USERS-AND-ACCESS.md §11. Rates are starting points.
13. **Public reputation.** USERS-AND-ACCESS.md §7.5 proposes the public sees a summary (rating, number of shows, badges, short excerpts) and verified stakeholders see everything. Confirm.
14. ~~**Disputes.**~~ **Decided:** cases opened by staff (later flagged by AI first), parties respond before a decision, graduated sanctions only when proven, appeals reviewed by a different person. See USERS-AND-ACCESS.md §9.4. Still open: target response times, and whether outside mediation is offered for large disputes.
15. ~~**Money between stakeholders.**~~ **Decided:** all show money runs through the platform where possible, via a marketplace payment product; partner ticketing and gate sales are monitored through integrations, declared reports, representatives and cross-checks. See USERS-AND-ACCESS.md §9.
16. **Show Builder minimum supply.** How many verified providers per category does a city need before "Build my show team" is switched on there?
17. **Payments regulation.** Before Phase 3: confirm with a payments lawyer how long fan money may be held before an event in launch markets, refund obligations on cancellation, and whether marketplace split payments through the processor are enough to avoid needing a payments licence of HiveConcerts' own.
18. **Representatives.** Are HiveConcerts representatives staff, contractors, or vetted local stakeholders paid per show? How are they themselves checked?
19. **Surplus split.** When a show raises more than its full cost, what shares go to the performer or show owner, the top-up fund for shows that fall just short, and HiveConcerts?
20. **Booking-agency licensing.** In some places, finding paid work for performers requires a talent or employment agency licence, and agency fees are capped. Before matching performers to paid deals (Phase 2–3), check whether HiveConcerts' matching and performer commission fall under those rules in launch markets, and structure accordingly.
21. **Non-circumvention period.** How long should repeat business between parties HiveConcerts introduced stay on the platform (12 months proposed), and what happens if it doesn't?
