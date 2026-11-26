import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Public navigation does not require a running backend or create any records.
  await page.route("**/api/backend/users/me", (route) => route.fulfill({
    status: 401, contentType: "application/json", body: JSON.stringify({ message: "Please sign in" }),
  }));
});

test("public homepage stays public and connects visitors to registration and login", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A clearer spaceto teach.And to learn.");
  await expect(page).toHaveTitle("E-LearningLKA | A home for teaching and learning");
  await page.getByRole("link", { name: "Create an account", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.getByRole("heading", { name: "Who are you?" })).toBeVisible();
  await page.getByRole("link", { name: "Back to home" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Log in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("link", { name: "Back to home" }).click();
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login\?redirect=%2Fdashboard$/);
});

test("mobile navigation, FAQ and content work without horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation).toBeHidden();
  await toggle.click();
  await navigation.getByRole("link", { name: "For teachers" }).focus();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await expect(navigation).toBeHidden();
  await toggle.click();
  await navigation.getByRole("link", { name: "For teachers" }).click();
  await expect(page).toHaveURL(/\/#teachers$/);
  await expect(navigation).toBeHidden();
  await page.locator("summary").filter({ hasText: "How do I join a teacher’s class?" }).click();
  await expect(page.getByText(/Your teacher reviews the request before/)).toBeVisible();
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
});

for (const role of ["STUDENT", "TEACHER"] as const) {
  test(`signed-in ${role.toLowerCase()} can still see the homepage and their dashboard link`, async ({ page }) => {
    await page.route("**/api/backend/users/me", (route) => route.fulfill({
      contentType: "application/json", body: JSON.stringify({ role, name: "Example User" }),
    }));
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to dashboard" })).toHaveAttribute("href", role === "TEACHER" ? "/teacher/dashboard" : "/dashboard");
    await expect(page).toHaveURL(/\/$/);
  });
}
