import Link from "next/link";
import { logoutAction } from "@/app/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarNavigation, type NavigationItem } from "@/components/sidebar-navigation";
import { MobileNavigation } from "@/components/mobile-navigation";
import { SidebarScroll } from "@/components/sidebar-scroll";
import type { TenantContext } from "@/lib/tenant";
import { LogOut } from "lucide-react";

type NavigationSection = { label: string; links: readonly NavigationItem[] };
const salonSections: readonly NavigationSection[] = [
  { label: "TODAY", links: [["/", "Dashboard", "dashboard.view"], ["/appointments", "Appointments", "appointments.view"], ["/walk-ins", "Walk-ins", "walkins.view"], ["/follow-ups", "Follow-ups", "followups.view"], ["/tasks", "Tasks", "tasks.view"]] },
  { label: "CUSTOMERS", links: [["/customers", "Customers", "customers.view"], ["/services", "Services", "services.view"], ["/memberships", "Memberships", "memberships.view"], ["/packages", "Packages", "packages.view"]] },
  { label: "OPERATIONS", links: [["/visits", "Visits", "visits.view"], ["/payments", "Payments", "transactions.view"], ["/staff", "Staff", "staff.view"], ["/inventory", "Inventory", "inventory.view"], ["/purchases", "Purchases", "purchases.manage"]] },
  { label: "INSIGHTS", links: [["/reports", "Reports", "reports.view"], ["/revenue", "Revenue", "revenue_reports.view"], ["/commissions", "Commissions", "commissions.view"], ["/settings", "Settings", "settings.manage"]] },
];
const baseSections: readonly NavigationSection[] = [
  { label: "WORKSPACE", links: [["/", "Dashboard", "dashboard.view"], ["/customers", "Customers", "customers.view"], ["/staff", "Staff", "staff.view"], ["/inventory", "Inventory", "inventory.view"], ["/tasks", "Tasks", "tasks.view"]] },
  { label: "MANAGE", links: [["/reports", "Reports", "reports.view"], ["/settings", "Settings", "settings.manage"]] },
];

function visibleSections(context: TenantContext, businessType: string) {
  const source = businessType === "SALON" ? salonSections : baseSections;
  const sections = source.map((section) => ({ ...section, links: section.links.filter(([, ,permission]) => context.permissions.has(permission)) })).filter((section) => section.links.length);
  if (businessType === "SALON" && !context.permissions.has("appointments.edit") && context.permissions.has("dashboard.view")) sections.unshift({ label: "MY WORK", links: [["/my-day", "My day", "dashboard.view"]] });
  return sections;
}

function Navigation({ sections, mobile = false }: { sections: ReturnType<typeof visibleSections>; mobile?: boolean }) {
  return <>{sections.map((section) => <div className="nav-section" key={section.label}><div className="nav-caption">{section.label}</div><SidebarNavigation links={section.links} mobile={mobile} label={section.label} /></div>)}</>;
}

export function AppShell({ children, context, businessName, businessType }: { children: React.ReactNode; context: TenantContext; businessName: string; businessType: string }) {
  const sections = visibleSections(context, businessType);
  const mobileSignOut = <form action={logoutAction}><button>Sign out</button></form>;
  return <div className="shell"><aside className="sidebar"><div className="sidebar-top"><Link className="brand" href="/"><span className="brand-mark">L</span><span>LocalOps</span></Link><div className="business-switcher"><span className="business-orb">{businessName.slice(0, 1)}</span><span><small>{businessType === "SALON" ? "SALON WORKSPACE" : "WORKSPACE"}</small><strong>{businessName}</strong></span></div></div><SidebarScroll><Navigation sections={sections} /></SidebarScroll><div className="sidebar-footer"><form action={logoutAction}><button className="signout"><LogOut aria-hidden="true"/> Sign out</button></form></div></aside><main><header className="header"><MobileNavigation signOut={mobileSignOut}><Navigation sections={sections} mobile /></MobileNavigation><span className="header-title">{businessType === "SALON" ? "Salon workspace" : "Operations workspace"}</span><ThemeToggle /></header><div className="content">{children}</div></main></div>;
}
