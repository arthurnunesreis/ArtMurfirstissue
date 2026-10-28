import { NextResponse } from "next/server";
import { isAuthorizedCronRequest } from "@/lib/cron";
import { db } from "@/lib/db";
import { refreshFxRates } from "@/lib/fx";

export const dynamic = "force-dynamic";

/** Daily: refresh display-only exchange rates (schedule in vercel.json). */
export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const url = process.env.FX_RATES_API_URL;
  if (!url) {
    return NextResponse.json({ error: "FX_RATES_API_URL is not set." }, { status: 500 });
  }
  try {
    const result = await refreshFxRates(db, url);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/fx] refresh failed", error);
    return NextResponse.json({ error: "Refreshing exchange rates failed." }, { status: 502 });
  }
}
