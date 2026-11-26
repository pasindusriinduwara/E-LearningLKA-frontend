import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/backend/users/me", (route) => route.fulfill({
    status: 401, contentType: "application/json", body: JSON.stringify({ message: "Please sign in" }),
  }));
});

test("developer profile is public, linked from home, and has working home navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Developer", exact: true }).click();
  await expect(page).toHaveURL(/\/developer$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Hi, I’m");
  await expect(page).toHaveTitle(/Developer of E-LearningLKA$/);
  await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Developer", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/developer$/);
  const contactLinks = page.getByRole("navigation", { name: "Developer contact links" });
  await expect(contactLinks.getByRole("link", { name: "Email me", exact: true })).toHaveAttribute("href", "mailto:ipasindusri@gmail.com");
  const portfolio = contactLinks.getByRole("link", { name: "My portfolio" });
  await expect(portfolio).toHaveAttribute("href", "https://pasindu-portfolio-gamma.vercel.app/");
  await expect(portfolio).toHaveAttribute("target", "_blank");
  await expect(portfolio).toHaveAttribute("rel", "noopener noreferrer");
  expect(await (await page.request.get("/sitemap.xml")).text()).toContain("/developer");
  await page.getByRole("link", { name: "For students", exact: true }).click();
  await expect(page).toHaveURL(/\/#students$/);
  await expect(page.locator("#students")).toBeInViewport();
  await page.getByRole("navigation", { name: "Footer navigation" }).getByRole("link", { name: "Developer", exact: true }).click();
  await expect(page).toHaveURL(/\/developer$/);
  await page.getByRole("link", { name: "Explore my work" }).click();
  await expect(page).toHaveURL(/\/developer#the-project$/);
  await page.getByRole("link", { name: "Explore E-LearningLKA", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("developer profile and shared navigation fit mobile and tablet widths", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/developer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "For teachers", exact: true }).click();
  await expect(page).toHaveURL(/\/#teachers$/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeHidden();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Developer", exact: true }).click();
  await expect(page).toHaveURL(/\/developer$/);
  for (const width of [320, 375, 768, 900, 1024, 1280]) {
    await page.setViewportSize({ width, height: 812 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
});
