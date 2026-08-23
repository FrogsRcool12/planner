import { Router } from "express";
import { db } from "@workspace/db";
import { assignments, notes, reminders, subjects } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

function buildSmartReminders(
  rows: Array<{
    assignment: typeof assignments.$inferSelect;
    subject: { name: string; color: string } | null;
  }>,
  today: string,
) {
  const activeRows = rows.filter(
    ({ assignment: a }) =>
      a.status !== "completed" &&
      a.status !== "submitted" &&
      a.dueDate !== null,
  );
  const reminders: Array<{
    id: number;
    message: string;
    type: "smart";
    isRead: boolean;
    createdAt: string;
  }> = [];

  const addReminder = (
    assignment: typeof assignments.$inferSelect,
    subject: { name: string; color: string } | null,
    message: string,
  ) => {
    // Negative virtual IDs cannot collide with persisted reminder IDs.
    reminders.push({
      id: -assignment.id,
      message,
      type: "smart",
      isRead: false,
      createdAt: assignment.createdAt.toISOString(),
    });
  };

  const overdue = activeRows
    .filter(({ assignment: a }) => a.dueDate! < today)
    .sort((a, b) => a.assignment.dueDate!.localeCompare(b.assignment.dueDate!));
  overdue.slice(0, 3).forEach(({ assignment: a, subject: s }) => {
    addReminder(
      a,
      s,
      `${a.title}${s ? ` for ${s.name}` : ""} is overdue. Update its status or reschedule it.`,
    );
  });

  const todayRows = activeRows
    .filter(({ assignment: a }) => a.dueDate === today)
    .sort((a, b) => b.assignment.priority - a.assignment.priority);
  todayRows.slice(0, 2).forEach(({ assignment: a, subject: s }) => {
    addReminder(
      a,
      s,
      `${a.title}${s ? ` for ${s.name}` : ""} is due today${a.workloadMinutes ? ` and may take about ${a.workloadMinutes} minutes` : ""}.`,
    );
  });

  const todayDate = new Date(`${today}T00:00:00Z`);
  const sevenDaysFromNow = new Date(todayDate);
  sevenDaysFromNow.setUTCDate(sevenDaysFromNow.getUTCDate() + 7);
  const sevenDayDate = sevenDaysFromNow.toISOString().split("T")[0];
  const upcomingTests = activeRows
    .filter(({ assignment: a }) =>
      (a.taskType === "test" || a.taskType === "quiz") &&
      a.dueDate! > today &&
      a.dueDate! <= sevenDayDate,
    )
    .sort((a, b) => a.assignment.dueDate!.localeCompare(b.assignment.dueDate!));
  upcomingTests.slice(0, 2).forEach(({ assignment: a, subject: s }) => {
    addReminder(
      a,
      s,
      `${a.taskType === "test" ? "Test" : "Quiz"}: ${a.title}${s ? ` for ${s.name}` : ""} is coming up on ${a.dueDate}. Start reviewing soon.`,
    );
  });

  const highPrioritySoon = activeRows
    .filter(({ assignment: a }) =>
      a.priority >= 4 &&
      a.dueDate! > today &&
      a.dueDate! <= sevenDayDate &&
      a.taskType !== "test" &&
      a.taskType !== "quiz",
    )
    .sort((a, b) => {
      const dueDateOrder = a.assignment.dueDate!.localeCompare(b.assignment.dueDate!);
      return dueDateOrder || b.assignment.priority - a.assignment.priority;
    });
  highPrioritySoon.slice(0, 2).forEach(({ assignment: a, subject: s }) => {
    addReminder(
      a,
      s,
      `${a.title}${s ? ` for ${s.name}` : ""} is a high-priority task due on ${a.dueDate}.`,
    );
  });

  return reminders;
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
          eq(reminders.type, "manual"),
        ),
      )
      .orderBy(reminders.createdAt)
      .limit(10);

    const manualReminders = reminderRows.map((r) => ({
      id: r.id,
      message: r.message,
      type: r.type,
      isRead: r.isRead,
      createdAt: r.createdAt.toISOString(),
    }));
    const smartReminders = buildSmartReminders(allRows, today);
    const formattedReminders = [...smartReminders, ...manualReminders].slice(0, 10);

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
  const weekStart = req.query.weekStart as string | undefined;
  if (!weekStart || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return void res.status(400).json({ error: "weekStart is required (YYYY-MM-DD)" });
  }
  try {
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
