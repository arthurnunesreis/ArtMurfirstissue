import { NextResponse } from "next/server";
import { isTestAuthEnabled, latestMagicLink } from "@/lib/auth/magic-link";

export const dynamic = "force-dynamic";

/**
 * TEST ONLY. Returns the latest sign-in link captured for an address, so Playwright can
 * sign in without an inbox. Answers 404 unless AUTH_TEST_MODE=1 outside production.
 */
export async function GET(request: Request) {
  if (!isTestAuthEnabled()) return new NextResponse(null, { status: 404 });
  const email = new URL(request.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Add ?email=" }, { status: 400 });
  const url = latestMagicLink(email);
  if (!url)
    return NextResponse.json({ error: "No link sent to that address yet." }, { status: 404 });
  return NextResponse.json({ url });
}
