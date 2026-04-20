# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: TimeTrack Pro

A full-stack **multi-tenant SaaS** attendance control system with:
- **Frontend**: React + Vite + Tailwind CSS (dark/light mode toggle) at `artifacts/timetrack-pro`
- **Backend**: Node/Express 5 API server at `artifacts/api-server`
- **Database**: PostgreSQL + Drizzle ORM (multi-tenant with `company_id` FK on all tables)
- **Auth**: JWT-based with role-based access control (super_admin/admin/employee)
- **API Client**: Auto-generated hooks via Orval at `lib/api-client-react`
- **Language**: Full Spanish UI

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Charts**: Recharts

## Multi-tenant Architecture

- Every table (users, employees, attendanceLogs, workSchedule) has `companyId` FK
- `super_admin` users have `companyId = null` and manage all companies
- `admin` users are scoped to their company — all API queries auto-filter by `companyId` from JWT
- `employees.documentNumber` is the globally unique field used for terminal punch (no auth required)

## Routes & Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | **Public** | Terminal kiosk — clock + keypad + todaySummary |
| `/login` | Public | Admin login, redirects based on role |
| `/companies` | super_admin | CRUD for all registered companies |
| `/dashboard` | admin | Stats cards + 7-day chart + live activity feed |
| `/employees` | admin | CRUD + real-time status (Dentro/Fuera/Ausente/Día libre) + live timer |
| `/employees/:id` | admin | Employee profile + attendance history |
| `/reports` | admin | Filterable attendance logs + CSV export |
| `/settings/users` | admin | User CRUD |
| `/settings/jornada` | admin | Work schedule config |

## API Endpoints

### Public (no auth)
- `POST /api/attendance/punch` — Record punch by `documentNumber`, returns `todaySummary`
- `GET /api/attendance/today-summary/:document` — Get today summary for employee

### Auth required (filtered by companyId in JWT)
- `POST /api/auth/login` — Login (returns token with companyId)
- `GET /api/auth/me` — Current user
- `GET /api/companies` — List companies (super_admin only)
- `POST /api/companies` — Create company with optional admin (super_admin only)
- `PATCH /api/companies/:id` — Update company (super_admin only)
- `DELETE /api/companies/:id` — Delete company (super_admin only)
- `GET /api/employees` — List employees for company
- `POST /api/employees` — Create employee
- `GET /api/employees/status` — Real-time attendance status
- `GET /api/employees/:id` — Get employee
- `PATCH /api/employees/:id` — Update employee
- `DELETE /api/employees/:id` — Delete employee
- `GET /api/attendance/logs` — Paginated logs
- `GET /api/attendance/today` — Today's activity feed
- `GET /api/attendance/employee/:id` — Employee history
- `GET /api/dashboard/summary` — Dashboard metrics
- `GET /api/dashboard/attendance-trends` — 7-day chart data
- `GET /api/users`, `POST /api/users`, `DELETE /api/users/:id`
- `GET /api/work-schedule`, `PUT /api/work-schedule`

## Roles

- **super_admin** — Manages companies (no companyId), redirects to /companies after login
- **admin** — Full access within their company, redirects to /dashboard after login
- **employee** — No panel access (for future use)

## Seeded Credentials (Demo)

- `super@timetrack.com` / `super123` — Super Administrador
- `admin@empresa-demo.com` / `admin123` — Admin de Empresa Demo S.A.
- 7 employees with document numbers: 12345678, 23456789, 34567890, 45678901, 56789012, 67890123, 78901234

## DB Schema

Tables: `companies`, `users`, `employees`, `attendanceLogs`, `workSchedule`
- All tables (except `companies`) have `companyId` FK
- `employees.documentNumber` is globally unique (cedulas)
- `users.role` enum: `super_admin | admin | employee`
- `attendanceLogs.type` enum: `check_in | check_out`
- `employees.status` enum: `active | inactive`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
  - **IMPORTANT**: Codegen script auto-fixes `lib/api-zod/src/index.ts` (only exports `./generated/api`)
  - After codegen, lib/api-zod/src/index.ts must be: `export * from "./generated/api";`
- `pnpm --filter @workspace/db run push` — push DB schema changes
- Re-seed: `pnpm --filter @workspace/api-server exec node_modules/.bin/esbuild src/seed.ts --bundle --platform=node --format=cjs --outfile=dist/seed.cjs && node artifacts/api-server/dist/seed.cjs`

## Critical Notes

- Vite frontend proxies `/api/*` to `localhost:8080` (the API server)
- `setAuthTokenGetter` is imported from `@workspace/api-client-react` (main export)
- `logout()` redirects to `/` (Terminal), not `/login`
- bcrypt hashing is done via `api-server` package only (bcryptjs not installed at root)
- Employee attendance status values: "inside" | "outside" | "absent" | "day_off"
- Work days use abbreviations: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
- Terminal is completely public — no auth, employees punch using `documentNumber`
- `super_admin` has no `companyId` — gets null from JWT

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
