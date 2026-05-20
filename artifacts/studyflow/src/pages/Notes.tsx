import { useState } from "react";
import { useListNotes, useCreateNote } from "@workspace/api-client-react";
import { getListNotesQueryKey } from "@workspace/api-client-react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { queryClient } from "@/lib/queryClient";
import { format } from "date-fns";

export default function Notes() {
  const [newNote, setNewNote] = useState("");
  
  const { data: notes, isLoading } = useListNotes(
    {}, 
    { query: { queryKey: getListNotesQueryKey({}) } }
  );
  
  const createMutation = useCreateNote();

  const handleCreate = () => {
    if (!newNote.trim()) return;
    
    createMutation.mutate({
      data: { content: newNote }
    }, {
      onSuccess: () => {
        setNewNote("");
        queryClient.invalidateQueries({ queryKey: getListNotesQueryKey({}) });
      }
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-muted-foreground">Jot down quick thoughts and reminders.</p>
        </div>
      </header>

      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <Textarea 
          placeholder="Type a new note here..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          className="min-h-[100px] mb-4"
        />
        <div className="flex justify-end">
          <Button onClick={handleCreate} disabled={createMutation.isPending || !newNote.trim()}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Save Note
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {notes?.map(note => (
            <div key={note.id} className="bg-card border border-border p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <p className="whitespace-pre-wrap text-sm">{note.content}</p>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>{format(new Date(note.createdAt), "MMM d, yyyy")}</span>
                {note.subjectName && (
                  <span className="px-2 py-1 rounded bg-secondary text-secondary-foreground font-medium">
                    {note.subjectName}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {notes?.length === 0 && (
            <div className="col-span-full text-center p-12 bg-muted/10 border border-border border-dashed rounded-xl">
              <p className="text-muted-foreground">No notes yet.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
