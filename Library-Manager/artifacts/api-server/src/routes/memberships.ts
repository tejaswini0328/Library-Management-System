import { Router, type IRouter } from "express";
import { db, membershipsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateMembershipBody,
  UpdateMembershipBody,
  GetMembershipParams,
  UpdateMembershipParams,
  DeleteMembershipParams,
  ListMembershipsQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/memberships", async (req, res): Promise<void> => {
  const parsed = ListMembershipsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(membershipsTable.status, status));
  const offset = (page - 1) * limit;
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: membershipsTable.id,
        userId: membershipsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        membershipType: membershipsTable.membershipType,
        status: membershipsTable.status,
        startDate: membershipsTable.startDate,
        endDate: membershipsTable.endDate,
        maxBooks: membershipsTable.maxBooks,
        createdAt: membershipsTable.createdAt,
      })
      .from(membershipsTable)
      .leftJoin(usersTable, eq(membershipsTable.userId, usersTable.id))
      .where(where)
      .limit(limit)
      .offset(offset)
      .orderBy(membershipsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(membershipsTable).where(where),
  ]);

  res.json({ data: rows, total: countResult[0]?.count ?? 0, page, limit });
});

router.post("/memberships", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateMembershipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const maxBooks = parsed.data.membershipType === "premium" ? 10 : parsed.data.membershipType === "student" ? 5 : 3;
  const [membership] = await db.insert(membershipsTable).values({ ...parsed.data, maxBooks }).returning();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, membership.userId));
  res.status(201).json({ ...membership, userName: user?.name ?? "", userEmail: user?.email ?? "" });
});

router.get("/memberships/:id", async (req, res): Promise<void> => {
  const params = GetMembershipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({
      id: membershipsTable.id,
      userId: membershipsTable.userId,
      userName: usersTable.name,
      userEmail: usersTable.email,
      membershipType: membershipsTable.membershipType,
      status: membershipsTable.status,
      startDate: membershipsTable.startDate,
      endDate: membershipsTable.endDate,
      maxBooks: membershipsTable.maxBooks,
      createdAt: membershipsTable.createdAt,
    })
    .from(membershipsTable)
    .leftJoin(usersTable, eq(membershipsTable.userId, usersTable.id))
    .where(eq(membershipsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  res.json(row);
});

router.put("/memberships/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateMembershipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMembershipBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const maxBooks = parsed.data.membershipType === "premium" ? 10 : parsed.data.membershipType === "student" ? 5 : 3;
  const [membership] = await db
    .update(membershipsTable)
    .set({ ...parsed.data, maxBooks })
    .where(eq(membershipsTable.id, params.data.id))
    .returning();
  if (!membership) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, membership.userId));
  res.json({ ...membership, userName: user?.name ?? "", userEmail: user?.email ?? "" });
});

router.delete("/memberships/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteMembershipParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [membership] = await db.delete(membershipsTable).where(eq(membershipsTable.id, params.data.id)).returning();
  if (!membership) {
    res.status(404).json({ error: "Membership not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
