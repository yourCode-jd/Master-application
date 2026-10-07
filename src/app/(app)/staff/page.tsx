import { setStaffServicesAction } from "@/app/actions";
import { EmptyState } from "@/components/ui";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import Link from "next/link";

export default async function Staff() {
  const c = await getTenantContext(); requirePermission(c, "staff.view");
  const business = await db.business.findUniqueOrThrow({ where: { id: c.businessId }, select: { type: true } });
  const salon = business.type === "SALON";
  const [staff, services] = await Promise.all([
    db.staffMember.findMany({ where: { businessId: c.businessId }, include: { staffServices: { where: { active: true }, include: { service: { select: { id: true, name: true } } } } }, orderBy: { name: "asc" } }),
    salon ? db.service.findMany({ where: { businessId: c.businessId, active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : Promise.resolve([]),
  ]);
  return <><div className="page-head"><div><p className="eyebrow">TEAM</p><h1>Staff</h1></div></div>
    {salon ? <div className="staff-capabilities">{staff.length ? staff.map(member => <section className="card staff-card" key={member.id}><div><Link href={`/staff/${member.id}`}><strong>{member.name}</strong></Link><p>{member.phone}{member.email ? ` · ${member.email}` : ""}</p><span className="badge">{member.availability.replace("_", " ")}</span></div><div className="capability-list"><span className="muted">Services</span><p>{member.staffServices.length ? member.staffServices.map(x => x.service.name).join(", ") : "No services assigned"}</p></div>{c.permissions.has("staff.manage") && <details><summary>Manage services</summary><form action={setStaffServicesAction.bind(null, member.id)} className="service-checkboxes">{services.map(service => <label key={service.id}><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={member.staffServices.some(x => x.service.id === service.id)}/>{service.name}</label>)}<button className="btn">Save services</button></form></details>}</section>) : <EmptyState title="No staff" description="Staff profiles live here, independently from login access."/>}</div> : <div className="card table-wrap">{staff.length ? <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Login</th></tr></thead><tbody>{staff.map(x => <tr key={x.id}><td><Link href={`/staff/${x.id}`}>{x.name}</Link></td><td>{x.phone}</td><td>{x.email||"—"}</td><td>{x.status}</td><td>{x.userId ? "Enabled" : "No access"}</td></tr>)}</tbody></table> : <EmptyState title="No staff" description="Staff profiles live here, independently from login access."/>}</div>}
  </>;
}
