import { useState } from "react";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { CheckCircle2, Circle, Clock, FileText, Calendar as CalendarIcon, BookOpen, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUpdateAssignment } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import AssignmentEditSheet from "./AssignmentEditSheet";

export default function AssignmentCard({ assignment, compact = false }: { assignment: Assignment, compact?: boolean }) {
  const [editOpen, setEditOpen] = useState(false);
  const updateMutation = useUpdateAssignment();

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = assignment.status === 'completed' ? 'notStarted' : 'completed';
    
    // Optimistic update logic would go here ideally
    updateMutation.mutate({
      id: assignment.id,
      data: { status: newStatus }
    }, {
      onSuccess: () => queryClient.invalidateQueries()
    });
  };

  const getIcon = () => {
    switch(assignment.taskType) {
      case 'homework': return <FileText className="h-3.5 w-3.5" />;
      case 'test': return <BrainCircuit className="h-3.5 w-3.5 text-destructive" />;
      case 'quiz': return <BrainCircuit className="h-3.5 w-3.5" />;
      case 'note': return <BookOpen className="h-3.5 w-3.5" />;
      default: return <CheckCircle2 className="h-3.5 w-3.5" />;
    }
  };

  const isCompleted = assignment.status === 'completed' || assignment.status === 'submitted';

  return (
    <>
    <div 
      className={cn(
        "group relative rounded-lg border p-3 shadow-sm transition-all hover-elevate cursor-pointer",
        isCompleted ? "bg-muted/50 border-muted opacity-60" : "bg-card border-border hover:border-primary/30",
        compact ? "p-2" : "p-4"
      )}
      style={!isCompleted && assignment.subjectColor ? { borderLeftColor: assignment.subjectColor, borderLeftWidth: '4px' } : {}}
      onClick={() => setEditOpen(true)}
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={toggleStatus}
          className="mt-0.5 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
        >
          {isCompleted ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "font-medium truncate text-sm leading-tight",
              isCompleted && "line-through text-muted-foreground"
            )}>
              {assignment.title}
            </h4>
            
            {!compact && assignment.priority > 0 && (
              <div className="flex shrink-0 text-yellow-400 text-xs">
                {"★".repeat(assignment.priority)}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 mt-2 flex-wrap text-xs text-muted-foreground">
            {assignment.subjectName && (
              <span 
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ 
                  backgroundColor: assignment.subjectColor ? `${assignment.subjectColor}20` : 'var(--secondary)',
                  color: assignment.subjectColor || 'var(--secondary-foreground)'
                }}
              >
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
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {assignment.workloadMinutes}m
              </span>
            )}
            
            {compact && assignment.priority > 0 && (
              <span className="text-yellow-400">★{assignment.priority}</span>
            )}
          </div>
        </div>
      </div>
    </div>
    <AssignmentEditSheet assignment={assignment} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
