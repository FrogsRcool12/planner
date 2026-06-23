import { pgTable, serial, text, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { subjects } from "./subjects";

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: integer("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  dueDate: date("due_date"),
  period: integer("period"),
  taskType: text("task_type").notNull().default("assignment"),
  status: text("status").notNull().default("notStarted"),
  priority: integer("priority").notNull().default(3),
  workloadMinutes: integer("workload_minutes"),
  difficulty: text("difficulty"),
  urgency: text("urgency"),
  aiGenerated: boolean("ai_generated").notNull().default(false),
  notes: text("notes"),
  recurringInterval: text("recurring_interval"),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export type Assignment = typeof assignments.$inferSelect;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
