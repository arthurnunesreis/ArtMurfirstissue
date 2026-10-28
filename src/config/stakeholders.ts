import { Stakeholder } from "@/generated/prisma/enums";

/** How each role is named to people, in the order onboarding shows them. */
export const STAKEHOLDER_OPTIONS: readonly { value: Stakeholder; label: string; hint: string }[] = [
  { value: Stakeholder.FAN, label: "A fan", hint: "Propose and back the shows you want" },
  {
    value: Stakeholder.PERFORMER,
    label: "A performer or their team",
    hint: "Artists, bands, orchestras, companies and managers",
  },
  { value: Stakeholder.ORGANIZER, label: "An organiser or promoter", hint: "You put on events" },
  { value: Stakeholder.SPONSOR, label: "A sponsor", hint: "A brand or business backing shows" },
  {
    value: Stakeholder.PROVIDER,
    label: "A venue or event service",
    hint: "Venues, sound, staging, security, ticketing and more",
  },
];

export const STAKEHOLDER_LABELS = Object.fromEntries(
  STAKEHOLDER_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Stakeholder, string>;

/** Roles that will get a portal in Phase 2. */
export const PORTAL_ROLES: readonly Stakeholder[] = [
  Stakeholder.PERFORMER,
  Stakeholder.ORGANIZER,
  Stakeholder.SPONSOR,
  Stakeholder.PROVIDER,
];
