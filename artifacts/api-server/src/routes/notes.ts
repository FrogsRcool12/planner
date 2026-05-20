import { Router } from "express";
import { db } from "@workspace/db";
import { notes, subjects } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  ListNotesQueryParams,
  CreateNoteBody,
  UpdateNoteParams,
  UpdateNoteBody,
  DeleteNoteParams,
} from "@workspace/api-zod";

const router = Router();

function formatNote(n: typeof notes.$inferSelect, subject: { name: string; color: string } | null) {
  return {
    id: n.id,
    content: n.content,
    subjectId: n.subjectId ?? null,
    subjectName: subject?.name ?? null,
    subjectColor: subject?.color ?? null,
    period: n.period ?? null,
    weekStart: n.weekStart ?? null,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  const parsed = ListNotesQueryParams.safeParse(req.query);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid query" });
  try {
    const { subjectId, weekStart, period } = parsed.data;
    const userId = req.auth?.userId ?? null;
    const rows = await db
      .select({ note: notes, subject: subjects })
      .from(notes)
      .leftJoin(subjects, eq(notes.subjectId, subjects.id))
      .where(
        and(
          userId ? eq(notes.userId, userId) : undefined,
          subjectId !== null && subjectId !== undefined ? eq(notes.subjectId, subjectId) : undefined,
          weekStart ? eq(notes.weekStart, weekStart) : undefined,
          period !== null && period !== undefined ? eq(notes.period, period) : undefined,
        ),
      )
      .orderBy(notes.createdAt);
    res.json(rows.map(({ note: n, subject: s }) => formatNote(n, s)));
  } catch (err) {
    req.log.error({ err }, "listNotes error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const userId = req.auth?.userId ?? null;
    const [row] = await db.insert(notes).values({ ...parsed.data, userId }).returning();
    let subject: { name: string; color: string } | null = null;
    if (row.subjectId) {
      const [s] = await db.select().from(subjects).where(eq(subjects.id, row.subjectId));
      subject = s ?? null;
    }
    res.status(201).json(formatNote(row, subject));
  } catch (err) {
    req.log.error({ err }, "createNote error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const params = UpdateNoteParams.safeParse(req.params);
  const body = UpdateNoteBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const [row] = await db
      .update(notes)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(notes.id, params.data.id))
      .returning();
    if (!row) return void res.status(404).json({ error: "Not found" });
    let subject: { name: string; color: string } | null = null;
    if (row.subjectId) {
      const [s] = await db.select().from(subjects).where(eq(subjects.id, row.subjectId));
      subject = s ?? null;
    }
    res.json(formatNote(row, subject));
  } catch (err) {
    req.log.error({ err }, "updateNote error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid params" });
  try {
    await db.delete(notes).where(eq(notes.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteNote error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
