import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { useParseWithAI, useCreateAssignment } from "@workspace/api-client-react";
import { Subject, ParsedAssignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

export default function AISmartInput({ subjects }: { subjects: Subject[] }) {
  const [text, setText] = useState("");
  const { toast } = useToast();

  const parseMutation = useParseWithAI();
  const createMutation = useCreateAssignment();

  const [parsedResults, setParsedResults] = useState<ParsedAssignment[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleParse = () => {
    if (!text.trim()) return;
    parseMutation.mutate({ data: { text, subjects } }, {
      onSuccess: (data) => {
        if (data.assignments && data.assignments.length > 0) {
          setParsedResults(data.assignments);
          // Select all by default
          setSelectedIndices(new Set(data.assignments.map((_, i) => i)));
          toast({ title: "Tasks extracted!", description: `Found ${data.assignments.length} task${data.assignments.length > 1 ? "s" : ""}. Uncheck any you don't want.` });
        } else {
          toast({ title: "No tasks found", description: "Try rewording your input.", variant: "destructive" });
        }
      },
      onError: () => {
        toast({ title: "AI Parse failed", description: "Something went wrong.", variant: "destructive" });
      }
    });
  };

  const toggleIndex = (idx: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  const allSelected = parsedResults ? selectedIndices.size === parsedResults.length : false;
  const toggleAll = () => {
    if (allSelected) setSelectedIndices(new Set());
    else setSelectedIndices(new Set(parsedResults!.map((_, i) => i)));
  };

  const handleSaveSelected = async () => {
    if (!parsedResults || selectedIndices.size === 0) return;
    const toSave = parsedResults.filter((_, i) => selectedIndices.has(i));
    let successCount = 0;
    for (const assignment of toSave) {
      try {
        const subject = subjects.find(s => s.name === assignment.subjectName);
        await createMutation.mutateAsync({
          data: {
            title: assignment.title,
            description: assignment.notes || undefined,
            subjectId: subject?.id,
            dueDate: assignment.dueDate,
            period: assignment.period || subject?.period,
            taskType: assignment.taskType,
            status: "notStarted",
            priority: assignment.priority,
            workloadMinutes: assignment.workloadMinutes,
            difficulty: assignment.difficulty,
            urgency: assignment.urgency,
            aiGenerated: true,
          }
        });
        successCount++;
      } catch {
        // continue on individual failures
      }
    }
    queryClient.invalidateQueries();
    toast({ title: "Saved!", description: `Added ${successCount} task${successCount > 1 ? "s" : ""} to your planner.` });
    setParsedResults(null);
    setSelectedIndices(new Set());
    setText("");
  };

  const handleCancel = () => {
    setParsedResults(null);
    setSelectedIndices(new Set());
  };

  return (
    <div data-tutorial="ai-input" className="bg-card rounded-xl border border-primary/20 shadow-md shadow-primary/5 overflow-hidden transition-all duration-300">
      {!parsedResults ? (
        <div className="p-4 relative">
          <div className="absolute top-6 left-6 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or type anything — 'Math worksheet due tomorrow, biology quiz Friday...'"
            className="min-h-[80px] border-none bg-transparent resize-none pl-10 focus-visible:ring-0 shadow-none text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleParse();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2 px-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Cmd+Enter</kbd> to parse
            </span>
            <Button onClick={handleParse} disabled={parseMutation.isPending || !text.trim()} className="gap-2">
              {parseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse with AI"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/30">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              {parsedResults.length} task{parsedResults.length > 1 ? "s" : ""} found — pick the ones to add
            </h3>
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1.5" /> Cancel
            </Button>
          </div>

          {/* Select all toggle */}
          <button
            onClick={toggleAll}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <div className={cn(
              "h-4 w-4 rounded border-2 flex items-center justify-center transition-colors",
              allSelected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40",
            )}>
              {allSelected && (
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {allSelected ? "Deselect all" : "Select all"}
          </button>

          <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
            {parsedResults.map((item, idx) => {
              const checked = selectedIndices.has(idx);
              return (
                <button
                  key={idx}
                  onClick={() => toggleIndex(idx)}
                  className={cn(
                    "w-full text-left bg-background rounded-lg border p-3 shadow-sm flex items-start gap-3 transition-all",
                    checked ? "border-primary/40 ring-1 ring-primary/20" : "border-border opacity-50",
                  )}
                >
                  <div className={cn(
                    "mt-0.5 h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                    checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40",
                  )}>
                    {checked && (
                      <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-sm leading-tight">{item.title}</h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {item.subjectName && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                          {item.subjectName}
                        </span>
                      )}
                      {item.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(item.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      )}
                      {item.priority > 0 && (
                        <span className="text-xs text-yellow-500">{"★".repeat(item.priority)}</span>
                      )}
                      {item.taskType && item.taskType !== "assignment" && (
                        <span className="text-xs text-muted-foreground capitalize">{item.taskType}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              {selectedIndices.size} of {parsedResults.length} selected
            </span>
            <Button
              onClick={handleSaveSelected}
              disabled={createMutation.isPending || selectedIndices.size === 0}
              className="gap-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add {selectedIndices.size > 0 ? selectedIndices.size : ""} to Planner
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
