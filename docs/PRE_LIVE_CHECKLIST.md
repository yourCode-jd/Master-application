# LocalOps pre-live checklist

Status is deliberately explicit. `PASS` means verified in this workspace; `BLOCKER` requires work before a real-world pilot; `DEFERRED` is intentionally outside the product scope.

## Product and workflows

| Status | Requirement | Evidence / next action |
| --- | --- | --- |
| PASS | Appointment, walk-in, visits, payments, follow-ups, inventory, memberships, packages, and commission domain regressions | 44 automated tests cover critical lifecycle, permission, tenant, idempotency, finance, inventory, and membership/package rules. |
| PASS | Full end-to-end rendered owner/manager/staff workflows | Playwright against the production-style server verified owner operational routes; manager allowed routes; staff My Day and restricted financial/settings routes; plus appointment, walk-in, follow-up, membership, package, and inventory workflows. |
| PASS | No page-render notification writes | Membership/package alerts now run through `pnpm worker` or `pnpm worker:once`. |
| PASS | Scheduled-alert idempotency and preferences | Repeated worker scans produce one unread daily alert per opted-in owner/manager. |
| PASS | Working-hours setup and booking enforcement | Business defaults and location overrides support open/close times and closed days; create/reschedule actions enforce the effective hours server-side. |
| PASS | Full onboarding target | The non-blocking setup checklist covers profile, location, staff, services, first customer, and first appointment; working-hours controls are in Settings. |

## UX, responsive, and accessibility

| Status | Requirement | Evidence / next action |
| --- | --- | --- |
| PASS | Permission-aware grouped navigation and staff My day | Implemented in the shared application shell. |
| PASS | Route error recovery and visible keyboard focus | Shared route error boundary and `:focus-visible` styling added. |
| PASS | Authenticated responsive QA at 360/390/768/1024/1440/1920 | Production-style Playwright rendered dashboard, appointments, customers, inventory, memberships, and settings at every listed width; no document-width overflow. Mobile navigation was keyboard-tested. |
| PASS | Accessibility regression | Browser checks cover labelled login fields, semantic navigation, visible shared focus styling, keyboard menu open/close, Escape focus restoration, and labelled controls used by the operational workflows. |
| PASS | Forms/settings final review | Owner browser regression submitted booking, walk-in, follow-up, membership, package, and inventory forms; Settings was rendered in the owner route sweep. |

## Security and roles

| Status | Requirement | Evidence / next action |
| --- | --- | --- |
| PASS | Tenant and permission enforcement tests | Direct domain-layer tenant/RBAC/finance/inventory/membership tests pass. |
| PASS | Secure session cookie configuration | HTTP-only, SameSite=Lax, 14-day signed session; `secure` is enabled in production. |
| PASS | Demo credentials hidden in production login | Login prefill and demo hint appear only outside production. |
| PASS | Production login rate limiting | Failed logins are database-backed by a hashed email/address key, with an eight-attempt, 15-minute window and a clear retry message. Set `TRUST_PROXY=true` only behind a trusted reverse proxy. |
| PASS | Password reset lifecycle | Generic forgot-password response, hashed one-hour single-use tokens, inactive-user rejection, reset request rate limiting, audit events, and session-version revocation are implemented and covered by reset tests. Development shows simulated delivery links only outside production. |
| PASS | Full route/action role regression | Isolated Owner, Manager, and Staff browser sessions passed. Staff cannot render settings, revenue, or commissions from direct routes; server/domain permission checks remain covered by automated tests. |

## Technical and operations

| Status | Requirement | Evidence / next action |
| --- | --- | --- |
| PASS | Typecheck | `pnpm typecheck` passes. |
| PASS | Automated tests | `pnpm test`: 44 passed, 0 failed. |
| PASS | Clean production build | `pnpm build` exited 0 and `.next/BUILD_ID` exists. |
| PASS | Production startup and health routes | `pnpm start`, `/login`, `/api/health`, `/api/health/database`, manifest, and service worker returned 200. |
| PASS | Worker once | `pnpm worker:once` completed active salon scans with 0 failures. Run `pnpm worker` as an independently supervised process in deployment. |
| PASS | PWA safe offline behavior | Manifest, icons, registration, and an offline fallback are present; operational routes use network-first behavior and are not cached as current data. |
| PASS | Safe database restore drill | Backup restored into `localops_phase3f_restore_check`; source/restored business/customer/notification counts matched `3:50:4`; temporary database and dump were removed. PostgreSQL client/server emitted one benign `transaction_timeout` compatibility warning. |
| PASS | Uploaded-file backup/restore | `pnpm backup` writes database dump, upload archive, checksum manifest, and metadata. `pnpm restore:uploads` requires an explicit target, rejects traversal/non-empty targets, and verifies checksums. An isolated temporary database/storage restore verified two files and matching fixture checksum. |
| DEFERRED | Import/export | No import/export domain is currently implemented; this is not introduced during Phase 3F. |
| PASS | Worker liveness health endpoint | `/api/health/worker` reports a recent successful sweep and returns `503` when stale or unavailable. |

## Pilot gate

Do not call this ready for a real-world pilot until every `BLOCKER` is resolved. Intentionally excluded product areas remain deferred: AI, real WhatsApp delivery, loyalty points, gift cards, payroll, advanced attendance, GST/accounting, autopay, customer mobile apps, cafe, and retail.
