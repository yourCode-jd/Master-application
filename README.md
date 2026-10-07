# LocalOps — Phase 1

A reusable local-business operating platform foundation. It deliberately contains no vertical workflows.

## Stack

Next.js App Router, React, TypeScript, PostgreSQL, Prisma, Tailwind CSS v4, and pnpm.

## Setup

1. Copy `.env.example` to `.env` and supply a local PostgreSQL `DATABASE_URL` plus a 32-character `SESSION_SECRET`.
2. Run `pnpm install`.
3. Run `pnpm db:generate`, then `pnpm db:migrate --name init`, then `pnpm db:seed`.
4. Run `pnpm dev` and visit `http://localhost:3000`.

Demo login: `owner@demo.local` / `DemoPass123!` (manager and staff accounts use the same password).

## Commands

`pnpm typecheck` · `pnpm test` · `pnpm build` · `pnpm db:seed`

## Architecture

- `src/app`: routes, layouts, and server actions
- `src/components`: reusable UI primitives and shell
- `src/domain`: business rules and validated write services
- `src/lib`: DB, environment, authentication, tenancy, RBAC, audit helpers
- `src/integrations`: provider contracts plus simulation adapters
- `prisma`: schema and synthetic seed

## Tenant and permission model

Every tenant-owned model has `businessId`. Server-side services obtain an active authenticated tenant context and filter writes and reads by that business. Roles, permissions, and role assignments are database-backed; UI navigation is only a convenience, while domain services enforce permissions.

## Phase 1 includes

Authentication/session handling, multi-business schema, RBAC, responsive dark/light shell, customer CRUD, activity feed, task management, basic inventory movements, audit log, seed data, and foundation-rule tests.

## Deferred Product Research

The following are intentionally not designed: salon appointments, salon return prediction, commissions, cafe KOT/KDS, recipes, wastage intelligence, retail POS/GST, supplier intelligence, customer loyalty, AI assistant, WhatsApp automation, and advanced reporting.
## Local PostgreSQL setup

The committed example uses placeholders and will not authenticate until you create a dedicated local role and database. On a machine where you have PostgreSQL administrator access, run:

```sql
CREATE ROLE localops_user LOGIN PASSWORD 'choose-a-strong-local-password';
CREATE DATABASE local_ops OWNER localops_user;
```

Then set `.env` (never commit it):

```dotenv
DATABASE_URL="postgresql://localops_user:choose-a-strong-local-password@localhost:5432/local_ops?schema=public"
SESSION_SECRET="a-random-secret-with-at-least-32-characters"
```

Apply the checked-in migration history and seed without resetting existing data:

```bash
pnpm db:generate
pnpm prisma migrate deploy
pnpm db:seed
```

If the existing local PostgreSQL installation is administered by another user, obtain a dedicated role/database from that administrator rather than reusing or guessing another project’s credentials.

## Current migration status

`0001_phase1_foundation` contains the initial schema. `0002_phase2_operations` is currently empty and must be replaced with a safe incremental migration after a valid PostgreSQL connection is configured; do not use it as proof that Phase 2 was applied.

### Included isolated development database

This workspace also has an isolated PostgreSQL cluster under `.postgres-data`, listening only on `127.0.0.1:5433`. It avoids reliance on the machine-wide PostgreSQL password. Use `pnpm db:local:start` before development, or `pnpm dev:local` to start the database and Next.js together. Use `pnpm db:local:stop` to stop it cleanly. Do not rename the project folder while the local database is running; if the folder is moved, run `pnpm db:local:start` again from its new location.
