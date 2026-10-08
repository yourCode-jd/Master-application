"use client";

import { useEffect } from "react";

/** Registers the small offline shell only in browsers that support it. */
export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
