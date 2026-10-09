import { setStaffServicesAction } from "@/app/actions";
import { EmptyState } from "@/components/ui";
import { AppDialog } from "@/components/primitives";
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

  return <><div className="page-head"><div><p className="eyebrow">TEAM</p><h1>Staff</h1><p className="muted">Manage availability and the services each team member can perform.</p></div></div>
    {salon ? <div className="staff-capabilities">{staff.length ? staff.map(member => {
      const names = member.staffServices.map(item => item.service.name);
      const visible = names.slice(0, 4), remaining = names.length - visible.length;
      const initials = member.name.split(" ").map(part => part[0]).slice(0, 2).join("");
      return <section className="card staff-card" key={member.id}>
        <div className="staff-card-head"><span className="staff-avatar" aria-hidden="true">{initials}</span><div><Link href={`/staff/${member.id}`}><strong>{member.name}</strong></Link><p>{member.phone}{member.email ? ` · ${member.email}` : ""}</p></div><span className="badge">{member.availability.replace("_", " ")}</span></div>
        <div className="staff-services"><span>Services</span>{visible.length ? <div className="service-chips">{visible.map(name => <span key={name}>{name}</span>)}{remaining > 0 && <span className="service-more">+{remaining} more</span>}</div> : <p>No services assigned</p>}</div>
        {c.permissions.has("staff.manage") && <AppDialog title={`Manage ${member.name}'s services`} description="Choose the services this team member can be assigned to." trigger={<button className="staff-manage-trigger" type="button">Manage services</button>}><form action={setStaffServicesAction.bind(null, member.id)} className="service-checkboxes dialog-service-checkboxes">{services.map(service => <label key={service.id}><input type="checkbox" name="serviceIds" value={service.id} defaultChecked={member.staffServices.some(item => item.service.id === service.id)}/>{service.name}</label>)}<button className="btn">Save services</button></form></AppDialog>}
      </section>;
    }) : <EmptyState title="No staff" description="Staff profiles live here, independently from login access."/>}</div> : <div className="card table-wrap">{staff.length ? <table><thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Status</th><th>Login</th></tr></thead><tbody>{staff.map(member => <tr key={member.id}><td><Link href={`/staff/${member.id}`}>{member.name}</Link></td><td>{member.phone}</td><td>{member.email||"—"}</td><td>{member.status}</td><td>{member.userId ? "Enabled" : "No access"}</td></tr>)}</tbody></table> : <EmptyState title="No staff" description="Staff profiles live here, independently from login access."/>}</div>}
  </>;
}
