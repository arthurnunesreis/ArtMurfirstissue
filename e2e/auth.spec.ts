import { expect, test, type Page } from "@playwright/test";

/**
 * Sign-in and onboarding, end to end. Needs a migrated, seeded database and the dev server
 * running with AUTH_TEST_MODE=1 (playwright.config.ts sets it), so sign-in links are
 * captured instead of emailed.
 */

const uniqueEmail = (tag: string) =>
  `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;

async function signInByEmail(page: Page, email: string) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

  const res = await page.request.get(`/api/test/magic-link?email=${encodeURIComponent(email)}`);
  expect(res.ok()).toBe(true);
  const { url } = (await res.json()) as { url: string };
  // The link points at AUTH_URL's host; keep the path so it works on any test port.
  const link = new URL(url);
  await page.goto(link.pathname + link.search);
}

test("a new person signs in by email, onboards, and their choices persist", async ({ page }) => {
  const email = uniqueEmail("onboard");
  await signInByEmail(page, email);

  await expect(page).toHaveURL(/\/welcome$/);
  await page.getByLabel("Your name").fill("Tendai Test");
  await page.getByLabel("Home city").selectOption({ label: "Lagos" });
  // The display currency follows the city until the person picks one themselves.
  await expect(page.getByLabel("Show prices in")).toHaveValue("NGN");

  // Fan is pre-selected; add venue or event service.
  await expect(page.getByRole("checkbox", { name: /A fan/ })).toBeChecked();
  await page.getByRole("checkbox", { name: /A venue or event service/ }).check();
  await page.getByRole("button", { name: "Save and continue" }).click();

  await expect(page).toHaveURL(/\/me$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Hi Tendai/i);
  await expect(page.getByTestId("home-city")).toHaveText("Lagos");
  const roles = page.getByTestId("roles");
  await expect(roles).toContainText("A fan");
  await expect(roles).toContainText("A venue or event service");

  // It persisted: a fresh load shows the same, and onboarding doesn't come back.
  await page.reload();
  await expect(page.getByTestId("roles")).toContainText("A venue or event service");
  await page.goto("/welcome");
  await expect(page).toHaveURL(/\/me$/);

  // Stakeholder roles put them on the portals waitlist.
  await page.goto("/hub");
  await expect(page.getByTestId("waitlist")).toContainText("venue or event service");
});

test("onboarding explains what's missing", async ({ page }) => {
  await signInByEmail(page, uniqueEmail("errors"));
  await page.getByLabel("Your name").fill("");
  await page.getByRole("checkbox", { name: /A fan/ }).uncheck();
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page.getByText("Add your name.")).toBeVisible();
  await expect(page.getByText("Choose your home city.")).toBeVisible();
  await expect(page.getByText("Choose at least one.")).toBeVisible();
  await expect(page).toHaveURL(/\/welcome$/);
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  await page.goto("/me");
  await expect(page).toHaveURL(/\/sign-in\?callbackUrl=%2Fme$/);
});

test("the admin area doesn't exist for non-admins", async ({ page }) => {
  const anon = await page.goto("/admin");
  expect(anon?.status()).toBe(404);

  await signInByEmail(page, uniqueEmail("notadmin"));
  const res = await page.goto("/admin");
  expect(res?.status()).toBe(404);
});

test("an invalid email gets a clear message", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText(/Enter a valid email address/)).toBeVisible();
});
