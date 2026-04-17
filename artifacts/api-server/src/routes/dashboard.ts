import { Router, type IRouter } from "express";
import { db, employeesTable, attendanceLogsTable } from "@workspace/db";
import { eq, gte, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/dashboard/summary", requireAuth, async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalResult] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(employeesTable)
    .where(eq(employeesTable.status, "active"));

  const todayLogs = await db
    .select()
    .from(attendanceLogsTable)
    .where(gte(attendanceLogsTable.timestamp, today));

  const checkInsToday = todayLogs.filter((l) => l.type === "check_in").length;
  const checkOutsToday = todayLogs.filter((l) => l.type === "check_out").length;

  const checkedInEmployees = new Set<number>();
  const checkedOutEmployees = new Set<number>();
  const activeTodayEmployees = new Set<number>();

  for (const log of todayLogs) {
    activeTodayEmployees.add(log.employeeId);
    if (log.type === "check_in") checkedInEmployees.add(log.employeeId);
    if (log.type === "check_out") checkedOutEmployees.add(log.employeeId);
  }

  const checkedInNow = [...checkedInEmployees].filter((id) => !checkedOutEmployees.has(id)).length;
  const totalEmployees = totalResult?.count ?? 0;
  const absentToday = Math.max(0, totalEmployees - activeTodayEmployees.size);

  res.json({
    totalEmployees,
    activeToday: activeTodayEmployees.size,
    checkedInNow,
    checkInsToday,
    checkOutsToday,
    absentToday,
  });
});

router.get("/dashboard/attendance-trends", requireAuth, async (_req, res): Promise<void> => {
  const trends = [];

  for (let i = 6; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    day.setHours(0, 0, 0, 0);

    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const logs = await db
      .select()
      .from(attendanceLogsTable)
      .where(
        and(
          gte(attendanceLogsTable.timestamp, day),
          sql`${attendanceLogsTable.timestamp} < ${nextDay}`
        )
      );

    const checkIns = logs.filter((l) => l.type === "check_in").length;
    const checkOuts = logs.filter((l) => l.type === "check_out").length;

    trends.push({
      date: day.toISOString().split("T")[0],
      checkIns,
      checkOuts,
    });
  }

  res.json(trends);
});

export default router;
