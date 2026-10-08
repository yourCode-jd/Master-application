import { db } from "@/lib/db";
import { createMembershipAlerts } from "@/domain/memberships/notifications";

export type MembershipAlertRun = { businesses: number; failures: number };

/** Runs the tenant-scoped alert scan once. Safe to invoke repeatedly. */
export async function runMembershipAlertSweep(): Promise<MembershipAlertRun> {
  const businesses = await db.business.findMany({ where: { type: "SALON", status: "ACTIVE" }, select: { id: true } });
  let failures = 0;
  for (const business of businesses) {
    try {
      await createMembershipAlerts(business.id);
    } catch (error) {
      failures += 1;
      console.error("membership-alert-sweep", { businessId: business.id, error: error instanceof Error ? error.message : "unknown" });
    }
  }
  return { businesses: businesses.length, failures };
}
