"use client";

import { useRef } from "react";

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
    <summary ref={summaryRef} aria-label="Open navigation" aria-controls="mobile-navigation">☰</summary>
    <div id="mobile-navigation" onClick={(event) => {
      if ((event.target as HTMLElement).closest("a")) closeMenu();
    }}>
      {children}
      {signOut}
    </div>
  </details>;
}
