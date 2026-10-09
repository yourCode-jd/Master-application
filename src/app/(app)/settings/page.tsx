import { saveDiscountPolicyAction, saveMembershipNotificationPreferencesAction, saveWorkingHoursAction } from "@/app/actions";
import { SectionCard } from "@/components/ui";
import { readWorkingHours } from "@/domain/salon/working-hours";
import { WorkingHoursForm } from "@/components/working-hours-form";
import { db } from "@/lib/db";
import { getTenantContext, requirePermission } from "@/lib/tenant";
import { redirect } from "next/navigation";

export default async function Settings() {
  const context = await getTenantContext();
  if (!context.permissions.has("settings.manage")) redirect("/");
  requirePermission(context, "settings.manage");
  const [business, locations, roles, policy, preferences] = await Promise.all([
    db.business.findUniqueOrThrow({ where: { id: context.businessId } }), db.businessLocation.findMany({ where: { businessId: context.businessId }, orderBy: { name: "asc" } }), db.role.findMany({ include: { permissions: { include: { permission: true } } } }), db.discountPolicy.findUnique({ where: { businessId: context.businessId } }), db.notificationPreference.findMany({ where: { businessId: context.businessId, userId: context.userId } }),
  ]);
  const enabled = (type: string) => preferences.find((item) => item.type === type)?.enabled ?? true;
  return <><div className="page-head"><div><p className="eyebrow">ADMINISTRATION</p><h1>Settings</h1><p className="muted">Salon profile, booking rules, team controls, and alerts.</p></div></div>
    <div className="two-col"><SectionCard title="Business"><dl><dt>Name</dt><dd>{business.name}</dd><dt>Timezone</dt><dd>{business.timezone}</dd><dt>Currency</dt><dd>{business.currency}</dd></dl></SectionCard><SectionCard title="Locations">{locations.map((location) => <p key={location.id}><strong>{location.name}</strong><br /><span className="muted">{[location.addressLine1, location.city, location.state].filter(Boolean).join(", ") || "No address"}</span></p>)}</SectionCard></div>
    <SectionCard title="Business working hours"><WorkingHoursForm value={readWorkingHours(business.workingHours)} action={saveWorkingHoursAction.bind(null, "BUSINESS", undefined)} /></SectionCard>
    <SectionCard title="Location working hours"><p className="muted">Leave a location aligned with the business default, or set different normal booking hours below.</p>{locations.map((location) => <details className="settings-detail" key={location.id}><summary>{location.name}</summary><WorkingHoursForm value={readWorkingHours(location.workingHours ?? business.workingHours)} action={saveWorkingHoursAction.bind(null, "LOCATION", location.id)} /></details>)}</SectionCard>
    <SectionCard title="Financial controls"><p className="muted">Normal discount limits. An authorised override always requires a recorded reason.</p><form action={saveDiscountPolicyAction} className="form-grid"><label>Staff maximum (%)<input name="staffPercent" inputMode="decimal" defaultValue={policy?.staffMaxPercentage.toString() || "5"} required /></label><label>Manager maximum (%)<input name="managerPercent" inputMode="decimal" defaultValue={policy?.managerMaxPercentage.toString() || "15"} required /></label><label>Staff maximum fixed amount<input name="staffFixed" inputMode="decimal" defaultValue={policy?.staffMaxFixed.toString() || "0"} required /></label><label>Manager maximum fixed amount<input name="managerFixed" inputMode="decimal" defaultValue={policy?.managerMaxFixed.toString() || "0"} required /></label><button className="btn">Save discount policy</button></form></SectionCard>
    <SectionCard title="Membership & package alerts"><p className="muted">Choose the in-app reminders you receive. Daily alerts are deduplicated.</p><form action={saveMembershipNotificationPreferencesAction} className="form-grid">{[["MEMBERSHIP_EXPIRING", "Membership expiry"], ["MEMBERSHIP_EXPIRED", "Membership expired"], ["MEMBERSHIP_RENEWED", "Membership renewed"], ["PACKAGE_EXPIRING", "Package expiry"], ["PACKAGE_LOW_CREDITS", "Low package credits"], ["PACKAGE_COMPLETED", "Package completed"]].map(([type, label]) => <label className="check" key={type}><input name={type} type="checkbox" defaultChecked={enabled(type)} />{label}</label>)}<button className="btn">Save alert preferences</button></form></SectionCard>
    <SectionCard title="Roles & permissions"><div className="role-grid">{roles.map((role) => <div key={role.id}><strong>{role.name}</strong><p>{role.permissions.map((item) => item.permission.key).join(", ")}</p></div>)}</div></SectionCard>
  </>;
}
