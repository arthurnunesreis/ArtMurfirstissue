import { POLICIES } from "./policies";
import type { Action, Actor, Decision, Resource } from "./types";

/**
 * The single place permission decisions are made (CLAUDE.md principle 8).
 * Default deny: an unknown action, or a policy that throws, is refused.
 */
export function decide(actor: Actor, action: Action, resource?: Resource): Decision {
  const policy = Object.hasOwn(POLICIES, action) ? POLICIES[action] : undefined;
  if (!policy) return { allowed: false, reason: "no-policy" };
  try {
    return policy(actor, resource);
  } catch {
    return { allowed: false, reason: "no-policy" };
  }
}

export function can(actor: Actor, action: Action, resource?: Resource): boolean {
  return decide(actor, action, resource).allowed;
}
