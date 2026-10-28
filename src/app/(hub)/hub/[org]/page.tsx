import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { PortalsComingSoon } from "../coming-soon";

export const metadata: Metadata = { title: "Portals" };

/** Organisation portals arrive in Phase 2 (USERS-AND-ACCESS.md §2.3). */
export default async function OrgHubPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  const { user } = await requireUser({ returnTo: `/hub/${encodeURIComponent(org)}` });
  return <PortalsComingSoon roles={user.stakeholderRoles} />;
}
