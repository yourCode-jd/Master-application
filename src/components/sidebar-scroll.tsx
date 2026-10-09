"use client";

import { useEffect, useRef } from "react";

const storageKey = "localops.sidebar.scroll-top";

export function SidebarScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const saved = sessionStorage.getItem(storageKey);
    if (saved) element.scrollTop = Number(saved);
    const persist = () => sessionStorage.setItem(storageKey, String(element.scrollTop));
    element.addEventListener("scroll", persist, { passive: true });
    return () => element.removeEventListener("scroll", persist);
  }, []);

  return <div className="sidebar-scroll" ref={ref}>{children}</div>;
}
