import { createServiceAction, createServiceCategoryAction, saveServiceInventoryRequirementAction, toggleServiceAction, updateSalonServiceAction } from "@/app/actions";
import { ActionMenu, ActionMenuItem, AppDialog, IconTooltip } from "@/components/primitives";
import { EmptyState } from "@/components/ui";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { Boxes, Pencil, Plus, Power, SlidersHorizontal } from "lucide-react";

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const c = await getTenantContext();
  await requireSalon(c);
  requirePermission(c, "services.view");
  const { q = "", category = "" } = await searchParams;
  const [categories, services, items] = await Promise.all([
    db.serviceCategory.findMany({ where: { businessId: c.businessId }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    db.service.findMany({
      where: { businessId: c.businessId, ...(category ? { categoryId: category } : {}), ...(q ? { name: { contains: q, mode: "insensitive" } } : {}) },
      include: { category: true, inventoryRequirements: { include: { item: true }, orderBy: { createdAt: "asc" } }, _count: { select: { staffServices: { where: { active: true } } } } },
      orderBy: [{ active: "desc" }, { name: "asc" }],
    }),
    db.item.findMany({ where: { businessId: c.businessId, active: true }, orderBy: { name: "asc" } }),
  ]);
  const canManage = c.permissions.has("services.manage");

  return <>
    <header className="page-head page-head-actions">
      <div><p className="eyebrow">SALON SETUP</p><h1>Services</h1><p className="muted">Define the work your team can book, perform, and track.</p></div>
      {canManage && <div className="header-actions">
        <AppDialog title="Add category" description="Group services so your catalogue stays easy to navigate." trigger={<button className="btn secondary" type="button">Add category</button>}>
          <form action={createServiceCategoryAction} className="form-grid dialog-form"><label className="wide">Category name<input name="name" placeholder="e.g. Hair" required /></label><label className="wide">Description <span className="muted">(optional)</span><input name="description" /></label><input type="hidden" name="sortOrder" value={categories.length} /><button className="btn" type="submit">Save category</button></form>
        </AppDialog>
        <AppDialog title="Add service" description="Create a service your team can add to appointments and visits." trigger={<button className="btn" type="button"><Plus aria-hidden="true"/> New service</button>}>
          <form action={createServiceAction} className="form-grid dialog-form"><label>Name<input name="name" placeholder="e.g. Classic haircut" required /></label><label>Category<select name="categoryId"><option value="">No category</option>{categories.filter(x => x.active).map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</select></label><label>Price<input name="price" inputMode="decimal" placeholder="0.00" required /></label><label>Duration (minutes)<input name="durationMinutes" type="number" min="5" step="5" defaultValue="30" required /></label><label className="wide">Description <span className="muted">(optional)</span><input name="description" /></label><label className="wide">Recommended return after days <span className="muted">(optional)</span><input name="recommendedReturnDays" type="number" min="1" /></label><button className="btn" type="submit">Create service</button></form>
        </AppDialog>
      </div>}
    </header>

    <form className="services-toolbar" aria-label="Filter services">
      <label className="services-search"><span className="sr-only">Search services</span><input name="q" defaultValue={q} placeholder="Search services" /></label>
      <label><span className="sr-only">Filter category</span><select name="category" defaultValue={category}><option value="">All categories</option>{categories.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
      <button className="btn secondary" type="submit"><SlidersHorizontal aria-hidden="true"/> Filter</button>
      <span className="services-count">{services.length} {services.length === 1 ? "service" : "services"}</span>
    </form>

    <section className="card services-table-card">
      {services.length ? <div className="table-wrap services-table-wrap"><table className="services-table"><thead><tr><th>Service</th><th>Category</th><th>Duration</th><th>Price</th><th>Products used</th><th>Team</th><th>Status</th>{canManage && <th><span className="sr-only">Actions</span></th>}</tr></thead><tbody>{services.map(service => <tr key={service.id}>
        <td data-label="Service"><strong>{service.name}</strong>{service.description && <small className="table-note">{service.description}</small>}</td>
        <td data-label="Category">{service.category?.name || <span className="muted">Uncategorised</span>}</td>
        <td data-label="Duration">{service.durationMinutes} min</td>
        <td data-label="Price"><strong>₹{service.price.toString()}</strong></td>
        <td data-label="Products used">{service.inventoryRequirements.length ? <span className="product-count"><Boxes aria-hidden="true"/>{service.inventoryRequirements.length} {service.inventoryRequirements.length === 1 ? "product" : "products"}</span> : <span className="muted">None</span>}</td>
        <td data-label="Team">{service._count.staffServices} staff</td>
        <td data-label="Status"><span className={`badge ${service.active ? "badge-success" : "badge-muted"}`}>{service.active ? "Active" : "Inactive"}</span></td>
        {canManage && <td className="table-actions" data-label="Actions">
          <IconTooltip label={`Edit ${service.name}`}><AppDialog title={`Edit ${service.name}`} description="Changes apply to new bookings; historical visits keep their original details." trigger={<button className="icon-btn" type="button" aria-label={`Edit ${service.name}`}><Pencil aria-hidden="true"/></button>}>
            <form action={updateSalonServiceAction.bind(null, service.id)} className="form-grid dialog-form"><label>Name<input name="name" defaultValue={service.name} required/></label><label>Price<input name="price" defaultValue={service.price.toString()} inputMode="decimal" required/></label><label>Duration (minutes)<input name="durationMinutes" defaultValue={service.durationMinutes} type="number" min="5" required/></label><label>Recommended return after days<input name="recommendedReturnDays" defaultValue={service.recommendedReturnDays || ""} type="number" min="1"/></label><label className="wide">Description<input name="description" defaultValue={service.description || ""}/></label><button className="btn" type="submit">Save changes</button></form>
          </AppDialog></IconTooltip>
          <IconTooltip label={`Manage products for ${service.name}`}><AppDialog title={`${service.name} product usage`} description="Record the products consumed whenever this service is completed." trigger={<button className="icon-btn" type="button" aria-label={`Manage products for ${service.name}`}><Boxes aria-hidden="true"/></button>}>
            <div className="usage-dialog"><form action={saveServiceInventoryRequirementAction.bind(null, undefined)} className="form-grid dialog-form"><input type="hidden" name="serviceId" value={service.id}/><label>Product<select name="itemId" required defaultValue=""><option value="">Choose product</option>{items.map(item => <option key={item.id} value={item.id}>{item.name} · {item.unit}</option>)}</select></label><label>Quantity per service<input name="quantity" type="number" min="0.001" step="0.001" placeholder="0.000" required/></label><button className="btn" type="submit">Add product</button></form>{service.inventoryRequirements.length > 0 && <div className="usage-list">{service.inventoryRequirements.map(requirement => <form action={saveServiceInventoryRequirementAction.bind(null, requirement.id)} className="usage-row" key={requirement.id}><input type="hidden" name="serviceId" value={service.id}/><strong>{requirement.item.name}</strong><span>{requirement.quantityPerService.toString()} {requirement.item.unit}</span><label className="check"><input name="active" type="checkbox" defaultChecked={requirement.active}/> Active</label><input type="hidden" name="itemId" value={requirement.itemId}/><input className="usage-quantity" name="quantity" type="number" min="0.001" step="0.001" defaultValue={requirement.quantityPerService.toString()} required/><button className="btn secondary" type="submit">Update</button></form>)}</div>}</div>
          </AppDialog></IconTooltip>
          <ActionMenu label={`Actions for ${service.name}`}><form action={toggleServiceAction.bind(null, service.id)}><ActionMenuItem asChild><button className="ui-menu-item" type="submit"><Power aria-hidden="true"/>{service.active ? "Deactivate service" : "Activate service"}</button></ActionMenuItem></form></ActionMenu>
        </td>}
      </tr>)}</tbody></table></div> : <EmptyState title="No services yet" description="Create your first service to start booking appointments." />}
    </section>
  </>;
}
