"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type SetupStep = { label: string; href: string; complete: boolean };

export function SalonSetupChecklist({ businessId, steps }: { businessId: string; steps: SetupStep[] }) {
  const key = `localops:setup-checklist:${businessId}`;
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => setDismissed(localStorage.getItem(key) === "dismissed"), [key]);
  const completed = steps.filter((step) => step.complete).length;
  if (dismissed || completed === steps.length) return null;
  return <section className="panel setup-checklist"><div className="panel-heading"><div><p className="eyebrow">SALON SETUP</p><h2>{completed} of {steps.length} essentials ready</h2></div><button className="text-button" onClick={() => { localStorage.setItem(key, "dismissed"); setDismissed(true); }}>Skip for now</button></div><p className="muted">You can keep working while you finish these basics.</p><ol>{steps.map((step) => <li key={step.label} className={step.complete ? "complete" : undefined}><span aria-hidden="true">{step.complete ? "✓" : "○"}</span><Link href={step.href}>{step.label}</Link><small>{step.complete ? "Ready" : "Set up"}</small></li>)}</ol></section>;
}
