import { useGetDashboardSummary, useListSubjects } from "@workspace/api-client-react";
import { getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import AISmartInput from "@/components/shared/AISmartInput";
import AssignmentCard from "@/components/shared/AssignmentCard";
import { Loader2, AlertTriangle, Calendar, Clock, CheckCircle, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Today() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: subjects } = useListSubjects();

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const completedRatio = summary ? (summary.completedTodayCount / (summary.todayAssignments.length + summary.completedTodayCount)) * 100 : 0;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Today</h1>
        <p className="text-muted-foreground">Let's see what you need to get done.</p>
      </header>
      
      <div data-tutorial="today-overview" className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <span>Tasks Done</span>
          </div>
          <span className="text-3xl font-bold">{summary?.completedTodayCount || 0}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Clock className="h-5 w-5 text-blue-500" />
            <span>Est. Workload</span>
          </div>
          <span className="text-3xl font-bold">{summary?.totalWorkloadMinutesToday || 0} mins</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span>Overdue</span>
          </div>
          <span className="text-3xl font-bold">{summary?.overdueAssignments.length || 0}</span>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <Calendar className="h-5 w-5 text-yellow-500" />
            <span>Upcoming Tests</span>
          </div>
          <span className="text-3xl font-bold">{summary?.upcomingTests.length || 0}</span>
        </div>
      </div>
      
      {summary && summary.todayAssignments.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Daily Progress</span>
            <span>{Math.round(completedRatio || 0)}%</span>
          </div>
          <Progress value={completedRatio || 0} className="h-2" />
        </div>
      )}

      <AISmartInput subjects={subjects || []} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {summary?.overdueAssignments && summary.overdueAssignments.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" /> Overdue
              </h2>
              <div className="space-y-3">
                {summary.overdueAssignments.map(a => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            </section>
          )}

          <section data-tutorial="today-assignments" className="space-y-4">
            <h2 className="text-xl font-bold">Today's Schedule</h2>
            {summary?.todayAssignments && summary.todayAssignments.length > 0 ? (
              <div className="space-y-3">
                {summary.todayAssignments.map(a => (
                  <AssignmentCard key={a.id} assignment={a} />
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-muted/20 border border-border border-dashed rounded-xl">
                <p className="text-muted-foreground">No tasks due today. You're all caught up!</p>
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          {summary?.upcomingTests && summary.upcomingTests.length > 0 && (
            <section className="space-y-4 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/20">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-yellow-600" /> Upcoming Tests
              </h2>
              <div className="space-y-3">
                {summary.upcomingTests.map(a => (
                  <AssignmentCard key={a.id} assignment={a} compact />
                ))}
              </div>
            </section>
          )}

          {summary?.reminders && summary.reminders.length > 0 && (
            <section className="space-y-4 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
              <h2 className="text-lg font-bold">Smart Reminders</h2>
              <ul className="space-y-3">
                {summary.reminders.map(r => (
                  <li key={r.id} className="flex gap-2 text-sm bg-background p-3 rounded-lg border border-border shadow-sm">
                    <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <span>{r.message}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
