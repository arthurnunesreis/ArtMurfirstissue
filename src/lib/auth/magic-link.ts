/**
 * Delivers sign-in links.
 * - With RESEND_API_KEY set: sends a real email through Resend.
 * - Without it (local development and tests): prints the link to the server console and
 *   keeps the latest link per address in memory, so the test-only route can hand it to
 *   Playwright. Nothing is ever exposed in production (see isTestAuthEnabled).
 */

type LinkStore = Map<string, string>;
const store = ((globalThis as unknown as { __hiveMagicLinks?: LinkStore }).__hiveMagicLinks ??=
  new Map());

/** The test-only sign-in route works only when explicitly enabled outside production. */
export function isTestAuthEnabled(): boolean {
  return process.env.AUTH_TEST_MODE === "1" && process.env.NODE_ENV !== "production";
}

export function latestMagicLink(email: string): string | undefined {
  return store.get(email.trim().toLowerCase());
}

export async function sendMagicLink({ to, url }: { to: string; url: string }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set, so sign-in emails can't be sent.");
    }
    store.set(to.trim().toLowerCase(), url);
    console.info(`\n[auth] Sign-in link for ${to} (no RESEND_API_KEY, so not emailed):\n${url}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "HiveConcerts <hello@hiveconcerts.com>",
      to,
      subject: "Your HiveConcerts sign-in link",
      text: signInText(url),
      html: signInHtml(url),
    }),
  });
  if (!res.ok) throw new Error(`Resend refused the sign-in email (${res.status}).`);
}

function signInText(url: string): string {
  return [
    "Sign in to HiveConcerts",
    "",
    "Open this link to sign in. It works once and expires in 24 hours:",
    url,
    "",
    "If you didn't ask for this, you can ignore this email.",
  ].join("\n");
}

function signInHtml(url: string): string {
  const safe = url.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<!doctype html><html><body style="margin:0;background:#ECEBF3;font-family:Arial,Helvetica,sans-serif;color:#1D1838">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:12px" cellpadding="0" cellspacing="0"><tr><td style="padding:32px">
<p style="margin:0 0 8px;font-size:22px;font-weight:bold">Sign in to HiveConcerts</p>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5;color:#5B5675">Tap the button to sign in. The link works once and expires in 24 hours.</p>
<a href="${safe}" style="display:inline-block;background:#F0A400;color:#3A2700;font-weight:bold;text-decoration:none;padding:12px 24px;border-radius:6px">Sign in</a>
<p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#5B5675">If you didn't ask for this, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`;
}
