import type { Role, Stakeholder, SuggestionStatus } from "@/generated/prisma/enums";

/** Who is acting. Phase 1 actors are anonymous visitors or signed-in people acting as themselves. */
export type Actor =
  | { kind: "anonymous" }
  | {
      kind: "user";
      userId: string;
      role: Role;
      emailVerified: boolean;
      /** Self-declared in Phase 1; verified per organisation from Phase 2. */
      stakeholderRoles: readonly Stakeholder[];
      /** Acting on behalf of an organisation (Phase 2 portals). Unused in Phase 1. */
      org?: { orgId: string; orgRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" };
    };

export type SignedInActor = Extract<Actor, { kind: "user" }>;

export const ANONYMOUS: Actor = { kind: "anonymous" };

/** The facts about a thing that a decision needs. Callers load these; policies never query. */
export type Resource =
  | { type: "suggestion"; status: SuggestionStatus; hidden: boolean }
  | { type: "pledge"; ownerId: string; suggestionStatus: SuggestionStatus }
  | { type: "participation"; as: Stakeholder; suggestionStatus: SuggestionStatus; hidden: boolean }
  | { type: "user"; userId: string }
  | { type: "performer"; hidden: boolean }
  | { type: "media"; hidden: boolean };

/** Every action Phase 1 performs. Adding a feature means adding its action and policy here. */
export const ACTIONS = [
  // Public reading
  "suggestion.view",
  "performer.view",
  // Fan area
  "profile.update",
  "follow.create",
  "follow.delete",
  // Demand
  "suggestion.propose",
  "pledge.create",
  "pledge.update",
  "pledge.withdraw",
  "participation.create",
  "performer.create",
  "media.upload",
  // Portals (Phase 2 shows a coming-soon page)
  "hub.access",
  // Admin
  "admin.access",
  "suggestion.hide",
  "suggestion.cancel",
  "performer.hide",
  "performer.merge",
  "media.hide",
  "threshold.edit",
  "participation.review",
] as const;

export type Action = (typeof ACTIONS)[number];

export type Decision = { allowed: true } | { allowed: false; reason: DenyReason };

export type DenyReason =
  | "sign-in-required"
  | "email-not-verified"
  | "not-owner"
  | "admin-only"
  | "not-open"
  | "hidden"
  | "role-not-held"
  | "fans-pledge-instead"
  | "missing-resource"
  | "no-policy";
