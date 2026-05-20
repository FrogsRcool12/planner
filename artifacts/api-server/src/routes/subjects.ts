import { Router } from "express";
import { db } from "@workspace/db";
import { subjects } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateSubjectBody,
  UpdateSubjectBody,
  UpdateSubjectParams,
  DeleteSubjectParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const userId = req.auth?.userId ?? null;
    const rows = await db
      .select()
      .from(subjects)
      .where(userId ? eq(subjects.userId, userId) : undefined)
      .orderBy(subjects.name);
    res.json(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        period: s.period ?? null,
        createdAt: s.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error({ err }, "listSubjects error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const userId = req.auth?.userId ?? null;
    const [row] = await db
      .insert(subjects)
      .values({ ...parsed.data, userId })
      .returning();
    res.status(201).json({
      id: row.id,
      name: row.name,
      color: row.color,
      period: row.period ?? null,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "createSubject error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const params = UpdateSubjectParams.safeParse(req.params);
  const body = UpdateSubjectBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const [row] = await db
      .update(subjects)
      .set(body.data)
      .where(eq(subjects.id, params.data.id))
      .returning();
    if (!row) return void res.status(404).json({ error: "Not found" });
    res.json({
      id: row.id,
      name: row.name,
      color: row.color,
      period: row.period ?? null,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "updateSubject error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const params = DeleteSubjectParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    await db.delete(subjects).where(eq(subjects.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteSubject error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
