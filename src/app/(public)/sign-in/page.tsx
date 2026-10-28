import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { googleEnabled } from "@/auth";
import { PageShell } from "@/components/page-shell";
import { secondaryButtonClass } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/session";
import { signInWithGoogle } from "./actions";
import { EmailSignInForm } from "./email-form";

export const metadata: Metadata = { title: "Sign in" };

const ERRORS: Record<string, string> = {
  Verification: "That sign-in link has expired or was already used. Ask for a new one below.",
  OAuthAccountNotLinked:
    "That email already signs in with a link. Use the email option below instead.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  if (await getSessionUser()) redirect(callbackUrl?.startsWith("/") ? callbackUrl : "/me");

  return (
    <PageShell width="max-w-md">
      <h1 className="font-display mb-2 text-5xl font-black uppercase">Sign in</h1>
      <p className="text-muted mb-8">
        New here? Signing in creates your account. No password needed.
      </p>
      {error ? (
        <p role="alert" className="border-line bg-surface mb-6 rounded-md border p-3 text-sm">
          {ERRORS[error] ?? "Something went wrong signing you in. Try again."}
        </p>
      ) : null}

      {googleEnabled ? (
        <>
          <form action={signInWithGoogle}>
            {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
            <button type="submit" className={`${secondaryButtonClass} w-full`}>
              Continue with Google
            </button>
          </form>
          <p className="text-muted my-6 text-center text-sm">or</p>
        </>
      ) : null}

      <EmailSignInForm callbackUrl={callbackUrl} />
    </PageShell>
  );
}
