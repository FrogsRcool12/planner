import { Router } from "express";
import { db } from "@workspace/db";
import { assignments, subjects } from "@workspace/db";
import { eq, and, isNull, or } from "drizzle-orm";
import {
  ListAssignmentsQueryParams,
  CreateAssignmentBody,
  GetAssignmentParams,
  UpdateAssignmentParams,
  UpdateAssignmentBody,
  DeleteAssignmentParams,
} from "@workspace/api-zod";

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
    recurringInterval: a.recurringInterval ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListAssignmentsQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid query" });
  try {
    const { weekStart, status, subjectId } = parsed.data;
    const userId = req.auth?.userId ?? null;

    const rows = await db
      .select({ assignment: assignments, subject: subjects })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .where(
        and(
          userId ? eq(assignments.userId, userId) : undefined,
          status ? eq(assignments.status, status) : undefined,
          subjectId !== null && subjectId !== undefined ? eq(assignments.subjectId, subjectId) : undefined,
        ),
      )
      .orderBy(assignments.dueDate, assignments.priority);

    res.json(rows.map(({ assignment: a, subject: s }) => formatAssignment(a, s)));
  } catch (err) {
    req.log.error({ err }, "listAssignments error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateAssignmentBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const userId = req.auth?.userId ?? null;
    const [row] = await db
      .insert(assignments)
      .values({ ...parsed.data, userId, aiGenerated: parsed.data.aiGenerated ?? false })
      .returning();
    let subject: { name: string; color: string } | null = null;
    if (row.subjectId) {
      const [s] = await db.select().from(subjects).where(eq(subjects.id, row.subjectId));
      subject = s ?? null;
    }
    res.status(201).json(formatAssignment(row, subject));
  } catch (err) {
    req.log.error({ err }, "createAssignment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const params = GetAssignmentParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid params" });
  try {
    const [row] = await db
      .select({ assignment: assignments, subject: subjects })
      .from(assignments)
      .leftJoin(subjects, eq(assignments.subjectId, subjects.id))
      .where(eq(assignments.id, params.data.id));
    if (!row) return void res.status(404).json({ error: "Not found" });
    res.json(formatAssignment(row.assignment, row.subject));
  } catch (err) {
    req.log.error({ err }, "getAssignment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const params = UpdateAssignmentParams.safeParse(req.params);
  const body = UpdateAssignmentBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const [row] = await db
      .update(assignments)
      .set(body.data)
      .where(eq(assignments.id, params.data.id))
      .returning();
    if (!row) return void res.status(404).json({ error: "Not found" });
    let subject: { name: string; color: string } | null = null;
    if (row.subjectId) {
      const [s] = await db.select().from(subjects).where(eq(subjects.id, row.subjectId));
      subject = s ?? null;
    }

    // Auto-create next recurring occurrence when a task is completed/submitted
    const newStatus = body.data.status;
    if (
      row.recurringInterval &&
      (newStatus === "completed" || newStatus === "submitted") &&
      row.dueDate
    ) {
      const nextDate = new Date(row.dueDate);
      switch (row.recurringInterval) {
        case "daily":    nextDate.setDate(nextDate.getDate() + 1);  break;
        case "weekly":   nextDate.setDate(nextDate.getDate() + 7);  break;
        case "biweekly": nextDate.setDate(nextDate.getDate() + 14); break;
        case "monthly":  nextDate.setMonth(nextDate.getMonth() + 1); break;
      }
      const nextDueDate = nextDate.toISOString().split("T")[0];
      await db.insert(assignments).values({
        title: row.title,
        description: row.description,
        subjectId: row.subjectId,
        dueDate: nextDueDate,
        period: row.period,
        taskType: row.taskType,
        status: "notStarted",
        priority: row.priority,
        workloadMinutes: row.workloadMinutes,
        difficulty: row.difficulty,
        urgency: row.urgency,
        aiGenerated: false,
        notes: row.notes,
        recurringInterval: row.recurringInterval,
        userId: row.userId,
      });
    }

    res.json(formatAssignment(row, subject));
  } catch (err) {
    req.log.error({ err }, "updateAssignment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const params = DeleteAssignmentParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid params" });
  try {
    await db.delete(assignments).where(eq(assignments.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteAssignment error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
