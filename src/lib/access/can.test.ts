import { describe, expect, it } from "vitest";
import { Role, Stakeholder, SuggestionStatus } from "@/generated/prisma/enums";
import { POLICIES } from "./policies";
import { ACTIONS, ANONYMOUS, can, decide, type Action, type Actor, type Resource } from "./index";

// ── Actors ───────────────────────────────────────────────────────
const fan: Actor = {
  kind: "user",
  userId: "fan-1",
  role: Role.USER,
  emailVerified: true,
  stakeholderRoles: [Stakeholder.FAN],
};
const unverified: Actor = { ...fan, userId: "fan-2", emailVerified: false };
const venueOwner: Actor = {
  ...fan,
  userId: "venue-1",
  stakeholderRoles: [Stakeholder.FAN, Stakeholder.PROVIDER],
};
const admin: Actor = { ...fan, userId: "admin-1", role: Role.ADMIN };
const anon = ANONYMOUS;

// ── Resources ────────────────────────────────────────────────────
const suggestion = (
  status: SuggestionStatus = SuggestionStatus.OPEN,
  hidden = false,
): Resource => ({
  type: "suggestion",
  status,
  hidden,
});
const pledgeOf = (ownerId: string, status: SuggestionStatus = SuggestionStatus.OPEN): Resource => ({
  type: "pledge",
  ownerId,
  suggestionStatus: status,
});
const participation = (
  as: Stakeholder,
  status: SuggestionStatus = SuggestionStatus.OPEN,
  hidden = false,
): Resource => ({ type: "participation", as, suggestionStatus: status, hidden });

const { OPEN, THRESHOLD_MET, EXPIRED, CANCELLED, CONFIRMED } = SuggestionStatus;

type Case = [
  label: string,
  actor: Actor,
  action: Action,
  resource: Resource | undefined,
  allowed: boolean,
  reason?: string,
];

const cases: Case[] = [
  // Viewing
  ["anyone views an open show", anon, "suggestion.view", suggestion(), true],
  [
    "anyone is refused a hidden show",
    anon,
    "suggestion.view",
    suggestion(OPEN, true),
    false,
    "hidden",
  ],
  [
    "a fan is refused a hidden show",
    fan,
    "suggestion.view",
    suggestion(OPEN, true),
    false,
    "hidden",
  ],
  ["an admin sees a hidden show", admin, "suggestion.view", suggestion(OPEN, true), true],
  [
    "anyone views a visible performer",
    anon,
    "performer.view",
    { type: "performer", hidden: false },
    true,
  ],
  [
    "nobody but admins sees a hidden performer",
    fan,
    "performer.view",
    { type: "performer", hidden: true },
    false,
    "hidden",
  ],

  // Profile
  [
    "a person updates their own profile",
    fan,
    "profile.update",
    { type: "user", userId: "fan-1" },
    true,
  ],
  [
    "a person can't update someone else's profile",
    fan,
    "profile.update",
    { type: "user", userId: "fan-2" },
    false,
    "not-owner",
  ],
  [
    "a visitor can't update a profile",
    anon,
    "profile.update",
    { type: "user", userId: "fan-1" },
    false,
    "sign-in-required",
  ],

  // Follows
  ["a signed-in person follows", unverified, "follow.create", undefined, true],
  ["a visitor can't follow", anon, "follow.create", undefined, false, "sign-in-required"],

  // Proposing
  ["a verified person proposes a show", fan, "suggestion.propose", undefined, true],
  [
    "an unverified person can't propose",
    unverified,
    "suggestion.propose",
    undefined,
    false,
    "email-not-verified",
  ],
  ["a visitor can't propose", anon, "suggestion.propose", undefined, false, "sign-in-required"],

  // Pledging
  ["a verified fan pledges to an open show", fan, "pledge.create", suggestion(OPEN), true],
  [
    "pledging continues after the target is met",
    fan,
    "pledge.create",
    suggestion(THRESHOLD_MET),
    true,
  ],
  ["no pledging on an expired show", fan, "pledge.create", suggestion(EXPIRED), false, "not-open"],
  [
    "no pledging on a cancelled show",
    fan,
    "pledge.create",
    suggestion(CANCELLED),
    false,
    "not-open",
  ],
  ["no pledging on a hidden show", fan, "pledge.create", suggestion(OPEN, true), false, "hidden"],
  [
    "an unverified person can't pledge",
    unverified,
    "pledge.create",
    suggestion(),
    false,
    "email-not-verified",
  ],
  ["a visitor can't pledge", anon, "pledge.create", suggestion(), false, "sign-in-required"],
  ["pledging needs the show's facts", fan, "pledge.create", undefined, false, "missing-resource"],

  // Changing and withdrawing a pledge
  ["the owner changes their pledge", fan, "pledge.update", pledgeOf("fan-1"), true],
  [
    "someone else can't change it",
    venueOwner,
    "pledge.update",
    pledgeOf("fan-1"),
    false,
    "not-owner",
  ],
  [
    "even an admin can't change a fan's pledge",
    admin,
    "pledge.update",
    pledgeOf("fan-1"),
    false,
    "not-owner",
  ],
  [
    "the owner withdraws while the show is open",
    fan,
    "pledge.withdraw",
    pledgeOf("fan-1", OPEN),
    true,
  ],
  [
    "no withdrawing once the target is met",
    fan,
    "pledge.withdraw",
    pledgeOf("fan-1", THRESHOLD_MET),
    false,
    "not-open",
  ],
  [
    "no withdrawing once confirmed",
    fan,
    "pledge.withdraw",
    pledgeOf("fan-1", CONFIRMED),
    false,
    "not-open",
  ],
  [
    "someone else can't withdraw it",
    venueOwner,
    "pledge.withdraw",
    pledgeOf("fan-1"),
    false,
    "not-owner",
  ],

  // Participation
  [
    "a venue offers to take part in a role it holds",
    venueOwner,
    "participation.create",
    participation(Stakeholder.PROVIDER),
    true,
  ],
  [
    "a fan can't claim a role they don't hold",
    fan,
    "participation.create",
    participation(Stakeholder.SPONSOR),
    false,
    "role-not-held",
  ],
  [
    "fans pledge rather than 'participate'",
    venueOwner,
    "participation.create",
    participation(Stakeholder.FAN),
    false,
    "fans-pledge-instead",
  ],
  [
    "no participation on an expired show",
    venueOwner,
    "participation.create",
    participation(Stakeholder.PROVIDER, EXPIRED),
    false,
    "not-open",
  ],
  [
    "no participation on a hidden show",
    venueOwner,
    "participation.create",
    participation(Stakeholder.PROVIDER, OPEN, true),
    false,
    "hidden",
  ],
  [
    "participation needs a verified email",
    { ...venueOwner, emailVerified: false },
    "participation.create",
    participation(Stakeholder.PROVIDER),
    false,
    "email-not-verified",
  ],

  // Creating content
  ["a verified person adds a performer", fan, "performer.create", undefined, true],
  [
    "an unverified person can't add a performer",
    unverified,
    "performer.create",
    undefined,
    false,
    "email-not-verified",
  ],
  ["a verified person uploads media", fan, "media.upload", undefined, true],
  ["a visitor can't upload media", anon, "media.upload", undefined, false, "sign-in-required"],

  // Portals
  ["a signed-in person reaches the portals page", fan, "hub.access", undefined, true],
  ["a visitor can't", anon, "hub.access", undefined, false, "sign-in-required"],
];

