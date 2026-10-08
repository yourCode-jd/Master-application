import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const heartbeat = await db.workerHeartbeat.findUnique({ where: { name: "membership-alerts" }, select: { lastSuccess: true, updatedAt: true } });
    const fresh = Boolean(heartbeat?.lastSuccess && Date.now() - heartbeat.lastSuccess.getTime() < 15 * 60_000);
    return NextResponse.json({ status: fresh ? "ok" : "stale", worker: "membership-alerts", lastSuccess: heartbeat?.lastSuccess?.toISOString() ?? null }, { status: fresh ? 200 : 503 });
  } catch {
    return NextResponse.json({ status: "unavailable", worker: "membership-alerts" }, { status: 503 });
  }
}
