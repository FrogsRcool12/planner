import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subjectsRouter from "./subjects";
import assignmentsRouter from "./assignments";
import notesRouter from "./notes";
import remindersRouter from "./reminders";
import studyPlansRouter from "./studyPlans";
import dashboardRouter from "./dashboard";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/subjects", subjectsRouter);
router.use("/assignments", assignmentsRouter);
router.use("/notes", notesRouter);
router.use("/reminders", remindersRouter);
router.use("/study-plans", studyPlansRouter);
router.use("/dashboard", dashboardRouter);
router.use("/ai", aiRouter);

export default router;
