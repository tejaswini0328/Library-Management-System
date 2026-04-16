import { Router, type IRouter } from "express";
import { db, moviesTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import {
  CreateMovieBody,
  UpdateMovieBody,
  GetMovieParams,
  UpdateMovieParams,
  DeleteMovieParams,
  ListMoviesQueryParams,
} from "@workspace/api-zod";
import { requireAdmin } from "../lib/auth";

const router: IRouter = Router();

router.get("/movies", async (req, res): Promise<void> => {
  const parsed = ListMoviesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { search, genre, available, page = 1, limit = 20 } = parsed.data;

  const conditions = [];
  if (search) conditions.push(ilike(moviesTable.title, `%${search}%`));
  if (genre) conditions.push(eq(moviesTable.genre, genre));
  if (available === true) conditions.push(sql`${moviesTable.availableCopies} > 0`);
  if (available === false) conditions.push(eq(moviesTable.availableCopies, 0));

  const offset = (page - 1) * limit;
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [movies, countResult] = await Promise.all([
    db.select().from(moviesTable).where(where).limit(limit).offset(offset).orderBy(moviesTable.createdAt),
    db.select({ count: sql<number>`count(*)::int` }).from(moviesTable).where(where),
  ]);

  res.json({ data: movies, total: countResult[0]?.count ?? 0, page, limit });
});

router.post("/movies", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateMovieBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { totalCopies, ...rest } = parsed.data;
  const [movie] = await db.insert(moviesTable).values({ ...rest, totalCopies, availableCopies: totalCopies }).returning();
  res.status(201).json(movie);
});

router.get("/movies/:id", async (req, res): Promise<void> => {
  const params = GetMovieParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [movie] = await db.select().from(moviesTable).where(eq(moviesTable.id, params.data.id));
  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.json(movie);
});

router.put("/movies/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateMovieParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateMovieBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [movie] = await db.update(moviesTable).set(parsed.data).where(eq(moviesTable.id, params.data.id)).returning();
  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.json(movie);
});

router.delete("/movies/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteMovieParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [movie] = await db.delete(moviesTable).where(eq(moviesTable.id, params.data.id)).returning();
  if (!movie) {
    res.status(404).json({ error: "Movie not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
