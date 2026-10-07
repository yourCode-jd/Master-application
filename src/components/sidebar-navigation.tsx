"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavigationItem = readonly [href: string, label: string, permission: string];

const glyphs: Record<string, string> = {
  Dashboard: "⌂", "My day": "☀", Customers: "◉", Activity: "↗", Staff: "♙", Inventory: "□", Tasks: "✓", Reports: "◫", Settings: "⚙", Appointments: "◷", "Walk-ins": "↳", Services: "✦", "Follow-ups": "↺", Payments: "₹",
};

export function SidebarNavigation({ links, mobile = false }: { links: readonly NavigationItem[]; mobile?: boolean }) {
  const pathname = usePathname();
  return <nav className={mobile ? "sidebar-nav mobile-nav" : "sidebar-nav"} aria-label="Main navigation">
    {links.map(([href, label]) => {
      const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
      return <Link key={href} href={href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}><span className="nav-glyph" aria-hidden="true">{glyphs[label] ?? "·"}</span><span>{label}</span></Link>;
    })}
  </nav>;
}
