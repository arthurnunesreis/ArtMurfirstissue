import { describe, expect, it } from "vitest";
import { isAuthorizedCronRequest } from "./cron";

const req = (authorization?: string) =>
  new Request("https://hiveconcerts.com/api/cron/fx", {
    headers: authorization ? { authorization } : {},
  });

describe("isAuthorizedCronRequest", () => {
  it("accepts the right bearer token", () => {
    expect(isAuthorizedCronRequest(req("Bearer s3cret"), "s3cret")).toBe(true);
  });

  it("rejects a wrong, missing or malformed token", () => {
    expect(isAuthorizedCronRequest(req("Bearer nope"), "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest(req(), "s3cret")).toBe(false);
    expect(isAuthorizedCronRequest(req("s3cret"), "s3cret")).toBe(false);
  });

  it("stays closed when no secret is configured", () => {
    expect(isAuthorizedCronRequest(req("Bearer "), "")).toBe(false);
    expect(isAuthorizedCronRequest(req("Bearer undefined"), undefined)).toBe(false);
  });
});
