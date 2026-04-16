import { Router, type IRouter } from "express";
import { db, booksTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  CreateBookBody,
  UpdateBookBody,
  GetBookParams,
  UpdateBookParams,
  DeleteBookParams,
  ListBooksQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/books", async (req, res): Promise<void> => {
  const parsed = ListBooksQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, category, available, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (search) conditions.push(ilike(booksTable.title, `%${search}%`));
  if (category) conditions.push(eq(booksTable.category, category));
  if (available === true) conditions.push(sql`${booksTable.availableCopies} > 0`);
  if (available === false) conditions.push(eq(booksTable.availableCopies, 0));

  const offset = (page - 1) * limit;
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [books, countResult] = await Promise.all([
    db.select().from(booksTable).where(where).limit(limit).offset(offset).orderBy(booksTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(booksTable).where(where),
  ]);

  res.json({ data: books, total: countResult[0]?.count ?? 0, page, limit });
});

router.post("/books", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { totalCopies, ...rest } = parsed.data;
  const [book] = await db.insert(booksTable).values({ ...rest, totalCopies, availableCopies: totalCopies }).returning();
  res.status(201).json(book);
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, params.data.id));
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json(book);
});

router.put("/books/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBookBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [book] = await db.update(booksTable).set(parsed.data).where(eq(booksTable.id, params.data.id)).returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.json(book);
});

router.delete("/books/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [book] = await db.delete(booksTable).where(eq(booksTable.id, params.data.id)).returning();
  if (!book) {
    res.status(404).json({ error: "Book not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
