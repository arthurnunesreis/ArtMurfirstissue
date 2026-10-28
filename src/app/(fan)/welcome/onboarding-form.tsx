"use client";

import { useActionState, useState } from "react";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui";
import { STAKEHOLDER_OPTIONS } from "@/config/stakeholders";
import type { Stakeholder } from "@/generated/prisma/enums";
import { completeOnboarding, type OnboardingState } from "./actions";

type RegionOption = { id: string; name: string; country: string; defaultCurrency: string };
type CurrencyOption = { code: string; name: string };

export function OnboardingForm(props: {
  defaultName: string;
  defaultRoles: Stakeholder[];
  regions: RegionOption[];
  currencies: CurrencyOption[];
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboarding,
    {},
  );
  const [regionId, setRegionId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [currencyTouched, setCurrencyTouched] = useState(false);

  const byCountry = new Map<string, RegionOption[]>();
  for (const r of props.regions) byCountry.set(r.country, [...(byCountry.get(r.country) ?? []), r]);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="flex flex-col gap-7" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className={labelClass}>
          Your name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          defaultValue={props.defaultName}
          className={inputClass}
          aria-invalid={Boolean(errors.name)}
        />
        {errors.name ? <FieldError>{errors.name}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="homeRegionId" className={labelClass}>
          Home city
        </label>
        <select
          id="homeRegionId"
          name="homeRegionId"
          value={regionId}
          onChange={(e) => {
            setRegionId(e.target.value);
            const region = props.regions.find((r) => r.id === e.target.value);
            if (region && !currencyTouched) setCurrency(region.defaultCurrency);
          }}
          className={inputClass}
          aria-invalid={Boolean(errors.homeRegionId)}
        >
          <option value="" disabled>
            Choose a city
          </option>
          {[...byCountry].map(([country, regions]) => (
            <optgroup key={country} label={country}>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-muted text-sm">
          We&apos;ll show you shows proposed near here. Your city not listed yet? Pick the closest
          one.
        </p>
        {errors.homeRegionId ? <FieldError>{errors.homeRegionId}</FieldError> : null}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="preferredCurrency" className={labelClass}>
          Show prices in
        </label>
        <select
          id="preferredCurrency"
          name="preferredCurrency"
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            setCurrencyTouched(true);
          }}
          className={inputClass}
        >
          {props.currencies.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        <p className="text-muted text-sm">
          Shows keep their own currency; we&apos;ll add an approximate amount in yours.
        </p>
        {errors.preferredCurrency ? <FieldError>{errors.preferredCurrency}</FieldError> : null}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`${labelClass} mb-2`}>I&apos;m here as…</legend>
        <p className="text-muted -mt-1 mb-1 text-sm">
          Choose all that apply. You can change this later.
        </p>
        {STAKEHOLDER_OPTIONS.map((o) => (
          <label
            key={o.value}
            className="border-line bg-surface has-[:checked]:border-ink flex cursor-pointer items-start gap-3 rounded-md border p-3"
          >
            <input
              type="checkbox"
              name="stakeholderRoles"
              value={o.value}
              defaultChecked={props.defaultRoles.includes(o.value)}
              className="accent-ink mt-1 size-4"
            />
            <span>
              <span className="block font-bold">{o.label}</span>
              <span className="text-muted block text-sm">{o.hint}</span>
            </span>
          </label>
        ))}
        {errors.stakeholderRoles ? <FieldError>{errors.stakeholderRoles}</FieldError> : null}
      </fieldset>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="text-sm text-red-700 dark:text-red-300">
      {children}
    </p>
  );
}
