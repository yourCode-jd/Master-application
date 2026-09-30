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
