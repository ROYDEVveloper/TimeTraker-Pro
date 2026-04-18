import { Router, type IRouter } from "express";
import { db, workScheduleTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/work-schedule", requireAuth, async (_req, res): Promise<void> => {
  const schedules = await db.select().from(workScheduleTable);
  const schedule = schedules[0] ?? {
    id: 0,
    startTime: "09:00",
    endTime: "18:00",
    workDays: ["mon", "tue", "wed", "thu", "fri"],
    lateToleranceMinutes: 15,
  };
  res.json(schedule);
});

router.put("/work-schedule", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const { startTime, endTime, workDays, lateToleranceMinutes } = req.body;

  if (!startTime || !endTime || !Array.isArray(workDays)) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const existing = await db.select().from(workScheduleTable);

  let schedule;
  if (existing.length === 0) {
    [schedule] = await db
      .insert(workScheduleTable)
      .values({ startTime, endTime, workDays, lateToleranceMinutes: lateToleranceMinutes ?? 15 })
      .returning();
  } else {
    [schedule] = await db
      .update(workScheduleTable)
      .set({ startTime, endTime, workDays, lateToleranceMinutes: lateToleranceMinutes ?? 15 })
      .returning();
  }

  res.json(schedule);
});

export default router;
