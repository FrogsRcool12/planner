import { useListAssignments, useListSubjects } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey, getListSubjectsQueryKey } from "@workspace/api-client-react";
import { Loader2, TrendingUp, CheckCircle2, AlertTriangle, Clock, Star, BookOpen, BarChart2, Target, Flame, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  notStarted: "Not Started",
  inProgress: "In Progress",
  completed: "Completed",
  submitted: "Submitted",
};

const STATUS_COLORS: Record<string, string> = {
  notStarted: "bg-muted-foreground/40",
  inProgress: "bg-blue-500",
  completed: "bg-emerald-500",
  submitted: "bg-violet-500",
};

const TYPE_LABELS: Record<string, string> = {
  assignment: "Assignment",
  homework: "Homework",
  quiz: "Quiz",
  test: "Test",
  reminder: "Reminder",
  studySession: "Study Session",
  note: "Note",
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex flex-col gap-2">
      <div className={cn("flex items-center gap-2 text-sm font-medium text-muted-foreground")}>
        <Icon className={cn("h-4 w-4", color)} />
        {label}
      </div>
      <span className="text-3xl font-bold tracking-tight">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

function BarRow({ label, count, total, color, sublabel }: { label: string; count: number; total: number; color: string; sublabel?: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-sm text-muted-foreground truncate shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-medium tabular-nums w-8 text-right">{count}</span>
      {sublabel && <span className="text-xs text-muted-foreground w-12 text-right">{sublabel}</span>}
    </div>
  );
}

export default function Stats() {
  const { data: assignments, isLoading } = useListAssignments(
    {},
    { query: { queryKey: getListAssignmentsQueryKey({}) } },
  );
  const { data: subjects } = useListSubjects({ query: { queryKey: getListSubjectsQueryKey({}) } });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const all = assignments ?? [];
  const total = all.length;

  // --- Status breakdown ---
  const byStatus = ["notStarted", "inProgress", "completed", "submitted"].map(s => ({
    status: s,
    count: all.filter(a => a.status === s).length,
  }));
  const done = all.filter(a => a.status === "completed" || a.status === "submitted").length;
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
  const inProgress = all.filter(a => a.status === "inProgress").length;

  // --- Overdue ---
  const today = new Date().toISOString().split("T")[0];
  const overdue = all.filter(a => a.dueDate && a.dueDate < today && a.status !== "completed" && a.status !== "submitted").length;

  // --- Workload ---
  const totalWorkload = all.reduce((s, a) => s + (a.workloadMinutes ?? 0), 0);
  const avgWorkload = total > 0 ? Math.round(totalWorkload / total) : 0;
  const heaviestTask = all.reduce((best, a) => ((a.workloadMinutes ?? 0) > (best?.workloadMinutes ?? 0) ? a : best), all[0]);

  // --- Priority distribution ---
  const byPriority = [1, 2, 3, 4, 5].map(p => ({
    priority: p,
    count: all.filter(a => a.priority === p).length,
  }));
  const avgPriority = total > 0 ? (all.reduce((s, a) => s + (a.priority ?? 0), 0) / total).toFixed(1) : "—";

  // --- By type ---
  const typeKeys = [...new Set(all.map(a => a.taskType))];
  const byType = typeKeys.map(t => ({
    type: t,
    count: all.filter(a => a.taskType === t).length,
    done: all.filter(a => a.taskType === t && (a.status === "completed" || a.status === "submitted")).length,
  })).sort((a, b) => b.count - a.count);

  // --- By subject ---
  const subjectIds = [...new Set(all.map(a => a.subjectId).filter(Boolean))];
  const bySubject = subjectIds.map(sid => {
    const sub = subjects?.find(s => s.id === sid);
    const tasks = all.filter(a => a.subjectId === sid);
    const subDone = tasks.filter(a => a.status === "completed" || a.status === "submitted").length;
    return { id: sid, name: sub?.name ?? "Unknown", color: sub?.color ?? "#6366f1", count: tasks.length, done: subDone };
  }).sort((a, b) => b.count - a.count);

  const noSubject = all.filter(a => !a.subjectId).length;

  // --- This week ---
  const dow = new Date().getDay();
  const weekStartDate = new Date();
  weekStartDate.setDate(weekStartDate.getDate() - (dow === 0 ? 6 : dow - 1));
  const weekStart = weekStartDate.toISOString().split("T")[0];
  const weekEndDate = new Date(weekStartDate); weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEnd = weekEndDate.toISOString().split("T")[0];
  const thisWeek = all.filter(a => a.dueDate && a.dueDate >= weekStart && a.dueDate <= weekEnd);
  const thisWeekDone = thisWeek.filter(a => a.status === "completed" || a.status === "submitted").length;
  const thisWeekRate = thisWeek.length > 0 ? Math.round((thisWeekDone / thisWeek.length) * 100) : 0;

  // --- Recurring tasks ---
  const recurringCount = all.filter(a => a.recurringInterval).length;

  if (total === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
          <p className="text-muted-foreground">Track your productivity and progress.</p>
        </header>
        <div className="text-center p-16 rounded-xl border border-border border-dashed">
          <BarChart2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No tasks yet — add some to start tracking your progress.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Stats</h1>
        <p className="text-muted-foreground">Track your productivity and progress.</p>
      </header>

      {/* Top KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Total Tasks" value={total} color="text-primary" />
        <StatCard icon={CheckCircle2} label="Completed" value={done} sub={`${completionRate}% completion rate`} color="text-emerald-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue} sub={total > 0 ? `${Math.round((overdue / total) * 100)}% of all tasks` : undefined} color="text-destructive" />
        <StatCard icon={Clock} label="Est. Workload" value={`${Math.round(totalWorkload / 60)}h ${totalWorkload % 60}m`} sub={`~${avgWorkload}m avg per task`} color="text-blue-500" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Flame} label="In Progress" value={inProgress} color="text-orange-500" />
        <StatCard icon={Star} label="Avg Priority" value={avgPriority} sub="out of 5 stars" color="text-yellow-500" />
        <StatCard icon={Calendar} label="This Week" value={`${thisWeekDone}/${thisWeek.length}`} sub={`${thisWeekRate}% done`} color="text-violet-500" />
        <StatCard icon={BookOpen} label="Recurring" value={recurringCount} sub="repeating tasks" color="text-teal-500" />
      </div>

      {/* Completion progress */}
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" /> Overall Completion
        </h2>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{done} completed out of {total} total</span>
          <span className="font-semibold text-foreground">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-3" />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status breakdown */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Status Breakdown</h2>
          <div className="space-y-3">
            {byStatus.map(({ status, count }) => (
              <BarRow
                key={status}
                label={STATUS_LABELS[status]}
                count={count}
                total={total}
                color={STATUS_COLORS[status]}
                sublabel={`${total > 0 ? Math.round((count / total) * 100) : 0}%`}
              />
            ))}
          </div>
        </section>

        {/* Priority distribution */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">Priority Distribution</h2>
          <div className="space-y-3">
            {byPriority.map(({ priority, count }) => (
              <BarRow
                key={priority}
                label={"★".repeat(priority)}
                count={count}
                total={total}
                color="bg-yellow-400"
                sublabel={`${total > 0 ? Math.round((count / total) * 100) : 0}%`}
              />
            ))}
          </div>
        </section>

        {/* By task type */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">By Task Type</h2>
          {byType.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-3">
              {byType.map(({ type, count, done: typeDone }) => (
                <BarRow
                  key={type}
                  label={TYPE_LABELS[type] ?? type}
                  count={count}
                  total={total}
                  color="bg-primary/70"
                  sublabel={`${count > 0 ? Math.round((typeDone / count) * 100) : 0}% ✓`}
                />
              ))}
            </div>
          )}
        </section>

        {/* By subject */}
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="font-semibold">By Subject</h2>
          {bySubject.length === 0 && noSubject === 0 ? (
            <p className="text-sm text-muted-foreground">No data</p>
          ) : (
            <div className="space-y-3">
              {bySubject.map(({ id, name, color, count, done: subDone }) => (
                <div key={id} className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="w-24 text-sm text-muted-foreground truncate shrink-0">{name}</span>
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${total > 0 ? (count / total) * 100 : 0}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-sm font-medium tabular-nums w-6 text-right">{count}</span>
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {count > 0 ? Math.round((subDone / count) * 100) : 0}% ✓
                  </span>
                </div>
              ))}
              {noSubject > 0 && (
                <BarRow label="No subject" count={noSubject} total={total} color="bg-muted-foreground/40" sublabel="" />
              )}
            </div>
          )}
        </section>
      </div>

      {/* Heaviest task callout */}
      {heaviestTask && heaviestTask.workloadMinutes && heaviestTask.workloadMinutes > 0 && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold mb-3">Biggest Task</h2>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{heaviestTask.title}</p>
              <p className="text-sm text-muted-foreground">
                {heaviestTask.workloadMinutes} minutes estimated
                {heaviestTask.subjectName && ` · ${heaviestTask.subjectName}`}
                {heaviestTask.dueDate && ` · Due ${new Date(heaviestTask.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`}
              </p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
