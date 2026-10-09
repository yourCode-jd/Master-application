"use client";

import { useRef } from "react";
import { Menu, X } from "lucide-react";

export function MobileNavigation({ children, signOut }: { children: React.ReactNode; signOut: React.ReactNode }) {
  const menuRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  function closeMenu() {
    if (!menuRef.current?.open) return;
    menuRef.current.open = false;
    summaryRef.current?.focus();
  }

  return <details ref={menuRef} className="mobile-menu" onKeyDown={(event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
    }
  }}>
    <summary ref={summaryRef} aria-label="Open navigation" aria-controls="mobile-navigation"><Menu aria-hidden="true"/></summary>
    <div className="mobile-menu-layer">
      <button type="button" className="mobile-menu-backdrop" aria-label="Close navigation" onClick={closeMenu}/>
      <div id="mobile-navigation" className="mobile-menu-drawer" onClick={(event) => {
        if ((event.target as HTMLElement).closest("a")) closeMenu();
      }}>
        <div className="mobile-menu-heading"><strong>Navigation</strong><button type="button" aria-label="Close navigation" onClick={closeMenu}><X aria-hidden="true"/></button></div>
        {children}
        {signOut}
      </div>
    </div>
  </details>;
}
