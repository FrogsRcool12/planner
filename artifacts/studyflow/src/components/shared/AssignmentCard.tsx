import { useState } from "react";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { CheckCircle2, Circle, Clock, FileText, Calendar as CalendarIcon, BookOpen, BrainCircuit, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateAssignment } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import AssignmentEditSheet from "./AssignmentEditSheet";

const INTERVAL_LABELS: Record<string, string> = {
  daily: "Daily", weekly: "Weekly", biweekly: "Every 2 wks", monthly: "Monthly",
};

interface AssignmentCardProps {
  assignment: Assignment;
  compact?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onSelect?: (id: number, checked: boolean) => void;
}

export default function AssignmentCard({
  assignment,
  compact = false,
  selectMode = false,
  selected = false,
  onSelect,
}: AssignmentCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const updateMutation = useUpdateAssignment();

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectMode) return;
    const newStatus = assignment.status === 'completed' ? 'notStarted' : 'completed';
    updateMutation.mutate(
      { id: assignment.id, data: { status: newStatus } },
      { onSuccess: () => queryClient.invalidateQueries() },
    );
  };

  const handleClick = () => {
    if (selectMode) onSelect?.(assignment.id, !selected);
    else setEditOpen(true);
  };

  const isCompleted = assignment.status === 'completed' || assignment.status === 'submitted';

  return (
    <>
    <div
      className={cn(
        "group relative rounded-lg border shadow-sm transition-all cursor-pointer",
        isCompleted ? "bg-muted/50 border-muted opacity-60" : "bg-card border-border",
        selectMode
          ? selected ? "ring-2 ring-primary border-primary bg-primary/5" : "hover:border-primary/40"
          : "hover-elevate hover:border-primary/30",
        compact ? "p-2" : "p-4",
      )}
      style={!isCompleted && assignment.subjectColor ? { borderLeftColor: assignment.subjectColor, borderLeftWidth: '4px' } : {}}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {selectMode ? (
            <div className={cn(
              "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
              selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40",
            )}>
              {selected && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          ) : (
            <button onClick={toggleStatus} className="text-muted-foreground hover:text-primary transition-colors focus:outline-none">
              {isCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5" />}
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn("font-medium truncate text-sm leading-tight", isCompleted && "line-through text-muted-foreground")}>
              {assignment.title}
            </h4>
            <div className="flex items-center gap-1.5 shrink-0">
              {assignment.recurringInterval && (
                <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground border border-border rounded px-1 py-0.5">
                  <RefreshCw className="h-2.5 w-2.5" />
                  {INTERVAL_LABELS[assignment.recurringInterval] ?? assignment.recurringInterval}
                </span>
              )}
              {!compact && assignment.priority > 0 && (
                <div className="flex text-yellow-400 text-xs">{"★".repeat(assignment.priority)}</div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
            {assignment.subjectName && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
                backgroundColor: assignment.subjectColor ? `${assignment.subjectColor}20` : 'var(--secondary)',
                color: assignment.subjectColor || 'var(--secondary-foreground)',
              }}>
                {assignment.subjectName}
              </span>
            )}
            {assignment.dueDate && (
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {new Date(assignment.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
            {assignment.workloadMinutes && (
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{assignment.workloadMinutes}m</span>
            )}
            {compact && assignment.priority > 0 && <span className="text-yellow-400">★{assignment.priority}</span>}
          </div>
        </div>
      </div>
    </div>
    {!selectMode && <AssignmentEditSheet assignment={assignment} open={editOpen} onOpenChange={setEditOpen} />}
    </>
  );
}
