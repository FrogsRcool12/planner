import { useState, useCallback } from "react";
import { useListAssignments, useListSubjects, useSortTasksWithAI, useDeleteAssignment, useUpdateAssignment } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey } from "@workspace/api-client-react";
import AssignmentCard from "@/components/shared/AssignmentCard";
import QuickAddSheet from "@/components/shared/QuickAddSheet";
import { Loader2, Search, Sparkles, Plus, SlidersHorizontal, CheckSquare, Square, Download, Trash2, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { queryClient } from "@/lib/queryClient";

type SortKey = "due-asc" | "due-desc" | "created-desc" | "created-asc" | "priority-desc" | "priority-asc" | "duration-desc" | "duration-asc" | "ai";
type StatusFilter = "active" | "all" | "notStarted" | "inProgress" | "completed" | "submitted";

const SORT_OPTIONS: { value: SortKey; label: string; ai?: boolean }[] = [
  { value: "due-asc",       label: "Soonest due"       },
  { value: "due-desc",      label: "Latest due"        },
  { value: "created-desc",  label: "Recently added"    },
  { value: "created-asc",   label: "Oldest first"      },
  { value: "priority-desc", label: "Highest priority"  },
  { value: "priority-asc",  label: "Lowest priority"   },
  { value: "duration-desc", label: "Longest duration"  },
  { value: "duration-asc",  label: "Shortest duration" },
  { value: "ai",            label: "AI Recommended",   ai: true },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "active",      label: "Active" },
  { value: "notStarted",  label: "Not Started" },
  { value: "inProgress",  label: "In Progress" },
  { value: "completed",   label: "Completed" },
  { value: "submitted",   label: "Submitted" },
  { value: "all",         label: "All" },
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
  const [searchTerm, setSearchTerm]     = useState("");
  const [sortKey, setSortKey]           = useState<SortKey>("due-asc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [aiOrderedIds, setAiOrderedIds] = useState<number[] | null>(null);
  const [aiReasoning, setAiReasoning]   = useState<string>("");
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [selectMode, setSelectMode]     = useState(false);
  const [selectedIds, setSelectedIds]   = useState<Set<number>>(new Set());

  const { data: assignments, isLoading } = useListAssignments(
    {},
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );
  const { data: subjects } = useListSubjects();

  const aiSortMutation   = useSortTasksWithAI();
  const deleteMutation   = useDeleteAssignment();
  const updateMutation   = useUpdateAssignment();
  const { toast } = useToast();

  const handleSelect = useCallback((id: number, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const exitSelectMode = () => { setSelectMode(false); setSelectedIds(new Set()); };

  const handleBulkMarkDone = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => updateMutation.mutateAsync({ id, data: { status: "completed" } })));
    queryClient.invalidateQueries();
    toast({ title: `${ids.length} task${ids.length > 1 ? "s" : ""} marked done` });
    exitSelectMode();
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    await Promise.all(ids.map(id => deleteMutation.mutateAsync({ id })));
    queryClient.invalidateQueries();
    toast({ title: `${ids.length} task${ids.length > 1 ? "s" : ""} deleted` });
    exitSelectMode();
  };

  const exportCSV = (list: Assignment[]) => {
    const header = ["id", "title", "subject", "taskType", "status", "priority", "dueDate", "workloadMinutes", "recurringInterval"].join(",");
    const rows = list.map(a => [
      a.id,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${(a.subjectName ?? "").replace(/"/g, '""')}"`,
      a.taskType,
      a.status,
      a.priority,
      a.dueDate ?? "",
      a.workloadMinutes ?? "",
      a.recurringInterval ?? "",
    ].join(","));
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "studyflow-tasks.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${list.length} tasks` });
  };

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

  // 1. Search
  const searched = assignments?.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.subjectName && a.subjectName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) ?? [];

  // 2. Status filter
  const statusFiltered =
    statusFilter === "all"
      ? searched
      : statusFilter === "active"
        ? searched.filter(a => a.status === "notStarted" || a.status === "inProgress")
        : searched.filter(a => a.status === statusFilter);

  // 3. Subject filter
  const subjectFiltered = subjectFilter === "all"
    ? statusFiltered
    : statusFiltered.filter(a => String(a.subjectId) === subjectFilter);

  // 4. Sort
  const sorted = (() => {
    if (sortKey === "ai" && aiOrderedIds) {
      const idMap = new Map(subjectFiltered.map(a => [a.id, a]));
      const ordered = aiOrderedIds.flatMap(id => idMap.has(id) ? [idMap.get(id)!] : []);
      const unranked = subjectFiltered.filter(a => !aiOrderedIds.includes(a.id));
      return [...ordered, ...unranked];
    }
    return sortAssignments(subjectFiltered, sortKey);
  })();

  const isAiLoading = sortKey === "ai" && aiSortMutation.isPending;

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (subjectFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto h-full flex flex-col">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Tasks</h1>
          <p className="text-muted-foreground">Manage everything on your plate.</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[200px]"
            />
          </div>

          <Select value={sortKey} onValueChange={handleSortChange} disabled={isAiLoading}>
            <SelectTrigger className="w-[185px] shrink-0">
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

          <Button
            variant="outline"
            onClick={() => exportCSV(sorted)}
            className="gap-1.5 shrink-0"
            title="Export to CSV"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>

          <Button
            variant={selectMode ? "secondary" : "outline"}
            onClick={() => { if (selectMode) exitSelectMode(); else setSelectMode(true); }}
            className="gap-1.5 shrink-0"
          >
            {selectMode ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
            {selectMode ? "Cancel" : "Select"}
          </Button>

          <Button onClick={() => setQuickAddOpen(true)} className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            New Task
          </Button>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Status chips */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                statusFilter === f.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Subject filter */}
        {subjects && subjects.length > 0 && (
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="h-7 text-xs rounded-full px-3 w-auto min-w-[130px]">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.color ?? "#6366f1" }}
                    />
                    {s.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {activeFilterCount > 0 && (
          <button
            onClick={() => { setStatusFilter("all"); setSubjectFilter("all"); }}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

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
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  selectMode={selectMode}
                  selected={selectedIds.has(a.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          ) : (
            <div className="text-center p-12 bg-muted/10 border border-border border-dashed rounded-xl">
              <p className="text-muted-foreground">
                {activeFilterCount > 0 ? "No tasks match these filters." : "No tasks found."}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={() => { setStatusFilter("all"); setSubjectFilter("all"); }}
                  className="mt-2 text-xs text-primary underline underline-offset-2"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />

      {/* Floating bulk action bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-card border border-border shadow-xl px-4 py-2.5 animate-in slide-in-from-bottom-4">
          <span className="text-sm font-medium text-muted-foreground mr-2">
            {selectedIds.size} selected
          </span>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
            onClick={handleBulkMarkDone}
            disabled={updateMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Done
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={handleBulkDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={exitSelectMode}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
