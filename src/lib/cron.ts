import { timingSafeEqual } from "node:crypto";

/**
 * Checks that a request to a cron route comes from our scheduler.
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; other schedulers can do the same.
 * This is machine-to-machine authentication, not a user permission, so it sits outside can().
 */
export function isAuthorizedCronRequest(
  request: Request,
  secret: string | undefined = process.env.CRON_SECRET,
): boolean {
  if (!secret) return false; // Never open a cron route because the secret is missing.
  const header = request.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
