import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Zap,
  Sparkles,
  Calendar,
  LayoutDashboard,
  Star,
  CheckSquare,
  Plus,
} from "lucide-react";

const STORAGE_KEY = "studyflow_tutorial_completed";
const PAD = 12;

interface SpotlightRect { x: number; y: number; w: number; h: number; }

interface StepConfig {
  id: string;
  icon: React.ReactNode;
  page: string | null;
  targetSelector: string | null;
  title: string;
  description: string;
  cta: string | null;
  accentColor: string;
  tooltipSide?: "auto" | "top" | "bottom";
}

const STEPS: StepConfig[] = [
  {
    id: "welcome",
    icon: <Zap className="h-6 w-6" />,
    page: null,
    targetSelector: null,
    title: "Welcome to StudyFlow",
    description: "Your AI-powered academic operating system. Let's take a 60-second tour of the key features.",
    cta: null,
    accentColor: "#6366f1",
  },
  {
    id: "ai-input",
    icon: <Sparkles className="h-6 w-6" />,
    page: "/week",
    targetSelector: "[data-tutorial='ai-input']",
    title: "AI Smart Input",
    description: "Paste any messy school text here — a syllabus, assignment email, anything — and the AI extracts your tasks automatically.",
    cta: "Try pasting some text, then hit \"Parse with AI\"",
    accentColor: "#6366f1",
  },
  {
    id: "week-grid",
    icon: <Calendar className="h-6 w-6" />,
    page: "/week",
    targetSelector: "[data-tutorial='week-grid']",
    title: "Weekly Planner",
    description: "Your 7-day × 7-period grid. Each assignment is color-coded by subject so you can see your full workload at a glance.",
    cta: "Use the arrows above to navigate between weeks",
    accentColor: "#10b981",
  },
  {
    id: "today-overview",
    icon: <LayoutDashboard className="h-6 w-6" />,
    page: "/today",
    targetSelector: "[data-tutorial='today-overview']",
    title: "Today Dashboard",
    description: "See your day at a glance — tasks due today, overdue items, upcoming tests, and AI-generated smart reminders.",
    cta: "Check this every morning to plan your day",
    accentColor: "#f59e0b",
  },
  {
    id: "priority",
    icon: <Star className="h-6 w-6" />,
    page: "/today",
    targetSelector: "[data-tutorial='today-assignments']",
    title: "Priority Stars",
    description: "Each task has a 1–5 star priority. The AI suggests one based on due date and type, but you're always in control.",
    cta: "Click any task card to edit its priority",
    accentColor: "#f59e0b",
  },
  {
    id: "status",
    icon: <CheckSquare className="h-6 w-6" />,
    page: "/today",
    targetSelector: "[data-tutorial='today-assignments']",
    title: "Task Status",
    description: "Track tasks through four stages: Not Started → In Progress → Completed → Submitted. One click advances the status.",
    cta: "Click a task's status badge to advance it",
    accentColor: "#8b5cf6",
  },
  {
    id: "quick-add",
    icon: <Plus className="h-6 w-6" />,
    page: "/today",
    targetSelector: "[data-tutorial='quick-add-fab']",
    title: "Quick Add",
    description: "This button is always in the corner on every page. Tap it to instantly add a task without losing your place.",
    cta: "Give it a tap to add your first task",
    accentColor: "#ec4899",
    tooltipSide: "top",
  },
  {
    id: "ready",
    icon: <Zap className="h-6 w-6" />,
    page: null,
    targetSelector: null,
    title: "You're all set!",
    description: "Next up: add your subjects and give them colors. StudyFlow works best when it knows your schedule.",
    cta: null,
    accentColor: "#6366f1",
  },
];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function getTooltipPos(
  sr: SpotlightRect,
  side: "auto" | "top" | "bottom" = "auto",
): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const TW = 340;
  const GAP = 18;

  const spotTop = sr.y - PAD;
  const spotBottom = sr.y + sr.h + PAD;
  const centerX = sr.x + sr.w / 2;
  const left = clamp(centerX - TW / 2, 12, vw - TW - 12);

  const useBelow =
    side === "bottom" ||
    (side !== "top" && spotBottom + GAP + 220 < vh);

  if (useBelow) return { top: spotBottom + GAP, left };
  return { bottom: vh - spotTop + GAP, left };
}

