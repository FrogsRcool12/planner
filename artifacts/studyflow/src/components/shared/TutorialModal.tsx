import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Calendar,
  LayoutDashboard,
  Star,
  CheckSquare,
  Plus,
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  BookOpen,
} from "lucide-react";

const STORAGE_KEY = "studyflow_tutorial_completed";

interface Step {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  visual: React.ReactNode;
  accentColor: string;
}

function AIInputIllustration() {
  return (
    <div className="w-full rounded-xl bg-muted/50 border border-border p-4 space-y-3">
      <div className="rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground font-mono leading-relaxed">
        "Math worksheet due tomorrow, biology quiz on Friday, history essay next Monday 1000 words..."
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 flex-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "75%" }}
            transition={{ delay: 0.4, duration: 1.2, ease: "easeInOut" }}
          />
        </div>
        <span className="text-xs text-primary font-medium">Parsing...</span>
      </div>
      <div className="space-y-2">
        {[
          { subject: "Math", task: "Worksheet", due: "Tomorrow", color: "#6366f1" },
          { subject: "Biology", task: "Quiz", due: "Friday", color: "#10b981" },
          { subject: "History", task: "Essay", due: "Monday", color: "#ef4444" },
        ].map((item, i) => (
          <motion.div
            key={item.task}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.2 }}
            className="flex items-center gap-3 bg-background rounded-lg border border-border px-3 py-2"
          >
            <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-sm font-medium flex-1">{item.subject} — {item.task}</span>
            <span className="text-xs text-muted-foreground">{item.due}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function WeekGridIllustration() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const cards = [
    { day: 0, period: 0, label: "Math HW", color: "#6366f1" },
    { day: 1, period: 1, label: "Bio Quiz", color: "#10b981" },
    { day: 2, period: 2, label: "History", color: "#ef4444" },
    { day: 3, period: 0, label: "Chem Lab", color: "#8b5cf6" },
    { day: 4, period: 1, label: "English", color: "#f59e0b" },
  ];

  return (
    <div className="w-full rounded-xl border border-border bg-card overflow-hidden">
      <div className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-border bg-muted/30">
        <div className="p-2" />
        {days.map((d) => (
          <div key={d} className="p-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
        ))}
      </div>
      {[0, 1, 2].map((period) => (
        <div key={period} className="grid grid-cols-[48px_repeat(5,1fr)] border-b border-border last:border-b-0 min-h-[44px]">
          <div className="flex items-center justify-center border-r border-border">
            <span className="text-[10px] font-semibold text-muted-foreground">P{period + 1}</span>
          </div>
          {days.map((_, di) => {
            const card = cards.find((c) => c.day === di && c.period === period);
            return (
              <div key={di} className="border-r border-border last:border-r-0 p-1">
                {card && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (di + period) * 0.08 }}
                    className="rounded px-2 py-1 text-[10px] font-medium text-white truncate"
                    style={{ background: card.color }}
                  >
                    {card.label}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function TodayIllustration() {
  return (
    <div className="w-full space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Due Today", value: "4", color: "text-primary" },
          { label: "Overdue", value: "2", color: "text-red-500" },
          { label: "Done", value: "1", color: "text-green-500" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="rounded-xl border border-border bg-card p-3 text-center"
          >
            <div className={cn("text-2xl font-bold", stat.color)}>{stat.value}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Smart Reminders</p>
        {[
          "Biology quiz in 2 days — haven't started yet!",
          "Math test Friday — high priority",
        ].map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.15 }}
            className="flex gap-2 items-start text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-xs text-foreground leading-snug">{msg}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PriorityIllustration() {
  return (
    <div className="w-full space-y-2">
      {[
        { stars: 5, label: "Urgent — exam tomorrow", color: "#ef4444" },
        { stars: 4, label: "Major test / big assignment", color: "#f59e0b" },
        { stars: 3, label: "Standard homework", color: "#6366f1" },
        { stars: 2, label: "Small task", color: "#10b981" },
        { stars: 1, label: "Optional / low priority", color: "#94a3b8" },
      ].map((row, i) => (
        <motion.div
          key={row.stars}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.1 }}
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
        >
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, si) => (
              <Star
                key={si}
                className="h-3.5 w-3.5"
                style={{ color: si < row.stars ? row.color : "#e2e8f0", fill: si < row.stars ? row.color : "#e2e8f0" }}
              />
            ))}
          </div>
          <span className="text-xs text-foreground">{row.label}</span>
        </motion.div>
      ))}
    </div>
  );
}

function StatusIllustration() {
  const statuses = [
    { label: "Not Started", badge: "bg-muted text-muted-foreground" },
    { label: "In Progress", badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
    { label: "Completed", badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
    { label: "Submitted", badge: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300" },
  ];

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center gap-1 mb-4">
        {statuses.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12 }}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div className={cn("text-center text-[10px] font-semibold px-2 py-1 rounded-full w-full", s.badge)}>
              {s.label}
            </div>
            {i < statuses.length - 1 && (
              <ChevronRight className="h-3 w-3 text-muted-foreground absolute" style={{ display: "none" }} />
            )}
          </motion.div>
        ))}
      </div>
      <div className="rounded-lg border border-border bg-card p-3 space-y-2">
        {["Math Worksheet", "Biology Quiz", "History Essay"].map((title, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 + i * 0.15 }}
            className="flex items-center justify-between gap-2"
          >
            <span className="text-xs font-medium">{title}</span>
            <span className={cn(
              "text-[10px] font-semibold px-2 py-0.5 rounded-full",
              i === 0 ? statuses[0].badge : i === 1 ? statuses[1].badge : statuses[2].badge
            )}>
              {i === 0 ? statuses[0].label : i === 1 ? statuses[1].label : statuses[2].label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function QuickAddIllustration() {
  return (
    <div className="w-full flex flex-col items-center gap-6">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 20 }}
        className="h-16 w-16 rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center"
      >
        <Plus className="h-8 w-8 text-white" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-xl border border-border bg-card p-4 space-y-3"
      >
        <div className="h-8 rounded-md bg-muted/60 flex items-center px-3">
          <span className="text-xs text-muted-foreground">Task title...</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-7 rounded-md bg-muted/60" />
          <div className="h-7 rounded-md bg-muted/60" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className="h-5 w-5"
              style={{ color: n <= 3 ? "#6366f1" : "#e2e8f0", fill: n <= 3 ? "#6366f1" : "#e2e8f0" }}
            />
          ))}
        </div>
        <div className="h-8 rounded-md bg-primary/90 flex items-center justify-center">
          <span className="text-xs font-semibold text-white">Add Task</span>
        </div>
      </motion.div>
    </div>
  );
}

function ReadyIllustration() {
  const items = [
    { icon: Sparkles, label: "AI parsing", color: "#6366f1" },
    { icon: Calendar, label: "Weekly planner", color: "#10b981" },
    { icon: LayoutDashboard, label: "Today view", color: "#f59e0b" },
    { icon: Star, label: "Priority system", color: "#ef4444" },
    { icon: CheckSquare, label: "Task tracker", color: "#8b5cf6" },
    { icon: BookOpen, label: "Notes", color: "#06b6d4" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 w-full">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.08, type: "spring", stiffness: 300, damping: 22 }}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-3"
          >
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center"
              style={{ background: `${item.color}20` }}
            >
              <Icon className="h-5 w-5" style={{ color: item.color }} />
            </div>
            <span className="text-[10px] font-medium text-center text-muted-foreground leading-tight">{item.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
}

const STEPS: Step[] = [
  {
    id: "welcome",
    icon: <Zap className="h-6 w-6" />,
    title: "Welcome to StudyFlow",
    description: "Your AI-powered academic operating system. Let's take a quick tour so you can hit the ground running.",
    visual: (
      <div className="flex flex-col items-center gap-4">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="h-24 w-24 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30"
        >
          <span className="text-4xl font-bold text-white">SF</span>
        </motion.div>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed"
        >
          Drop in your syllabus, paste an assignment, or just type what's due. StudyFlow extracts it, schedules it, and helps you get it done.
        </motion.p>
      </div>
    ),
    accentColor: "#6366f1",
  },
  {
    id: "ai-input",
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI Smart Input",
    description: "Paste any messy school text — a syllabus, email, or just your own notes — and the AI extracts structured tasks automatically.",
    visual: <AIInputIllustration />,
    accentColor: "#6366f1",
  },
  {
    id: "weekly-planner",
    icon: <Calendar className="h-6 w-6" />,
    title: "Weekly Planner",
    description: "A 7-day × 7-period grid shows everything at a glance. Assignments are color-coded by subject so you can see your workload instantly.",
    visual: <WeekGridIllustration />,
    accentColor: "#10b981",
  },
  {
    id: "today",
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "Today Dashboard",
    description: "Open your day and see exactly what needs doing — due today, overdue, upcoming tests, and AI-generated smart reminders.",
    visual: <TodayIllustration />,
    accentColor: "#f59e0b",
  },
  {
    id: "priority",
    icon: <Star className="h-6 w-6" />,
    title: "Priority Stars",
    description: "Rate every task from 1 to 5 stars. The AI suggests a priority based on due date and type, but you're always in control.",
    visual: <PriorityIllustration />,
    accentColor: "#f59e0b",
  },
  {
    id: "status",
    icon: <CheckSquare className="h-6 w-6" />,
    title: "Task Status",
    description: "Move tasks through four stages: Not Started → In Progress → Completed → Submitted. Stay organized from start to finish.",
    visual: <StatusIllustration />,
    accentColor: "#8b5cf6",
  },
  {
    id: "quick-add",
    icon: <Plus className="h-6 w-6" />,
    title: "Quick Add",
    description: "See the floating button in the corner? Tap it anywhere in the app to instantly add a task without leaving what you're doing.",
    visual: <QuickAddIllustration />,
    accentColor: "#ec4899",
  },
  {
    id: "ready",
    icon: <Zap className="h-6 w-6" />,
    title: "You're all set!",
    description: "Everything you need to stay on top of school — all in one place. Start by adding a subject in Settings or pasting your first assignment.",
    visual: <ReadyIllustration />,
    accentColor: "#6366f1",
  },
];

export default function TutorialModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      handleClose();
    }
  }

  function handlePrev() {
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  }

  function handleClose() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  const current = STEPS[step];

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-0">
                <div className="flex gap-1.5">
                  {STEPS.map((s, i) => (
                    <button
                      key={s.id}
                      onClick={() => { setDirection(i > step ? 1 : -1); setStep(i); }}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-300",
                        i === step ? "w-6 bg-primary" : "w-1.5 bg-muted hover:bg-muted-foreground/30"
                      )}
                      aria-label={`Go to step ${i + 1}`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleClose}
                  className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  aria-label="Skip tutorial"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Icon + step label */}
              <div className="px-5 pt-4 pb-2 flex items-center gap-3">
                <motion.div
                  key={`icon-${current.id}`}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${current.accentColor}15`, color: current.accentColor }}
                >
                  {current.icon}
                </motion.div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">
                    Step {step + 1} of {STEPS.length}
                  </p>
                </div>
              </div>

              {/* Content (animated) */}
              <div className="relative overflow-hidden px-5">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={current.id}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="space-y-3"
                  >
                    <h2 className="text-xl font-bold tracking-tight leading-snug">
                      {current.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {current.description}
                    </p>
                    <div className="pt-1 pb-2">
                      {current.visual}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-border mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={step === 0}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>

                <button
                  onClick={handleClose}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip tutorial
                </button>

                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1"
                  style={{ background: current.accentColor }}
                >
                  {step === STEPS.length - 1 ? "Let's go!" : "Next"}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
