import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <PageShell width="max-w-md">
      <h1 className="font-display mb-4 text-5xl font-black uppercase">Check your email</h1>
      <p className="mb-4 text-lg">
        We&apos;ve sent you a sign-in link. Open it on this device to continue.
      </p>
      <p className="text-muted">
        The link works once and expires in 24 hours. Nothing arrived? Check your spam folder, or{" "}
        <Link href="/sign-in" className="underline underline-offset-4">
          ask for a new link
        </Link>
        .
      </p>
    </PageShell>
  );
}