export default function TutorialModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [sr, setSr] = useState<SpotlightRect | null>(null);
  const [, setLocation] = useLocation();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const measure = useCallback((sel: string) => {
    const el = document.querySelector(sel);
    if (!el) return false;
    const r = el.getBoundingClientRect();
    setSr({ x: r.x, y: r.y, w: r.width, h: r.height });
    return true;
  }, []);

  useEffect(() => {
    if (!open) return;
    const cur = STEPS[step];
    if (pollRef.current) clearInterval(pollRef.current);

    if (!cur.targetSelector) {
      setSr(null);
      if (cur.page) setLocation(cur.page);
      return;
    }

    if (cur.page) setLocation(cur.page);
    setSr(null);

    let attempts = 0;
    pollRef.current = setInterval(() => {
      if (measure(cur.targetSelector!)) {
        clearInterval(pollRef.current!);
      } else if (++attempts > 40) {
        clearInterval(pollRef.current!);
      }
    }, 100);

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, open]); // eslint-disable-line

  useEffect(() => {
    if (!open) return;
    const sel = STEPS[step].targetSelector;
    if (!sel) return;
    const remeasure = () => measure(sel);
    window.addEventListener("resize", remeasure);
    window.addEventListener("scroll", remeasure, true);
    return () => {
      window.removeEventListener("resize", remeasure);
      window.removeEventListener("scroll", remeasure, true);
    };
  }, [step, open, measure]);

  function goNext() {
    if (step < STEPS.length - 1) { setDirection(1); setStep(s => s + 1); }
    else finish();
  }
  function goPrev() {
    if (step > 0) { setDirection(-1); setStep(s => s - 1); }
  }
  function finish() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    setLocation("/settings");
  }
  function skip() {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  }

  const cur = STEPS[step];
  const isSpotlight = !!cur.targetSelector && !!sr;
  const isModal = !cur.targetSelector;

  const tipPos = sr ? getTooltipPos(sr, cur.tooltipSide) : null;

  const progressDots = (
    <div className="flex gap-1.5">
      {STEPS.map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i === step ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-muted-foreground/25",
          )}
        />
      ))}
    </div>
  );

  const navButtons = (small = false) => (
    <div className={cn("flex gap-1.5", small ? "" : "")}>
      <Button
        variant="ghost"
        size={small ? "sm" : "sm"}
        className={cn("gap-1", small && "h-7 px-2 text-xs")}
        onClick={goPrev}
        disabled={step === 0}
      >
        <ChevronLeft className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
        Back
      </Button>
      <Button
        size={small ? "sm" : "sm"}
        className={cn("gap-1 text-white", small && "h-7 px-3 text-xs")}
        style={{ background: cur.accentColor }}
        onClick={goNext}
      >
        {step === STEPS.length - 1 ? "Let's go!" : "Next"}
        <ChevronRight className={small ? "h-3.5 w-3.5" : "h-4 w-4"} />
      </Button>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── SPOTLIGHT MODE ── */}
          {isSpotlight && sr && tipPos && (() => {
            const sx = sr.x - PAD;
            const sy = sr.y - PAD;
            const sw = sr.w + PAD * 2;
            const sh = sr.h + PAD * 2;
            return (
              <>
                {/* Four overlay pieces — leave the spotlight area clear so it's interactive */}
                {/* Top */}
                <motion.div
                  className="fixed inset-x-0 top-0 z-40 bg-black/60 pointer-events-auto"
                  animate={{ height: Math.max(0, sy) }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                />
                {/* Bottom */}
                <motion.div
                  className="fixed inset-x-0 bottom-0 z-40 bg-black/60 pointer-events-auto"
                  animate={{ top: sy + sh }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                />
                {/* Left */}
                <motion.div
                  className="fixed left-0 z-40 bg-black/60 pointer-events-auto"
                  animate={{ top: sy, height: sh, width: Math.max(0, sx) }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                />
                {/* Right */}
                <motion.div
                  className="fixed right-0 z-40 bg-black/60 pointer-events-auto"
                  animate={{ top: sy, height: sh, left: sx + sw }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                />

                {/* Glowing border ring around spotlight */}
                <motion.div
                  className="fixed z-40 rounded-xl pointer-events-none"
                  animate={{ left: sx, top: sy, width: sw, height: sh }}
                  transition={{ duration: 0.28, ease: "easeInOut" }}
                  style={{
                    border: `2px solid ${cur.accentColor}`,
                    boxShadow: `0 0 0 3px ${cur.accentColor}25, 0 0 24px ${cur.accentColor}50`,
                  }}
                />

                {/* Tooltip card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={cur.id}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="fixed z-50 w-[340px] bg-background rounded-2xl border border-border shadow-2xl overflow-hidden"
                    style={tipPos}
                  >
                    {/* Accent top bar */}
                    <div className="h-1" style={{ background: cur.accentColor }} />

                    <div className="p-4 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start gap-2 justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: `${cur.accentColor}18`, color: cur.accentColor }}
                          >
                            {cur.icon}
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest leading-none mb-0.5">
                              Step {step + 1} of {STEPS.length}
                            </p>
                            <h3 className="text-sm font-bold leading-tight">{cur.title}</h3>
                          </div>
                        </div>
                        <button
                          onClick={skip}
                          className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0 mt-0.5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {cur.description}
                      </p>

                      {cur.cta && (
                        <div
                          className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs font-medium"
                          style={{ background: `${cur.accentColor}12`, color: cur.accentColor }}
                        >
                          <ChevronRight className="h-3.5 w-3.5 mt-px flex-shrink-0" />
                          <span>{cur.cta}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-0.5">
                        {progressDots}
                        {navButtons(true)}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            );
          })()}

          {/* Loading state: navigating to page, waiting for element */}
          {cur.targetSelector && !sr && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-40 bg-black/55 pointer-events-auto"
            />
          )}

          {/* ── CENTERED MODAL MODE ── for steps without a spotlight target */}
          {isModal && (
            <>
              <motion.div
                key="modal-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={skip}
              />
              <motion.div
                key="modal-card"
                initial={{ opacity: 0, scale: 0.9, y: 24 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 24 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
              >
                <div
                  className="pointer-events-auto w-full max-w-sm bg-background rounded-2xl shadow-2xl border border-border overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="h-1" style={{ background: cur.accentColor }} />

                  <div className="p-6 space-y-5">
                    {/* Progress + close */}
                    <div className="flex items-center justify-between">
                      {progressDots}
                      <button
                        onClick={skip}
                        className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Icon */}
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="h-20 w-20 rounded-2xl flex items-center justify-center mx-auto"
                      style={{ background: `${cur.accentColor}15`, color: cur.accentColor }}
                    >
                      {step === 0
                        ? <span className="text-4xl font-extrabold" style={{ color: cur.accentColor }}>SF</span>
                        : <div className="scale-[1.6]">{cur.icon}</div>
                      }
                    </motion.div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={cur.id}
                        initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
                        transition={{ duration: 0.2 }}
                        className="text-center space-y-2"
                      >
                        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">
                          Step {step + 1} of {STEPS.length}
                        </p>
                        <h2 className="text-xl font-bold tracking-tight">{cur.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{cur.description}</p>
                      </motion.div>
                    </AnimatePresence>

                    <div className="flex items-center justify-between pt-1">
                      <Button variant="ghost" size="sm" onClick={goPrev} disabled={step === 0} className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        Back
                      </Button>
                      <button onClick={skip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Skip tutorial
                      </button>
                      <Button size="sm" onClick={goNext} className="gap-1 text-white" style={{ background: cur.accentColor }}>
                        {step === STEPS.length - 1 ? "Let's go!" : "Next"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
