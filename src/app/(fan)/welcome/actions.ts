"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { Stakeholder } from "@/generated/prisma/enums";
import { assertCan, requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { isKnownCurrency } from "@/lib/money";

const onboardingSchema = z.object({
  // A blank <select> isn't submitted at all, so a missing field gets the same message as an empty one.
  name: z
    .string({ error: "Add your name." })
    .trim()
    .min(1, "Add your name.")
    .max(80, "Use 80 characters or fewer."),
  homeRegionId: z.string({ error: "Choose your home city." }).min(1, "Choose your home city."),
  preferredCurrency: z
    .string({ error: "Choose a currency from the list." })
    .refine(isKnownCurrency, "Choose a currency from the list."),
  stakeholderRoles: z.array(z.enum(Stakeholder)).min(1, "Choose at least one."),
});

export type OnboardingState = {
  errors?: Partial<Record<keyof z.infer<typeof onboardingSchema>, string>>;
};

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { user } = await requireUser({ allowNotOnboarded: true, returnTo: "/welcome" });
  await assertCan("profile.update", { type: "user", userId: user.id });

  const parsed = onboardingSchema.safeParse({
    name: formData.get("name"),
    homeRegionId: formData.get("homeRegionId"),
    preferredCurrency: formData.get("preferredCurrency"),
    stakeholderRoles: formData.getAll("stakeholderRoles"),
  });
  if (!parsed.success) {
    const errors: OnboardingState["errors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof NonNullable<OnboardingState["errors"]>;
      errors[key] ??= issue.message;
    }
    return { errors };
  }

  const region = await db.region.findFirst({
    where: { id: parsed.data.homeRegionId, active: true },
    select: { id: true },
  });
  if (!region) return { errors: { homeRegionId: "Choose your home city from the list." } };

  await db.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      homeRegionId: region.id,
      preferredCurrency: parsed.data.preferredCurrency,
      stakeholderRoles: [...new Set(parsed.data.stakeholderRoles)],
    },
  });
  redirect("/me");
}
