import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { EmptyState, SectionCard } from "@/components/ui";

export default async function SupplierDetail({ params }: { params: Promise<{ id: string }> }) {
 const context=await getTenantContext(); requirePermission(context,"suppliers.view"); const id=(await params).id;
 const supplier=await db.supplier.findFirst({where:{id,businessId:context.businessId},include:{items:{include:{item:true}},preferredByItems:true,purchases:{orderBy:{purchaseDate:"desc"},take:10}}}); if(!supplier)notFound(); const products=[...supplier.items.map(x=>x.item),...supplier.preferredByItems.filter(item=>!supplier.items.some(link=>link.itemId===item.id))];
 return <><div className="page-head"><div><p className="eyebrow">SUPPLIER</p><h1>{supplier.name}</h1></div></div><div className="two-col"><SectionCard title="Contact"><dl><dt>Phone</dt><dd>{supplier.phone}</dd><dt>Email</dt><dd>{supplier.email||"—"}</dd><dt>Status</dt><dd>{supplier.active?"Active":"Inactive"}</dd><dt>Notes</dt><dd>{supplier.notes||"—"}</dd></dl></SectionCard><SectionCard title="Supplied products">{products.length?<ul className="plain-list">{products.map(item=><li key={item.id}>{item.name}<span>{item.purchaseCost?`Latest listed cost ₹${item.purchaseCost}`:"No cost recorded"}</span></li>)}</ul>:<EmptyState title="No linked products" description="Choose this supplier as a product's preferred supplier when known."/>}</SectionCard></div><SectionCard title="Purchases">{supplier.purchases.length?<ul className="plain-list">{supplier.purchases.map(p=><li key={p.id}>{p.referenceNumber||p.id}<span>{p.status} · {p.purchaseDate.toLocaleDateString()}</span></li>)}</ul>:<EmptyState title="No purchases recorded" description="Purchases from this supplier will appear here."/>}</SectionCard></>;
}
