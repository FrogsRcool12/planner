import { useState } from "react";
import { useListAssignments, useListSubjects } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey } from "@workspace/api-client-react";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AssignmentEditSheet from "@/components/shared/AssignmentEditSheet";
import QuickAddSheet from "@/components/shared/QuickAddSheet";

const STATUS_COLORS: Record<string, string> = {
  notStarted: "bg-muted-foreground",
  inProgress:  "bg-blue-500",
  completed:   "bg-emerald-500",
  submitted:   "bg-purple-500",
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function Calendar() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const { data: assignments } = useListAssignments(
    {},
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );
  const { data: subjects } = useListSubjects();

  const subjectColorMap = new Map(
    subjects?.map(s => [s.id, s.color ?? "#6366f1"]) ?? []
  );

  // Group assignments by due date string (YYYY-MM-DD)
  const byDate = new Map<string, Assignment[]>();
  for (const a of assignments ?? []) {
    if (!a.dueDate) continue;
    const key = a.dueDate.slice(0, 10);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(a);
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDow   = getFirstDayOfWeek(viewYear, viewMonth);

  // Fill calendar grid (null = empty leading/trailing cells)
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">All your due dates at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base font-semibold w-40 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button className="ml-2 gap-1.5" onClick={() => setQuickAddOpen(true)}>
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      {/* Grid */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-xl border border-border">
        {/* Day name row */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/40">
          {DAY_NAMES.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {cells.map((day, idx) => {
            const dateKey = day
              ? `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
              : null;
            const cellAssignments = dateKey ? (byDate.get(dateKey) ?? []) : [];
            const showMore = cellAssignments.length > 3;

            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] border-b border-r border-border p-1.5 flex flex-col gap-1",
                  !day && "bg-muted/20",
                  idx % 7 === 6 && "border-r-0",
                )}
              >
                {day && (
                  <>
                    <span className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full shrink-0",
                      isToday(day)
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground",
                    )}>
                      {day}
                    </span>

                    {cellAssignments.slice(0, 3).map(a => {
                      const color = a.subjectId ? subjectColorMap.get(a.subjectId) : undefined;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedAssignment(a)}
                          className="w-full text-left rounded px-1.5 py-0.5 text-xs truncate font-medium transition-opacity hover:opacity-80"
                          style={{
                            backgroundColor: color ? `${color}22` : "var(--muted)",
                            color: color ?? "var(--foreground)",
                            borderLeft: `3px solid ${color ?? "var(--border)"}`,
                          }}
                          title={a.title}
                        >
                          {a.title}
                        </button>
                      );
                    })}

                    {showMore && (
                      <span className="text-xs text-muted-foreground pl-1">
                        +{cellAssignments.length - 3} more
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0 pb-4">
        <span className="font-medium">Status:</span>
        {[
          { label: "Not Started", cls: "bg-muted-foreground" },
          { label: "In Progress",  cls: "bg-blue-500" },
          { label: "Completed",    cls: "bg-emerald-500" },
          { label: "Submitted",    cls: "bg-purple-500" },
        ].map(({ label, cls }) => (
          <span key={label} className="flex items-center gap-1">
            <span className={cn("inline-block h-2 w-2 rounded-full", cls)} />
            {label}
          </span>
        ))}
      </div>

      {selectedAssignment && (
        <AssignmentEditSheet
          assignment={selectedAssignment}
          open={!!selectedAssignment}
          onOpenChange={open => { if (!open) setSelectedAssignment(null); }}
        />
      )}

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
