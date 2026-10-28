import { PerformerKind, ShowFormat } from "@/generated/prisma/enums";

/**
 * The show formats and performer kinds switched on in this phase.
 * Every form, filter and validator reads from here; nothing else hard-codes the list.
 * To switch a format on later: add it here, seed its genres, and write its copy.
 */
export const ENABLED_FORMATS = [
  ShowFormat.CONCERT,
  ShowFormat.ORCHESTRAL,
  ShowFormat.THEATRE,
] as const satisfies readonly ShowFormat[];

export const ENABLED_PERFORMER_KINDS = [
  PerformerKind.SOLO_ARTIST,
  PerformerKind.BAND,
  PerformerKind.ORCHESTRA,
  PerformerKind.ENSEMBLE,
  PerformerKind.THEATRE_COMPANY,
  PerformerKind.PRODUCTION,
] as const satisfies readonly PerformerKind[];

export type EnabledFormat = (typeof ENABLED_FORMATS)[number];
export type EnabledPerformerKind = (typeof ENABLED_PERFORMER_KINDS)[number];

/** Music is the anchor: it's the default in forms and leads discovery. */
export const DEFAULT_FORMAT: EnabledFormat = ShowFormat.CONCERT;

export function isEnabledFormat(value: unknown): value is EnabledFormat {
  return (ENABLED_FORMATS as readonly unknown[]).includes(value);
}

export function isEnabledPerformerKind(value: unknown): value is EnabledPerformerKind {
  return (ENABLED_PERFORMER_KINDS as readonly unknown[]).includes(value);
}

/** User-facing labels. Logic never branches on these strings. */
export const FORMAT_LABELS: Record<EnabledFormat, string> = {
  CONCERT: "Music",
  ORCHESTRAL: "Orchestra",
  THEATRE: "Theatre",
};

/** How copy refers to a performer of each kind ("Bring the band to…"). */
export const PERFORMER_KIND_NOUNS: Record<EnabledPerformerKind, string> = {
  SOLO_ARTIST: "artist",
  BAND: "band",
  ORCHESTRA: "orchestra",
  ENSEMBLE: "ensemble",
  THEATRE_COMPANY: "company",
  PRODUCTION: "production",
};
