import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const moviesTable = pgTable("movies", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  director: text("director").notNull(),
  genre: text("genre").notNull(),
  description: text("description"),
  duration: integer("duration"),
  releaseYear: integer("release_year"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  status: text("status").notNull().default("available"),
  posterUrl: text("poster_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMovieSchema = createInsertSchema(moviesTable).omit({ id: true, createdAt: true });
export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof moviesTable.$inferSelect;
