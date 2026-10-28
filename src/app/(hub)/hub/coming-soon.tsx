import { PageShell } from "@/components/page-shell";
import { PORTAL_ROLES, STAKEHOLDER_LABELS } from "@/config/stakeholders";
import type { Stakeholder } from "@/generated/prisma/enums";

export function PortalsComingSoon({ roles }: { roles: readonly Stakeholder[] }) {
  const portalRoles = roles.filter((r) => PORTAL_ROLES.includes(r));
  return (
    <PageShell>
      <h1 className="font-display mb-4 text-5xl font-black uppercase">Portals are coming</h1>
      <p className="mb-6 text-lg">
        Performers, organisers, sponsors and venues will each get their own portal: a dashboard,
        tools to work together on a show, and a track record that builds with every show.
      </p>
      {portalRoles.length > 0 ? (
        <p className="border-line bg-surface rounded-md border p-4" data-testid="waitlist">
          You&apos;re on the waitlist as{" "}
          {portalRoles.map((r) => STAKEHOLDER_LABELS[r].toLowerCase()).join(", ")}. We&apos;ll email
          you when your portal opens.
        </p>
      ) : (
        <p className="text-muted">
          Run a venue, an act or a brand? Add that role on your profile to join the waitlist.
        </p>
      )}
    </PageShell>
  );
}
