import { expect, test } from "@playwright/test";

test("home page renders the HiveConcerts placeholder", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/HiveConcerts/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/bring the show/i);
});