// Every admin action: allowed for admins, refused for everyone else.
const ADMIN_ACTIONS: Action[] = [
  "admin.access",
  "suggestion.hide",
  "suggestion.cancel",
  "performer.hide",
  "performer.merge",
  "media.hide",
  "threshold.edit",
  "participation.review",
];
for (const action of ADMIN_ACTIONS) {
  cases.push([`an admin may ${action}`, admin, action, undefined, true]);
  cases.push([`a fan may not ${action}`, fan, action, undefined, false, "admin-only"]);
  cases.push([
    `a stakeholder may not ${action}`,
    venueOwner,
    action,
    undefined,
    false,
    "admin-only",
  ]);
  cases.push([`a visitor may not ${action}`, anon, action, undefined, false, "sign-in-required"]);
}

describe("can()", () => {
  it.each(cases)("%s", (_label, actor, action, resource, allowed, reason) => {
    const decision = decide(actor, action, resource);
    expect(decision.allowed).toBe(allowed);
    expect(can(actor, action, resource)).toBe(allowed);
    if (!allowed && reason) expect(decision).toEqual({ allowed: false, reason });
  });
});

describe("default deny", () => {
  it("has a policy for every action and nothing else", () => {
    expect(Object.keys(POLICIES).sort()).toEqual([...ACTIONS].sort());
  });

  it("refuses an action it doesn't know", () => {
    expect(decide(admin, "launch.rockets" as Action)).toEqual({
      allowed: false,
      reason: "no-policy",
    });
    expect(decide(admin, "toString" as Action)).toEqual({ allowed: false, reason: "no-policy" });
  });

  it("refuses anything a visitor tries except public reading", () => {
    const publicReads: Action[] = ["suggestion.view", "performer.view"];
    for (const action of ACTIONS) {
      if (publicReads.includes(action)) continue;
      expect(can(anon, action, suggestion()), action).toBe(false);
    }
  });

  it("refuses when given the wrong kind of resource", () => {
    expect(decide(fan, "pledge.create", pledgeOf("fan-1"))).toEqual({
      allowed: false,
      reason: "missing-resource",
    });
  });
});
