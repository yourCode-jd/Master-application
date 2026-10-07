import { Prisma } from "@prisma/client";

/** Snapshot active requirements into immutable visit usage and linked stock movements. */
export async function consumeServiceInventory(tx: Prisma.TransactionClient, input: { businessId: string; visitServiceId: string; serviceId: string; locationId?: string; userId: string; staffId: string | null; allowNegative?: boolean; overrideReason?: string }) {
  const requirements = await tx.serviceInventoryRequirement.findMany({ where: { businessId: input.businessId, serviceId: input.serviceId, active: true }, include: { item: true } });
  if (!requirements.length) return;
  const locationId = input.locationId ?? (await tx.inventoryLocation.findFirst({ where: { businessId: input.businessId, active: true }, orderBy: { createdAt: "asc" } }))?.id;
  if (!locationId) throw new Error("Create an inventory location before completing a service that consumes stock.");
  for (const requirement of requirements) {
    const existing = await tx.visitServiceInventoryUsage.findUnique({ where: { visitServiceId_itemId: { visitServiceId: input.visitServiceId, itemId: requirement.itemId } } });
    if (existing) continue;
    const onHand = await tx.stockMovement.aggregate({ where: { businessId: input.businessId, itemId: requirement.itemId, locationId }, _sum: { quantityChange: true } });
    const available = new Prisma.Decimal(onHand._sum.quantityChange || 0);
    if (available.lt(requirement.quantityPerService) && !input.allowNegative) throw new Error(`${requirement.item.name} has insufficient stock for this service.`);
    const usage = await tx.visitServiceInventoryUsage.create({ data: { businessId: input.businessId, visitServiceId: input.visitServiceId, itemId: requirement.itemId, quantity: requirement.quantityPerService, unitSnapshot: requirement.item.unit, requirementId: requirement.id } });
    await tx.stockMovement.create({ data: { businessId: input.businessId, itemId: requirement.itemId, locationId, quantityChange: requirement.quantityPerService.negated(), type: "ISSUE", reason: available.lt(requirement.quantityPerService) ? `Service consumption — negative-stock override: ${input.overrideReason}` : "Service consumption", staffId: input.staffId, userId: input.userId, visitServiceUsageId: usage.id } });
    await tx.activity.create({ data: { businessId: input.businessId, staffId: input.staffId, type: "SERVICE_INVENTORY_CONSUMED", title: "Service consumed inventory", description: `${requirement.item.name}: ${requirement.quantityPerService.toString()} ${requirement.item.unit}`, metadata: { visitServiceId: input.visitServiceId, itemId: requirement.itemId, usageId: usage.id } } });
  }
}
