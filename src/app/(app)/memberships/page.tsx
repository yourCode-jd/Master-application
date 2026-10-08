import Link from "next/link";
import { cancelMembershipAction, createMembershipFollowUpAction, purchaseMembershipAction, saveMembershipPlanAction } from "@/app/actions";
import { SectionCard } from "@/components/ui";
import { membershipStatus } from "@/domain/memberships/service";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";

const inputDate = (value: Date) => value.toISOString().slice(0, 10);

export default async function MembershipsPage() {
  const context = await getTenantContext();
  await requireSalon(context);
  requirePermission(context, "memberships.view");
  const [plans, memberships, customers] = await Promise.all([
    db.membershipPlan.findMany({ where: { businessId: context.businessId }, orderBy: { name: "asc" } }),
    db.customerMembership.findMany({ where: { businessId: context.businessId }, include: { customer: true }, orderBy: { purchasedAt: "desc" }, take: 60 }),
    db.customer.findMany({ where: { businessId: context.businessId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();
  const active = memberships.filter((item) => membershipStatus(item) === "ACTIVE");
  const expiring = active.filter((item) => item.endDate.getTime() - now.getTime() <= 7 * 86_400_000);
  const canFollow = context.permissions.has("followups.manage");
  return <>
    <div className="page-head"><div><p className="eyebrow">MEMBERSHIPS</p><h1>Memberships</h1><p className="muted">Sell simple salon memberships and keep expiry dates clear.</p></div></div>
    <section className="salon-metrics"><article><span>Active</span><strong>{active.length}</strong><small>Current members</small></article><article><span>Expiring soon</span><strong>{expiring.length}</strong><small>Within seven days</small></article><article><span>Expired</span><strong>{memberships.filter((item) => membershipStatus(item) === "EXPIRED").length}</strong><small>Historical records</small></article></section>
    {context.permissions.has("memberships.manage") && <div className="two-col salon-forms">
      <SectionCard title="New membership plan"><form action={saveMembershipPlanAction.bind(null, undefined)} className="form-grid"><label>Name<input name="name" required /></label><label>Price<input name="price" inputMode="decimal" required /></label><label>Validity days<input name="validityDays" type="number" min="1" required /></label><label className="wide">Benefits or member note<textarea name="benefits" placeholder="e.g. 10% off services" /></label><label className="wide">Description<input name="description" /></label><button className="btn">Save plan</button></form></SectionCard>
      <SectionCard title="Activate membership"><form action={purchaseMembershipAction} className="form-grid"><label className="wide">Customer<select name="customerId" required><option value="">Choose customer</option>{customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Plan<select name="planId" required><option value="">Choose plan</option>{plans.filter((item) => item.active).map((item) => <option value={item.id} key={item.id}>{item.name} · ₹{item.price.toString()}</option>)}</select></label><label>Start date<input name="startDate" type="date" defaultValue={inputDate(now)} required /></label><label>Payment method<select name="method"><option>CASH</option><option>UPI</option><option>CARD</option><option>BANK</option></select></label><button className="btn">Record & activate</button></form></SectionCard>
    </div>}
    <SectionCard title="Member overview"><div className="table-wrap"><table className="inventory-table"><thead><tr><th>Customer</th><th>Membership</th><th>Ends</th><th>Status</th><th>Action</th></tr></thead><tbody>{memberships.map((item) => {
      const status = membershipStatus(item); const needsFollow = status === "EXPIRED" || item.endDate.getTime() - now.getTime() <= 7 * 86_400_000;
      const canCancel = context.permissions.has("memberships.cancel") && status === "ACTIVE";
      return <tr key={item.id}><td data-label="Customer"><Link href={`/customers/${item.customerId}`}><strong>{item.customer.name}</strong></Link></td><td data-label="Membership">{item.planNameSnapshot}</td><td data-label="Ends">{item.endDate.toLocaleDateString()}</td><td data-label="Status"><span className="badge">{status}</span></td><td data-label="Action"><div className="inline-actions">{canCancel && <details><summary className="text-button">Cancel</summary><form action={cancelMembershipAction.bind(null, item.id)} className="inline-edit"><input name="reason" placeholder="Reason" required /><button className="text-button">Confirm</button></form></details>}{canFollow && needsFollow && <form action={createMembershipFollowUpAction}><input type="hidden" name="kind" value="membership" /><input type="hidden" name="id" value={item.id} /><button className="text-button">Create follow-up</button></form>}{!canCancel && !(canFollow && needsFollow) && "—"}</div></td></tr>;
    })}</tbody></table></div></SectionCard>
  </>;
}
