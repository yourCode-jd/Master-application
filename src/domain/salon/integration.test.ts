import { Prisma, PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { assertServiceCapability, assertStaffAvailable, canOperateAppointment, createVisitForAppointment, createVisitForWalkIn, recordConflictOverride, transitionAppointment, transitionWalkIn } from "./service";
import { requirePermission, type TenantContext } from "@/lib/tenant";
import { searchBusiness } from "@/lib/phase2-search";

const db = new PrismaClient();
const suffix = `phase3a-it-${Date.now()}`;
let a: { businessId: string; locationId: string; customerId: string; staffId: string; serviceId: string; categoryId: string; userId: string };
let b: { businessId: string; locationId: string; customerId: string; staffId: string; serviceId: string; categoryId: string; userId: string };
const owner = (businessId: string, userId: string): TenantContext => ({ userId, businessId, permissions: new Set(["services.view", "services.manage", "appointments.edit", "appointments.create", "appointments.override_conflict", "walkins.manage", "visits.manage", "dashboard.view"]) });
const manager = (businessId: string, userId: string): TenantContext => ({ userId, businessId, permissions: new Set(["appointments.edit", "appointments.override_conflict", "walkins.manage", "visits.manage", "dashboard.view"]) });
const managerWithoutOverride = (businessId: string, userId: string): TenantContext => ({ userId, businessId, permissions: new Set(["appointments.edit", "walkins.manage", "visits.manage", "dashboard.view"]) });
const staffContext = (businessId: string, userId: string): TenantContext => ({ userId, businessId, permissions: new Set(["appointments.view", "walkins.view", "dashboard.view"]) });
const booking = async (fixture: typeof a, startAt: Date, status: "PENDING" | "CONFIRMED" | "CANCELLED" = "PENDING") => {
  const service = await db.service.findUniqueOrThrow({ where: { id: fixture.serviceId } }); const endAt = new Date(startAt.getTime() + service.durationMinutes * 60_000);
  return db.appointment.create({ data: { businessId: fixture.businessId, customerId: fixture.customerId, locationId: fixture.locationId, staffId: fixture.staffId, startAt, endAt, status, source: "MANUAL", createdBy: fixture.userId, services: { create: { serviceId: fixture.serviceId, staffId: fixture.staffId, priceSnapshot: service.price, durationSnapshot: service.durationMinutes } } } });
};

async function cleanupTestBusinesses() {
  const businesses = await db.business.findMany({ where: { slug: { startsWith: "phase3a-it-" } }, select: { id: true } }); const ids = businesses.map(x => x.id); if (!ids.length) return;
  await db.auditLog.deleteMany({ where: { businessId: { in: ids } } }); await db.transactionRecord.deleteMany({ where: { businessId: { in: ids } } }); await db.returnRecommendation.deleteMany({ where: { businessId: { in: ids } } }); await db.stockMovement.deleteMany({ where: { businessId: { in: ids } } }); await db.visitService.deleteMany({ where: { visit: { businessId: { in: ids } } } }); await db.visit.deleteMany({ where: { businessId: { in: ids } } }); await db.appointmentService.deleteMany({ where: { appointment: { businessId: { in: ids } } } }); await db.appointment.deleteMany({ where: { businessId: { in: ids } } }); await db.walkIn.deleteMany({ where: { businessId: { in: ids } } }); await db.staffService.deleteMany({ where: { businessId: { in: ids } } }); await db.activity.deleteMany({ where: { businessId: { in: ids } } }); await db.task.deleteMany({ where: { businessId: { in: ids } } }); await db.customerNote.deleteMany({ where: { businessId: { in: ids } } }); await db.customer.deleteMany({ where: { businessId: { in: ids } } }); await db.staffMember.deleteMany({ where: { businessId: { in: ids } } }); await db.serviceInventoryRequirement.deleteMany({ where: { businessId: { in: ids } } }); await db.item.deleteMany({ where: { businessId: { in: ids } } }); await db.inventoryLocation.deleteMany({ where: { businessId: { in: ids } } }); await db.itemCategory.deleteMany({ where: { businessId: { in: ids } } }); await db.service.deleteMany({ where: { businessId: { in: ids } } }); await db.serviceCategory.deleteMany({ where: { businessId: { in: ids } } }); await db.businessLocation.deleteMany({ where: { businessId: { in: ids } } }); await db.business.deleteMany({ where: { id: { in: ids } } });
  await db.user.deleteMany({ where: { email: { startsWith: "phase3a-it-" } } });
}

beforeAll(async () => {
  await cleanupTestBusinesses();
  async function fixture(label: "a" | "b") {
    const user = await db.user.create({ data: { name: `Integration ${label}`, email: `${suffix}-${label}@example.test`, passwordHash: "not-used" } });
    const business = await db.business.create({ data: { name: `Salon ${label}`, slug: `${suffix}-${label}`, type: "SALON" } });
    const location = await db.businessLocation.create({ data: { businessId: business.id, name: "Main" } });
    const customer = await db.customer.create({ data: { businessId: business.id, name: `Guest ${label}`, phone: `900${label === "a" ? "0000001" : "0000002"}` } });
    const staff = await db.staffMember.create({ data: { businessId: business.id, userId: user.id, name: `Stylist ${label}`, phone: `800${label === "a" ? "0000001" : "0000002"}` } });
    const category = await db.serviceCategory.create({ data: { businessId: business.id, name: "Hair" } });
    const service = await db.service.create({ data: { businessId: business.id, categoryId: category.id, name: "Cut", durationMinutes: 30, price: new Prisma.Decimal("500") } });
    await db.staffService.create({ data: { businessId: business.id, staffId: staff.id, serviceId: service.id } });
    return { businessId: business.id, locationId: location.id, customerId: customer.id, staffId: staff.id, serviceId: service.id, categoryId: category.id, userId: user.id };
  }
  a = await fixture("a"); b = await fixture("b");
});

afterAll(async () => { await cleanupTestBusinesses(); await db.$disconnect(); });

describe("salon tenant boundaries", () => {
  it("blocks cross-tenant reads and writes for every salon record", async () => {
    const appointment = await booking(a, new Date("2026-10-12T10:00:00Z"));
    const walkIn = await db.walkIn.create({ data: { businessId: a.businessId, customerId: a.customerId, serviceId: a.serviceId, locationId: a.locationId } });
    const visit = await db.visit.create({ data: { businessId: a.businessId, customerId: a.customerId, locationId: a.locationId, totalAmount: new Prisma.Decimal("500"), services: { create: { serviceId: a.serviceId, staffId: a.staffId, priceSnapshot: new Prisma.Decimal("500"), durationSnapshot: 30 } } } });
    const appointmentService = await db.appointmentService.findFirstOrThrow({ where: { appointmentId: appointment.id } }); const visitService = await db.visitService.findFirstOrThrow({ where: { visitId: visit.id } });
    const ids = [a.serviceId, a.categoryId, appointment.id, appointmentService.id, walkIn.id, visit.id, visitService.id];
    const [service, category, appointmentRead, appointmentServiceRead, walkInRead, visitRead, visitServiceRead] = await Promise.all([
      db.service.findFirst({ where: { id: ids[0], businessId: b.businessId } }), db.serviceCategory.findFirst({ where: { id: ids[1], businessId: b.businessId } }), db.appointment.findFirst({ where: { id: ids[2], businessId: b.businessId } }), db.appointmentService.findFirst({ where: { id: ids[3], appointment: { businessId: b.businessId } } }), db.walkIn.findFirst({ where: { id: ids[4], businessId: b.businessId } }), db.visit.findFirst({ where: { id: ids[5], businessId: b.businessId } }), db.visitService.findFirst({ where: { id: ids[6], visit: { businessId: b.businessId } } }),
    ]);
    expect([service, category, appointmentRead, appointmentServiceRead, walkInRead, visitRead, visitServiceRead]).toEqual([null, null, null, null, null, null, null]);
    expect((await db.service.updateMany({ where: { id: a.serviceId, businessId: b.businessId }, data: { name: "Blocked" } })).count).toBe(0); expect((await db.serviceCategory.updateMany({ where: { id: a.categoryId, businessId: b.businessId }, data: { name: "Blocked" } })).count).toBe(0); expect((await db.appointment.updateMany({ where: { id: appointment.id, businessId: b.businessId }, data: { status: "CANCELLED" } })).count).toBe(0); expect((await db.appointmentService.updateMany({ where: { id: appointmentService.id, appointment: { businessId: b.businessId } }, data: { durationSnapshot: 1 } })).count).toBe(0); expect((await db.walkIn.updateMany({ where: { id: walkIn.id, businessId: b.businessId }, data: { status: "LEFT" } })).count).toBe(0); expect((await db.visit.updateMany({ where: { id: visit.id, businessId: b.businessId }, data: { status: "CANCELLED" } })).count).toBe(0); expect((await db.visitService.updateMany({ where: { id: visitService.id, visit: { businessId: b.businessId } }, data: { durationSnapshot: 1 } })).count).toBe(0);
    await expect(assertServiceCapability(owner(b.businessId,b.userId),a.staffId,a.serviceId)).rejects.toThrow("not assigned");
    await expect(createVisitForAppointment(owner(b.businessId,b.userId),appointment.id)).rejects.toThrow("not found");
  });

  it("scopes salon search-style queries to the active business", async () => {
    const rows = await db.service.findMany({ where: { businessId: b.businessId, name: { contains: "Cut" } } });
    expect(rows.map(row => row.id)).toEqual([b.serviceId]);
    const results = await searchBusiness(owner(b.businessId,b.userId),"Cut"); expect(results.filter(result=>result.type==="Service").map(result=>result.id)).toEqual([b.serviceId]);
  });
});

describe("appointment lifecycle, conflicts, and snapshots", () => {
  it("persists lifecycle, activity, visit snapshots, and payment", async () => {
    const context = owner(a.businessId,a.userId); const appointment = await booking(a,new Date("2026-10-13T10:00:00Z"));
    for (const target of ["CONFIRMED","ARRIVED","IN_SERVICE"] as const) expect((await transitionAppointment(context,appointment.id,target)).status).toBe(target);
    await expect(transitionAppointment(context,appointment.id,"CONFIRMED")).rejects.toThrow("cannot move");
    await db.service.update({ where: { id: a.serviceId }, data: { price: new Prisma.Decimal("900"), durationMinutes: 75 } });
    const visit = await createVisitForAppointment(context,appointment.id,{amount:"500",method:"CARD",note:"integration payment"}); const saved=await db.visit.findUniqueOrThrow({where:{id:visit.id},include:{services:true}});
    expect(saved.status).toBe("COMPLETED"); expect(saved.services[0]).toMatchObject({ serviceId:a.serviceId, staffId:a.staffId, durationSnapshot:30 }); expect(saved.services[0].priceSnapshot.toString()).toBe("500"); await db.appointment.update({where:{id:appointment.id},data:{staffId:null}}); expect((await db.visitService.findFirstOrThrow({where:{visitId:visit.id}})).staffId).toBe(a.staffId);
    expect(await db.transactionRecord.count({where:{businessId:a.businessId,reference:`Visit ${visit.id}`,amount:new Prisma.Decimal("500")}})).toBe(1);
    expect(await db.activity.count({where:{businessId:a.businessId,customerId:a.customerId,type:{in:["APPOINTMENT_CONFIRMED","APPOINTMENT_ARRIVED","APPOINTMENT_IN_SERVICE"]}}})).toBe(3);
  });

  it("applies conflict rules and audits an authorised override", async () => {
    const start=new Date("2026-10-14T10:00:00Z"); const existing=await booking(a,start); const context=owner(a.businessId,a.userId); const end=existing.endAt;
    await expect(assertStaffAvailable(context,a.staffId,start,end)).rejects.toThrow("already booked");
    await expect(assertStaffAvailable(context,a.staffId,new Date("2026-10-14T10:15:00Z"),new Date("2026-10-14T10:45:00Z"))).rejects.toThrow();
    await expect(assertStaffAvailable(context,a.staffId,new Date("2026-10-14T10:05:00Z"),new Date("2026-10-14T10:20:00Z"))).rejects.toThrow();
    await expect(assertStaffAvailable(context,a.staffId,end,new Date("2026-10-14T11:00:00Z"))).resolves.toBeNull();
    await db.appointment.update({where:{id:existing.id},data:{status:"CANCELLED"}}); await expect(assertStaffAvailable(context,a.staffId,start,end)).resolves.toBeNull();
    const active=await booking(a,start); await expect(assertStaffAvailable(managerWithoutOverride(a.businessId,a.userId),a.staffId,start,end,undefined,true)).rejects.toThrow("Missing permission"); const override=await assertStaffAvailable(manager(a.businessId,a.userId),a.staffId,start,end,undefined,true); expect(override?.id).toBe(active.id); await recordConflictOverride(context,active.id,override!.id); expect(await db.auditLog.count({where:{businessId:a.businessId,action:"appointment.conflict_overridden",entityId:active.id}})).toBe(1); const secondStaff=await db.staffMember.create({data:{businessId:a.businessId,name:"Second stylist",phone:"8999999999"}}); await db.staffService.create({data:{businessId:a.businessId,staffId:secondStaff.id,serviceId:a.serviceId}}); await expect(assertStaffAvailable(context,secondStaff.id,start,end)).resolves.toBeNull();
  });
});

describe("walk-in lifecycle and role guards", () => {
  it("creates a visit and payment only when completed", async () => {
    const context=owner(a.businessId,a.userId); const walkIn=await db.walkIn.create({data:{businessId:a.businessId,customerId:a.customerId,serviceId:a.serviceId,locationId:a.locationId}}); expect((await transitionWalkIn(context,walkIn.id,"ASSIGNED",a.staffId)).status).toBe("ASSIGNED"); expect((await transitionWalkIn(context,walkIn.id,"IN_SERVICE")).status).toBe("IN_SERVICE"); const visit=await createVisitForWalkIn(context,walkIn.id,{amount:"500",method:"UPI"}); const saved=await db.visit.findUniqueOrThrow({where:{id:visit.id},include:{services:true}}); expect(saved.services[0].durationSnapshot).toBe(75); expect(await db.transactionRecord.count({where:{businessId:a.businessId,reference:`Visit ${visit.id}`}})).toBe(1); expect(await db.activity.count({where:{businessId:a.businessId,customerId:a.customerId,type:"WALKIN_UPDATED"}})).toBeGreaterThanOrEqual(2); expect(await db.visit.count({where:{businessId:a.businessId,customerId:a.customerId,status:"COMPLETED"}})).toBeGreaterThanOrEqual(1); const left=await db.walkIn.create({data:{businessId:a.businessId,customerId:a.customerId,serviceId:a.serviceId,locationId:a.locationId}}); await transitionWalkIn(context,left.id,"LEFT"); expect(await db.visit.count({where:{businessId:a.businessId,notes:`walkin:${left.id}`}})).toBe(0);
  });

  it("enforces owner, manager, and staff permissions server-side", async () => {
    expect(()=>requirePermission(owner(a.businessId,a.userId),"services.manage")).not.toThrow(); expect(()=>requirePermission(owner(a.businessId,a.userId),"appointments.override_conflict")).not.toThrow(); expect(()=>requirePermission(manager(a.businessId,a.userId),"appointments.edit")).not.toThrow(); expect(()=>requirePermission(manager(a.businessId,a.userId),"walkins.manage")).not.toThrow(); expect(()=>requirePermission(manager(a.businessId,a.userId),"appointments.override_conflict")).not.toThrow(); expect(()=>requirePermission(managerWithoutOverride(a.businessId,a.userId),"appointments.override_conflict")).toThrow("Missing permission"); expect(()=>requirePermission(manager(a.businessId,a.userId),"services.manage")).toThrow("Missing permission"); expect(()=>requirePermission(staffContext(a.businessId,a.userId),"services.manage")).toThrow("Missing permission"); expect(()=>requirePermission(staffContext(a.businessId,a.userId),"appointments.override_conflict")).toThrow("Missing permission"); expect(()=>requirePermission(staffContext(a.businessId,a.userId),"transactions.view")).toThrow("Missing permission"); const own=await booking(a,new Date("2026-10-15T10:00:00Z")); expect(await canOperateAppointment(staffContext(a.businessId,a.userId),own.id)).toBe(true); expect(await canOperateAppointment(staffContext(b.businessId,b.userId),own.id)).toBe(false);
  });
});

describe("service inventory consumption", () => {
  async function inventoryFixture(quantity = "10") {
    const location = await db.inventoryLocation.create({ data: { businessId: a.businessId, name: `Stock ${Date.now()}-${Math.random()}` } });
    const item = await db.item.create({ data: { businessId: a.businessId, name: `Developer ${Date.now()}-${Math.random()}`, unit: "ml", reorderLevel: new Prisma.Decimal("2") } });
    await db.stockMovement.create({ data: { businessId: a.businessId, itemId: item.id, locationId: location.id, quantityChange: new Prisma.Decimal(quantity), type: "OPENING", userId: a.userId } });
    const rule = await db.serviceInventoryRequirement.create({ data: { businessId: a.businessId, serviceId: a.serviceId, itemId: item.id, quantityPerService: new Prisma.Decimal("2") } });
    return { location, item, rule };
  }

  it("deducts configured products exactly once and preserves the completed snapshot", async () => {
    const fixture=await inventoryFixture(); const appointment=await booking(a,new Date("2026-10-18T10:00:00Z")); const context=owner(a.businessId,a.userId);
    const visit=await createVisitForAppointment(context,appointment.id); const service=await db.visitService.findFirstOrThrow({where:{visitId:visit.id}});
    expect(await db.visitServiceInventoryUsage.count({where:{visitServiceId:service.id,itemId:fixture.item.id}})).toBe(1);
    expect((await db.stockMovement.aggregate({where:{businessId:a.businessId,itemId:fixture.item.id},_sum:{quantityChange:true}}))._sum.quantityChange?.toString()).toBe("8");
    await db.serviceInventoryRequirement.update({where:{id:fixture.rule.id},data:{quantityPerService:new Prisma.Decimal("7")}});
    expect((await db.visitServiceInventoryUsage.findFirstOrThrow({where:{visitServiceId:service.id,itemId:fixture.item.id}})).quantity.toString()).toBe("2");
    await createVisitForAppointment(context,appointment.id);
    expect(await db.stockMovement.count({where:{businessId:a.businessId,itemId:fixture.item.id,type:"ISSUE"}})).toBe(1);
  });

  it("does not deduct without a configuration and blocks or audits negative-stock overrides", async () => {
    const noConfig=await db.service.create({data:{businessId:a.businessId,name:`No product ${Date.now()}`,durationMinutes:20,price:new Prisma.Decimal("200")}});await db.staffService.create({data:{businessId:a.businessId,staffId:a.staffId,serviceId:noConfig.id}});
    const start=new Date("2026-10-19T10:00:00Z");const appointment=await db.appointment.create({data:{businessId:a.businessId,customerId:a.customerId,locationId:a.locationId,staffId:a.staffId,startAt:start,endAt:new Date(start.getTime()+20*60_000),source:"MANUAL",createdBy:a.userId,services:{create:{serviceId:noConfig.id,staffId:a.staffId,priceSnapshot:200,durationSnapshot:20}}}});await createVisitForAppointment(owner(a.businessId,a.userId),appointment.id);expect(await db.stockMovement.count({where:{businessId:a.businessId,type:"ISSUE"}})).toBeGreaterThanOrEqual(1);
    const fixture=await inventoryFixture("1");const insufficient=await booking(a,new Date("2026-10-20T10:00:00Z"));await expect(createVisitForAppointment(owner(a.businessId,a.userId),insufficient.id)).rejects.toThrow("insufficient stock");
    const override:{userId:string;businessId:string;permissions:Set<string>}={...owner(a.businessId,a.userId),permissions:new Set([...owner(a.businessId,a.userId).permissions,"inventory.negative_override"])};const completed=await createVisitForAppointment(override,insufficient.id,undefined,{reason:"Emergency service"});expect(await db.stockMovement.count({where:{businessId:a.businessId,itemId:fixture.item.id,type:"ISSUE",reason:{contains:"negative-stock override"}}})).toBe(1);expect(completed.status).toBe("COMPLETED");
  });
});
