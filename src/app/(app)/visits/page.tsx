import { adjustServiceConsumptionAction, applyMembershipDiscountAction, applyVisitDiscountAction, correctVisitServiceAction, usePackageCreditAction } from "@/app/actions";
import { AppDialog, IconTooltip } from "@/components/primitives";
import { EmptyState } from "@/components/ui";
import { membershipStatus, packageStatus } from "@/domain/memberships/service";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { ClipboardCheck, ReceiptText } from "lucide-react";

export default async function VisitsPage() {
  const c = await getTenantContext();
  await requireSalon(c);
  requirePermission(c, "visits.view");
  const [visits, staff, services, payments] = await Promise.all([
    db.visit.findMany({ where: { businessId: c.businessId, status: "COMPLETED" }, include: { customer: { include: { memberships: true, packages: { include: { items: true } } } }, primaryStaff: true, services: { include: { service: true, staff: true, packageUsage: true, inventoryUsages: { include: { item: true } } } } }, orderBy: { completedAt: "desc" }, take: 60 }),
    db.staffMember.findMany({ where: { businessId: c.businessId, status: "ACTIVE" }, orderBy: { name: "asc" } }),
    db.service.findMany({ where: { businessId: c.businessId, active: true }, orderBy: { name: "asc" } }),
    db.transactionRecord.findMany({ where: { businessId: c.businessId, type: "PAYMENT_IN", reference: { startsWith: "Visit " } }, select: { reference: true, method: true }, orderBy: { occurredAt: "desc" }, take: 100 }),
  ]);
  const paymentMethod = new Map(payments.map(payment => [payment.reference?.replace("Visit ", ""), payment.method]));

  return <>
    <header className="page-head page-head-actions">
      <div><p className="eyebrow">VISITS</p><h1>Completed visits</h1><p className="muted">Review completed work and make traceable corrections when a record needs fixing.</p></div>
      <span className="page-count"><ClipboardCheck aria-hidden="true"/>{visits.length} completed</span>
    </header>
    <section className="card visits-table-card">
      {visits.length ? <div className="table-wrap visits-table-wrap"><table className="visits-table"><thead><tr><th>Customer</th><th>Date</th><th>Services</th><th>Staff</th><th>Amount</th><th>Payment</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{visits.map(visit => {
        const staffNames = [...new Set(visit.services.map(row => row.staff?.name).filter(Boolean))];
        const method = paymentMethod.get(visit.id);
        return <tr key={visit.id}>
          <td data-label="Customer"><strong>{visit.customer.name}</strong><small className="table-note">{visit.source.replaceAll("_", " ")}</small></td>
          <td data-label="Date">{visit.completedAt?.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}<small className="table-note">{visit.completedAt?.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</small></td>
          <td data-label="Services"><span className="visit-service-preview">{visit.services.slice(0, 2).map(row => row.service.name).join(", ")}{visit.services.length > 2 ? ` +${visit.services.length - 2}` : ""}</span></td>
          <td data-label="Staff">{staffNames.length ? staffNames.join(", ") : visit.primaryStaff?.name || <span className="muted">Unassigned</span>}</td>
          <td data-label="Amount"><strong>₹{visit.totalAmount.toString()}</strong></td>
          <td data-label="Payment">{method ? <span className="payment-method"><ReceiptText aria-hidden="true"/>{method}</span> : <span className="muted">Not recorded</span>}</td>
          <td className="table-actions" data-label="Actions"><IconTooltip label={`Review ${visit.customer.name}'s visit`}><AppDialog title={`${visit.customer.name}'s visit`} description={`${visit.completedAt?.toLocaleString() || "Completed visit"} · ₹${visit.totalAmount.toString()}`} trigger={<button className="btn secondary compact-action" type="button">Review</button>}>
            <div className="visit-dialog-list">{visit.services.map(row => <VisitServicePanel key={row.id} row={row} visit={visit} staff={staff} services={services} permissions={c.permissions}/>)}</div>
          </AppDialog></IconTooltip></td>
        </tr>;
      })}</tbody></table></div> : <EmptyState title="No completed visits" description="Completed appointments and walk-ins will appear here." />}
    </section>
  </>;
}

function VisitServicePanel({ row, visit, staff, services, permissions }: {
  row: any; visit: any; staff: { id: string; name: string }[]; services: { id: string; name: string }[]; permissions: Set<string>;
}) {
  const eligible = visit.customer.packages.filter((pack: any) => packageStatus(pack) === "ACTIVE" && pack.items.some((item: any) => item.serviceId === row.serviceId && item.usedQuantity < item.includedQuantity));
  const members = visit.customer.memberships.filter((member: any) => membershipStatus(member) === "ACTIVE");
  return <section className="visit-service-panel">
    <div className="visit-service-heading"><div><strong>{row.service.name}</strong><span>{row.staff?.name || "No staff assigned"}</span></div><div><b>₹{row.finalAmount.toString()}</b>{row.packageUsage && <span className="badge badge-success">Package credit</span>}{row.discountSource === "MEMBERSHIP" && <span className="badge">Member benefit</span>}</div></div>
    {row.inventoryUsages.length > 0 && <div className="visit-products"><span>Products used</span>{row.inventoryUsages.map((usage: any) => <span key={usage.id}>{usage.item.name} · {usage.quantity.toString()} {usage.unitSnapshot}</span>)}</div>}
    <div className="visit-service-actions">
      {!row.packageUsage && permissions.has("packages.use") && eligible.length > 0 && <form action={usePackageCreditAction.bind(null, row.id)}><label>Use package credit<select name="customerPackageId" required defaultValue=""><option value="">Choose package</option>{eligible.map((pack: any) => <option key={pack.id} value={pack.id}>{pack.packageNameSnapshot} · {pack.items.find((item: any) => item.serviceId === row.serviceId)!.includedQuantity - pack.items.find((item: any) => item.serviceId === row.serviceId)!.usedQuantity} remaining</option>)}</select></label><button className="btn secondary" type="submit">Apply credit</button></form>}
      {!row.packageUsage && row.discountSource !== "MEMBERSHIP" && permissions.has("discounts.apply") && members.length > 0 && <form action={applyMembershipDiscountAction.bind(null, row.id)}><label>Apply membership<select name="membershipId" required defaultValue=""><option value="">Choose membership</option>{members.map((member: any) => <option key={member.id} value={member.id}>{member.planNameSnapshot} · ends {member.endDate.toLocaleDateString()}</option>)}</select></label><button className="btn secondary" type="submit">Apply benefit</button></form>}
      {permissions.has("discounts.apply") && row.discountSource !== "MEMBERSHIP" && <AppDialog title={`Manual discount · ${row.service.name}`} description="Discounts are recorded against this service and cannot silently stack with membership benefits." trigger={<button className="btn secondary" type="button">Add discount</button>}><form action={applyVisitDiscountAction.bind(null, row.id)} className="form-grid dialog-form"><label>Discount type<select name="type"><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label><label>Value<input name="value" inputMode="decimal" required /></label><label className="wide">Reason<input name="reason" required /></label><button className="btn" type="submit">Apply discount</button></form></AppDialog>}
      {permissions.has("visits.manage") && <AppDialog title={`Correct ${row.service.name}`} description="Use corrections only to repair a factual historical record." trigger={<button className="btn secondary" type="button">Correct record</button>}><form action={correctVisitServiceAction.bind(null, row.id)} className="form-grid dialog-form"><label>Service<select name="serviceId" defaultValue={row.serviceId}>{services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>Staff<select name="staffId" defaultValue={row.staffId || ""}><option value="">Unassigned</option>{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Final amount<input name="amount" inputMode="decimal" defaultValue={row.finalAmount.toString()} required /></label><label className="wide">Reason<input name="reason" required /></label><button className="btn" type="submit">Save correction</button></form></AppDialog>}
      {permissions.has("inventory.manage") && row.inventoryUsages.map((usage: any) => <AppDialog key={usage.id} title={`Adjust ${usage.item.name} usage`} description="This records a stock adjustment; it does not rewrite the original service snapshot." trigger={<button className="btn secondary" type="button">Adjust {usage.item.name}</button>}><form action={adjustServiceConsumptionAction.bind(null, row.id)} className="form-grid dialog-form"><input type="hidden" name="itemId" value={usage.itemId}/><label>Adjustment quantity<input name="quantity" inputMode="decimal" placeholder="0.000" required /></label><label>Reason<input name="reason" required /></label><button className="btn" type="submit">Record adjustment</button></form></AppDialog>)}
    </div>
  </section>;
}
