import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useUpdateAssignment } from "@workspace/api-client-react";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Circle, PlayCircle, CheckCircle2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "notStarted",  label: "Not Started",  icon: Circle,       color: "text-muted-foreground",  bg: "bg-muted/40" },
  { value: "inProgress",  label: "In Progress",  icon: PlayCircle,   color: "text-blue-500",          bg: "bg-blue-500/10" },
  { value: "completed",   label: "Completed",    icon: CheckCircle2, color: "text-emerald-500",       bg: "bg-emerald-500/10" },
  { value: "submitted",   label: "Submitted",    icon: Send,         color: "text-purple-500",        bg: "bg-purple-500/10" },
] as const;

type Status = typeof STATUSES[number]["value"];

export default function AssignmentEditSheet({
  assignment,
  open,
  onOpenChange,
}: {
  assignment: Assignment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [status, setStatus] = useState<Status>(assignment.status as Status);
  const [priority, setPriority] = useState(assignment.priority ?? 3);
  const [hovered, setHovered] = useState(0);

  const updateMutation = useUpdateAssignment();
  const { toast } = useToast();

  const isDirty = status !== assignment.status || priority !== assignment.priority;

  function handleSave() {
    updateMutation.mutate(
      { id: assignment.id, data: { status, priority } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries();
          toast({ title: "Task updated" });
          onOpenChange(false);
        },
        onError: () => toast({ title: "Failed to update task", variant: "destructive" }),
      },
    );
  }

  const displayPriority = hovered || priority;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader className="pb-4">
          <SheetTitle className="leading-snug pr-6">{assignment.title}</SheetTitle>
          {assignment.subjectName && (
            <SheetDescription>
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: assignment.subjectColor ? `${assignment.subjectColor}25` : "var(--secondary)",
                  color: assignment.subjectColor ?? "var(--secondary-foreground)",
                }}
              >
                {assignment.subjectName}
              </span>
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="space-y-6 mt-2">
          {/* Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Status</Label>
            <div className="grid grid-cols-2 gap-2">
              {STATUSES.map(({ value, label, icon: Icon, color, bg }) => {
                const active = status === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                      active
                        ? `${bg} border-current ${color} ring-1 ring-current/30`
                        : "border-border hover:bg-muted/50 text-muted-foreground",
                    )}
                  >
                    <Icon className={cn("h-4 w-4 flex-shrink-0", active ? color : "")} />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Priority
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                {["", "Low", "Low-Medium", "Medium", "High", "Critical"][priority]}
              </span>
            </Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  onMouseEnter={() => setHovered(p)}
                  onMouseLeave={() => setHovered(0)}
                  className="p-1.5 rounded-md transition-colors hover:bg-muted"
                >
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill={displayPriority >= p ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={cn(
                      "transition-colors",
                      displayPriority >= p ? "text-yellow-400" : "text-muted-foreground/40",
                    )}
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* Meta info */}
          {(assignment.dueDate || assignment.taskType) && (
            <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 space-y-1 text-sm text-muted-foreground">
              {assignment.taskType && (
                <div className="flex justify-between">
                  <span>Type</span>
                  <span className="capitalize font-medium text-foreground">{assignment.taskType}</span>
                </div>
              )}
              {assignment.dueDate && (
                <div className="flex justify-between">
                  <span>Due</span>
                  <span className="font-medium text-foreground">
                    {new Date(assignment.dueDate).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                </div>
              )}
              {assignment.workloadMinutes && (
                <div className="flex justify-between">
                  <span>Est. time</span>
                  <span className="font-medium text-foreground">{assignment.workloadMinutes} min</span>
                </div>
              )}
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={updateMutation.isPending || !isDirty}
          >
            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
