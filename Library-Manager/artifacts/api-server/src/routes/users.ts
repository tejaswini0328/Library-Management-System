import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { ListUsersQueryParams } from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/users", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const [users, countResult] = await Promise.all([
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
      .from(usersTable)
      .limit(limit)
      .offset(offset)
      .orderBy(usersTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
  ]);

  res.json({ data: users, total: countResult[0]?.count ?? 0, page, limit });
});

export default router;
