import { useState } from "react";
import { useListAssignments } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey } from "@workspace/api-client-react";
import AssignmentCard from "@/components/shared/AssignmentCard";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Assignment } from "@workspace/api-client-react/src/generated/api.schemas";

type SortKey = "due-asc" | "due-desc" | "created-desc" | "created-asc" | "priority-desc" | "priority-asc" | "duration-desc" | "duration-asc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "due-asc",       label: "Earliest due"       },
  { value: "due-desc",      label: "Latest due"         },
  { value: "created-desc",  label: "Recently added"     },
  { value: "created-asc",   label: "Oldest first"       },
  { value: "priority-desc", label: "Highest priority"   },
  { value: "priority-asc",  label: "Lowest priority"    },
  { value: "duration-desc", label: "Longest duration"   },
  { value: "duration-asc",  label: "Shortest duration"  },
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
    }
  });
}

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("due-asc");

  const { data: assignments, isLoading } = useListAssignments(
    {},
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );

  const filtered = assignments?.filter(a =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.subjectName && a.subjectName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) ?? [];

  const sorted = sortAssignments(filtered, sortKey);

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

          <Select value={sortKey} onValueChange={v => setSortKey(v as SortKey)}>
            <SelectTrigger className="w-[190px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {isLoading ? (
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
