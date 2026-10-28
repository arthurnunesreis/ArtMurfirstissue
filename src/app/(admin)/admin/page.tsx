import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

/** Admin console. Task 13 adds moderation, threshold edits and merges. */
export default async function AdminPage() {
  await requireAdmin();
  const [users, regions, genres] = await Promise.all([
    db.user.count(),
    db.region.count(),
    db.genre.count(),
  ]);
  return (
    <PageShell>
      <h1 className="font-display mb-6 text-5xl font-black uppercase">Admin</h1>
      <dl className="grid grid-cols-3 gap-4 tabular-nums">
        {[
          ["People", users],
          ["Cities", regions],
          ["Genres", genres],
        ].map(([label, value]) => (
          <div key={label} className="border-line bg-surface rounded-lg border p-4">
            <dt className="text-muted text-sm">{label}</dt>
            <dd className="font-display text-4xl font-extrabold">{value}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
