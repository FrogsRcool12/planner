import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, X } from "lucide-react";
import { useParseWithAI, useCreateAssignment } from "@workspace/api-client-react";
import { Subject, ParsedAssignment } from "@workspace/api-client-react/src/generated/api.schemas";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function AISmartInput({ subjects }: { subjects: Subject[] }) {
  const [text, setText] = useState("");
  const { toast } = useToast();
  
  const parseMutation = useParseWithAI();
  const createMutation = useCreateAssignment();
  
  const [parsedResults, setParsedResults] = useState<ParsedAssignment[] | null>(null);

  const handleParse = () => {
    if (!text.trim()) return;
    
    parseMutation.mutate({ data: { text, subjects } }, {
      onSuccess: (data) => {
        if (data.assignments && data.assignments.length > 0) {
          setParsedResults(data.assignments);
          toast({
            title: "Tasks extracted!",
            description: `Found ${data.assignments.length} assignments.`,
          });
        } else {
          toast({
            title: "No tasks found",
            description: "Try rewording your input.",
            variant: "destructive"
          });
        }
      },
      onError: (err) => {
        toast({
          title: "AI Parse failed",
          description: "Something went wrong.",
          variant: "destructive"
        });
      }
    });
  };

  const handleSaveAll = async () => {
    if (!parsedResults) return;
    
    let successCount = 0;
    
    // We'll execute them sequentially to not hammer the API too hard, or we could Promise.all
    for (const assignment of parsedResults) {
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
            status: 'notStarted',
            priority: assignment.priority,
            workloadMinutes: assignment.workloadMinutes,
            difficulty: assignment.difficulty,
            urgency: assignment.urgency,
            aiGenerated: true
          }
        });
        successCount++;
      } catch (e) {
        console.error("Failed to save assignment", e);
      }
    }
    
    queryClient.invalidateQueries();
    
    toast({
      title: "Success",
      description: `Saved ${successCount} assignments.`,
    });
    
    setParsedResults(null);
    setText("");
  };

  return (
    <div className="bg-card rounded-xl border border-primary/20 shadow-md shadow-primary/5 overflow-hidden transition-all duration-300">
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
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleParse();
              }
            }}
          />
          <div className="flex justify-between items-center mt-2 px-2">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">Cmd+Enter</kbd> to parse
            </span>
            <Button 
              onClick={handleParse} 
              disabled={parseMutation.isPending || !text.trim()}
              className="gap-2"
            >
              {parseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Parse with AI"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-muted/30">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Found {parsedResults.length} tasks
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setParsedResults(null)}>
              <X className="h-4 w-4 mr-2" /> Cancel
            </Button>
          </div>
          
          <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto pr-2">
            {parsedResults.map((item, idx) => (
              <div key={idx} className="bg-background rounded-lg border border-border p-3 shadow-sm flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-sm">{item.title}</h4>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {item.subjectName && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium">
                        {item.subjectName}
                      </span>
                    )}
                    {item.dueDate && (
                      <span className="text-xs text-muted-foreground">Due: {item.dueDate}</span>
                    )}
                    {item.priority > 0 && (
                      <span className="text-xs text-yellow-500 font-medium">
                        {"★".repeat(item.priority)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button onClick={handleSaveAll} disabled={createMutation.isPending}>
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Save All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
