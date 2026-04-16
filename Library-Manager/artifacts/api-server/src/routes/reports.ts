import { Router, type IRouter } from "express";
import { db, transactionsTable, booksTable, moviesTable, usersTable, membershipsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

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

router.get("/reports/summary", requireAdmin, async (_req, res): Promise<void> => {
  const [
    booksCount,
    moviesCount,
    usersCount,
    membersCount,
    activeIssues,
    overdueCount,
    pendingRequests,
    finesResult,
    recentTxs,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(booksTable),
    db.select({ count: sql<number>`count(*)::int` }).from(moviesTable),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(membershipsTable).where(eq(membershipsTable.status, "active")),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(eq(transactionsTable.status, "issued")),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(eq(transactionsTable.status, "overdue")),
    db.select({ count: sql<number>`count(*)::int` }).from(transactionsTable).where(eq(transactionsTable.status, "pending")),
    db.select({ total: sql<number>`coalesce(sum(fine_amount), 0)::float` }).from(transactionsTable).where(eq(transactionsTable.finePaid, true)),
    db.select().from(transactionsTable).orderBy(transactionsTable.createdAt).limit(5),
  ]);

  const enrichedRecent = await Promise.all(recentTxs.map(enrichTransaction));

  res.json({
    totalBooks: booksCount[0]?.count ?? 0,
    totalMovies: moviesCount[0]?.count ?? 0,
    totalUsers: usersCount[0]?.count ?? 0,
    totalMembers: membersCount[0]?.count ?? 0,
    activeIssues: activeIssues[0]?.count ?? 0,
    overdueCount: overdueCount[0]?.count ?? 0,
    pendingRequests: pendingRequests[0]?.count ?? 0,
    totalFinesCollected: finesResult[0]?.total ?? 0,
    recentTransactions: enrichedRecent,
  });
});

router.get("/reports/active-issues", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "issued")).orderBy(transactionsTable.issueDate);
  const enriched = await Promise.all(txs.map(enrichTransaction));
  res.json(enriched);
});

router.get("/reports/overdue", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "overdue")).orderBy(transactionsTable.dueDate);
  const enriched = await Promise.all(txs.map(enrichTransaction));
  res.json(enriched);
});

router.get("/reports/pending-requests", requireAdmin, async (_req, res): Promise<void> => {
  const txs = await db.select().from(transactionsTable).where(eq(transactionsTable.status, "pending")).orderBy(transactionsTable.createdAt);
  const enriched = await Promise.all(txs.map(enrichTransaction));
  res.json(enriched);
});

export default router;
