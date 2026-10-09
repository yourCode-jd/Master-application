"use client";

import { useActionState, useState } from "react";
import { loginAction } from "@/app/actions";

const demoAccounts = [{ role: "Owner", email: "owner@demo.local" }, { role: "Manager", email: "manager@demo.local" }, { role: "Staff", email: "staff@demo.local" }, { role: "Staff", email: "staff2@demo.local" }] as const;
const demoPassword = "DemoPass123!";

export default function Login() {
  const [state, formAction, pending] = useActionState<{ error?: string }, FormData>(loginAction, {});
  const demo = process.env.NODE_ENV !== "production";
  const [email, setEmail] = useState(demo ? "owner@demo.local" : "");
  const [password, setPassword] = useState(demo ? demoPassword : "");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const errorId = state.error ? "login-error" : undefined;
  async function copyCredentials(account: typeof demoAccounts[number]) { await navigator.clipboard?.writeText(`${account.email}\n${demoPassword}`); setCopied(account.email); window.setTimeout(() => setCopied(null), 1600); }
  return <main className="login"><div className="login-stack"><form action={formAction} className="login-card"><p className="eyebrow">LOCAL BUSINESS PLATFORM</p><h1>Welcome back</h1><p>Sign in to your operations workspace.</p><label>Email<input name="email" type="email" required autoComplete="email" aria-describedby={errorId} value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input name="password" type="password" required autoComplete="current-password" aria-describedby={errorId} value={password} onChange={(event) => setPassword(event.target.value)} /></label>{state.error && <p id="login-error" className="error" role="alert">{state.error}</p>}<button className="btn" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button><a className="text-button" href="/forgot-password">Forgot password?</a></form>{demo && <section className="demo-access"><button type="button" className="demo-toggle" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="demo-access-list"><span>Demo access</span><small>Choose an account to fill the form</small><span aria-hidden="true" className="demo-chevron">⌄</span></button>{open && <div id="demo-access-list" className="demo-list"><p>All demo accounts use <code>{demoPassword}</code>.</p>{demoAccounts.map((account) => <div className="demo-account" key={account.email}><div><strong>{account.role}</strong><span>{account.email}</span></div><div className="demo-actions"><button type="button" onClick={() => { setEmail(account.email); setPassword(demoPassword); }}>Use</button><button type="button" className="copy-account" onClick={() => copyCredentials(account)} aria-label={`Copy ${account.role} credentials`} title="Copy credentials">{copied === account.email ? "✓" : "⧉"}</button></div></div>)}</div>}</section>}</div></main>;
}
