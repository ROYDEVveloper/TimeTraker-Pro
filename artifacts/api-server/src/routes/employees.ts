import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import { eq, ilike, and, or } from "drizzle-orm";
import { requireAuth, requireRole } from "../middlewares/auth";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
  ListEmployeesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", requireAuth, async (req, res): Promise<void> => {
  const query = ListEmployeesQueryParams.safeParse(req.query);
  let conditions = [];

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
