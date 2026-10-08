# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: phase3f.spec.ts >> owner can complete safe rendered operational workflows
- Location: tests/browser/phase3f.spec.ts:58:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Browser QA Guest', { exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Browser QA Guest', { exact: true }) with timeout 5000ms
  - waiting for getByText('Browser QA Guest', { exact: true })

```

```yaml
- complementary:
  - link "L LocalOps":
    - /url: /
  - text: L SALON WORKSPACE
  - strong: Luna & Loom Salon
  - text: TODAY
  - navigation "TODAY":
    - link "Dashboard":
      - /url: /
    - link "Appointments":
      - /url: /appointments
    - link "Walk-ins":
      - /url: /walk-ins
    - link "Follow-ups":
      - /url: /follow-ups
    - link "Tasks":
      - /url: /tasks
  - text: CUSTOMERS
  - navigation "CUSTOMERS":
    - link "Customers":
      - /url: /customers
    - link "Services":
      - /url: /services
    - link "Memberships":
      - /url: /memberships
    - link "Packages":
      - /url: /packages
  - text: OPERATIONS
  - navigation "OPERATIONS":
    - link "Visits":
      - /url: /visits
    - link "Payments":
      - /url: /payments
    - link "Staff":
      - /url: /staff
    - link "Inventory":
      - /url: /inventory
    - link "Purchases":
      - /url: /purchases
  - text: INSIGHTS
  - navigation "INSIGHTS":
    - link "Reports":
      - /url: /reports
    - link "Revenue":
      - /url: /revenue
    - link "Commissions":
      - /url: /commissions
    - link "Settings":
      - /url: /settings
  - button "Sign out"
