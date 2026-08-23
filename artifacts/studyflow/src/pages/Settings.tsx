import { useState, useEffect } from "react";
import { useListSubjects, useCreateSubject, useDeleteSubject, useUpdateSubject } from "@workspace/api-client-react";
import { getListSubjectsQueryKey } from "@workspace/api-client-react";
import { Subject } from "@workspace/api-client-react/src/generated/api.schemas";
import { useTheme } from "next-themes";
import { Loader2, Plus, Trash2, Moon, Sun, Monitor, GripVertical, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRESET_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16",
  "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9",
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e",
];

function SortableSubjectRow({
  subject,
  onDelete,
}: {
  subject: Subject;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-0.5 rounded touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: subject.color }} />
        <span className="font-medium">{subject.name}</span>
        {subject.period != null && (
          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
            P{subject.period}
          </span>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        onClick={() => onDelete(subject.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const { data: subjects, isLoading } = useListSubjects({ query: { queryKey: getListSubjectsQueryKey() } });
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  const updateSubject = useUpdateSubject();

  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjColor, setNewSubjColor] = useState("#5835FF");
  const [newSubjPeriod, setNewSubjPeriod] = useState<string>("none");

  const selectTheme = (nextTheme: string) => {
    setTheme(nextTheme);

    if (nextTheme === "seasonal") {
      const month = new Date().getMonth() + 1;
      const season =
        month === 10
          ? "spooky"
          : month === 6 || month === 7 || month === 8
            ? "summer"
            : month === 9 || month === 11
              ? "fall"
              : month === 12 || month === 1 || month === 2
                ? "winter"
                : "spring";
      document.documentElement.setAttribute("data-season", season);
    } else {
      document.documentElement.removeAttribute("data-season");
    }
  };

  // Local ordered list — kept in sync with server data, sorted by period
  const [ordered, setOrdered] = useState<Subject[]>([]);

  useEffect(() => {
    if (!subjects) return;
    const sorted = [...subjects].sort((a, b) => {
      if (a.period == null && b.period == null) return 0;
      if (a.period == null) return 1;
      if (b.period == null) return -1;
      return a.period - b.period;
    });
    setOrdered(sorted);
  }, [subjects]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ordered.findIndex(s => s.id === active.id);
    const newIndex = ordered.findIndex(s => s.id === over.id);
    const newOrder = arrayMove(ordered, oldIndex, newIndex);
    setOrdered(newOrder);

    // Reassign period numbers (1-indexed) and persist
    newOrder.forEach((subject, idx) => {
      const newPeriod = idx + 1;
      if (subject.period !== newPeriod) {
        updateSubject.mutate(
          { id: subject.id, data: { period: newPeriod } },
          { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() }) },
        );
      }
    });
  }

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    createSubject.mutate({
      data: {
        name: newSubjName,
        color: newSubjColor,
        period: newSubjPeriod !== "none" ? parseInt(newSubjPeriod) : undefined,
      },
    }, {
      onSuccess: () => {
        setNewSubjName("");
        setNewSubjPeriod("none");
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        toast({ title: "Subject added" });
      },
    });
  };

  const handleDeleteSubject = (id: number) => {
    if (!confirm("Are you sure? This doesn't delete assignments, but removes the subject link.")) return;
    deleteSubject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        toast({ title: "Subject deleted" });
      },
    });
  };

  const [clearingAll, setClearingAll] = useState(false);

  const handleClearAll = async () => {
    if (!ordered.length) return;
    if (!confirm(`Remove all ${ordered.length} subjects? Your assignments won't be deleted, just unlinked from subjects.`)) return;
    setClearingAll(true);
    await Promise.all(
      ordered.map(s =>
        new Promise<void>(resolve =>
          deleteSubject.mutate({ id: s.id }, { onSettled: () => resolve() })
        )
      )
    );
    queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
    toast({ title: "All subjects cleared" });
    setClearingAll(false);
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto h-full flex flex-col pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace preferences.</p>
      </header>

      {/* Theme Settings */}
      <section className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            onClick={() => selectTheme("light")}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            onClick={() => selectTheme("dark")}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </Button>
          <Button
            variant={theme === "system" ? "default" : "outline"}
            onClick={() => selectTheme("system")}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Monitor className="h-5 w-5" />
            <span>System</span>
          </Button>
          <Button
            variant={theme === "seasonal" ? "default" : "outline"}
            onClick={() => selectTheme("seasonal")}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Sparkles className="h-5 w-5" />
            <span>Seasonal</span>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Seasonal automatically changes its colors throughout the year: beach tones in summer, falling leaves in autumn, spooky colors in October, and fresh palettes for spring and winter.
        </p>
      </section>

      {/* Subject Management */}
      <section className="space-y-6 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Subjects</h2>

        <form onSubmit={handleAddSubject} className="grid sm:grid-cols-[1fr_auto_1fr_auto] gap-4 items-end">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={newSubjName} onChange={e => setNewSubjName(e.target.value)} placeholder="e.g. AP Biology" />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-10 rounded-md border border-border shadow-sm"
                style={{ backgroundColor: newSubjColor }}
              />
              <Input
                type="color"
                value={newSubjColor}
                onChange={e => setNewSubjColor(e.target.value)}
                className="w-0 h-0 p-0 border-0 opacity-0 absolute"
                id="color-picker"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("color-picker")?.click()}>
                Pick
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Period</Label>
            <Select value={newSubjPeriod} onValueChange={setNewSubjPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {[1, 2, 3, 4, 5, 6, 7].map(p => (
                  <SelectItem key={p} value={p.toString()}>Period {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={createSubject.isPending || !newSubjName}>
            {createSubject.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add
          </Button>
        </form>

        <div className="flex gap-2 flex-wrap mb-4">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${newSubjColor === c ? "border-primary" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setNewSubjColor(c)}
            />
          ))}
        </div>

        <div className="mt-8 space-y-2">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : ordered.length ? (
            <>
              <div className="flex items-center justify-between pb-1">
                <p className="text-xs text-muted-foreground">Drag to reorder — period numbers update automatically.</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                  onClick={handleClearAll}
                  disabled={clearingAll}
                >
                  {clearingAll ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Trash2 className="h-3.5 w-3.5 mr-1" />}
                  Clear All
                </Button>
              </div>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={ordered.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {ordered.map(s => (
                      <SortableSubjectRow key={s.id} subject={s} onDelete={handleDeleteSubject} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No subjects added yet.</p>
          )}
        </div>
      </section>

      {/* Help */}
      <section className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Help</h2>
         <p className="text-sm text-muted-foreground">New to Smart Planner? Replay the onboarding tutorial to learn about all the features.</p>
        <Button
          variant="outline"
          onClick={() => {
             localStorage.removeItem("smart_planner_tutorial_completed");
            window.location.reload();
          }}
        >
          Replay Tutorial
        </Button>
      </section>

      {/* Account */}
      <section className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Account</h2>
        <Button variant="destructive" onClick={() => signOut()}>
          Sign Out
        </Button>
      </section>
    </div>
  );
}
