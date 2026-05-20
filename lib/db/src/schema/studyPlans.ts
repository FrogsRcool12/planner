import { pgTable, serial, integer, text, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { assignments } from "./assignments";

export const studyPlans = pgTable("study_plans", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => assignments.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  activity: text("activity").notNull(),
  durationMinutes: integer("duration_minutes"),
  completed: boolean("completed").notNull().default(false),
  userId: text("user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertStudyPlanSchema = createInsertSchema(studyPlans).omit({ id: true, createdAt: true });
export type StudyPlan = typeof studyPlans.$inferSelect;
export type InsertStudyPlan = z.infer<typeof insertStudyPlanSchema>;
