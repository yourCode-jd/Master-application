# LocalOps Salon

LocalOps is a multi-tenant salon operations workspace for appointments, walk-ins, customers, visits, payments, follow-ups, inventory, memberships, packages, commissions, and reports.

## Run locally

Requirements: Node.js 20+, pnpm 10+, and the project dependencies installed with `pnpm install`.

The repository includes an isolated PostgreSQL cluster in `.postgres-data` for local development. It listens only on `127.0.0.1:5433` and is started automatically by:

```bash
pnpm dev:local
```

Open `http://localhost:3000` and sign in with:

```text
owner@demo.local
DemoPass123!
```

The seeded manager and staff users use the same password. Stop only the local database with `pnpm db:local:stop`.

## Database and schema

The application reads `DATABASE_URL` and `SESSION_SECRET` from `.env`. For an external PostgreSQL server, use a dedicated database and role; never reuse another application’s credentials.

```bash
pnpm db:generate
pnpm prisma migrate deploy
pnpm db:seed
```

`pnpm db:seed` supplies synthetic salon demo data. It is for development and test environments, not a live business database.

## Quality and production checks

```bash
pnpm typecheck
pnpm test
pnpm build
test -f .next/BUILD_ID
pnpm start
```

The build is valid only when `pnpm build` exits with status `0` and `.next/BUILD_ID` exists. After `pnpm start`, verify:

```text
/login
/api/health
/api/health/database
```

The database health endpoint returns only reachability status and does not expose credentials.

## Product workflows

- **Appointments:** create, schedule, reschedule, assign, transition, and complete salon bookings with conflict protection.
- **Walk-ins:** queue, assign, serve, complete, or mark left.
- **Visits and payments:** retain service/staff/price snapshots, record payments, apply permitted discounts, and correct records with audit history.
- **Follow-ups:** act on return recommendations and membership/package attention from the existing task workflow.
- **Inventory:** receive purchases, record consumption, adjustments, damage/returns, and low-stock signals.
- **Memberships and packages:** purchase, renew, cancel, expire, apply membership benefits, and consume package credits without double charging.
- **Finance:** view permitted revenue and commission information; corrections and settlements are auditable.

## Roles and permissions

Permissions are enforced in the server/domain layer. Navigation is a convenience only.

- **Owner:** full salon operational, financial, settings, report, and override access.
- **Manager:** only the daily operations and financial actions granted to their role.
- **Staff:** a simplified daily workspace and only their permitted appointments, tasks, follow-ups, and self-information.

All tenant-owned domain reads and writes are scoped to the active business. Never rely on a hidden button as an access-control measure.

## PWA and offline behavior

The manifest, install icons, service worker, and `/offline` fallback are included. The service worker only serves the offline fallback when navigation fails; it does not cache operational routes as current data.

## Background alert worker

Membership and package expiry/low-credit alerts are not created during dashboard rendering. Run the worker as a separately supervised process:

```bash
pnpm worker
```

For a one-time scheduled invocation (for example, from a platform scheduler), run:

```bash
pnpm worker:once
```

The scan is tenant scoped, respects notification preferences, and deduplicates unread alerts by recipient, type, title, and day.

## Backup and restore

Private uploads live in `uploads-private` by default (override with an absolute `UPLOAD_STORAGE_DIR`). Back up the database and uploads together:

```bash
pnpm backup -- /absolute/path/to/backup-directory
createdb localops_restore_test
pg_restore --dbname=postgresql://.../localops_restore_test --clean --if-exists /absolute/path/to/backup-directory/database.dump
pnpm restore:uploads -- /absolute/path/to/backup-directory /absolute/path/to/empty-restore-directory
```

The upload archive preserves relative paths and has a SHA-256 manifest. Restore rejects traversal paths and non-empty targets unless `--overwrite` is supplied. Perform restores only into separate test database and storage targets first; never restore over active production storage without an approved recovery plan.

## Password reset

`/forgot-password` always returns the same response for every email address. Requests are rate-limited (five per email/address per 15 minutes); reset tokens are random, stored only as hashes, expire after one hour, and can be used once. Successful reset revokes existing signed sessions. Configure a real email provider before production. Without one, the simulated delivery exposes a reset link only in non-production development UI.

## Deferred capabilities

The project intentionally does not include AI assistance, real WhatsApp delivery, loyalty points, gift cards, payroll, advanced attendance, GST/accounting, online subscription autopay, a customer mobile app, cafe workflows, or retail workflows.

## Pre-live checklist

See [docs/PRE_LIVE_CHECKLIST.md](docs/PRE_LIVE_CHECKLIST.md) before a real salon pilot.
