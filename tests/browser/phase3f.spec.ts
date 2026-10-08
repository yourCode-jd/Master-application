import { expect, test, type Browser, type Page } from "@playwright/test";

const password = "DemoPass123!";
const users = { owner: "owner@demo.local", manager: "manager@demo.local", staff: "staff@demo.local" };
const ownerRoutes = ["/", "/appointments", "/walk-ins", "/customers", "/services", "/staff", "/follow-ups", "/visits", "/payments", "/commissions", "/revenue", "/inventory", "/purchases", "/memberships", "/packages", "/reports", "/search", "/settings"];

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/");
  await expect(page.locator("main")).toBeVisible();
}

test.describe.configure({ mode: "serial" });

test("owner can render all major operational routes without server errors", async ({ page }) => {
  await login(page, users.owner);
  for (const route of ownerRoutes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBeLessThan(500);
    await expect(page.locator("main")).toBeVisible();
  }
});

test("manager and staff direct routes remain permission protected", async ({ browser }) => {
  const managerContext = await browser.newContext();
  const manager = await managerContext.newPage(); await login(manager, users.manager);
  for (const route of ["/", "/appointments", "/walk-ins", "/customers"]) { const response = await manager.goto(route); expect(response?.status(), route).toBeLessThan(500); }
  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage(); await login(staff, users.staff);
  await expect(staff).toHaveURL(/\/$/);
  await staff.goto("/my-day"); await expect(staff.getByRole("heading", { name: "Today" })).toBeVisible();
  await expect(staff.getByRole("link", { name: "Settings" })).toHaveCount(0);
  for (const [route, heading] of [["/settings", "Settings"], ["/revenue", "Recorded revenue"], ["/commissions", "Commissions"]] as const) {
    const response = await staff.goto(route); expect(response?.status(), route).toBeLessThan(500);
    await expect(staff.getByRole("heading", { name: heading, exact: true }), `${route} must not render restricted data`).toHaveCount(0);
  }
  await managerContext.close(); await staffContext.close();
});

test("mobile menu is keyboard operable and primary pages do not overflow", async ({ page }) => {
  await login(page, users.owner);
  for (const width of [360, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/appointments", "/customers", "/inventory", "/memberships", "/settings"]) {
      await page.goto(route); await expect(page.locator("main")).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px ${route}`).toBeTruthy();
    }
  }
  await page.setViewportSize({ width: 360, height: 900 }); await page.goto("/");
  const menu = page.getByLabel("Open navigation"); await menu.focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("link", { name: "Dashboard" }).last()).toBeVisible();
  await page.keyboard.press("Escape");
});

test("owner can complete safe rendered operational workflows", async ({ page }) => {
  await login(page, users.owner);

  await page.goto("/appointments?date=2030-10-10");
  await page.locator(".booking-card summary").click();
  const appointment = page.locator(".booking-form");
  await appointment.getByPlaceholder("Customer name").fill("Browser QA Guest");
  await appointment.getByPlaceholder("Phone").fill("9990000001");
  await appointment.getByLabel("Service").selectOption({ index: 1 });
  await appointment.getByLabel("Location").selectOption({ index: 1 });
  await appointment.getByLabel("Date and time").fill("2030-10-10T10:00");
  await appointment.getByRole("button", { name: "Book appointment" }).click();
  await expect(page.getByText("Browser QA Guest", { exact: true })).toBeVisible();

  await page.goto("/walk-ins");
  const walkIn = page.locator(".booking-form");
  await walkIn.getByLabel("Customer").selectOption({ index: 1 });
  await walkIn.getByLabel("Service").selectOption({ index: 1 });
  await walkIn.getByLabel("Location").selectOption({ index: 1 });
  await walkIn.getByRole("button", { name: "Add to queue" }).click();
  await expect(page.locator(".queue-card").first()).toBeVisible();

  await page.goto("/follow-ups?filter=OVERDUE");
  const more = page.getByText("More").first();
  if (await more.count()) {
    await more.click();
    await page.getByRole("button", { name: "Create task" }).first().click();
  }

  await page.goto("/memberships");
  await page.getByLabel("Customer").selectOption({ index: 1 });
  await page.getByLabel("Plan").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Record & activate" }).click();
  await expect(page.getByRole("heading", { name: "Memberships" })).toBeVisible();

  await page.goto("/packages");
  await page.getByLabel("Customer").selectOption({ index: 1 });
  await page.getByLabel("Package").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Record & sell" }).click();
  await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();

  await page.goto("/inventory");
  const stock = page.locator("form").filter({ has: page.getByRole("button", { name: "Record movement" }) });
  await stock.getByLabel("Product").selectOption({ index: 1 });
  await stock.getByLabel("Location").selectOption({ index: 1 });
  await stock.getByLabel("Action").selectOption("RETURNED");
  await stock.getByLabel("Quantity change").fill("1");
  await stock.getByLabel(/Reason/).fill("Browser QA return");
  await stock.getByRole("button", { name: "Record movement" }).click();
  await expect(page.getByText("Browser QA return", { exact: true })).toBeVisible();
});
