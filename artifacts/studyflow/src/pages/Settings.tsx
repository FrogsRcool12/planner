import { useState } from "react";
import { useListSubjects, useCreateSubject, useDeleteSubject } from "@workspace/api-client-react";
import { getListSubjectsQueryKey } from "@workspace/api-client-react";
import { useTheme } from "next-themes";
import { Loader2, Plus, Trash2, Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@clerk/react";

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const { signOut } = useAuth();
  
  const { data: subjects, isLoading } = useListSubjects({ query: { queryKey: getListSubjectsQueryKey() } });
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();
  
  const [newSubjName, setNewSubjName] = useState("");
  const [newSubjColor, setNewSubjColor] = useState("#5835FF");
  const [newSubjPeriod, setNewSubjPeriod] = useState<string>("none");

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    
    createSubject.mutate({
      data: {
        name: newSubjName,
        color: newSubjColor,
        period: newSubjPeriod !== "none" ? parseInt(newSubjPeriod) : undefined
      }
    }, {
      onSuccess: () => {
        setNewSubjName("");
        setNewSubjPeriod("none");
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        toast({ title: "Subject added" });
      }
    });
  };

  const handleDeleteSubject = (id: number) => {
    if (!confirm("Are you sure? This doesn't delete assignments, but removes the subject link.")) return;
    
    deleteSubject.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListSubjectsQueryKey() });
        toast({ title: "Subject deleted" });
      }
    });
  };

  const PRESET_COLORS = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308", "#84cc16", 
    "#22c55e", "#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", 
    "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", 
    "#ec4899", "#f43f5e"
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto h-full flex flex-col pb-20">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your workspace preferences.</p>
      </header>

      {/* Theme Settings */}
      <section className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Appearance</h2>
        <div className="grid grid-cols-3 gap-4 max-w-sm">
          <Button 
            variant={theme === 'light' ? 'default' : 'outline'} 
            onClick={() => setTheme('light')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </Button>
          <Button 
            variant={theme === 'dark' ? 'default' : 'outline'} 
            onClick={() => setTheme('dark')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </Button>
          <Button 
            variant={theme === 'system' ? 'default' : 'outline'} 
            onClick={() => setTheme('system')}
            className="flex flex-col gap-2 h-auto py-4"
          >
            <Monitor className="h-5 w-5" />
            <span>System</span>
          </Button>
        </div>
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
              <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('color-picker')?.click()}>
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
                {[1,2,3,4,5,6,7].map(p => (
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
              className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-transform hover:scale-110 ${newSubjColor === c ? 'border-primary' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => setNewSubjColor(c)}
            />
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {isLoading ? (
            <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : subjects?.length ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {subjects.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.name}</span>
                    {s.period && <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">P{s.period}</span>}
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDeleteSubject(s.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No subjects added yet.</p>
          )}
        </div>
      </section>

      {/* Help */}
      <section className="space-y-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <h2 className="text-xl font-semibold">Help</h2>
        <p className="text-sm text-muted-foreground">New to StudyFlow? Replay the onboarding tutorial to learn about all the features.</p>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem("studyflow_tutorial_completed");
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
