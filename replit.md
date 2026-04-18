# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Project: TimeTrack Pro

A full-stack SaaS attendance control system with:
- **Frontend**: React + Vite + Tailwind CSS (dark/light mode toggle) at `artifacts/timetrack-pro`
- **Backend**: Node/Express 5 API server at `artifacts/api-server`
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT-based with role-based access control (admin/manager/employee)
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

## Features

1. **Login** (`/login`) — JWT auth con credenciales de demo en pantalla
2. **Panel de Control** (`/dashboard`) — Tarjetas de estadísticas + gráfico de barras 7 días + actividad en tiempo real (polling 30s)
3. **Terminal** (`/terminal`) — Teclado numérico + soporte teclado físico (Enter, Esc, Backspace, 0-9), sidebar completo
4. **Empleados** (`/employees`) — CRUD completo + columna de estado en tiempo real (Dentro/Fuera/Ausente/Día libre) + temporizador de tiempo en oficina (actualiza cada segundo)
5. **Detalle del Empleado** (`/employees/:id`) — Perfil + historial de asistencia
6. **Reportes** (`/reports`) — Tabla filtrable de asistencia con exportación CSV
7. **Gestión de Usuarios** (`/settings/users`) — CRUD de usuarios (solo admin)
8. **Jornada Laboral** (`/settings/jornada`) — Configurar horario, días laborales y tolerancia de tardanza (solo admin)
9. **Dark/Light mode toggle** — Persiste en localStorage, botón Sol/Luna en sidebar

## API Endpoints (new since initial setup)

- `GET /api/employees/status` — Estado actual de todos los empleados (inside/outside/absent/day_off)
- `GET /api/work-schedule` — Obtener configuración de jornada laboral
- `PUT /api/work-schedule` — Actualizar configuración de jornada laboral

## Roles

- **admin** — Acceso completo (incluyendo /settings/users y /settings/jornada)
- **manager** — Panel, empleados, reportes
- **employee** — Solo panel y terminal

## Seeded Credentials

- `admin@timetrackpro.com` / `admin123`
- `manager@timetrackpro.com` / `manager123`
- 7 empleados de muestra con datos de asistencia de 7 días

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
- ThemeContext lives at `artifacts/timetrack-pro/src/contexts/ThemeContext.tsx`
- Employee attendance status values: "inside" | "outside" | "absent" | "day_off"
- Work days use abbreviations: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
