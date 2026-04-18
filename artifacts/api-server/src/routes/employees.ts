import { Router, type IRouter } from "express";
import { db, employeesTable, attendanceLogsTable, workScheduleTable } from "@workspace/db";
import { eq, ilike, and, or, gte, inArray } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";

const DAY_MAP: Record<number, string> = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

const router: IRouter = Router();

router.get("/employees", requireAuth, async (req, res): Promise<void> => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  const conditions = [];

  if (query.success) {
    if (query.data.search) {
      const search = `%${query.data.search}%`;
      conditions.push(
        or(
          ilike(employeesTable.name, search),
          ilike(employeesTable.nationalId, search),
          ilike(employeesTable.department, search),
          ilike(employeesTable.position, search)
        )
      );
    }
    if (query.data.status) {
      conditions.push(eq(employeesTable.status, query.data.status));
    }
  }

  const employees = await db
    .select()
    .from(employeesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(employeesTable.name);

  res.json(employees);
});

router.post("/employees", requireAuth, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await db
    .select({ id: employeesTable.id })
    .from(employeesTable)
    .where(eq(employeesTable.nationalId, parsed.data.nationalId));

  if (existing.length > 0) {
    res.status(409).json({ error: "An employee with this national ID already exists" });
    return;
  }

  const [employee] = await db.insert(employeesTable).values(parsed.data).returning();
  res.status(201).json(employee);
});

router.get("/employees/status", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDayStr = DAY_MAP[new Date().getDay()];

  const schedules = await db.select().from(workScheduleTable);
  const schedule = schedules[0];
  const workDays: string[] = schedule?.workDays ?? ["mon", "tue", "wed", "thu", "fri"];
  const isWorkDay = workDays.includes(todayDayStr);

  const employees = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"))
    .orderBy(employeesTable.name);

  if (employees.length === 0) {
    res.json([]);
    return;
  }

  const employeeIds = employees.map((e) => e.id);
  const todayLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(and(gte(attendanceLogsTable.timestamp, today), inArray(attendanceLogsTable.employeeId, employeeIds)));

  const result = employees.map((emp) => {
    const empLogs = todayLogs
      .filter((l) => l.employeeId === emp.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const lastLog = empLogs[0];
    const checkInLog = empLogs.find((l) => l.type === "check_in");

    if (!isWorkDay) {
      return { ...emp, attendanceStatus: "day_off" as const, checkInTime: null as string | null, lastLogTime: null as string | null };
    }

    if (!lastLog) {
      return { ...emp, attendanceStatus: "absent" as const, checkInTime: null as string | null, lastLogTime: null as string | null };
    }

    if (lastLog.type === "check_in") {
      return {
        ...emp,
        attendanceStatus: "inside" as const,
        checkInTime: checkInLog?.timestamp?.toISOString() ?? null,
        lastLogTime: lastLog.timestamp.toISOString(),
      };
    }

    return {
      ...emp,
      attendanceStatus: "outside" as const,
      checkInTime: checkInLog?.timestamp?.toISOString() ?? null,
      lastLogTime: lastLog.timestamp.toISOString(),
    };
  });

  res.json(result);
});

router.get("/employees/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [employee] = await db
    .select()
    .from(employeesTable)
    .where(eq(employeesTable.id, params.data.id));

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(employee);
});

router.patch("/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const params = UpdateEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [employee] = await db
    .update(employeesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(employeesTable.id, params.data.id))
    .returning();

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.json(employee);
});

router.delete("/employees/:id", requireAuth, requireRole("admin", "manager"), async (req, res): Promise<void> => {
  const params = DeleteEmployeeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [employee] = await db
    .delete(employeesTable)
    .where(eq(employeesTable.id, params.data.id))
    .returning();

  if (!employee) {
    res.status(404).json({ error: "Employee not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
