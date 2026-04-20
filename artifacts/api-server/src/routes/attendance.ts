import { Router, type IRouter } from "express";
import { db, employeesTable, attendanceLogsTable, workScheduleTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// Public punch endpoint — no auth required, employee found by document number
router.post("/attendance/punch", async (req, res): Promise<void> => {
  const { documentNumber } = req.body;

  if (!documentNumber) {
    res.status(400).json({ error: "Número de documento requerido" });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.documentNumber, documentNumber), eq(employeesTable.status, "active")));

  if (!employee) {
    res.status(404).json({ error: "Empleado no encontrado o inactivo" });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(eq(attendanceLogsTable.employeeId, employee.id), gte(attendanceLogsTable.timestamp, today)))
    .orderBy(desc(attendanceLogsTable.timestamp));

  const lastLog = todayLogs[0];
  const type = !lastLog || lastLog.type === "check_out" ? "check_in" : "check_out";

  const now = new Date();
  const [log] = await db
    .insert(attendanceLogsTable)
    .values({ companyId: employee.companyId, employeeId: employee.id, type, timestamp: now })
    .returning();

  // Calculate today summary
  const checkInLog = [...todayLogs, log].filter((l) => l.type === "check_in").sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )[0];

  const checkOutLogs = [...todayLogs, log]
    .filter((l) => l.type === "check_out")
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const firstCheckIn = checkInLog?.timestamp ? new Date(checkInLog.timestamp) : null;
  const lastCheckOut = type === "check_out" ? now : (checkOutLogs[0]?.timestamp ? new Date(checkOutLogs[0].timestamp) : null);

  let workedHours = 0;
  let extraHours = 0;

  if (firstCheckIn && lastCheckOut) {
    workedHours = (lastCheckOut.getTime() - firstCheckIn.getTime()) / (1000 * 60 * 60);
    extraHours = Math.max(0, workedHours - 8);
  }

  const message =
    type === "check_in"
      ? `¡Bienvenido, ${employee.name}! Entrada registrada.`
      : `¡Hasta luego, ${employee.name}! Salida registrada.`;

  res.json({
    type,
    employee,
    log,
    message,
    todaySummary: {
      checkInTime: firstCheckIn?.toISOString() ?? null,
      checkOutTime: type === "check_out" ? now.toISOString() : null,
      workedHours: Math.round(workedHours * 100) / 100,
      extraHours: Math.round(extraHours * 100) / 100,
    },
  });
});

// Get today summary for a document number (public)
router.get("/attendance/today-summary/:document", async (req, res): Promise<void> => {
  const { document } = req.params;

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.documentNumber, document));

  if (!employee) {
    res.status(404).json({ error: "Empleado no encontrado" });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(eq(attendanceLogsTable.employeeId, employee.id), gte(attendanceLogsTable.timestamp, today)))
    .orderBy(attendanceLogsTable.timestamp);

  const checkIns = todayLogs.filter((l) => l.type === "check_in");
  const checkOuts = todayLogs.filter((l) => l.type === "check_out");

  const firstCheckIn = checkIns[0]?.timestamp ? new Date(checkIns[0].timestamp) : null;
  const lastCheckOut = checkOuts[checkOuts.length - 1]?.timestamp
    ? new Date(checkOuts[checkOuts.length - 1].timestamp)
    : null;

  let workedHours = 0;
  let extraHours = 0;

  if (firstCheckIn && lastCheckOut) {
    workedHours = (lastCheckOut.getTime() - firstCheckIn.getTime()) / (1000 * 60 * 60);
    extraHours = Math.max(0, workedHours - 8);
  }

  res.json({
    employee: { id: employee.id, name: employee.name, department: employee.department, documentNumber: employee.documentNumber },
    checkInTime: firstCheckIn?.toISOString() ?? null,
    checkOutTime: lastCheckOut?.toISOString() ?? null,
    workedHours: Math.round(workedHours * 100) / 100,
    extraHours: Math.round(extraHours * 100) / 100,
  });
});

// Attendance logs (auth required, filtered by company)
router.get("/attendance/logs", requireAuth, async (req, res): Promise<void> => {
  const companyId = req.user!.companyId;
  if (!companyId) {
    res.status(403).json({ error: "Se requiere contexto de empresa" });
    return;
  }

  const { employeeId, startDate, endDate, page: pageStr, limit: limitStr } = req.query as Record<string, string>;
  const page = parseInt(pageStr ?? "1");
  const limit = parseInt(limitStr ?? "50");
  const offset = (page - 1) * limit;

  const conditions: any[] = [eq(attendanceLogsTable.companyId, companyId)];
  if (employeeId) conditions.push(eq(attendanceLogsTable.employeeId, parseInt(employeeId)));
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(attendanceLogsTable.timestamp, start));
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(attendanceLogsTable.timestamp, end));
  }

  const whereClause = and(...conditions);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(attendanceLogsTable)
    .where(whereClause);

  const rawLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(whereClause)
    .orderBy(desc(attendanceLogsTable.timestamp))
    .limit(limit)
    .offset(offset);

  const empIds = [...new Set(rawLogs.map((l) => l.employeeId))];
  const employees = empIds.length > 0
    ? await db.select().from(employeesTable).where(inArray(employeesTable.id, empIds))
    : [];
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const logs = rawLogs.map((l) => ({ ...l, employee: empMap[l.employeeId] }));

  res.json({ logs, total: countResult?.count ?? 0, page, limit });
});

// Today's activity (auth required, filtered by company)
router.get("/attendance/today", requireAuth, async (req, res): Promise<void> => {
  const companyId = req.user!.companyId;
  if (!companyId) {
    res.status(403).json({ error: "Se requiere contexto de empresa" });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(eq(attendanceLogsTable.companyId, companyId), gte(attendanceLogsTable.timestamp, today)))
    .orderBy(desc(attendanceLogsTable.timestamp))
    .limit(100);

  const empIds = [...new Set(rawLogs.map((l) => l.employeeId))];
  const employees = empIds.length > 0
    ? await db.select().from(employeesTable).where(inArray(employeesTable.id, empIds))
    : [];
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const logs = rawLogs.map((l) => ({ ...l, employee: empMap[l.employeeId] }));
  res.json(logs);
});

// Employee attendance history (auth required)
router.get("/attendance/employee/:id", requireAuth, async (req, res): Promise<void> => {
  const companyId = req.user!.companyId;
  const empId = parseInt(req.params.id);
  if (isNaN(empId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const { startDate, endDate } = req.query as Record<string, string>;
  const conditions: any[] = [eq(attendanceLogsTable.employeeId, empId)];
  if (companyId) conditions.push(eq(attendanceLogsTable.companyId, companyId));
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(attendanceLogsTable.timestamp, start));
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(attendanceLogsTable.timestamp, end));
  }

  const logs = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(...conditions))
    .orderBy(desc(attendanceLogsTable.timestamp));

  res.json(logs);
});

export default router;
