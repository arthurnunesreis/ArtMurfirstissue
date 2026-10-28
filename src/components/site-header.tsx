import Link from "next/link";
import { signOut } from "@/auth";
import { getSessionUser } from "@/lib/auth/session";
import { Logo } from "./logo";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/" });
}

export async function SiteHeader() {
  const user = await getSessionUser();
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-[max(16px,env(safe-area-inset-left))] py-4">
      <Logo />
      <nav className="flex items-center gap-4 text-sm">
        {user ? (
          <>
            <Link href="/me" className="underline-offset-4 hover:underline">
              {user.name?.split(" ")[0] || "My HiveConcerts"}
            </Link>
            <form action={signOutAction}>
              <button type="submit" className="text-muted underline-offset-4 hover:underline">
                Sign out
              </button>
            </form>
          </>
        ) : (
          <Link href="/sign-in" className="bg-ink text-paper rounded-md px-3 py-1.5 font-bold">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
