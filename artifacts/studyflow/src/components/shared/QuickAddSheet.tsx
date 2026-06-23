import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAssignment, useListSubjects } from "@workspace/api-client-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { AssignmentInputTaskType, AssignmentInputStatus, AssignmentInputRecurringInterval } from "@workspace/api-client-react/src/generated/api.schemas";

export default function QuickAddSheet({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [title, setTitle] = useState("");
  const [subjectId, setSubjectId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");
  const [period, setPeriod] = useState<string>("none");
  const [taskType, setTaskType] = useState<AssignmentInputTaskType>("assignment");
  const [priority, setPriority] = useState(3);
  const [recurringInterval, setRecurringInterval] = useState<string>("none");
  
  const { data: subjects } = useListSubjects();
  const createMutation = useCreateAssignment();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title) return;
    
    createMutation.mutate({
      data: {
        title,
        subjectId: subjectId !== "none" ? parseInt(subjectId) : undefined,
        dueDate: dueDate || undefined,
        period: period !== "none" ? parseInt(period) : undefined,
        taskType,
        status: "notStarted",
        priority,
        recurringInterval: recurringInterval !== "none" ? recurringInterval as AssignmentInputRecurringInterval : undefined,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries();
        toast({ title: "Task added successfully!" });
        setTitle("");
        setSubjectId("none");
        setDueDate("");
        setPeriod("none");
        setPriority(3);
        setRecurringInterval("none");
        onOpenChange(false);
      },
      onError: () => {
        toast({ title: "Failed to add task", variant: "destructive" });
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Quick Add Task</SheetTitle>
          <SheetDescription>
            Add a new assignment, test, or reminder to your planner.
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g. Read Chapter 4" required />
          </div>
          
          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {subjects?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Task Type</Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as AssignmentInputTaskType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment</SelectItem>
                <SelectItem value="homework">Homework</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
                <SelectItem value="test">Test</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="studySession">Study Session</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {[1,2,3,4,5,6,7].map(p => (
                  <SelectItem key={p} value={p.toString()}>Period {p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`p-2 rounded-md transition-colors ${priority >= p ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500/50'}`}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={priority >= p ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Repeat</Label>
            <Select value={recurringInterval} onValueChange={setRecurringInterval}>
              <SelectTrigger>
                <SelectValue placeholder="Does not repeat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Does not repeat</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={createMutation.isPending || !title}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Add Task
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
