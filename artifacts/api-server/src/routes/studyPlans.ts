import { Router } from "express";
import { db } from "@workspace/db";
import { studyPlans, assignments } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListStudyPlansQueryParams,
  CreateStudyPlanBody,
  DeleteStudyPlanParams,
} from "@workspace/api-zod";

const router = Router();

function formatStudyPlan(
  sp: typeof studyPlans.$inferSelect,
  assignmentTitle: string | null,
) {
  return {
    id: sp.id,
    assignmentId: sp.assignmentId,
    assignmentTitle: assignmentTitle ?? null,
    date: sp.date,
    activity: sp.activity,
    durationMinutes: sp.durationMinutes ?? null,
    completed: sp.completed,
    createdAt: sp.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListStudyPlansQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid query" });
  try {
    const { assignmentId } = parsed.data;
    const userId = req.auth?.userId ?? null;
    const rows = await db
      .select({ studyPlan: studyPlans, assignment: assignments })
      .from(studyPlans)
      .leftJoin(assignments, eq(studyPlans.assignmentId, assignments.id))
      .where(
        and(
          userId ? eq(studyPlans.userId, userId) : undefined,
          assignmentId !== null && assignmentId !== undefined
            ? eq(studyPlans.assignmentId, assignmentId)
            : undefined,
        ),
      )
      .orderBy(studyPlans.date);
    res.json(rows.map(({ studyPlan: sp, assignment: a }) => formatStudyPlan(sp, a?.title ?? null)));
  } catch (err) {
    req.log.error({ err }, "listStudyPlans error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const userId = req.auth?.userId ?? null;
    const [row] = await db.insert(studyPlans).values({ ...parsed.data, userId }).returning();
    const [a] = await db.select().from(assignments).where(eq(assignments.id, row.assignmentId));
    res.status(201).json(formatStudyPlan(row, a?.title ?? null));
  } catch (err) {
    req.log.error({ err }, "createStudyPlan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const params = DeleteStudyPlanParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid params" });
  try {
    await db.delete(studyPlans).where(eq(studyPlans.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteStudyPlan error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
