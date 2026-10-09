# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase3f.spec.ts >> owner can render all major operational routes without server errors
- Location: tests/browser/phase3f.spec.ts:18:5

# Error details

```
Test timeout of 45000ms exceeded.
```

```
Error: locator.fill: Test timeout of 45000ms exceeded.
Call log:
  - waiting for getByLabel('Email')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]: Internal Server Error
```

# Test source

```ts
  1   | import { expect, test, type Browser, type Page } from "@playwright/test";
  2   | 
  3   | const password = "DemoPass123!";
  4   | const users = { owner: "owner@demo.local", manager: "manager@demo.local", staff: "staff@demo.local" };
  5   | const ownerRoutes = ["/", "/appointments", "/walk-ins", "/customers", "/services", "/staff", "/follow-ups", "/visits", "/payments", "/commissions", "/revenue", "/inventory", "/purchases", "/memberships", "/packages", "/reports", "/search", "/settings"];
  6   | 
  7   | async function login(page: Page, email: string) {
  8   |   await page.goto("/login");
> 9   |   await page.getByLabel("Email").fill(email);
      |                                  ^ Error: locator.fill: Test timeout of 45000ms exceeded.
  10  |   await page.getByLabel("Password").fill(password);
  11  |   await page.getByRole("button", { name: "Sign in" }).click();
  12  |   await page.waitForURL("**/");
  13  |   await expect(page.locator("main")).toBeVisible();
  14  | }
  15  | 
  16  | test.describe.configure({ mode: "serial" });
  17  | 
  18  | test("owner can render all major operational routes without server errors", async ({ page }) => {
  19  |   await login(page, users.owner);
  20  |   for (const route of ownerRoutes) {
  21  |     const response = await page.goto(route);
  22  |     expect(response?.status(), route).toBeLessThan(500);
  23  |     await expect(page.locator("main")).toBeVisible();
  24  |   }
  25  | });
  26  | 
  27  | test("manager and staff direct routes remain permission protected", async ({ browser }) => {
  28  |   const managerContext = await browser.newContext();
  29  |   const manager = await managerContext.newPage(); await login(manager, users.manager);
  30  |   for (const route of ["/", "/appointments", "/walk-ins", "/customers"]) { const response = await manager.goto(route); expect(response?.status(), route).toBeLessThan(500); }
  31  |   const staffContext = await browser.newContext();
  32  |   const staff = await staffContext.newPage(); await login(staff, users.staff);
  33  |   await expect(staff).toHaveURL(/\/$/);
  34  |   await staff.goto("/my-day"); await expect(staff.getByRole("heading", { name: "Today" })).toBeVisible();
  35  |   await expect(staff.getByRole("link", { name: "Settings" })).toHaveCount(0);
  36  |   for (const [route, heading] of [["/settings", "Settings"], ["/revenue", "Recorded revenue"], ["/commissions", "Commissions"]] as const) {
  37  |     const response = await staff.goto(route); expect(response?.status(), route).toBeLessThan(500);
  38  |     await expect(staff.getByRole("heading", { name: heading, exact: true }), `${route} must not render restricted data`).toHaveCount(0);
  39  |   }
  40  |   await managerContext.close(); await staffContext.close();
  41  | });
  42  | 
  43  | test("mobile menu is keyboard operable and primary pages do not overflow", async ({ page }) => {
  44  |   await login(page, users.owner);
  45  |   for (const width of [360, 390, 768, 1024, 1440, 1920]) {
  46  |     await page.setViewportSize({ width, height: 900 });
  47  |     for (const route of ["/", "/appointments", "/customers", "/inventory", "/memberships", "/settings"]) {
  48  |       await page.goto(route); await expect(page.locator("main")).toBeVisible();
  49  |       expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px ${route}`).toBeTruthy();
  50  |     }
  51  |   }
  52  |   await page.setViewportSize({ width: 360, height: 900 }); await page.goto("/");
  53  |   const menu = page.getByLabel("Open navigation"); await menu.focus(); await page.keyboard.press("Enter");
  54  |   await expect(page.getByRole("link", { name: "Dashboard" }).last()).toBeVisible();
  55  |   await page.keyboard.press("Escape");
  56  | });
  57  | 
  58  | test("owner can complete safe rendered operational workflows", async ({ page }) => {
  59  |   await login(page, users.owner);
  60  | 
  61  |   await page.goto("/appointments?date=2030-10-10");
  62  |   await page.locator(".booking-card summary").click();
  63  |   const appointment = page.locator(".booking-form");
  64  |   await appointment.getByPlaceholder("Customer name").fill("Browser QA Guest");
  65  |   await appointment.getByPlaceholder("Phone").fill("9990000001");
  66  |   await appointment.getByLabel("Service").selectOption({ index: 1 });
  67  |   await appointment.getByLabel("Location").selectOption({ index: 1 });
  68  |   await appointment.getByLabel("Date and time").fill("2030-10-10T10:00");
  69  |   await appointment.getByRole("button", { name: "Book appointment" }).click();
  70  |   await page.waitForTimeout(500); await page.reload();
  71  |   await expect(page.getByText("Browser QA Guest", { exact: true }).first()).toBeVisible();
  72  | 
  73  |   await page.goto("/walk-ins");
  74  |   const walkIn = page.locator(".booking-form");
  75  |   await walkIn.getByLabel("Customer").selectOption({ index: 1 });
  76  |   await walkIn.getByLabel("Service").selectOption({ index: 1 });
  77  |   await walkIn.getByLabel("Location").selectOption({ index: 1 });
  78  |   await walkIn.getByRole("button", { name: "Add to queue" }).click();
  79  |   await page.waitForTimeout(500); await page.reload();
  80  |   await expect(page.locator(".queue-card").first()).toBeVisible();
  81  | 
  82  |   await page.goto("/follow-ups?filter=OVERDUE");
  83  |   const more = page.getByText("More").first();
  84  |   if (await more.count()) {
  85  |     await more.click();
  86  |     await page.getByRole("button", { name: "Create task" }).first().click();
  87  |   }
  88  | 
  89  |   await page.goto("/memberships");
  90  |   const membershipSale = page.locator("form").filter({ has: page.getByRole("button", { name: "Record & activate" }) });
  91  |   await membershipSale.getByLabel("Customer").selectOption({ index: 1 });
  92  |   await membershipSale.getByLabel("Plan").selectOption({ index: 1 });
  93  |   await membershipSale.getByRole("button", { name: "Record & activate" }).click();
  94  |   await page.waitForTimeout(500); await page.reload();
  95  |   await expect(page.getByRole("heading", { name: "Memberships" })).toBeVisible();
  96  | 
  97  |   await page.goto("/packages");
  98  |   const packageSale = page.locator("form").filter({ has: page.getByRole("button", { name: "Record & sell" }) });
  99  |   await packageSale.getByLabel("Customer").selectOption({ index: 1 });
  100 |   await packageSale.getByLabel("Package").selectOption({ index: 1 });
  101 |   await packageSale.getByRole("button", { name: "Record & sell" }).click();
  102 |   await page.waitForTimeout(500); await page.reload();
  103 |   await expect(page.getByRole("heading", { name: "Packages", exact: true })).toBeVisible();
  104 | 
  105 |   await page.goto("/inventory");
  106 |   const stock = page.locator("form").filter({ has: page.getByRole("button", { name: "Record movement" }) });
  107 |   await stock.getByLabel("Product").selectOption({ index: 1 });
  108 |   await stock.getByLabel("Location").selectOption({ index: 1 });
  109 |   await stock.getByLabel("Action").selectOption("RETURNED");
```