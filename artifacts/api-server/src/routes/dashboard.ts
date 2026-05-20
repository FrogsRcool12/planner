import { Router } from "express";
import { db } from "@workspace/db";
import { assignments, notes, reminders, subjects } from "@workspace/db";
import { eq, and, lte, gte, lt } from "drizzle-orm";
import { GetWeeklyViewQueryParams } from "@workspace/api-zod";

const router = Router();

function formatAssignment(
  a: typeof assignments.$inferSelect,
  subject: { name: string; color: string } | null,
) {
  return {
    id: a.id,
    title: a.title,
    description: a.description ?? null,
    subjectId: a.subjectId ?? null,
    subjectName: subject?.name ?? null,
    subjectColor: subject?.color ?? null,
    dueDate: a.dueDate ?? null,
    period: a.period ?? null,
    taskType: a.taskType,
    status: a.status,
    priority: a.priority,
    workloadMinutes: a.workloadMinutes ?? null,
    difficulty: a.difficulty ?? null,
    urgency: a.urgency ?? null,
    aiGenerated: a.aiGenerated,
    notes: a.notes ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/summary", async (req, res) => {
  try {
    const userId = req.auth?.userId ?? null;
    const today = new Date().toISOString().split("T")[0];

    const allRows = await db
      .select({ assignment: assignments, subject: subjects })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .where(userId ? eq(assignments.userId, userId) : undefined);

    const todayAssignments = allRows
      .filter(({ assignment: a }) => a.dueDate === today && a.status !== "completed" && a.status !== "submitted")
      .map(({ assignment: a, subject: s }) => formatAssignment(a, s));

    const overdueAssignments = allRows
      .filter(({ assignment: a }) => a.dueDate !== null && a.dueDate < today && a.status !== "completed" && a.status !== "submitted")
      .map(({ assignment: a, subject: s }) => formatAssignment(a, s));

    const upcomingTests = allRows
      .filter(({ assignment: a }) => (a.taskType === "test" || a.taskType === "quiz") && a.dueDate !== null && a.dueDate >= today)
      .sort((x, y) => (x.assignment.dueDate ?? "").localeCompare(y.assignment.dueDate ?? ""))
      .slice(0, 5)
      .map(({ assignment: a, subject: s }) => formatAssignment(a, s));

    const totalWorkloadMinutesToday = todayAssignments.reduce((sum, a) => sum + (a.workloadMinutes ?? 0), 0);
    const urgentCount = allRows.filter(({ assignment: a }) => a.priority >= 4 && a.status !== "completed" && a.status !== "submitted").length;
    const completedTodayCount = allRows.filter(({ assignment: a }) => a.dueDate === today && (a.status === "completed" || a.status === "submitted")).length;

    const reminderRows = await db
      .select()
      .from(reminders)
      .where(
        and(
          userId ? eq(reminders.userId, userId) : undefined,
          eq(reminders.isRead, false),
        ),
      )
      .orderBy(reminders.createdAt)
      .limit(10);

    const formattedReminders = reminderRows.map((r) => ({
      id: r.id,
      message: r.message,
      type: r.type,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
    }));

    res.json({
      todayAssignments,
      overdueAssignments,
      upcomingTests,
      totalWorkloadMinutesToday,
      urgentCount,
      completedTodayCount,
      reminders: formattedReminders,
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardSummary error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/week", async (req, res) => {
  const parsed = GetWeeklyViewQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid query" });
  try {
    const { weekStart } = parsed.data;
    const userId = req.auth?.userId ?? null;

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = weekEndDate.toISOString().split("T")[0];

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const days = [];

    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(dayDate.getDate() + i);
      const dateStr = dayDate.toISOString().split("T")[0];

      const assignmentRows = await db
        .select({ assignment: assignments, subject: subjects })
        .from(assignments)
        .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
        .where(
          and(
            userId ? eq(assignments.userId, userId) : undefined,
            eq(assignments.dueDate, dateStr),
          ),
        )
        .orderBy(assignments.period, assignments.priority);

      const noteRows = await db
        .select({ note: notes, subject: subjects })
        .from(notes)
        .leftJoin(subjects, eq(notes.subjectId, subjects.id))
        .where(
          and(
            userId ? eq(notes.userId, userId) : undefined,
            eq(notes.weekStart, dateStr),
          ),
        );

      const dayAssignments = assignmentRows.map(({ assignment: a, subject: s }) => formatAssignment(a, s));
      const dayNotes = noteRows.map(({ note: n, subject: s }) => ({
        id: n.id,
        content: n.content,
        subjectId: n.subjectId ?? null,
        subjectName: s?.name ?? null,
        subjectColor: s?.color ?? null,
        period: n.period ?? null,
        weekStart: n.weekStart ?? null,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }));

      days.push({
        date: dateStr,
        dayName: dayNames[i],
        assignments: dayAssignments,
        notes: dayNotes,
        totalWorkloadMinutes: dayAssignments.reduce((sum, a) => sum + (a.workloadMinutes ?? 0), 0),
      });
    }

    res.json({ weekStart, days });
  } catch (err) {
    req.log.error({ err }, "getWeeklyView error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
