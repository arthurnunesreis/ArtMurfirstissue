"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";
import { signIn } from "@/auth";

const emailSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  callbackUrl: z.string().optional(),
});

/** Only allow returning to a path on this site. */
function safeReturnPath(value: string | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/me";
}

export type SignInState = { error?: string };

export async function signInWithEmail(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = emailSchema.safeParse({
    email: formData.get("email"),
    callbackUrl: formData.get("callbackUrl") ?? undefined,
  });
  if (!parsed.success) return { error: "Enter a valid email address, like you@example.com." };

  try {
    await signIn("resend", {
      email: parsed.data.email,
      redirectTo: safeReturnPath(parsed.data.callbackUrl),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "We couldn't send your sign-in link. Try again in a minute." };
    }
    throw error; // includes Next's redirect to the "check your email" page
  }
  redirect("/sign-in/check");
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const callbackUrl = formData.get("callbackUrl");
  await signIn("google", {
    redirectTo: safeReturnPath(typeof callbackUrl === "string" ? callbackUrl : undefined),
  });
}
