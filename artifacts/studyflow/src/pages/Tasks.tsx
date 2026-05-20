import { useState } from "react";
import { useListAssignments } from "@workspace/api-client-react";
import { getListAssignmentsQueryKey } from "@workspace/api-client-react";
import AssignmentCard from "@/components/shared/AssignmentCard";
import { Loader2, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Tasks() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: assignments, isLoading } = useListAssignments(
    {}, 
    { query: { queryKey: getListAssignmentsQueryKey({}) } }
  );

  const filteredAssignments = assignments?.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (a.subjectName && a.subjectName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
              className="pl-9 w-full sm:w-[250px]"
            />
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="flex-1 space-y-4 overflow-y-auto pb-20">
          {filteredAssignments?.length ? (
            <div className="grid gap-3">
              {filteredAssignments.map(a => (
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
