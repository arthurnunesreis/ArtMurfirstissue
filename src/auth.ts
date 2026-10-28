import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Adapter } from "next-auth/adapters";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import type { Role, Stakeholder } from "@/generated/prisma/enums";
import { sendMagicLink } from "@/lib/auth/magic-link";
import { db } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email: string;
      image?: string | null;
      role: Role;
      verified: boolean;
      stakeholderRoles: Stakeholder[];
      homeRegionId: string | null;
      preferredCurrency: string;
      onboarded: boolean;
    };
  }
}

/** Google sign-in switches on when both keys are present. */
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

const providers: NextAuthConfig["providers"] = [
  Resend({
    apiKey: process.env.RESEND_API_KEY ?? "",
    from: process.env.EMAIL_FROM ?? "HiveConcerts <hello@hiveconcerts.com>",
    maxAge: 24 * 60 * 60,
    sendVerificationRequest: ({ identifier, url }) => sendMagicLink({ to: identifier, url }),
  }),
];
if (googleEnabled) providers.push(Google({ allowDangerousEmailAccountLinking: false }));

type DbUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  emailVerified: Date | null;
  role: Role;
  stakeholderRoles: Stakeholder[];
  homeRegionId: string | null;
  preferredCurrency: string;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The generated client lives at a custom path, so the adapter's @prisma/client types don't
  // line up; the runtime API is the same.
  adapter: PrismaAdapter(db as never) as Adapter,
  session: { strategy: "database", maxAge: 60 * 60 * 24 * 30 },
  providers,
  pages: { signIn: "/sign-in", verifyRequest: "/sign-in/check", error: "/sign-in" },
  trustHost: true,
  callbacks: {
    session({ session, user }) {
      const u = user as unknown as DbUser;
      session.user = {
        ...session.user,
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        verified: u.emailVerified !== null,
        stakeholderRoles: u.stakeholderRoles,
        homeRegionId: u.homeRegionId,
        preferredCurrency: u.preferredCurrency,
        // Onboarding asks for a home city, so having one means it was completed.
        onboarded: u.homeRegionId !== null,
        emailVerified: u.emailVerified,
      };
      return session;
    },
  },
  events: {
    // Google has already verified the address, so it counts as verified here too.
    async linkAccount({ user, account, profile }) {
      const verifiedByGoogle =
        account.provider === "google" && (profile as { email_verified?: boolean }).email_verified;
      if (verifiedByGoogle && user.id) {
        await db.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      }
    },
  },
});
