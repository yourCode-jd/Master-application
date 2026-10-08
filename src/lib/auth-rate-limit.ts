import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";

const WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 8;

async function keyFor(email: string) {
  const requestHeaders = await headers();
  const forwarded = process.env.TRUST_PROXY === "true" ? requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() : undefined;
  const address = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  return createHash("sha256").update(`${email.trim().toLowerCase()}|${address}`).digest("hex");
}

export async function assertLoginAllowed(email: string) {
  const key = await keyFor(email); const row = await db.authRateLimit.findUnique({ where: { key } });
  if (row?.blockedUntil && row.blockedUntil > new Date()) throw new Error("Too many sign-in attempts. Please wait 15 minutes and try again.");
  return key;
}

export async function recordLoginFailure(key: string) {
  const now = new Date(); const existing = await db.authRateLimit.findUnique({ where: { key } });
  if (!existing || now.getTime() - existing.windowStarted.getTime() >= WINDOW_MS) return db.authRateLimit.upsert({ where: { key }, update: { attempts: 1, windowStarted: now, blockedUntil: null }, create: { key, attempts: 1, windowStarted: now } });
  const attempts = existing.attempts + 1;
  return db.authRateLimit.update({ where: { key }, data: { attempts, blockedUntil: attempts >= MAX_ATTEMPTS ? new Date(now.getTime() + WINDOW_MS) : null } });
}

export async function clearLoginFailures(key: string) { await db.authRateLimit.delete({ where: { key } }).catch(() => undefined); }
