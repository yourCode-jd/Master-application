import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";

const statusText = (status: string) => status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default async function PurchasesPage() {
  const context = await getTenantContext();
  await requireSalon(context);
  requirePermission(context, "purchases.manage");
  const purchases = await db.purchase.findMany({
    where: { businessId: context.businessId },
    include: { supplier: true, items: { include: { item: true } } },
    orderBy: { purchaseDate: "desc" },
  });

  return <>
    <div className="page-head"><div><p className="eyebrow">STOCK INTAKE</p><h1>Purchases</h1><p className="muted">Receive supplier orders once, with a clear record of each product and cost.</p></div><div className="hero-actions"><Link className="btn secondary" href="/inventory">Inventory</Link><Link className="btn secondary" href="/suppliers">Suppliers</Link></div></div>
    <section className="salon-metrics"><article><span>Draft</span><strong>{purchases.filter((purchase) => purchase.status === "DRAFT").length}</strong><small>Ready to receive</small></article><article><span>Received</span><strong>{purchases.filter((purchase) => purchase.status === "RECEIVED").length}</strong><small>Stocked orders</small></article><article><span>Cancelled</span><strong>{purchases.filter((purchase) => purchase.status === "CANCELLED").length}</strong><small>No stock movement</small></article></section>
    <div className="card table-wrap">{purchases.length ? <table className="inventory-table"><thead><tr><th>Purchase</th><th>Supplier</th><th>Date</th><th>Products</th><th>Status</th></tr></thead><tbody>{purchases.map((purchase) => <tr key={purchase.id}><td data-label="Purchase"><Link href={`/purchases/${purchase.id}`}><strong>{purchase.referenceNumber || "Supplier order"}</strong><small className="table-note">Open receiving details</small></Link></td><td data-label="Supplier">{purchase.supplier.name}</td><td data-label="Date">{purchase.purchaseDate.toLocaleDateString()}</td><td data-label="Products">{purchase.items.length} product{purchase.items.length === 1 ? "" : "s"}</td><td data-label="Status"><span className="badge">{statusText(purchase.status)}</span></td></tr>)}</tbody></table> : <EmptyState title="No purchases yet" description="Purchases from suppliers will appear here when they are recorded." />}</div>
  </>;
}
