import { pgTable, text, serial, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const membershipsTable = pgTable("memberships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  membershipType: text("membership_type").notNull().default("basic"),
  status: text("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  maxBooks: integer("max_books").notNull().default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMembershipSchema = createInsertSchema(membershipsTable).omit({ id: true, createdAt: true });
export type InsertMembership = z.infer<typeof insertMembershipSchema>;
export type Membership = typeof membershipsTable.$inferSelect;
