import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({ status: "ok", service: "local-ops", timestamp: new Date().toISOString() });
}
