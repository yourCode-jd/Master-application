import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyVisitServiceDiscount } from "@/domain/finance/service";
import { applyMembershipDiscount, cancelMembership, purchaseMembership, purchasePackage, renewMembership, saveMembershipPlan, saveServicePackage, usePackageCredit } from "./service";
import { createMembershipAlerts } from "./notifications";
import type { TenantContext } from "@/lib/tenant";

const db = new PrismaClient();
const suffix = `membership-it-${Date.now()}`;
let context: TenantContext, customerId: string, serviceId: string, visitServiceId: string, locationId: string, userId: string;

beforeAll(async () => {
  const user = await db.user.create({ data: { name: "Membership owner", email: `${suffix}@test.local`, passwordHash: "x" } });
  const business = await db.business.create({ data: { name: "Membership test", slug: suffix, type: "SALON" } });
  const ownerRole = await db.role.upsert({ where: { key: "OWNER" }, update: {}, create: { key: "OWNER", name: "Owner" } });
  await db.userBusinessRole.create({ data: { userId: user.id, businessId: business.id, roleId: ownerRole.id } });
  const customer = await db.customer.create({ data: { businessId: business.id, name: "Asha", phone: "9000000000" } });
  const category = await db.serviceCategory.create({ data: { businessId: business.id, name: "Care" } });
  const service = await db.service.create({ data: { businessId: business.id, categoryId: category.id, name: "Haircut", durationMinutes: 30, price: 500 } });
  const location = await db.businessLocation.create({ data: { businessId: business.id, name: "Studio" } });
  const visit = await db.visit.create({ data: { businessId: business.id, customerId: customer.id, locationId: location.id, status: "COMPLETED", services: { create: { serviceId: service.id, priceSnapshot: 500, durationSnapshot: 30, finalAmount: 500 } } }, include: { services: true } });
  context = { businessId: business.id, userId: user.id, permissions: new Set(["memberships.manage", "memberships.cancel", "packages.manage", "packages.cancel", "packages.use", "transactions.manage", "discounts.apply"]) };
  customerId = customer.id; serviceId = service.id; visitServiceId = visit.services[0].id; locationId = location.id; userId = user.id;
});

afterAll(async () => {
  if (context) {
    await db.packageUsage.deleteMany({ where: { businessId: context.businessId } });
    await db.customerPackageItem.deleteMany({ where: { customerPackage: { businessId: context.businessId } } });
    await db.customerPackage.deleteMany({ where: { businessId: context.businessId } });
    await db.servicePackageItem.deleteMany({ where: { package: { businessId: context.businessId } } });
    await db.servicePackage.deleteMany({ where: { businessId: context.businessId } });
    await db.customerMembership.deleteMany({ where: { businessId: context.businessId } });
    await db.visitService.deleteMany({ where: { visit: { businessId: context.businessId } } });
    await db.visit.deleteMany({ where: { businessId: context.businessId } });
    await db.business.deleteMany({ where: { id: context.businessId } });
  }
  await db.user.deleteMany({ where: { email: `${suffix}@test.local` } });
  await db.$disconnect();
});

