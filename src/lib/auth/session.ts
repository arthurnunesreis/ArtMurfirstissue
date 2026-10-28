import "server-only";
import { notFound, redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import {
  ANONYMOUS,
  decide,
  type Action,
  type Actor,
  type Resource,
  type SignedInActor,
} from "@/lib/access";

export type SessionUser = Session["user"];

export function actorFrom(user: SessionUser | undefined | null): Actor {
  if (!user) return ANONYMOUS;
  return {
    kind: "user",
    userId: user.id,
    role: user.role,
    emailVerified: user.verified,
    stakeholderRoles: user.stakeholderRoles,
  };
}

/** The current visitor as an Actor, for passing to can(). */
export async function getActor(): Promise<Actor> {
  const session = await auth();
  return actorFrom(session?.user);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  return (await auth())?.user ?? null;
}

/**
 * For pages and actions that need a signed-in person. Sends visitors to sign in, and
 * people who haven't finished onboarding to /welcome (unless this is /welcome).
 */
export async function requireUser(
  options: { returnTo?: string; allowNotOnboarded?: boolean } = {},
): Promise<{ user: SessionUser; actor: SignedInActor }> {
  const user = await getSessionUser();
  if (!user) {
    const callbackUrl = options.returnTo ?? "/me";
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  if (!user.onboarded && !options.allowNotOnboarded) redirect("/welcome");
  return { user, actor: actorFrom(user) as SignedInActor };
}

/** Admin pages: everyone else gets a plain 404, so the area isn't advertised. */
export async function requireAdmin(): Promise<{ user: SessionUser; actor: SignedInActor }> {
  const user = await getSessionUser();
  if (!user || !decide(actorFrom(user), "admin.access").allowed) notFound();
  return { user, actor: actorFrom(user) as SignedInActor };
}

/** For Server Actions: throws a typed error instead of redirecting. */
export class AccessDeniedError extends Error {
  constructor(
    public readonly action: Action,
    public readonly reason: string,
  ) {
    super(`Not allowed to ${action}: ${reason}`);
  }
}

export async function assertCan(action: Action, resource?: Resource): Promise<Actor> {
  const actor = await getActor();
  const decision = decide(actor, action, resource);
  if (!decision.allowed) throw new AccessDeniedError(action, decision.reason);
  return actor;
}
