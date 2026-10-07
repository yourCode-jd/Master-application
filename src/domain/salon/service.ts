import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { AccessError, businessWhere, requirePermission, type TenantContext } from "@/lib/tenant";
import { appointmentEnd, assertTransition } from "@/lib/salon-rules";
import { createRecommendationsForVisit } from "@/domain/retention/service";
import { commissionSnapshot } from "@/domain/finance/service";
import { consumeServiceInventory } from "@/domain/inventory/consumption";

const activeAppointmentStatuses = ["PENDING", "CONFIRMED", "ARRIVED", "IN_SERVICE"] as const;

export async function requireSalon(context: TenantContext) {
  const business = await db.business.findFirst({ where: { id: context.businessId, type: "SALON", status: "ACTIVE" } });
  if (!business) throw new AccessError("The salon workspace is unavailable.");
  return business;
}

export { appointmentEnd, assertTransition };

export async function assertStaffAvailable(context: TenantContext, staffId: string, startAt: Date, endAt: Date, excludeId?: string, allowOverride = false) {
  const staff = await db.staffMember.findFirst({ where: businessWhere(context, { id: staffId, status: "ACTIVE" }) });
  if (!staff) throw new Error("Choose an active staff member from this salon.");
  const conflict = await db.appointment.findFirst({
    where: {
      businessId: context.businessId,
      staffId,
      status: { in: [...activeAppointmentStatuses] },
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    include: { customer: { select: { name: true } } },
  });
  if (conflict && !allowOverride) throw new Error(`${staff.name} is already booked with ${conflict.customer.name} during this time.`);
  if (conflict && allowOverride && !context.permissions.has("appointments.override_conflict")) throw new AccessError("Missing permission: appointments.override_conflict");
  return conflict;
}

export async function assertServiceCapability(context: TenantContext, staffId: string | null, serviceId: string) {
  if (!staffId) return;
  const capability = await db.staffService.findFirst({ where: { businessId: context.businessId, staffId, serviceId, active: true } });
  if (!capability) throw new Error("This staff member is not assigned to perform the selected service.");
}

export async function canOperateAppointment(context: TenantContext, appointmentId: string) {
  if (context.permissions.has("appointments.edit") || context.permissions.has("visits.manage")) return true;
  const staff = await db.staffMember.findFirst({ where: businessWhere(context, { userId: context.userId, status: "ACTIVE" }) });
  const appointment = await db.appointment.findFirst({ where: businessWhere(context, { id: appointmentId }) });
  return Boolean(staff && appointment?.staffId === staff.id);
}

export async function transitionAppointment(context: TenantContext, appointmentId: string, target: "CONFIRMED" | "ARRIVED" | "IN_SERVICE" | "CANCELLED" | "NO_SHOW") {
  const appointment = await db.appointment.findFirst({ where: businessWhere(context, { id: appointmentId }) });
  if (!appointment) throw new AccessError("Appointment not found in this salon.");
  assertTransition(appointment.status, target);
  const updated = await db.appointment.update({ where: { id: appointment.id }, data: { status: target } });
  await logSalonActivity(context, appointment.customerId, `APPOINTMENT_${target}`, target === "NO_SHOW" ? "Appointment marked as no-show" : `Appointment marked ${target.toLowerCase().replace("_", " ")}`);
  await auditSalon(context, `appointment.${target.toLowerCase()}`, "Appointment", appointment.id, { status: appointment.status }, { status: target });
  return updated;
}

export async function transitionWalkIn(context: TenantContext, walkInId: string, target: "ASSIGNED" | "IN_SERVICE" | "LEFT", assignedStaffId?: string | null) {
  const walkIn = await db.walkIn.findFirst({ where: businessWhere(context, { id: walkInId }) });
  if (!walkIn) throw new AccessError("Walk-in not found in this salon.");
  if (target === "ASSIGNED" && !assignedStaffId) throw new Error("Choose a staff member to assign.");
  if (target === "ASSIGNED" && assignedStaffId) await assertServiceCapability(context, assignedStaffId, walkIn.serviceId);
  if (target === "IN_SERVICE" && walkIn.status !== "ASSIGNED") throw new Error("Assign the walk-in before starting service.");
  if (target === "LEFT" && !["WAITING", "ASSIGNED", "IN_SERVICE"].includes(walkIn.status)) throw new Error("This walk-in cannot be marked left.");
  const updated = await db.walkIn.update({ where: { id: walkIn.id }, data: { status: target, ...(target === "ASSIGNED" ? { assignedStaffId } : {}) } });
  await logSalonActivity(context, walkIn.customerId, "WALKIN_UPDATED", target === "LEFT" ? "Walk-in marked left" : `Walk-in ${target.toLowerCase().replace("_", " ")}`);
  await auditSalon(context, `walkin.${target.toLowerCase()}`, "WalkIn", walkIn.id, { status: walkIn.status }, { status: target });
  return updated;
}

export async function createVisitForAppointment(context: TenantContext, appointmentId: string, payment?: { amount: string; method: "CASH" | "UPI" | "CARD" | "BANK" | "OTHER"; note?: string }, inventoryOverride?: { reason: string }) {
  if(inventoryOverride){requirePermission(context,"inventory.negative_override");if(!inventoryOverride.reason.trim())throw new Error("Explain the negative-stock override.");}
  return db.$transaction(async (tx) => {
    const appointment = await tx.appointment.findFirst({ where: { id: appointmentId, businessId: context.businessId }, include: { services: true } });
    if (!appointment) throw new Error("Appointment not found.");
    const existing = await tx.visit.findFirst({ where: { businessId: context.businessId, appointmentId } });
    if (existing) return existing;
    const completedAt=new Date(); const serviceSnapshots=await Promise.all(appointment.services.map(async row=>({...row,...await commissionSnapshot(tx,context.businessId,row.staffId,row.serviceId,row.priceSnapshot,completedAt)})));
    const total = serviceSnapshots.reduce((sum, row) => sum.add(row.priceSnapshot), new Prisma.Decimal(0));
    const visit = await tx.visit.create({
      data: {
        businessId: context.businessId, customerId: appointment.customerId, locationId: appointment.locationId,
        appointmentId: appointment.id, primaryStaffId: appointment.staffId, source: "MANUAL", startedAt: appointment.startAt,
        completedAt, status: "COMPLETED", totalAmount: total,
        services: { create: serviceSnapshots.map((row) => ({ serviceId: row.serviceId, staffId: row.staffId, priceSnapshot: row.priceSnapshot, durationSnapshot: row.durationSnapshot, finalAmount:row.priceSnapshot,commissionType:row.commissionType,commissionValue:row.commissionValue,commissionAmount:row.commissionAmount,commissionRuleId:row.commissionRuleId })) },
      },
    });
    await tx.appointment.update({ where: { id: appointment.id }, data: { status: "COMPLETED" } });
    const createdServices=await tx.visitService.findMany({where:{visitId:visit.id}});for(const row of createdServices)await consumeServiceInventory(tx,{businessId:context.businessId,visitServiceId:row.id,serviceId:row.serviceId,userId:context.userId,staffId:row.staffId,allowNegative:Boolean(inventoryOverride),overrideReason:inventoryOverride?.reason});
    await createRecommendationsForVisit(tx,{businessId:context.businessId,visitId:visit.id,customerId:appointment.customerId,completedAt:visit.completedAt!,services:appointment.services.map(row=>({serviceId:row.serviceId,staffId:row.staffId}))});
    if (payment && /^\d+(\.\d{1,2})?$/.test(payment.amount) && new Prisma.Decimal(payment.amount).gt(0)) {
      await tx.transactionRecord.create({ data: { businessId: context.businessId, type: "PAYMENT_IN", method: payment.method, amount: new Prisma.Decimal(payment.amount), reference: `Visit ${visit.id}`, notes: payment.note || null, createdBy: context.userId } });
    }
    return visit;
  });
}

export async function createVisitForWalkIn(context: TenantContext, walkInId: string, payment?: { amount: string; method: "CASH" | "UPI" | "CARD" | "BANK" | "OTHER"; note?: string }, inventoryOverride?: { reason: string }) {
  if(inventoryOverride){requirePermission(context,"inventory.negative_override");if(!inventoryOverride.reason.trim())throw new Error("Explain the negative-stock override.");}
  return db.$transaction(async (tx) => {
    const walkIn = await tx.walkIn.findFirst({ where: { id: walkInId, businessId: context.businessId }, include: { service: true } });
    if (!walkIn) throw new Error("Walk-in not found.");
    const existing = await tx.visit.findFirst({ where: { businessId: context.businessId, notes: `walkin:${walkInId}` } });
    if (existing) return existing;
    const completedAt=new Date(), commission=await commissionSnapshot(tx,context.businessId,walkIn.assignedStaffId,walkIn.serviceId,walkIn.service.price,completedAt);
    const visit = await tx.visit.create({ data: { businessId: context.businessId, customerId: walkIn.customerId, locationId: walkIn.locationId, primaryStaffId: walkIn.assignedStaffId, source: "WALK_IN", startedAt: walkIn.createdAt, completedAt, status: "COMPLETED", notes: `walkin:${walkInId}`, totalAmount: walkIn.service.price, services: { create: { serviceId: walkIn.serviceId, staffId: walkIn.assignedStaffId, priceSnapshot: walkIn.service.price, durationSnapshot: walkIn.service.durationMinutes,finalAmount:walkIn.service.price,...commission } } } });
    await tx.walkIn.update({ where: { id: walkInId }, data: { status: "COMPLETED" } });
    const createdService=await tx.visitService.findFirstOrThrow({where:{visitId:visit.id}});await consumeServiceInventory(tx,{businessId:context.businessId,visitServiceId:createdService.id,serviceId:createdService.serviceId,userId:context.userId,staffId:createdService.staffId,allowNegative:Boolean(inventoryOverride),overrideReason:inventoryOverride?.reason});
    await createRecommendationsForVisit(tx,{businessId:context.businessId,visitId:visit.id,customerId:walkIn.customerId,completedAt:visit.completedAt!,services:[{serviceId:walkIn.serviceId,staffId:walkIn.assignedStaffId}]});
    if (payment && /^\d+(\.\d{1,2})?$/.test(payment.amount) && new Prisma.Decimal(payment.amount).gt(0)) await tx.transactionRecord.create({ data: { businessId: context.businessId, type: "PAYMENT_IN", method: payment.method, amount: new Prisma.Decimal(payment.amount), reference: `Visit ${visit.id}`, notes: payment.note || null, createdBy: context.userId } });
    return visit;
  });
}

export async function logSalonActivity(context: TenantContext, customerId: string | null, type: string, title: string, description?: string) {
  await db.activity.create({ data: { businessId: context.businessId, customerId, type, title, description: description || null } });
}

export async function auditSalon(context: TenantContext, action: string, entityType: string, entityId: string, before?: Prisma.InputJsonValue, after?: Prisma.InputJsonValue) {
  await audit(context, action, entityType, entityId, before, after);
}

export async function recordConflictOverride(context: TenantContext, appointmentId: string, conflictId: string) {
  requirePermission(context, "appointments.override_conflict");
  await auditSalon(context, "appointment.conflict_overridden", "Appointment", appointmentId, undefined, { conflictId });
}
