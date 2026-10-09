"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, CheckSquare, Circle, CircleDollarSign, ClipboardList, Clock3, ContactRound, CreditCard, Gem, HandCoins, LayoutDashboard, Package, Scissors, Settings, ShoppingBag, Sun, UserRound, UsersRound, Warehouse, type LucideIcon } from "lucide-react";

export type NavigationItem = readonly [href: string, label: string, permission: string];

const icons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  "My day": Sun,
  Appointments: CalendarDays,
  "Walk-ins": ContactRound,
  "Follow-ups": Clock3,
  Tasks: CheckSquare,
  Customers: UsersRound,
  Services: Scissors,
  Memberships: Gem,
  Packages: Package,
  Visits: ClipboardList,
  Payments: CreditCard,
  Staff: UserRound,
  Inventory: Warehouse,
  Purchases: ShoppingBag,
  Reports: BarChart3,
  Revenue: CircleDollarSign,
  Commissions: HandCoins,
  Activity: BarChart3,
  Settings,
};

export function SidebarNavigation({ links, mobile = false, label = "Main navigation" }: { links: readonly NavigationItem[]; mobile?: boolean; label?: string }) {
  const pathname = usePathname();
  return <nav className={mobile ? "sidebar-nav mobile-nav" : "sidebar-nav"} aria-label={label}>
    {links.map(([href, label]) => {
      const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
      const Icon = icons[label] ?? Circle;
      return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><span className="nav-glyph" aria-hidden="true"><Icon /></span><span>{label}</span></Link>;
    })}
  </nav>;
}
