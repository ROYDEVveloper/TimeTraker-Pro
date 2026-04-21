# TimeTrack Pro

Multi-tenant attendance tracking web application. UI is in Spanish.

## Stack
- Frontend: React + Vite + TypeScript + Tailwind + shadcn/ui (artifact: `timetrack-pro`)
- Backend: Express + JWT (artifact: `api-server`, port 8080)
- DB: PostgreSQL via Drizzle ORM (`lib/db`)
- API contract: OpenAPI 3.1 in `lib/api-spec/openapi.yaml`, codegen via orval → `lib/api-zod` and `lib/api-client-react`

## Routing (post-restructure)
- `/` and `/terminal` — public attendance terminal (no sidebar)
- `/login` — admin login
- `/app/dashboard` — admin panel
- `/app/companies` — super admin only
- `/app/employees`, `/app/employees/:id` — employee management
- `/app/reports`, `/app/users`, `/app/workshift`
- `/app/settings/roles` — Roles & Permissions matrix
- `/app/settings/audit` — Audit log viewer
- Legacy paths (e.g. `/dashboard`, `/employees`) redirect to `/app/*`.

## Roles
- `super_admin` — global, manages companies (Roydeveloper / roydeveloper@timetrack.com / 011224, companyId NULL)
- `admin` — company-scoped admin
- `employee` — terminal use only
- The custom-roles UI at `/app/settings/roles` is read-only and shows the permission matrix.

## Secure Attendance (PIN 2FA)
The terminal uses a two-step flow:
1. `POST /api/attendance/verify-identity` with `documentNumber` → returns `{ employeeName, requiresPin, requiresPhoneLast4 }` or 404.
2. `POST /api/attendance/punch` with `documentNumber` + `pin` (or `phoneLast4`) → records punch.
- 3 failed attempts per (documentNumber, IP) lock the terminal for 60 seconds (in-memory store).
- PINs are bcrypt-hashed in `employees.pin_hash`. Admins set them at `/app/employees/:id` via `PUT /api/employees/:id/pin`.
- If an employee has no PIN configured, the terminal falls back to last-4-digits-of-phone, or (if neither is set) allows punching without a second factor.

## Audit Logs
- Table `audit_logs` (companyId, userId, userEmail, action, resource, resourceId, details, ipAddress, timestamp).
- Helper: `artifacts/api-server/src/lib/audit.ts` — `audit(req, entry)`.
- Logged actions: `login`, `login_failed`, `logout`, `create_employee`, `set_employee_pin`, `attendance_punch`, `attendance_failed`, `attendance_locked`.
- Admin views logs scoped to their company at `/app/settings/audit` via `GET /api/audit/logs`. Super admin sees all.

## Workflows
- `API Server`: `PORT=8080 pnpm --filter @workspace/api-server run dev`
- `Start application`: `PORT=5000 BASE_PATH=/ pnpm --filter @workspace/timetrack-pro run dev`

## Theme
- Theme key `timetrack_theme` in localStorage. Default dark. Pre-hydrated via inline script in `index.html`.

## Frequent commands
- DB push: `pnpm --filter @workspace/db run push`
- API codegen: `pnpm --filter @workspace/api-spec run codegen` (regen after openapi.yaml changes)

## Notes
- "Abrir Terminal" in the admin sidebar opens `/terminal` in a new tab.
- The terminal has a top-left "Modo Administrador" button that returns to `/login`.
- Layout uses `overflow-x-hidden` on root and main to prevent horizontal overflow; main content max-width is 1600px.
