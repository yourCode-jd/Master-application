import { db } from "../src/lib/db";
import { runMembershipAlertSweep } from "../src/worker/membership-alerts";

const once = process.argv.includes("--once");
const intervalMs = Math.max(Number(process.env.WORKER_INTERVAL_MS ?? 300_000), 60_000);
let stopping = false;
let running = false;

async function execute() {
  if (running || stopping) return;
  running = true;
  const started = new Date();
  await db.workerHeartbeat.upsert({ where: { name: "membership-alerts" }, update: { lastStarted: started }, create: { name: "membership-alerts", lastStarted: started } });
  try {
    const result = await runMembershipAlertSweep();
    await db.workerHeartbeat.update({ where: { name: "membership-alerts" }, data: { lastSuccess: new Date(), lastError: null } });
    console.info("membership-alert-sweep-complete", result);
    if (once && result.failures) process.exitCode = 1;
  } catch (error) {
    await db.workerHeartbeat.update({ where: { name: "membership-alerts" }, data: { lastError: error instanceof Error ? error.message.slice(0, 500) : "Unknown worker error" } });
    console.error("membership-alert-sweep-failed", error);
    process.exitCode = 1;
  } finally {
    running = false;
  }
}

async function stop() {
  stopping = true;
  await db.$disconnect();
  process.exit(process.exitCode ?? 0);
}

async function main() {
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  await execute();
  if (once) return stop();
  setInterval(execute, intervalMs);
}

main().catch(async (error) => {
  console.error("worker-start-failed", error);
  process.exitCode = 1;
  await db.$disconnect();
});
