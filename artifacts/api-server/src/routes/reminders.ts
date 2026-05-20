import { Router } from "express";
import { db } from "@workspace/db";
import { reminders } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateReminderBody,
  UpdateReminderParams,
  UpdateReminderBody,
  DeleteReminderParams,
} from "@workspace/api-zod";

const router = Router();

function formatReminder(r: typeof reminders.$inferSelect) {
  return {
    id: r.id,
    message: r.message,
    type: r.type,
    isRead: r.isRead,
    createdAt: r.createdAt.toISOString(),
  };
}

router.get("/", async (req, res) => {
  try {
    const userId = req.auth?.userId ?? null;
    const rows = await db
      .select()
      .from(reminders)
      .where(userId ? eq(reminders.userId, userId) : undefined)
      .orderBy(reminders.createdAt);
    res.json(rows.map(formatReminder));
  } catch (err) {
    req.log.error({ err }, "listReminders error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const parsed = CreateReminderBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const userId = req.auth?.userId ?? null;
    const [row] = await db.insert(reminders).values({ ...parsed.data, userId }).returning();
    res.status(201).json(formatReminder(row));
  } catch (err) {
    req.log.error({ err }, "createReminder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const params = UpdateReminderParams.safeParse(req.params);
  const body = UpdateReminderBody.safeParse(req.body);
  if (!params.success || !body.success) return void res.status(400).json({ error: "Invalid input" });
  try {
    const [row] = await db
      .update(reminders)
      .set(body.data)
      .where(eq(reminders.id, params.data.id))
      .returning();
    if (!row) return void res.status(404).json({ error: "Not found" });
    res.json(formatReminder(row));
  } catch (err) {
    req.log.error({ err }, "updateReminder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const params = DeleteReminderParams.safeParse(req.params);
  if (!params.success) return void res.status(400).json({ error: "Invalid params" });
  try {
    await db.delete(reminders).where(eq(reminders.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "deleteReminder error");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
