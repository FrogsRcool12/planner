import { useState } from "react";
import { useListAssignments, useSortTasksWithAI } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey } from "@workspace/api-client-react";
import AssignmentCard from "@/components/shared/AssignmentCard";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";

type SortKey = "due-asc" | "due-desc" | "created-desc" | "created-asc" | "priority-desc" | "priority-asc" | "duration-desc" | "duration-asc" | "ai";

const SORT_OPTIONS: { value: SortKey; label: string; ai?: boolean }[] = [
  { value: "due-asc",       label: "Earliest due"      },
  { value: "due-desc",      label: "Latest due"        },
  { value: "created-desc",  label: "Recently added"    },
  { value: "created-asc",   label: "Oldest first"      },
  { value: "priority-desc", label: "Highest priority"  },
  { value: "priority-asc",  label: "Lowest priority"   },
  { value: "duration-desc", label: "Longest duration"  },
  { value: "duration-asc",  label: "Shortest duration" },
  { value: "ai",            label: "AI Recommended",   ai: true },
];

function sortAssignments(list: Assignment[], key: SortKey): Assignment[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case "due-asc":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case "due-desc":
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      case "created-desc":
        return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
      case "created-asc":
        return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
      case "priority-desc":
        return (b.priority ?? 0) - (a.priority ?? 0);
      case "priority-asc":
        return (a.priority ?? 0) - (b.priority ?? 0);
      case "duration-desc":
        return (b.workloadMinutes ?? 0) - (a.workloadMinutes ?? 0);
      case "duration-asc":
        return (a.workloadMinutes ?? 0) - (b.workloadMinutes ?? 0);
      default:
        return 0;
    }
  });
}

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due-asc");
  const [aiOrderedIds, setAiOrderedIds] = useState<number[] | null>(null);
  const [aiReasoning, setAiReasoning] = useState<string>("");

  const { data: assignments, isLoading } = useListAssignments(
    {},
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );

  const aiSortMutation = useSortTasksWithAI();
  const { toast } = useToast();

  const handleSortChange = async (value: string) => {
    const key = value as SortKey;
    setSortKey(key);

    if (key === "ai" && assignments?.length) {
      setAiOrderedIds(null);
      try {
        const result = await aiSortMutation.mutateAsync({
          data: {
            assignments: assignments.map(a => ({
              id: a.id,
              title: a.title,
              dueDate: a.dueDate ?? null,
              priority: a.priority ?? null,
              workloadMinutes: a.workloadMinutes ?? null,
              taskType: a.taskType ?? null,
              subjectName: a.subjectName ?? null,
              status: a.status,
            })),
          },
        });
        setAiOrderedIds(result.orderedIds);
        setAiReasoning(result.reasoning);
        toast({ title: "AI order ready", description: result.reasoning });
      } catch {
        toast({ title: "AI sort failed", variant: "destructive" });
        setSortKey("due-asc");
      }
    } else {
      setAiOrderedIds(null);
      setAiReasoning("");
    }
  };

  const filtered = assignments?.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.subjectName && a.subjectName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) ?? [];

  const sorted = (() => {
    if (sortKey === "ai" && aiOrderedIds) {
      const idMap = new Map(filtered.map(a => [a.id, a]));
      const ordered = aiOrderedIds.flatMap(id => idMap.has(id) ? [idMap.get(id)!] : []);
      const unranked = filtered.filter(a => !aiOrderedIds.includes(a.id));
      return [...ordered, ...unranked];
    }
    return sortAssignments(filtered, sortKey);
  })();

  const isAiLoading = sortKey === "ai" && aiSortMutation.isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground">Manage everything on your plate.</p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[220px]"
            />
          </div>

          <Select value={sortKey} onValueChange={handleSortChange} disabled={isAiLoading}>
            <SelectTrigger className="w-[200px] shrink-0">
              {isAiLoading
                ? <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" />Thinking…</span>
                : <SelectValue />}
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {opt.ai && <Sparkles className="h-3.5 w-3.5 text-violet-500" />}
                    {opt.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {aiReasoning && sortKey === "ai" && (
        <div className="flex items-start gap-2 rounded-lg border border-violet-200 bg-violet-50 dark:border-violet-900 dark:bg-violet-950/30 px-3 py-2.5 text-sm text-violet-700 dark:text-violet-300 shrink-0">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{aiReasoning}</span>
        </div>
      )}

      {isLoading || isAiLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pb-20">
          {sorted.length ? (
            <div className="grid gap-3">
              {sorted.map(a => (
                <AssignmentCard key={a.id} assignment={a} />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-muted/10 border border-border border-dashed rounded-xl">
              <p className="text-muted-foreground">No tasks found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
