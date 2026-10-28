import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { PortalsComingSoon } from "./coming-soon";

export const metadata: Metadata = { title: "Portals" };

export default async function HubPage() {
  const { user } = await requireUser({ returnTo: "/hub" });
  return <PortalsComingSoon roles={user.stakeholderRoles} />;
}
