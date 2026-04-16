import { Router, type IRouter } from "express";
import { db, transactionsTable, booksTable, moviesTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import {
  CreateTransactionBody,
  GetTransactionParams,
  ReturnItemParams,
  PayFineParams,
  ApproveTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import type { Request } from "express";

type AuthRequest = Request & { user: { id: number; email: string; role: string } };

const FINE_PER_DAY = 1.0;

async function enrichTransaction(tx: typeof transactionsTable.$inferSelect) {
  const [user] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, tx.userId));
  let itemTitle = "";
  let itemAuthor = "";
  if (tx.itemType === "book") {
    const [book] = await db.select({ title: booksTable.title, author: booksTable.author }).from(booksTable).where(eq(booksTable.id, tx.itemId));
    itemTitle = book?.title ?? "";
    itemAuthor = book?.author ?? "";
  } else {
    const [movie] = await db.select({ title: moviesTable.title, director: moviesTable.director }).from(moviesTable).where(eq(moviesTable.id, tx.itemId));
    itemTitle = movie?.title ?? "";
    itemAuthor = movie?.director ?? "";
  }
  return { ...tx, userName: user?.name ?? "", itemTitle, itemAuthor };
}

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const parsed = ListTransactionsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const authReq = req as AuthRequest;
  const { status, userId, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (status) conditions.push(eq(transactionsTable.status, status));
  if (userId) conditions.push(eq(transactionsTable.userId, userId));
  if (authReq.user.role !== "admin") {
    conditions.push(eq(transactionsTable.userId, authReq.user.id));
  }

  const offset = (page - 1) * limit;
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [txs, countResult] = await Promise.all([
    db.select().from(transactionsTable).where(where).limit(limit).offset(offset).orderBy(transactionsTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(where),
  ]);

  const enriched = await Promise.all(txs.map(enrichTransaction));
  res.json({ data: enriched, total: countResult[0]?.count ?? 0, page, limit });
});

router.post("/transactions", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const authReq = req as AuthRequest;
  const { itemType, itemId, daysToReturn = 14 } = parsed.data;
  const userId = parsed.data.userId ?? authReq.user.id;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysToReturn);

  const [tx] = await db.insert(transactionsTable).values({
    userId,
    itemType,
    itemId,
    status: authReq.user.role === "admin" ? "issued" : "pending",
    issueDate: authReq.user.role === "admin" ? new Date() : null,
    dueDate,
  }).returning();

  if (authReq.user.role === "admin") {
    if (itemType === "book") {
      await db.update(booksTable).set({ availableCopies: sql`${booksTable.availableCopies} - 1` }).where(eq(booksTable.id, itemId));
    } else {
      await db.update(moviesTable).set({ availableCopies: sql`${moviesTable.availableCopies} - 1` }).where(eq(moviesTable.id, itemId));
    }
  }

  const enriched = await enrichTransaction(tx);
  res.status(201).json(enriched);
});

router.get("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  const enriched = await enrichTransaction(tx);
  res.json(enriched);
});

router.post("/transactions/:id/return", requireAuth, async (req, res): Promise<void> => {
  const params = ReturnItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  if (tx.status === "returned") {
    res.status(400).json({ error: "Already returned" });
    return;
  }

  const now = new Date();
  const due = new Date(tx.dueDate);
  let fineAmount = 0;
  if (now > due) {
    const daysOverdue = Math.ceil((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    fineAmount = daysOverdue * FINE_PER_DAY;
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({ status: fineAmount > 0 ? "overdue" : "returned", returnDate: now, fineAmount })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (tx.itemType === "book") {
    await db.update(booksTable).set({ availableCopies: sql`${booksTable.availableCopies} + 1` }).where(eq(booksTable.id, tx.itemId));
  } else {
    await db.update(moviesTable).set({ availableCopies: sql`${moviesTable.availableCopies} + 1` }).where(eq(moviesTable.id, tx.itemId));
  }

  const enriched = await enrichTransaction(updated);
  res.json(enriched);
});

router.post("/transactions/:id/pay-fine", requireAuth, async (req, res): Promise<void> => {
  const params = PayFineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }
  const [updated] = await db
    .update(transactionsTable)
    .set({ finePaid: true, status: "returned" })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  const enriched = await enrichTransaction(updated);
  res.json(enriched);
});

router.post("/transactions/:id/approve", requireAuth, async (req, res): Promise<void> => {
  const params = ApproveTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const authReq = req as AuthRequest;
  if (authReq.user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }

  const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, params.data.id));
  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({ status: "issued", issueDate: new Date() })
    .where(eq(transactionsTable.id, params.data.id))
    .returning();

  if (tx.itemType === "book") {
    await db.update(booksTable).set({ availableCopies: sql`${booksTable.availableCopies} - 1` }).where(eq(booksTable.id, tx.itemId));
  } else {
    await db.update(moviesTable).set({ availableCopies: sql`${moviesTable.availableCopies} - 1` }).where(eq(moviesTable.id, tx.itemId));
  }

  const enriched = await enrichTransaction(updated);
  res.json(enriched);
});

export default router;