- main:
  - text: Salon workspace
  - button "Toggle theme": ◐
  - paragraph: SCHEDULE
  - heading "Appointments" [level=1]
  - group:
    - strong: + New appointment
    - text: Customer, service, staff, time Existing customer
    - combobox "Existing customer":
      - option "Choose customer" [selected]
      - option "Aarav Bose · 9001000000"
      - option "Aarav Das · 9001000015"
      - option "Aarav Gupta · 9001000030"
      - option "Aarav Jain · 9001000045"
      - option "Aditi Bose · 9001000001"
      - option "Aditi Das · 9001000016"
      - option "Aditi Gupta · 9001000031"
      - option "Aditi Jain · 9001000046"
      - option "Anika Bose · 9001000002"
      - option "Anika Das · 9001000017"
      - option "Anika Gupta · 9001000032"
      - option "Anika Jain · 9001000047"
      - option "Arjun Bose · 9001000003"
      - option "Arjun Das · 9001000018"
      - option "Arjun Gupta · 9001000033"
      - option "Bhavya Bose · 9001000004"
      - option "Bhavya Das · 9001000019"
      - option "Bhavya Gupta · 9001000034"
      - option "Diya Bose · 9001000005"
      - option "Diya Das · 9001000020"
      - option "Diya Gupta · 9001000035"
      - option "Ishaan Bose · 9001000006"
      - option "Ishaan Das · 9001000021"
      - option "Ishaan Gupta · 9001000036"
      - option "Kiran Bose · 9001000007"
      - option "Kiran Das · 9001000022"
      - option "Kiran Gupta · 9001000037"
      - option "Meera Bose · 9001000008"
      - option "Meera Das · 9001000023"
      - option "Meera Gupta · 9001000038"
      - option "Nikhil Bose · 9001000009"
      - option "Nikhil Das · 9001000024"
      - option "Nikhil Gupta · 9001000039"
      - option "Pooja Bose · 9001000010"
      - option "Pooja Das · 9001000025"
      - option "Pooja Gupta · 9001000040"
      - option "Rohan Bose · 9001000011"
      - option "Rohan Das · 9001000026"
      - option "Rohan Gupta · 9001000041"
      - option "Sana Bose · 9001000012"
      - option "Sana Das · 9001000027"
      - option "Sana Gupta · 9001000042"
      - option "Tara Bose · 9001000013"
      - option "Tara Das · 9001000028"
      - option "Tara Gupta · 9001000043"
      - option "Vikram Bose · 9001000014"
      - option "Vikram Das · 9001000029"
      - option "Vikram Gupta · 9001000044"
    - text: Or quick add
    - textbox "Customer name": Browser QA Guest
    - textbox "Phone": "9990000001"
    - text: Service
    - combobox "Service":
      - option "Choose service"
      - option "Beard Shape & Spa · 35 min · ₹550" [selected]
      - option "Beard Trim · 20 min · ₹300"
      - option "Blow Dry · 30 min · ₹450"
      - option "Bridal Trial · 90 min · ₹3000"
      - option "Classic Haircut · 30 min · ₹500"
      - option "Express Facial · 30 min · ₹900"
      - option "Eyebrow Threading · 15 min · ₹150"
      - option "Gel Polish · 40 min · ₹950"
      - option "Global Hair Colour · 150 min · ₹4500"
      - option "Glow Facial · 60 min · ₹1800"
      - option "Hair Colour Roots · 90 min · ₹2200"
      - option "Hair Spa · 45 min · ₹1200"
      - option "Hair Wash & Cut · 45 min · ₹750"
      - option "Head Massage · 30 min · ₹600"
      - option "Kids Haircut · 25 min · ₹350"
      - option "Manicure · 45 min · ₹800"
      - option "Pedicure · 60 min · ₹1100"
    - text: Staff (optional)
    - combobox "Staff (optional)":
      - option "Unassigned" [selected]
      - option "Ananya Nair · Classic Haircut, Blow Dry, Kids Haircut, Beard Shape & Spa, Express Facial, Hair Colour Roots, Global Hair Colour, Manicure, Gel Polish, Eyebrow Threading, Head Massage"
      - option "Arjun Patel · Blow Dry, Kids Haircut, Beard Shape & Spa, Eyebrow Threading, Classic Haircut, Express Facial, Hair Colour Roots, Global Hair Colour, Head Massage, Manicure, Gel Polish"
      - option "Kavya Iyer · Hair Wash & Cut, Blow Dry, Beard Trim, Beard Shape & Spa, Glow Facial, Hair Colour Roots, Hair Spa, Head Massage, Pedicure, Gel Polish, Bridal Trial"
      - option "Neha Rao · Classic Haircut, Hair Wash & Cut, Kids Haircut, Beard Trim, Express Facial, Glow Facial, Global Hair Colour, Hair Spa, Manicure, Pedicure, Eyebrow Threading, Bridal Trial"
      - option "Priya Shah · Pedicure, Gel Polish, Bridal Trial, Blow Dry, Beard Shape & Spa, Glow Facial, Hair Colour Roots, Hair Spa, Head Massage, Beard Trim, Hair Wash & Cut"
      - option "Rahul Verma · Classic Haircut, Hair Wash & Cut, Kids Haircut, Beard Trim, Express Facial, Glow Facial, Global Hair Colour, Hair Spa, Manicure, Pedicure, Eyebrow Threading, Bridal Trial"
      - option "Zoya Khan · Hair Wash & Cut, Blow Dry, Beard Trim, Beard Shape & Spa, Glow Facial, Hair Colour Roots, Hair Spa, Head Massage, Pedicure, Gel Polish, Bridal Trial"
    - text: Date and time
    - textbox "Date and time": 2030-10-10T10:00
    - text: Location
    - combobox "Location":
      - option "Choose location"
      - option "Main Studio" [selected]
    - text: Source
    - combobox "Source":
      - option "Manual" [selected]
      - option "Phone"
      - option "WhatsApp"
      - option "Walk-in"
      - option "Other"
    - text: Notes (optional)
    - textbox "Notes (optional)"
    - checkbox "Allow a known staff clash and record it"
    - text: Allow a known staff clash and record it
    - button "Book appointment"
  - region "Week calendar":
    - paragraph: WEEK VIEW
    - heading "Oct 7 – Oct 13, 2030" [level=2]
    - link "← Previous":
      - /url: /appointments?date=2030-09-30
    - link "Today":
      - /url: /appointments?date=2026-10-08
    - link "Next →":
      - /url: /appointments?date=2030-10-14
    - strong: Mon
    - text: Oct 7
    - paragraph: No bookings
    - strong: Tue
    - text: Oct 8
    - paragraph: No bookings
    - strong: Wed
    - text: Oct 9
    - paragraph: No bookings
    - strong: Thu
    - text: Oct 10
    - paragraph: No bookings
    - strong: Fri
    - text: Oct 11
    - paragraph: No bookings
    - strong: Sat
    - text: Oct 12
    - paragraph: No bookings
    - strong: Sun
    - text: Oct 13
    - paragraph: No bookings
  - paragraph: DAY VIEW
  - heading "Thursday, October 10" [level=2]
  - text: Day
  - textbox "Day": 2030-10-10
  - button "View day"
  - strong: No appointments for this day
  - paragraph: Use New appointment to add the first booking.
