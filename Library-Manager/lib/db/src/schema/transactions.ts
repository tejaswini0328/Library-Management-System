import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  itemType: text("item_type").notNull(),
  itemId: integer("item_id").notNull(),
  status: text("status").notNull().default("pending"),
  issueDate: timestamp("issue_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnDate: timestamp("return_date", { withTimezone: true }),
  fineAmount: real("fine_amount").notNull().default(0),
  finePaid: boolean("fine_paid").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
