import Link from "next/link";
import { notFound } from "next/navigation";
import { cancelPurchaseAction, receivePurchaseAction } from "@/app/actions";
import { EmptyState, SectionCard } from "@/components/ui";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";

const money = (amount: { toString(): string }) => `₹${Number(amount.toString()).toFixed(2)}`;

export default async function PurchaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const context = await getTenantContext();
  await requireSalon(context);
  requirePermission(context, "purchases.manage");
  const [purchase, locations] = await Promise.all([
    db.purchase.findFirst({ where: { id, businessId: context.businessId }, include: { supplier: true, items: { include: { item: true } }, movements: { include: { location: true }, orderBy: { occurredAt: "desc" } } } }),
    db.inventoryLocation.findMany({ where: { businessId: context.businessId, active: true }, orderBy: { name: "asc" } }),
  ]);
  if (!purchase) notFound();
  const total = purchase.items.reduce((sum, entry) => sum + Number(entry.quantity) * Number(entry.unitCost), 0);
  const canReceive = purchase.status === "DRAFT" && locations.length > 0;

  return <>
    <div className="page-head"><div><p className="eyebrow">PURCHASE</p><h1>{purchase.referenceNumber || "Supplier order"}</h1><p className="muted">{purchase.supplier.name} · {purchase.purchaseDate.toLocaleDateString()}</p></div><div className="hero-actions"><Link className="btn secondary" href="/purchases">All purchases</Link></div></div>
    <div className="two-col"><SectionCard title="Order details"><dl><dt>Supplier</dt><dd><Link href={`/suppliers/${purchase.supplierId}`}>{purchase.supplier.name}</Link></dd><dt>Status</dt><dd><span className="badge">{purchase.status}</span></dd><dt>Order total</dt><dd>{money({ toString: () => total.toString() })}</dd><dt>Notes</dt><dd>{purchase.notes || "—"}</dd></dl></SectionCard><SectionCard title="Receive stock">{canReceive ? <form action={receivePurchaseAction.bind(null, purchase.id)} className="form-grid"><label className="wide">Stock location<select name="locationId" required defaultValue=""><option value="" disabled>Choose stock location</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label><p className="muted wide">Receiving adds every listed product exactly once. This action cannot be undone.</p><button className="btn">Receive purchase</button></form> : purchase.status === "DRAFT" ? <p className="muted">Add an active inventory location before receiving this purchase.</p> : <p className="muted">This purchase has already been {purchase.status.toLowerCase()}.</p>}{purchase.status === "DRAFT" && <form action={cancelPurchaseAction.bind(null, purchase.id)}><button className="text-button">Cancel draft purchase</button></form>}</SectionCard></div>
    <SectionCard title="Products"><div className="table-wrap"><table className="inventory-table"><thead><tr><th>Product</th><th>Quantity</th><th>Unit cost</th><th>Line total</th></tr></thead><tbody>{purchase.items.map((entry) => <tr key={entry.id}><td data-label="Product"><Link href={`/inventory/${entry.itemId}`}><strong>{entry.item.name}</strong><small className="table-note">{entry.item.unit}</small></Link></td><td data-label="Quantity">{entry.quantity.toString()}</td><td data-label="Unit cost">{money(entry.unitCost)}</td><td data-label="Line total">{money({ toString: () => (Number(entry.quantity) * Number(entry.unitCost)).toString() })}</td></tr>)}</tbody></table></div></SectionCard>
    <SectionCard title="Receiving history">{purchase.movements.length ? <ul className="plain-list">{purchase.movements.map((movement) => <li key={movement.id}><strong>{movement.quantityChange.toString()} {movement.itemId}</strong><span>{movement.location.name} · {movement.occurredAt.toLocaleString()}</span></li>)}</ul> : <EmptyState title="Not received yet" description="Stock movements will appear here after this order is received." />}</SectionCard>
  </>;
}