- alert
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
  9   |   await page.getByLabel("Email").fill(email);
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
> 70  |   await expect(page.getByText("Browser QA Guest", { exact: true })).toBeVisible();
      |                                                                     ^ Error: expect(locator).toBeVisible() failed
  71  | 
  72  |   await page.goto("/walk-ins");
  73  |   const walkIn = page.locator(".booking-form");
  74  |   await walkIn.getByLabel("Customer").selectOption({ index: 1 });
  75  |   await walkIn.getByLabel("Service").selectOption({ index: 1 });
  76  |   await walkIn.getByLabel("Location").selectOption({ index: 1 });
  77  |   await walkIn.getByRole("button", { name: "Add to queue" }).click();
  78  |   await expect(page.locator(".queue-card").first()).toBeVisible();
  79  | 
  80  |   await page.goto("/follow-ups?filter=OVERDUE");
  81  |   const more = page.getByText("More").first();
  82  |   if (await more.count()) {
  83  |     await more.click();
  84  |     await page.getByRole("button", { name: "Create task" }).first().click();
  85  |   }
  86  | 
  87  |   await page.goto("/memberships");
  88  |   await page.getByLabel("Customer").selectOption({ index: 1 });
  89  |   await page.getByLabel("Plan").selectOption({ index: 1 });
  90  |   await page.getByRole("button", { name: "Record & activate" }).click();
  91  |   await expect(page.getByRole("heading", { name: "Memberships" })).toBeVisible();
  92  | 
  93  |   await page.goto("/packages");
  94  |   await page.getByLabel("Customer").selectOption({ index: 1 });
  95  |   await page.getByLabel("Package").selectOption({ index: 1 });
  96  |   await page.getByRole("button", { name: "Record & sell" }).click();
  97  |   await expect(page.getByRole("heading", { name: "Packages" })).toBeVisible();
  98  | 
  99  |   await page.goto("/inventory");
  100 |   const stock = page.locator("form").filter({ has: page.getByRole("button", { name: "Record movement" }) });
  101 |   await stock.getByLabel("Product").selectOption({ index: 1 });
  102 |   await stock.getByLabel("Location").selectOption({ index: 1 });
  103 |   await stock.getByLabel("Action").selectOption("RETURNED");
  104 |   await stock.getByLabel("Quantity change").fill("1");
  105 |   await stock.getByLabel(/Reason/).fill("Browser QA return");
  106 |   await stock.getByRole("button", { name: "Record movement" }).click();
  107 |   await expect(page.getByText("Browser QA return", { exact: true })).toBeVisible();
  108 | });
  109 | 
```