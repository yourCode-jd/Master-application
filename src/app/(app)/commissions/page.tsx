import { addCommissionAdjustmentAction, saveCommissionRuleAction, settleCommissionAction } from "@/app/actions";
import { AppDialog, IconTooltip } from "@/components/primitives";
import { EmptyState } from "@/components/ui";
import { requireSalon } from "@/domain/salon/service";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { CalendarDays, Pencil, Plus, WalletCards } from "lucide-react";
import { redirect } from "next/navigation";

export default async function CommissionsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const c = await getTenantContext();
  await requireSalon(c);
  if (!c.permissions.has("commissions.view")) redirect("/");
  requirePermission(c, "commissions.view");
  const range = (await searchParams).range || "month";
  const now = new Date(); const start = new Date(now);
  if (range === "today") start.setHours(0, 0, 0, 0);
  else if (range === "week") start.setDate(now.getDate() - 6);
  else { start.setDate(1); start.setHours(0, 0, 0, 0); }
  const [staff, adjustments, settlements, services, rules] = await Promise.all([
    db.staffMember.findMany({ where: { businessId: c.businessId, status: "ACTIVE" }, include: { visitServices: { where: { visit: { status: "COMPLETED", completedAt: { gte: start } } }, include: { service: true } } }, orderBy: { name: "asc" } }),
    db.commissionAdjustment.findMany({ where: { businessId: c.businessId, date: { gte: start } }, include: { staff: true }, orderBy: { date: "desc" } }),
    db.commissionSettlement.findMany({ where: { businessId: c.businessId }, include: { staff: true, settler: true }, orderBy: { settledAt: "desc" }, take: 20 }),
    db.service.findMany({ where: { businessId: c.businessId, active: true }, orderBy: { name: "asc" } }),
    db.commissionRule.findMany({ where: { businessId: c.businessId }, include: { staff: true, service: true }, orderBy: [{ staff: { name: "asc" } }, { serviceId: "asc" }, { createdAt: "desc" }] }),
  ]);
  const totals = staff.map(member => {
    const revenue = member.visitServices.reduce((sum, row) => sum + Number(row.finalAmount || row.priceSnapshot), 0);
    const commission = member.visitServices.reduce((sum, row) => sum + Number(row.commissionAmount), 0);
    const adjustment = adjustments.filter(x => x.staffId === member.id).reduce((sum, x) => sum + (x.type === "DEDUCTION" ? -Number(x.amount) : Number(x.amount)), 0);
    return { member, revenue, commission, adjustment, payable: commission + adjustment };
  });
  const total = (key: "revenue" | "commission" | "adjustment" | "payable") => totals.reduce((sum, item) => sum + item[key], 0);
  const canSettle = c.permissions.has("commissions.settle");
  const canAdjust = c.permissions.has("commissions.adjust");
  const canManage = c.permissions.has("commissions.manage");

  return <>
    <header className="page-head page-head-actions">
      <div><p className="eyebrow">STAFF + MONEY</p><h1>Commissions</h1><p className="muted">Completed services only. This is not payroll.</p></div>
      <form className="commission-range"><CalendarDays aria-hidden="true"/><label><span className="sr-only">Date range</span><select name="range" defaultValue={range}><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select></label><button className="btn secondary" type="submit">Apply</button></form>
    </header>

    <section className="salon-metrics commission-metrics"><article><span>Service revenue</span><strong>₹{total("revenue").toFixed(0)}</strong><small>Completed visits</small></article><article><span>Commission owed</span><strong>₹{total("commission").toFixed(0)}</strong><small>Before adjustments</small></article><article><span>Adjustments</span><strong>₹{total("adjustment").toFixed(0)}</strong><small>Bonuses and deductions</small></article><article><span>Final payable</span><strong>₹{total("payable").toFixed(0)}</strong><small>Selected period</small></article></section>

    {(canSettle || canAdjust) && <div className="commission-actions">{canSettle && <AppDialog title="Settle a commission period" description="This records the amount due for one staff member over a completed period." trigger={<button className="btn" type="button"><WalletCards aria-hidden="true"/> Settle period</button>}><form action={settleCommissionAction} className="form-grid dialog-form"><label>Staff<select name="staffId">{staff.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Period start<input name="periodStart" type="date" required/></label><label>Period end<input name="periodEnd" type="date" required/></label><button className="btn" type="submit">Confirm settlement</button></form></AppDialog>}{canAdjust && <AppDialog title="Add a commission adjustment" description="Record a bonus, deduction, correction, or other adjustment with a clear reason." trigger={<button className="btn secondary" type="button">Add adjustment</button>}><form action={addCommissionAdjustmentAction} className="form-grid dialog-form"><label>Staff<select name="staffId">{staff.map(member => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label><label>Type<select name="type"><option value="BONUS">Bonus</option><option value="CORRECTION">Correction</option><option value="DEDUCTION">Deduction</option><option value="OTHER">Other</option></select></label><label>Amount<input name="amount" inputMode="decimal" required/></label><label>Date<input name="date" type="date"/></label><label className="wide">Reason<input name="reason" required/></label><button className="btn" type="submit">Save adjustment</button></form></AppDialog>}</div>}

    <section className="card commissions-table-card"><div className="section-heading"><div><p className="eyebrow">CURRENT PERIOD</p><h2>Commission by staff</h2></div><span className="muted">{staff.length} team members</span></div>{totals.length ? <div className="table-wrap commissions-table-wrap"><table className="commissions-table"><thead><tr><th>Staff</th><th>Services</th><th>Service revenue</th><th>Commission</th><th>Adjustments</th><th>Final payable</th></tr></thead><tbody>{totals.map(item => <tr key={item.member.id}><td data-label="Staff"><strong>{item.member.name}</strong></td><td data-label="Services">{item.member.visitServices.length}</td><td data-label="Service revenue">₹{item.revenue.toFixed(2)}</td><td data-label="Commission">₹{item.commission.toFixed(2)}</td><td data-label="Adjustments">₹{item.adjustment.toFixed(2)}</td><td data-label="Final payable"><strong>₹{item.payable.toFixed(2)}</strong></td></tr>)}</tbody></table></div> : <EmptyState title="No staff records" description="Completed service commissions will appear here." />}</section>

    {canManage && <section className="card commission-rules"><div className="section-heading"><div><p className="eyebrow">COMMISSION RULES</p><h2>Defaults and service overrides</h2><p className="muted">Changes affect future completed services only.</p></div><AppDialog title="Add commission rule" description="Set a default rule for a staff member or override it for one service." trigger={<button className="btn secondary" type="button"><Plus aria-hidden="true"/> Add rule</button>}><CommissionRuleForm staff={staff} services={services}/></AppDialog></div><div className="commission-rule-list">{rules.map(rule => <article className="commission-rule-row" key={rule.id}><div className="commission-rule-person"><span className="staff-avatar">{rule.staff.name.split(" ").map(part => part[0]).join("").slice(0, 2)}</span><div><strong>{rule.staff.name}</strong><span>{rule.service?.name || "Default for all services"}</span></div></div><div className="commission-rule-value"><strong>{rule.value.toString()}{rule.type === "PERCENTAGE" ? "%" : " fixed"}</strong><span>{rule.type === "PERCENTAGE" ? "Percentage" : "Fixed amount"}</span></div><span className={`badge ${rule.active ? "badge-success" : "badge-muted"}`}>{rule.active ? "Active" : "Inactive"}</span><IconTooltip label={`Edit ${rule.staff.name}'s rule`}><AppDialog title="Edit commission rule" description="Changes affect future completed services only." trigger={<button className="icon-btn" type="button" aria-label={`Edit ${rule.staff.name}'s rule`}><Pencil aria-hidden="true"/></button>}><CommissionRuleForm id={rule.id} rule={rule} staff={staff} services={services}/></AppDialog></IconTooltip></article>)}{!rules.length && <p className="muted commission-empty">No commission rules have been configured yet.</p>}</div></section>}

    <div className="commission-history"><section className="card"><div className="section-heading"><div><p className="eyebrow">RECENT ADJUSTMENTS</p><h2>Changes in this period</h2></div></div>{adjustments.length ? <ul className="plain-list compact-history">{adjustments.map(item => <li key={item.id}><div><strong>{item.staff.name} · {item.type}</strong><span>{item.reason}</span></div><b>₹{item.amount.toString()}</b></li>)}</ul> : <p className="muted">No adjustments in this period.</p>}</section><section className="card"><div className="section-heading"><div><p className="eyebrow">SETTLEMENT HISTORY</p><h2>Settled periods</h2></div></div>{settlements.length ? <ul className="plain-list compact-history">{settlements.map(item => <li key={item.id}><div><strong>{item.staff.name}</strong><span>{item.periodStart.toLocaleDateString()} – {item.periodEnd.toLocaleDateString()} · by {item.settler.name}</span></div><b>₹{item.amount.toString()}</b></li>)}</ul> : <p className="muted">No commission periods settled yet.</p>}</section></div>
  </>;
}

function CommissionRuleForm({ id, rule, staff, services }: { id?: string; rule?: any; staff: { id: string; name: string }[]; services: { id: string; name: string }[] }) {
  return <form action={saveCommissionRuleAction.bind(null, id)} className="form-grid dialog-form"><label>Staff<select name="staffId" defaultValue={rule?.staffId}>{staff.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>Service override<select name="serviceId" defaultValue={rule?.serviceId || ""}><option value="">Default for staff</option>{services.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label><label>Rule type<select name="type" defaultValue={rule?.type || "PERCENTAGE"}><option value="PERCENTAGE">Percentage</option><option value="FIXED">Fixed amount</option></select></label><label>Value<input name="value" inputMode="decimal" defaultValue={rule?.value?.toString()} required/></label><label>Effective from<input name="effectiveFrom" type="date" defaultValue={rule?.effectiveFrom?.toISOString().slice(0, 10) || ""}/></label><label>Effective to<input name="effectiveTo" type="date" defaultValue={rule?.effectiveTo?.toISOString().slice(0, 10) || ""}/></label><label className="check wide"><input name="active" type="checkbox" defaultChecked={rule?.active ?? true}/> Active rule</label><button className="btn" type="submit">{id ? "Save rule" : "Add rule"}</button></form>;
}