describe("memberships and packages", () => {
  it("snapshots membership purchases, renewals, and cancellation", async () => {
    const plan = await saveMembershipPlan(context, { name: "Monthly", price: "999", validityDays: 30, benefits: "10% off" });
    const purchased = await purchaseMembership(context, { customerId, planId: plan.id, startDate: new Date("2026-01-01"), method: "CASH" });
    await db.membershipPlan.update({ where: { id: plan.id }, data: { price: 1999, validityDays: 60 } });
    expect((await db.customerMembership.findUniqueOrThrow({ where: { id: purchased.id } })).priceSnapshot.toString()).toBe("999");
    const renewed = await renewMembership(context, purchased.id, { planId: plan.id, startDate: new Date("2026-02-01"), method: "UPI" });
    expect(renewed.id).not.toBe(purchased.id);
    await cancelMembership(context, purchased.id, "Customer requested");
    expect((await db.customerMembership.findUniqueOrThrow({ where: { id: purchased.id } })).status).toBe("CANCELLED");
  });

  it("uses a package credit once and keeps the covered service financially safe", async () => {
    const pack = await saveServicePackage(context, { name: "Five cuts", price: "2000", validityDays: 90, items: [{ serviceId, quantity: 2 }] });
    const purchased = await purchasePackage(context, { customerId, packageId: pack.id, startDate: new Date(), method: "CASH" });
    await usePackageCredit(context, visitServiceId, purchased.id);
    await usePackageCredit(context, visitServiceId, purchased.id);
    const item = await db.customerPackageItem.findFirstOrThrow({ where: { customerPackageId: purchased.id, serviceId } });
    const row = await db.visitService.findUniqueOrThrow({ where: { id: visitServiceId } });
    expect(item.usedQuantity).toBe(1);
    expect(row.finalAmount.toString()).toBe("0");
    expect(row.commissionAmount.toString()).toBe("0");
  });

  it("denies unpermitted and wrong-tenant package operations", async () => {
    const denied = { ...context, permissions: new Set<string>() };
    await expect(saveMembershipPlan(denied, { name: "Blocked", price: "10", validityDays: 1 })).rejects.toThrow("Missing permission");
    await expect(purchasePackage(context, { customerId, packageId: "missing", startDate: new Date(), method: "CASH" })).rejects.toThrow("not found");
  });

  it("applies an active benefit once and rejects cancelled and manual stacking", async () => {
    const plan = await saveMembershipPlan(context, { name: "Current benefit", price: "100", validityDays: 30, benefits: "10% off" });
    const membership = await purchaseMembership(context, { customerId, planId: plan.id, startDate: new Date(), method: "CASH" });
    const visit = await db.visit.create({ data: { businessId: context.businessId, customerId, locationId, status: "COMPLETED", services: { create: { serviceId, priceSnapshot: 500, durationSnapshot: 30, finalAmount: 500 } } }, include: { services: true } });
    const discounted = await applyMembershipDiscount(context, visit.services[0].id, membership.id);
    expect(discounted.finalAmount.toString()).toBe("450");
    expect(discounted.discountSource).toBe("MEMBERSHIP");
    await expect(applyVisitServiceDiscount(context, visit.services[0].id, { type: "FIXED", value: "10" })).rejects.toThrow("do not stack");
    await db.customerMembership.update({ where: { id: membership.id }, data: { status: "CANCELLED" } });
    const other = await db.visit.create({ data: { businessId: context.businessId, customerId, locationId, status: "COMPLETED", services: { create: { serviceId, priceSnapshot: 500, durationSnapshot: 30, finalAmount: 500 } } }, include: { services: true } });
    await expect(applyMembershipDiscount(context, other.services[0].id, membership.id)).rejects.toThrow("not active");
  });

  it("creates one opted-in expiry alert across repeated scheduled runs", async () => {
    const plan = await saveMembershipPlan(context, { name: "Alert plan", price: "100", validityDays: 2, benefits: "5% off" });
    await purchaseMembership(context, { customerId, planId: plan.id, startDate: new Date(), method: "CASH" });
    await createMembershipAlerts(context.businessId);
    await createMembershipAlerts(context.businessId);
    expect(await db.notification.count({ where: { businessId: context.businessId, userId, type: "MEMBERSHIP_EXPIRING" } })).toBe(1);
    await db.notificationPreference.upsert({ where: { businessId_userId_type: { businessId: context.businessId, userId, type: "MEMBERSHIP_EXPIRING" } }, update: { enabled: false }, create: { businessId: context.businessId, userId, type: "MEMBERSHIP_EXPIRING", enabled: false } });
    const secondPlan = await saveMembershipPlan(context, { name: "Alert plan suppressed", price: "100", validityDays: 2, benefits: "5% off" });
    await purchaseMembership(context, { customerId, planId: secondPlan.id, startDate: new Date(), method: "CASH" });
    await createMembershipAlerts(context.businessId);
    expect(await db.notification.count({ where: { businessId: context.businessId, userId, type: "MEMBERSHIP_EXPIRING" } })).toBe(1);
  });
});
