import type { TenantContext } from "@/lib/tenant";
import { db } from "@/lib/db";

export type SearchResult = { type: "Customer" | "Staff" | "Item" | "Supplier" | "Service" | "Appointment" | "Follow-up" | "Membership" | "Package"; id: string; title: string; detail: string; href: string };

export async function searchBusiness(context: TenantContext, query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const salon = await db.business.findFirst({ where: { id: context.businessId, type: "SALON" }, select: { id: true } });
  const ownStaff = salon && !context.permissions.has("followups.manage") ? await db.staffMember.findFirst({ where: { businessId: context.businessId, userId: context.userId }, select: { id: true } }) : null;
  const [customers, staff, items, suppliers, services, appointments, followUps, membershipPlans, membershipCustomers, packagePlans, packageCustomers] = await Promise.all([
    context.permissions.has("customers.view") ? db.customer.findMany({ where: { businessId: context.businessId, OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }, take: 6 }) : [],
    context.permissions.has("staff.view") ? db.staffMember.findMany({ where: { businessId: context.businessId, OR: [{ name: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }] }, take: 6 }) : [],
    context.permissions.has("inventory.view") ? db.item.findMany({ where: { businessId: context.businessId, OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { barcode: { contains: q, mode: "insensitive" } }] }, take: 6 }) : [],
    context.permissions.has("suppliers.view") ? db.supplier.findMany({ where: { businessId: context.businessId, name: { contains: q, mode: "insensitive" } }, take: 6 }) : [],
    salon && context.permissions.has("services.view") ? db.service.findMany({ where: { businessId: context.businessId, name: { contains: q, mode: "insensitive" } }, take: 6 }) : [],
    salon && context.permissions.has("appointments.view") ? db.appointment.findMany({ where: { businessId: context.businessId, OR: [{ customer: { name: { contains: q, mode: "insensitive" } } }, { customer: { phone: { contains: q } } }] }, include: { customer: true }, take: 6, orderBy: { startAt: "desc" } }) : [],
    salon && context.permissions.has("followups.view") ? db.returnRecommendation.findMany({ where: { businessId: context.businessId, ...(!context.permissions.has("followups.manage") ? { staffId: ownStaff?.id ?? "__none__" } : {}), status: { in: ["UPCOMING", "DUE", "CONTACTED", "BOOKED"] }, OR: [{ customer: { name: { contains: q, mode: "insensitive" } } }, { service: { name: { contains: q, mode: "insensitive" } } }] }, include: { customer: true, service: true }, take: 6, orderBy: { recommendedDate: "asc" } }) : [],
    salon && context.permissions.has("memberships.view") ? db.membershipPlan.findMany({where:{businessId:context.businessId,name:{contains:q,mode:"insensitive"}},take:6}) : [],
    salon && context.permissions.has("memberships.view") ? db.customerMembership.findMany({where:{businessId:context.businessId,status:"ACTIVE",OR:[{planNameSnapshot:{contains:q,mode:"insensitive"}},{customer:{name:{contains:q,mode:"insensitive"}}}]},include:{customer:true},take:6}) : [],
    salon && context.permissions.has("packages.view") ? db.servicePackage.findMany({where:{businessId:context.businessId,name:{contains:q,mode:"insensitive"}},take:6}) : [],
    salon && context.permissions.has("packages.view") ? db.customerPackage.findMany({where:{businessId:context.businessId,status:"ACTIVE",OR:[{packageNameSnapshot:{contains:q,mode:"insensitive"}},{customer:{name:{contains:q,mode:"insensitive"}}}]},include:{customer:true,items:true},take:6}) : [],
  ]);
  return [
    ...customers.map(x => ({ type: "Customer" as const, id: x.id, title: x.name, detail: x.phone, href: `/customers/${x.id}` })),
    ...staff.map(x => ({ type: "Staff" as const, id: x.id, title: x.name, detail: x.phone, href: `/staff/${x.id}` })),
    ...items.map(x => ({ type: "Item" as const, id: x.id, title: x.name, detail: x.sku ?? x.unit, href: `/inventory/${x.id}` })),
    ...suppliers.map(x => ({ type: "Supplier" as const, id: x.id, title: x.name, detail: x.phone, href: `/suppliers/${x.id}` })),
    ...services.map(x => ({ type: "Service" as const, id: x.id, title: x.name, detail: `${x.durationMinutes} min · ₹${x.price.toString()}`, href: "/services" })),
    ...appointments.map(x => ({ type: "Appointment" as const, id: x.id, title: x.customer.name, detail: x.startAt.toLocaleString(), href: `/appointments/${x.id}` })),
    ...followUps.map(x => ({ type: "Follow-up" as const, id: x.id, title: x.customer.name, detail: `${x.service.name} · return due ${x.recommendedDate.toLocaleDateString()}`, href: `/follow-ups?service=${x.serviceId}` })),
    ...membershipPlans.map(x=>({type:"Membership" as const,id:x.id,title:x.name,detail:`Plan · ₹${x.price.toString()}`,href:"/memberships"})),
    ...membershipCustomers.map(x=>({type:"Membership" as const,id:x.id,title:`${x.customer.name} — ${x.planNameSnapshot}`,detail:`Active · ends ${x.endDate.toLocaleDateString()}`,href:`/customers/${x.customerId}`})),
    ...packagePlans.map(x=>({type:"Package" as const,id:x.id,title:x.name,detail:`Package · ₹${x.price.toString()}`,href:"/packages"})),
    ...packageCustomers.map(x=>({type:"Package" as const,id:x.id,title:`${x.customer.name} — ${x.packageNameSnapshot}`,detail:x.items.map(item=>`${item.includedQuantity-item.usedQuantity} remaining`).join(" · "),href:`/customers/${x.customerId}`})),
  ];
}
