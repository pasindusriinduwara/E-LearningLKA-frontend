import { test, expect, type BrowserContext, type Page } from "@playwright/test";

type PortalRole = "TEACHER" | "STUDENT";

async function mockPortal(page: Page, context: BrowserContext, baseURL: string, role: PortalRole) {
  // Only the frontend route guard needs these synthetic cookies. Every API call
  // stays inside this browser mock, so this suite never creates or changes users.
  await context.addCookies([
    { name: "lms_session", value: "sidebar-regression-session", url: baseURL, httpOnly: true },
    { name: "lms_role", value: role, url: baseURL, httpOnly: true },
  ]);
  const profile = {
    id: "sidebar-user", userId: "sidebar-user", role, title: "Mr.",
    name: "Example User", initials: "EU", email: "sidebar@example.test",
    qualification: "Mathematics", studentId: "ST-TEST001", exam: "A/L",
    stream: "Science", medium: "English", subjects: "Mathematics",
  };
  const unexpectedRequests: string[] = [];
  await page.route("**/api/backend/**", async (route) => {
    const path = new URL(route.request().url()).pathname.replace("/api/backend", "");
    const profiles = ["/users/me", "/teacher/profile", "/students/profile"];
    if (route.request().method() === "GET" && profiles.includes(path)) {
      await route.fulfill({ json: profile });
    } else if (route.request().method() === "GET" && path === "/notifications/unread-count") {
      await route.fulfill({ json: { unreadCount: 0 } });
    } else {
      unexpectedRequests.push(`${route.request().method()} ${path}`);
      await route.fulfill({ status: 404, json: { message: "Unexpected request in sidebar regression" } });
    }
  });
  return unexpectedRequests;
}

for (const role of ["TEACHER", "STUDENT"] as const) {
  const name = role === "TEACHER" ? "Teacher navigation" : "Student navigation";
  const settingsPath = role === "TEACHER" ? "/teacher/settings" : "/settings";
  const desktopWidth = role === "TEACHER" ? 1024 : 769;

  test(`${role.toLowerCase()} mobile sidebar closes with its controls, Escape and navigation`, async ({ page, context, baseURL }) => {
    const requests = await mockPortal(page, context, baseURL!, role);
    await page.setViewportSize({ width: 600, height: 740 });
    await page.goto(settingsPath);
    await expect(page.getByRole("button", { name: "Save Profile Changes", exact: true })).toBeVisible();

    const sidebar = page.locator(`aside[aria-label="${name}"]`);
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    const drawer = page.getByRole("dialog", { name, exact: true });
    const close = drawer.getByRole("button", { name: "Close navigation", exact: true });
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    expect(await sidebar.evaluate((element) => {
      element.querySelector<HTMLAnchorElement>("a")?.focus();
      return element.contains(document.activeElement);
    })).toBe(false);

    await opener.click();
    await expect(drawer).toBeVisible();
    await expect(close).toBeFocused();
    const signOut = drawer.getByRole("button", { name: /Sign out$/ });
    const firstControl = drawer.locator('a[href], button:not([disabled])').first();
    await signOut.focus();
    await page.keyboard.press("Tab");
    await expect(firstControl).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(signOut).toBeFocused();
    await close.focus();
    // A background form cannot receive focus while its modal navigation is open.
    await page.locator("main input:not([disabled])").first().evaluate((element) => (element as HTMLInputElement).focus());
    await expect(close).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await close.click();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(opener).toBeFocused();

    await opener.click();
    // Click outside the drawer, rather than a point covered by the sidebar.
    await page.getByRole("button", { name: "Close navigation overlay", exact: true }).click({ position: { x: 580, y: 370 } });
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(opener).toBeFocused();

    // Choosing the current route still closes navigation; pathname did not change.
    await opener.click();
    await drawer.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(page).toHaveURL(new RegExp(`${settingsPath}$`));
    await opener.click();
    await drawer.locator(`a[href="${settingsPath}"]`).first().click();
    await expect(opener).toHaveAttribute("aria-expanded", "false");

    // Browser history changes must discard the previous opening permanently.
    await opener.click();
    await page.evaluate((path) => window.history.pushState({}, "", `${path}/sidebar-regression`), settingsPath);
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${settingsPath}$`));
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    expect(requests).toEqual([]);
  });

  test(`${role.toLowerCase()} sidebar stays usable in short windows and resets after desktop resize`, async ({ page, context, baseURL }) => {
    const requests = await mockPortal(page, context, baseURL!, role);
    await page.setViewportSize({ width: 600, height: 320 });
    await page.goto(settingsPath);
    await expect(page.getByRole("button", { name: "Save Profile Changes", exact: true })).toBeVisible();
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    const sidebar = page.locator(`aside[aria-label="${name}"]`);
    const drawer = page.getByRole("dialog", { name, exact: true });

    await opener.click();
    await expect(drawer.getByRole("button", { name: "Close navigation", exact: true })).toBeInViewport();
    const signOut = drawer.getByRole("button", { name: /Sign out$/ });
    await signOut.scrollIntoViewIfNeeded();
    await expect(signOut).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();

    await opener.click();
    await page.setViewportSize({ width: desktopWidth, height: 740 });
    await expect(drawer).toHaveCount(0);
    await expect(sidebar.getByRole("link", { name: "Settings", exact: true })).toBeVisible();
    await expect(opener).toBeHidden();
    await expect(page.getByRole("button", { name: "Close navigation overlay", exact: true })).toHaveCount(0);
    await expect(sidebar).not.toHaveAttribute("inert", "");

    await page.setViewportSize({ width: 600, height: 740 });
    await expect(opener).toHaveAttribute("aria-expanded", "false");
    await expect(sidebar).toHaveAttribute("aria-hidden", "true");
    await opener.click();
    await expect(drawer.getByRole("button", { name: "Close navigation", exact: true })).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(requests).toEqual([]);
  });
}
