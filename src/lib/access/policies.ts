import { Role, Stakeholder, SuggestionStatus } from "@/generated/prisma/enums";
import type { Action, Actor, Decision, DenyReason, Resource, SignedInActor } from "./types";

const ALLOW: Decision = { allowed: true };
const deny = (reason: DenyReason): Decision => ({ allowed: false, reason });

type Policy = (actor: Actor, resource: Resource | undefined) => Decision;

// ── Building blocks ──────────────────────────────────────────────

const isUser = (a: Actor): a is SignedInActor => a.kind === "user";
const isAdmin = (a: Actor) => isUser(a) && a.role === Role.ADMIN;

/** Signed in, and (optionally) with a verified email. */
function signedIn(actor: Actor, { verified = false } = {}): Decision {
  if (!isUser(actor)) return deny("sign-in-required");
  if (verified && !actor.emailVerified) return deny("email-not-verified");
  return ALLOW;
}

const adminOnly: Policy = (actor) => {
  if (!isUser(actor)) return deny("sign-in-required");
  return isAdmin(actor) ? ALLOW : deny("admin-only");
};

/** Statuses in which people can still back a Suggestion. */
const BACKABLE: readonly SuggestionStatus[] = [
  SuggestionStatus.OPEN,
  SuggestionStatus.THRESHOLD_MET,
];

function resourceOf<T extends Resource["type"]>(
  resource: Resource | undefined,
  type: T,
): Extract<Resource, { type: T }> | undefined {
  return resource?.type === type ? (resource as Extract<Resource, { type: T }>) : undefined;
}

// ── Policies, one per action ─────────────────────────────────────

export const POLICIES: Record<Action, Policy> = {
  "suggestion.view": (actor, resource) => {
    const s = resourceOf(resource, "suggestion");
    if (!s) return deny("missing-resource");
    if (s.hidden && !isAdmin(actor)) return deny("hidden");
    return ALLOW;
  },

  "performer.view": (actor, resource) => {
    const p = resourceOf(resource, "performer");
    if (!p) return deny("missing-resource");
    if (p.hidden && !isAdmin(actor)) return deny("hidden");
    return ALLOW;
  },

  "profile.update": (actor, resource) => {
    const u = resourceOf(resource, "user");
    if (!u) return deny("missing-resource");
    const d = signedIn(actor);
    if (!d.allowed) return d;
    return (actor as SignedInActor).userId === u.userId ? ALLOW : deny("not-owner");
  },

  "follow.create": (actor) => signedIn(actor),
  "follow.delete": (actor) => signedIn(actor),

  "suggestion.propose": (actor) => signedIn(actor, { verified: true }),

  "pledge.create": (actor, resource) => {
    const s = resourceOf(resource, "suggestion");
    if (!s) return deny("missing-resource");
    const d = signedIn(actor, { verified: true });
    if (!d.allowed) return d;
    if (s.hidden) return deny("hidden");
    return BACKABLE.includes(s.status) ? ALLOW : deny("not-open");
  },

  "pledge.update": (actor, resource) => {
    const p = resourceOf(resource, "pledge");
    if (!p) return deny("missing-resource");
    const d = signedIn(actor, { verified: true });
    if (!d.allowed) return d;
    if ((actor as SignedInActor).userId !== p.ownerId) return deny("not-owner");
    return BACKABLE.includes(p.suggestionStatus) ? ALLOW : deny("not-open");
  },

  // Withdrawing is only possible while the show is still collecting support.
  "pledge.withdraw": (actor, resource) => {
    const p = resourceOf(resource, "pledge");
    if (!p) return deny("missing-resource");
    const d = signedIn(actor);
    if (!d.allowed) return d;
    if ((actor as SignedInActor).userId !== p.ownerId) return deny("not-owner");
    return p.suggestionStatus === SuggestionStatus.OPEN ? ALLOW : deny("not-open");
  },

  // Non-money participation: only in a role the person has declared, and never as a fan.
  "participation.create": (actor, resource) => {
    const p = resourceOf(resource, "participation");
    if (!p) return deny("missing-resource");
    const d = signedIn(actor, { verified: true });
    if (!d.allowed) return d;
    if (p.hidden) return deny("hidden");
    if (!BACKABLE.includes(p.suggestionStatus)) return deny("not-open");
    if (p.as === Stakeholder.FAN) return deny("fans-pledge-instead");
    return (actor as SignedInActor).stakeholderRoles.includes(p.as) ? ALLOW : deny("role-not-held");
  },

  "performer.create": (actor) => signedIn(actor, { verified: true }),
  "media.upload": (actor) => signedIn(actor, { verified: true }),

  "hub.access": (actor) => signedIn(actor),

  "admin.access": adminOnly,
  "suggestion.hide": adminOnly,
  "suggestion.cancel": adminOnly,
  "performer.hide": adminOnly,
  "performer.merge": adminOnly,
  "media.hide": adminOnly,
  "threshold.edit": adminOnly,
  "participation.review": adminOnly,
};
