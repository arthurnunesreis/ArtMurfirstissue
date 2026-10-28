import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { PORTAL_ROLES, STAKEHOLDER_LABELS } from "@/config/stakeholders";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "My HiveConcerts" };

/** The fan area. Task 12 fills it with pledges, shows and follows. */
export default async function MePage() {
  const { user } = await requireUser({ returnTo: "/me" });
  const region = user.homeRegionId
    ? await db.region.findUnique({ where: { id: user.homeRegionId }, select: { name: true } })
    : null;
  const hasPortalRole = user.stakeholderRoles.some((r) => PORTAL_ROLES.includes(r));

  return (
    <PageShell>
      <h1 className="font-display mb-6 text-5xl font-black uppercase">
        Hi {user.name?.split(" ")[0] ?? "there"}
      </h1>

      <dl className="border-line bg-surface grid gap-x-4 gap-y-1 rounded-lg border p-5 sm:grid-cols-[10rem_1fr] sm:gap-y-4 [&>dt:not(:first-child)]:mt-4 sm:[&>dt:not(:first-child)]:mt-0">
        <dt className="text-muted text-sm">Home city</dt>
        <dd data-testid="home-city">{region?.name ?? "Not set"}</dd>
        <dt className="text-muted text-sm">Prices shown in</dt>
        <dd>{user.preferredCurrency}</dd>
        <dt className="text-muted text-sm">Here as</dt>
        <dd>
          <ul className="flex flex-wrap gap-2" data-testid="roles">
            {user.stakeholderRoles.map((r) => (
              <li key={r} className="border-line rounded-full border px-3 py-0.5 text-sm">
                {STAKEHOLDER_LABELS[r]}
              </li>
            ))}
          </ul>
        </dd>
        <dt className="text-muted text-sm">Email</dt>
        <dd className="break-all">
          {user.email}
          {user.verified ? null : (
            <span className="text-muted block text-sm">
              Not verified yet. Sign in with an email link to verify it.
            </span>
          )}
        </dd>
      </dl>

      <section className="mt-10 flex flex-col gap-2">
        <h2 className="text-xl font-bold">Your shows</h2>
        <p className="text-muted">
          Shows you propose and back will appear here. Proposing opens soon.
        </p>
      </section>

      {hasPortalRole ? (
        <section className="mt-10 flex flex-col gap-2">
          <h2 className="text-xl font-bold">Your portal</h2>
          <p className="text-muted">
            Portals for performers, organisers, sponsors and venues are coming.{" "}
            <Link href="/hub" className="text-ink underline underline-offset-4">
              See what&apos;s planned
            </Link>
            .
          </p>
        </section>
      ) : null}
    </PageShell>
  );
}
