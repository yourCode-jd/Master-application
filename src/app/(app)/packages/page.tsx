import Link from "next/link";
import { cancelPackageAction, createMembershipFollowUpAction, purchasePackageAction, saveServicePackageAction } from "@/app/actions";
import { SectionCard } from "@/components/ui";
import { packageStatus } from "@/domain/memberships/service";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";

const inputDate = (value: Date) => value.toISOString().slice(0, 10);

export default async function PackagesPage() {
  const context = await getTenantContext();
  await requireSalon(context);
  requirePermission(context, "packages.view");
  const [packages, purchases, customers, services] = await Promise.all([
    db.servicePackage.findMany({ where: { businessId: context.businessId }, include: { items: { include: { service: true } } }, orderBy: { name: "asc" } }),
    db.customerPackage.findMany({ where: { businessId: context.businessId }, include: { customer: true, items: true }, orderBy: { purchasedAt: "desc" }, take: 60 }),
    db.customer.findMany({ where: { businessId: context.businessId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { businessId: context.businessId, active: true }, orderBy: { name: "asc" } }),
  ]);
  const now = new Date();
  const active = purchases.filter((item) => packageStatus(item) === "ACTIVE");
  const canFollow = context.permissions.has("followups.manage");
  return <>
    <div className="page-head"><div><p className="eyebrow">SERVICE PACKAGES</p><h1>Packages</h1><p className="muted">Prepaid service credits with clear remaining visits.</p></div></div>
    <section className="salon-metrics"><article><span>Active packages</span><strong>{active.length}</strong><small>Available credits</small></article><article><span>Used</span><strong>{purchases.filter((item) => packageStatus(item) === "USED").length}</strong><small>Completed packages</small></article><article><span>Expiring soon</span><strong>{active.filter((item) => item.expiryDate && item.expiryDate.getTime() - now.getTime() <= 7 * 86_400_000).length}</strong><small>Within seven days</small></article></section>
    {context.permissions.has("packages.manage") && <div className="two-col salon-forms">
      <SectionCard title="New package"><form action={saveServicePackageAction.bind(null, undefined)} className="form-grid"><label>Name<input name="name" required /></label><label>Price<input name="price" inputMode="decimal" required /></label><label>Validity days <span className="muted">(optional)</span><input name="validityDays" type="number" min="1" /></label><label className="wide">Description<input name="description" /></label><label>Included service<select name="serviceId" required><option value="">Choose service</option>{services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Quantity<input name="quantity" type="number" min="1" defaultValue="1" required /></label><button className="btn">Save package</button></form></SectionCard>
      <SectionCard title="Sell package"><form action={purchasePackageAction} className="form-grid"><label className="wide">Customer<select name="customerId" required><option value="">Choose customer</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>Package<select name="packageId" required><option value="">Choose package</option>{packages.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name} · ₹{item.price.toString()}</option>)}</select></label><label>Start date<input name="startDate" type="date" defaultValue={inputDate(now)} required /></label><label>Payment method<select name="method"><option>CASH</option><option>UPI</option><option>CARD</option><option>BANK</option></select></label><button className="btn">Record & sell</button></form></SectionCard>
    </div>}
    <SectionCard title="Customer packages"><div className="table-wrap"><table className="inventory-table"><thead><tr><th>Customer</th><th>Package</th><th>Remaining</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead><tbody>{purchases.map((item) => {
      const status = packageStatus(item); const needsFollow = status !== "ACTIVE" || item.items.some((row) => row.includedQuantity - row.usedQuantity <= 1) || Boolean(item.expiryDate && item.expiryDate.getTime() - now.getTime() <= 7 * 86_400_000);
      const canCancel = context.permissions.has("packages.cancel") && status === "ACTIVE";
      return <tr key={item.id}><td data-label="Customer"><Link href={`/customers/${item.customerId}`}><strong>{item.customer.name}</strong></Link></td><td data-label="Package">{item.packageNameSnapshot}</td><td data-label="Remaining">{item.items.map((row) => `${row.serviceNameSnapshot}: ${row.includedQuantity - row.usedQuantity}`).join(" · ")}</td><td data-label="Expires">{item.expiryDate?.toLocaleDateString() || "No expiry"}</td><td data-label="Status"><span className="badge">{status}</span></td><td data-label="Action"><div className="inline-actions">{canCancel && <details><summary className="text-button">Cancel</summary><form action={cancelPackageAction.bind(null, item.id)} className="inline-edit"><input name="reason" placeholder="Reason" required /><button className="text-button">Confirm</button></form></details>}{canFollow && needsFollow && <form action={createMembershipFollowUpAction}><input type="hidden" name="kind" value="package" /><input type="hidden" name="id" value={item.id} /><button className="text-button">Create follow-up</button></form>}{!canCancel && !(canFollow && needsFollow) && "—"}</div></td></tr>;
    })}</tbody></table></div></SectionCard>
  </>;
}
