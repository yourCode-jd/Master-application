import Link from "next/link";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { createSupplierAction } from "@/app/actions";
import { EmptyState } from "@/components/ui";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const context = await getTenantContext(); requirePermission(context, "suppliers.view");
  const q = (await searchParams).q ?? "";
  const suppliers = await db.supplier.findMany({ where: { businessId: context.businessId, ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) }, orderBy: { name: "asc" } });
  return <><div className="page-head"><div><p className="eyebrow">SOURCING</p><h1>Suppliers</h1></div></div><div className="two-col"><form className="card search"><input name="q" defaultValue={q} placeholder="Search suppliers"/><button>Search</button></form>{context.permissions.has("suppliers.manage") && <form action={createSupplierAction} className="card form-grid"><label>Name<input name="name" required/></label><label>Phone<input name="phone" required/></label><label>Email<input name="email" type="email"/></label><label>Notes<input name="notes"/></label><button className="btn">Add supplier</button></form>}</div><div className="card table-wrap">{suppliers.length ? <table><thead><tr><th>Supplier</th><th>Phone</th><th>Email</th><th>Status</th></tr></thead><tbody>{suppliers.map(x=><tr key={x.id}><td><Link href={`/suppliers/${x.id}`}>{x.name}</Link></td><td>{x.phone}</td><td>{x.email||"—"}</td><td>{x.active?"Active":"Inactive"}</td></tr>)}</tbody></table> : <EmptyState title="No suppliers yet" description="Add your first supplier to begin recording inventory sources."/>}</div></>;
}
