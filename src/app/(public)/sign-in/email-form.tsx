"use client";

import { useActionState } from "react";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui";
import { signInWithEmail, type SignInState } from "./actions";

export function EmailSignInForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInWithEmail, {});
  return (
    <form action={action} className="flex flex-col gap-3" noValidate>
      <label htmlFor="email" className={labelClass}>
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        required
        placeholder="you@example.com"
        className={inputClass}
        aria-describedby={state.error ? "email-error" : undefined}
      />
      {callbackUrl ? <input type="hidden" name="callbackUrl" value={callbackUrl} /> : null}
      {state.error ? (
        <p id="email-error" role="alert" className="text-sm text-red-700 dark:text-red-300">
          {state.error}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
