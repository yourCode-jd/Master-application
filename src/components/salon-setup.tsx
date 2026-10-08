import { db } from "@/lib/db";
import { SalonSetupChecklist } from "@/components/salon-setup-checklist";

export async function SalonSetup({ businessId }: { businessId: string }) {
  const [locations, staff, services, customers, appointments] = await Promise.all([
    db.businessLocation.count({ where: { businessId, active: true } }),
    db.staffMember.count({ where: { businessId, status: "ACTIVE" } }),
    db.service.count({ where: { businessId, active: true } }),
    db.customer.count({ where: { businessId, status: "ACTIVE" } }),
    db.appointment.count({ where: { businessId } }),
  ]);
  return <SalonSetupChecklist businessId={businessId} steps={[
    { label: "Review business profile", href: "/settings", complete: true },
    { label: "Add a location", href: "/settings", complete: locations > 0 },
    { label: "Add your team", href: "/staff", complete: staff > 0 },
    { label: "Add services", href: "/services", complete: services > 0 },
    { label: "Add your first customer", href: "/customers/new", complete: customers > 0 },
    { label: "Book your first appointment", href: "/appointments", complete: appointments > 0 },
  ]} />;
}
