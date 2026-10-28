import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/page-shell";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Welcome" };

export default async function WelcomePage() {
  const { user } = await requireUser({ allowNotOnboarded: true, returnTo: "/welcome" });
  if (user.onboarded) redirect("/me");

  const regions = await db.region.findMany({
    where: { active: true },
    orderBy: [{ countryCode: "asc" }, { name: "asc" }],
    select: { id: true, name: true, countryCode: true, defaultCurrency: true },
  });
  const countryName = new Intl.DisplayNames(["en"], { type: "region" });
  const currencyName = new Intl.DisplayNames(["en"], { type: "currency" });
  const currencies = Intl.supportedValuesOf("currency")
    .map((code) => ({ code, name: currencyName.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <PageShell width="max-w-xl">
      <h1 className="font-display mb-2 text-5xl font-black uppercase">Welcome</h1>
      <p className="text-muted mb-8 text-lg">A few details so we can show you the right shows.</p>
      <OnboardingForm
        defaultName={user.name ?? ""}
        defaultRoles={user.stakeholderRoles}
        regions={regions
          .map((r) => ({
            id: r.id,
            name: r.name,
            country: countryName.of(r.countryCode) ?? r.countryCode,
            defaultCurrency: r.defaultCurrency,
          }))
          .sort((a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name))}
        currencies={currencies}
      />
    </PageShell>
  );
}
