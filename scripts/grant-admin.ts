// Makes an existing account an admin: `pnpm admin:grant you@example.com`.
// Sign in once first so the account exists. Use `--revoke` to remove admin rights.
import "dotenv/config";
import { Role } from "@/generated/prisma/enums";
import { db } from "@/lib/db";

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes("--revoke");
  const email = args
    .find((a) => !a.startsWith("--"))
    ?.trim()
    .toLowerCase();
  if (!email) throw new Error("Usage: pnpm admin:grant you@example.com [--revoke]");

  const user = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (!user) throw new Error(`No account for ${email}. Sign in once first, then run this again.`);

  await db.user.update({ where: { id: user.id }, data: { role: revoke ? Role.USER : Role.ADMIN } });
  console.log(revoke ? `${email} is no longer an admin.` : `${email} is now an admin.`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
