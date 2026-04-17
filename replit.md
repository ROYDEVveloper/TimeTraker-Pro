# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: TimeTrack Pro

A full-stack SaaS attendance control system with:
- **Frontend**: React + Vite + Tailwind CSS (dark mode default) at `artifacts/timetrack-pro`
- **Backend**: Node/Express 5 API server at `artifacts/api-server`
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT-based with role-based access control (admin/manager/employee)
- **API Client**: Auto-generated hooks via Orval at `lib/api-client-react`

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

## Features

1. **Login Page** (`/login`) — JWT auth with demo credentials shown
2. **Dashboard** (`/dashboard`) — Stats cards + 7-day attendance bar chart + today's live activity feed
3. **Kiosk Terminal** (`/terminal`) — Public, numeric keypad + national ID punch-in/out with feedback
4. **Employees** (`/employees`) — Full CRUD table (admin only for edit/delete)
5. **Employee Detail** (`/employees/:id`) — Profile + attendance history
6. **Reports** (`/reports`) — Filterable attendance log browser with CSV export
7. **User Management** (`/settings/users`) — Admin-only user CRUD

## Roles

- **admin** — Full access (all pages including /settings/users)
- **manager** — Dashboard, employees, reports
- **employee** — Dashboard only

## Seeded Credentials

- `admin@timetrackpro.com` / `admin123`
- `manager@timetrackpro.com` / `manager123`
- 7 seeded employees with sample attendance data

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
  - **IMPORTANT**: After codegen, always rewrite `lib/api-zod/src/index.ts` to `export * from "./generated/api";`
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Critical Notes

- Vite frontend proxies `/api/*` to `localhost:8080` (the API server)
- `setAuthTokenGetter` is imported from `@workspace/api-client-react` (main export), NOT from a subpath
- After orval codegen, `lib/api-zod/src/index.ts` must only export `./generated/api` (not `./generated/types`)
- bcrypt hashing is done via `api-server` package only (bcryptjs not installed at root)
- `useListEmployees`, `useListAttendanceLogs`, `useListUsers` are the correct hook names (not useGet*)

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
