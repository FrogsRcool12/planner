import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Brain, Calendar, CheckSquare, Sparkles, LayoutDashboard, ListTodo, BarChart2, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const SUBJECTS = [
  { name: "Math",      color: "#6366f1" },
  { name: "Biology",   color: "#10b981" },
  { name: "English",   color: "#f59e0b" },
  { name: "History",   color: "#ef4444" },
  { name: "Chemistry", color: "#8b5cf6" },
  { name: "Physics",   color: "#06b6d4" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

// [period][day] → subject index or null
const GRID: (number | null)[][] = [
  [0,    null, 0,    null, 0   ],
  [1,    2,    null, 1,    null],
  [null, 0,    3,    null, 4   ],
  [2,    null, 1,    5,    null],
  [4,    3,    null, 2,    0   ],
  [null, 1,    5,    null, 3   ],
  [3,    null, 2,    4,    null],
];

const TASKS: Record<string, string[]> = {
  "0-0": ["Worksheet"],
  "1-1": ["Quiz prep"],
  "0-2": ["Chapter 4"],
  "2-3": ["Essay"],
  "4-4": ["Test"],
};

function PlannerMockup() {
  return (
    <div className="w-full rounded-xl overflow-hidden bg-[#f8f8fc] border border-border shadow-sm flex text-[10px] font-sans select-none" style={{ minHeight: 320 }}>
      {/* Sidebar */}
      <div className="w-10 shrink-0 bg-white border-r border-border flex flex-col items-center py-3 gap-4">
        <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center text-white font-bold text-[8px]">SF</div>
        <div className="flex flex-col items-center gap-3 mt-2">
          {[
            { Icon: LayoutDashboard, active: false },
            { Icon: Calendar,        active: true  },
            { Icon: ListTodo,        active: false },
            { Icon: BookOpen,        active: false },
            { Icon: BarChart2,       active: false },
          ].map(({ Icon, active }, i) => (
            <div key={i} className={`p-1.5 rounded-lg ${active ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              <Icon className="w-3 h-3" />
            </div>
          ))}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-semibold text-[11px] text-foreground">Weekly Planner</div>
            <div className="text-muted-foreground" style={{ fontSize: 9 }}>Jun 23 – Jun 27, 2026</div>
          </div>
          <div className="flex gap-1">
            {SUBJECTS.slice(0, 4).map((s) => (
              <div key={s.name} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-white" style={{ background: s.color, fontSize: 8 }}>
                {s.name}
              </div>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 grid gap-px" style={{ gridTemplateColumns: `28px repeat(${DAYS.length}, 1fr)` }}>
          {/* Corner */}
          <div />
          {/* Day headers */}
          {DAYS.map((d) => (
            <div key={d} className="text-center font-semibold text-muted-foreground pb-1" style={{ fontSize: 9 }}>{d}</div>
          ))}

          {/* Period rows */}
          {GRID.map((row, p) => (
            <React.Fragment key={p}>
              <div className="flex items-center justify-center text-muted-foreground font-medium" style={{ fontSize: 8 }}>P{p + 1}</div>
              {row.map((subIdx, d) => {
                const taskKey = `${p}-${d}`;
                const tasks = TASKS[taskKey];
                const sub = subIdx !== null ? SUBJECTS[subIdx] : null;
                return (
                  <div
                    key={`${p}-${d}`}
                    className="rounded border border-border m-px flex flex-col gap-0.5 p-1 min-h-[34px]"
                    style={{ background: sub ? `${sub.color}14` : "white", borderColor: sub ? `${sub.color}40` : undefined }}
                  >
                    {sub && (
                      <div className="font-semibold truncate" style={{ color: sub.color, fontSize: 8 }}>{sub.name}</div>
                    )}
                    {tasks?.map((t, i) => (
                      <div key={i} className="rounded px-1 text-white truncate" style={{ background: sub?.color ?? "#6366f1", fontSize: 7 }}>{t}</div>
                    ))}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function AIParseMockup() {
  const parsed = [
    { title: "Math worksheet",       subject: "Math",    due: "Tomorrow",   color: "#6366f1", checked: true  },
    { title: "Biology quiz prep",    subject: "Biology", due: "Friday",     color: "#10b981", checked: true  },
    { title: "Read Chapter 4",       subject: "English", due: "Next Mon",   color: "#f59e0b", checked: false },
  ];

  return (
    <div className="w-full rounded-xl overflow-hidden bg-card border border-border shadow-sm font-sans select-none text-foreground">
      {/* Input area */}
      <div className="p-4 border-b border-border">
        <div className="flex gap-2 items-start">
          <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-foreground font-medium leading-snug">
              Math worksheet due tomorrow, biology quiz on Friday, and read chapter 4 for English next Monday
            </p>
            <div className="mt-2 flex justify-end">
              <div className="text-xs px-3 py-1 rounded-lg bg-primary text-white font-medium">Parsed ✓</div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="p-3 bg-muted/30 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" />
            3 tasks found — pick the ones to add
          </span>
          <span className="text-xs text-muted-foreground">2 of 3 selected</span>
        </div>
        {parsed.map((item, i) => (
          <div
            key={i}
            className={`flex items-start gap-2.5 rounded-lg border p-2.5 text-xs transition-all ${
              item.checked ? "bg-background border-primary/30 ring-1 ring-primary/20" : "bg-background border-border opacity-50"
            }`}
          >
            <div
              className={`mt-0.5 h-3.5 w-3.5 rounded shrink-0 border-2 flex items-center justify-center ${
                item.checked ? "border-primary bg-primary text-white" : "border-muted-foreground/40"
              }`}
            >
              {item.checked && (
                <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{item.title}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <span className="px-1.5 py-0.5 rounded-full text-white text-[10px]" style={{ background: item.color }}>{item.subject}</span>
                <span className="text-muted-foreground text-[10px]">Due {item.due}</span>
              </div>
            </div>
          </div>
        ))}
        <div className="flex justify-end pt-1">
          <div className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white font-medium">Add 2 to Planner</div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold">SF</div>
            <span className="font-bold text-xl tracking-tight">StudyFlow</span>
          </div>
          <div className="flex gap-4">
            <Link href={`${basePath}/sign-in`}>
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href={`${basePath}/sign-up`}>
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pb-32 overflow-hidden">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-medium text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              <span>AI-powered student workspace</span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-foreground mb-6 max-w-4xl mx-auto leading-[1.1]">
              The smartest way to organize your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">school life</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Drop in your syllabus, paste an assignment, or just type what's due. StudyFlow extracts it, schedules it, and helps you get it done.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href={`${basePath}/sign-up`}>
                <Button size="lg" className="h-14 px-8 text-lg rounded-xl">
                  Start for free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-20 relative mx-auto w-full max-w-5xl"
          >
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm shadow-2xl p-3 md:p-5">
              <PlannerMockup />
            </div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to ace your classes</h2>
            <p className="text-muted-foreground">Designed specifically for the modern student workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Task Extraction</h3>
              <p className="text-muted-foreground">Just paste your assignment descriptions. We'll extract due dates, difficulty, and create a study plan automatically.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Visual Weekly Grid</h3>
              <p className="text-muted-foreground">See exactly what classes you have and what's due for each period. Color-coded perfection.</p>
            </div>

            <div className="bg-card p-8 rounded-2xl border border-border">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center mb-6">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Prioritization</h3>
              <p className="text-muted-foreground">Know exactly what to work on next with our 5-star priority system and workload estimation.</p>
            </div>
          </div>
        </section>

        {/* AI Highlight Section */}
        <section className="mt-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Type it. Done.</h2>
            <p className="text-lg text-muted-foreground mb-8">
              "Math worksheet due tomorrow, biology quiz on Friday, and read chapter 4 for history."
              <br /><br />
              Just type how you think. StudyFlow understands the context, categorizes by subject, and places it exactly where it belongs on your calendar.
            </p>
            <ul className="space-y-4">
              {["Auto-categorization by subject", "Smart due date detection", "Workload time estimation"].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground font-medium">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">✓</div>
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full">
            <div className="rounded-2xl border border-border bg-card shadow-2xl p-2">
              <AIParseMockup />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-6 w-6 rounded flex items-center justify-center bg-muted text-foreground font-bold text-xs">SF</div>
            <span className="font-semibold text-foreground">StudyFlow</span>
          </div>
          <p>© {new Date().getFullYear()} StudyFlow. Designed for students.</p>
        </div>
      </footer>
    </div>
  );
}
