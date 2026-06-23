import { Router } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ParseWithAIBody, GenerateStudyPlanBody, SortTasksWithAIBody } from "@workspace/api-zod";

const router = Router();

router.post("/parse", async (req, res) => {
  const parsed = ParseWithAIBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });

  const { text, subjects } = parsed.data;
  const today = new Date().toISOString().split("T")[0];

  const subjectList = subjects && subjects.length > 0
    ? `Available subjects: ${subjects.map((s) => s.name).join(", ")}`
    : "No subjects defined yet.";

  const systemPrompt = `You are a smart school planner assistant. Parse the student's unstructured text and extract structured assignment/task data.

Today's date is ${today}.
${subjectList}

For each task found, return a JSON object with:
- title (string): short, clear title
- subjectName (string|null): match to available subjects if possible, else infer from context
- dueDate (string|null): ISO date (YYYY-MM-DD), interpret relative dates from today
- period (number|null): class period 1-7 if mentioned
- taskType (string): one of: assignment, homework, quiz, test, reminder, studySession, note
- priority (number 1-5): 1=optional, 2=small homework, 3=standard, 4=major/test prep, 5=urgent
- workloadMinutes (number|null): estimated completion time in minutes
- difficulty (string|null): easy, medium, or hard
- urgency (string|null): low, medium, or high
- notes (string|null): additional context

Return ONLY a JSON object like: { "assignments": [...] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 2048,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);
    res.json({ assignments: result.assignments ?? [] });
  } catch (err) {
    req.log.error({ err }, "parseWithAI error");
    res.status(500).json({ error: "AI parsing failed" });
  }
});

router.post("/generate-study-plan", async (req, res) => {
  const parsed = GenerateStudyPlanBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });

  const { assignmentTitle, dueDate, subject, currentDate } = parsed.data;

  const systemPrompt = `You are a smart study planner. Create a detailed study schedule for a student.

Current date: ${currentDate}
Due date: ${dueDate}
Assignment: ${assignmentTitle}
Subject: ${subject ?? "Unknown"}

Create a day-by-day study plan between now and the due date. Each session should be focused and specific.

Return ONLY JSON: { "sessions": [{ "date": "YYYY-MM-DD", "activity": "brief description", "durationMinutes": 30 }, ...] }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a study plan for: ${assignmentTitle}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);
    res.json({ sessions: result.sessions ?? [] });
  } catch (err) {
    req.log.error({ err }, "generateStudyPlan error");
    res.status(500).json({ error: "Study plan generation failed" });
  }
});

router.post("/sort-tasks", async (req, res) => {
  const parsed = SortTasksWithAIBody.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: "Invalid input" });

  const { assignments } = parsed.data;
  const today = new Date().toISOString().split("T")[0];

  const taskList = assignments.map(a =>
    `ID ${a.id}: "${a.title}" | subject: ${a.subjectName ?? "none"} | due: ${a.dueDate ?? "no due date"} | priority: ${a.priority ?? 3}/5 | workload: ${a.workloadMinutes ?? "?"} min | type: ${a.taskType ?? "assignment"} | status: ${a.status}`
  ).join("\n");

  const systemPrompt = `You are a smart student productivity assistant. Today is ${today}.

Given a list of tasks, return the optimal order a student should work through them — balancing urgency (due date), importance (priority), effort (workload), and type.

General rules:
- Overdue or due today tasks come first
- Higher priority tasks come before lower priority
- Tests/quizzes outrank regular homework at equal priority
- Mix in shorter tasks between long ones to maintain momentum
- Completed or submitted tasks should go last

Return ONLY JSON: { "orderedIds": [id1, id2, ...], "reasoning": "one sentence explanation" }`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.1",
      max_completion_tokens: 512,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Order these tasks:\n${taskList}` },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content ?? "{}";
    const result = JSON.parse(content);
    res.json({ orderedIds: result.orderedIds ?? [], reasoning: result.reasoning ?? "" });
  } catch (err) {
    req.log.error({ err }, "sortTasksWithAI error");
    res.status(500).json({ error: "AI sort failed" });
  }
});

export default router;
