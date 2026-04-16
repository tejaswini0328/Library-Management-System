import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  isbn: text("isbn"),
  category: text("category").notNull(),
  description: text("description"),
  totalCopies: integer("total_copies").notNull().default(1),
  availableCopies: integer("available_copies").notNull().default(1),
  publishedYear: integer("published_year"),
  status: text("status").notNull().default("available"),
  coverUrl: text("cover_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBookSchema = createInsertSchema(booksTable).omit({ id: true, createdAt: true });
export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof booksTable.$inferSelect;
