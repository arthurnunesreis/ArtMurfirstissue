import { describe, expect, it } from "vitest";
import { PerformerKind, ShowFormat } from "@/generated/prisma/enums";
import {
  DEFAULT_FORMAT,
  ENABLED_FORMATS,
  ENABLED_PERFORMER_KINDS,
  FORMAT_LABELS,
  PERFORMER_KIND_NOUNS,
  isEnabledFormat,
  isEnabledPerformerKind,
} from "./formats";

describe("enabled formats", () => {
  it("enables exactly concert, orchestral and theatre in Phase 1", () => {
    expect([...ENABLED_FORMATS].sort()).toEqual(["CONCERT", "ORCHESTRAL", "THEATRE"]);
  });

  it("defaults to music", () => {
    expect(DEFAULT_FORMAT).toBe(ShowFormat.CONCERT);
  });

  it("only enables values that exist in the schema", () => {
    for (const f of ENABLED_FORMATS) expect(Object.values(ShowFormat)).toContain(f);
    for (const k of ENABLED_PERFORMER_KINDS) expect(Object.values(PerformerKind)).toContain(k);
  });

  it("rejects later-phase formats and junk", () => {
    expect(isEnabledFormat(ShowFormat.EXHIBITION_MATCH)).toBe(false);
    expect(isEnabledFormat(ShowFormat.COMEDY)).toBe(false);
    expect(isEnabledFormat("concert")).toBe(false);
    expect(isEnabledFormat(undefined)).toBe(false);
    expect(isEnabledFormat(ShowFormat.THEATRE)).toBe(true);
  });

  it("rejects later-phase performer kinds", () => {
    expect(isEnabledPerformerKind(PerformerKind.ATHLETE)).toBe(false);
    expect(isEnabledPerformerKind(PerformerKind.BAND)).toBe(true);
  });

  it("has a label for every enabled format and noun for every enabled kind", () => {
    for (const f of ENABLED_FORMATS) expect(FORMAT_LABELS[f]).toBeTruthy();
    for (const k of ENABLED_PERFORMER_KINDS) expect(PERFORMER_KIND_NOUNS[k]).toBeTruthy();
  });
});
