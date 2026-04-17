import { Router, type IRouter } from "express";
import { db, employeesTable, attendanceLogsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import {
  PunchBody,
  ListAttendanceLogsQueryParams,
  GetEmployeeAttendanceParams,
  GetEmployeeAttendanceQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/attendance/punch", async (req, res): Promise<void> => {
  const parsed = PunchBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(and(eq(employeesTable.nationalId, parsed.data.nationalId), eq(employeesTable.status, "active")));

  if (!employee) {
    res.status(404).json({ error: "Employee not found or inactive" });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [lastLog] = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(eq(attendanceLogsTable.employeeId, employee.id), gte(attendanceLogsTable.timestamp, today)))
    .orderBy(desc(attendanceLogsTable.timestamp))
    .limit(1);

  const type = !lastLog || lastLog.type === "check_out" ? "check_in" : "check_out";

  const [log] = await db
    .insert(attendanceLogsTable)
    .values({ employeeId: employee.id, type, timestamp: new Date() })
    .returning();

  const message =
    type === "check_in"
      ? `Welcome, ${employee.name}! Check-in recorded.`
      : `Goodbye, ${employee.name}! Check-out recorded.`;

  res.json({ type, employee, log, message });
});

router.get("/attendance/logs", requireAuth, async (req, res): Promise<void> => {
  const queryParsed = ListAttendanceLogsQueryParams.safeParse(req.query);
  const params = queryParsed.success ? queryParsed.data : {};

  const page = params.page ?? 1;
  const limit = params.limit ?? 50;
  const offset = (page - 1) * limit;

  const conditions = [];
  if (params.employeeId) conditions.push(eq(attendanceLogsTable.employeeId, params.employeeId));
  if (params.date) {
    const start = new Date(params.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(params.date);
    end.setHours(23, 59, 59, 999);
    conditions.push(gte(attendanceLogsTable.timestamp, start));
    conditions.push(lte(attendanceLogsTable.timestamp, end));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  const employeeIds = [...new Set(rawLogs.map((l) => l.employeeId))];
  const employees = employeeIds.length > 0
    ? await db.select().from(employeesTable).where(sql`${employeesTable.id} = ANY(${employeeIds})`)
    : [];
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const logs = rawLogs.map((l) => ({ ...l, employee: empMap[l.employeeId] }));

  res.json({ logs, total: countResult?.count ?? 0, page, limit });
});

router.get("/attendance/today", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(gte(attendanceLogsTable.timestamp, today))
    .orderBy(desc(attendanceLogsTable.timestamp))
    .limit(100);

  const employeeIds = [...new Set(rawLogs.map((l) => l.employeeId))];
  const employees = employeeIds.length > 0
    ? await db.select().from(employeesTable).where(sql`${employeesTable.id} = ANY(${employeeIds})`)
    : [];
  const empMap = Object.fromEntries(employees.map((e) => [e.id, e]));

  const logs = rawLogs.map((l) => ({ ...l, employee: empMap[l.employeeId] }));
  res.json(logs);
});

router.get("/attendance/employee/:id", requireAuth, async (req, res): Promise<void> => {
  const paramsParsed = GetEmployeeAttendanceParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: paramsParsed.error.message });
    return;
  }

  const queryParsed = GetEmployeeAttendanceQueryParams.safeParse(req.query);
  const queryData = queryParsed.success ? queryParsed.data : {};

  const conditions = [eq(attendanceLogsTable.employeeId, paramsParsed.data.id)];
  if (queryData.startDate) {
    const start = new Date(queryData.startDate);
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(attendanceLogsTable.timestamp, start));
  }
  if (queryData.endDate) {
    const end = new Date(queryData.endDate);
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
