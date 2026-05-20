import { useState } from "react";
import { format, startOfWeek, addDays, subWeeks, addWeeks, isSameDay } from "date-fns";
import { useGetWeeklyView, useListSubjects } from "@workspace/api-client-react";
import { getGetWeeklyViewQueryKey } from "@workspace/api-client-react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AISmartInput from "@/components/shared/AISmartInput";
import AssignmentCard from "@/components/shared/AssignmentCard";

export default function Week() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Always start week on Monday
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");

  const { data: weeklyData, isLoading } = useGetWeeklyView(
    { weekStart: weekStartStr },
    { query: { enabled: true, queryKey: getGetWeeklyViewQueryKey({ weekStart: weekStartStr }) } }
  );
  
  const { data: subjects } = useListSubjects();

  const handlePrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const handleNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Generate 7 periods array
  const periods = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="flex flex-col h-full space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Weekly Planner</h1>
          <p className="text-muted-foreground">
            {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 6), "MMMM d, yyyy")}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-card p-1 rounded-lg border border-border shadow-sm">
          <Button variant="ghost" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleToday} className="font-medium">
            Today
          </Button>
          <Button variant="ghost" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <AISmartInput subjects={subjects || []} />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="flex-1 bg-card rounded-xl border border-border shadow-sm overflow-x-auto">
          <div className="min-w-[1000px] h-full flex flex-col">
            {/* Header Row */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-muted/30">
              <div className="p-3 border-r border-border flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Period</span>
              </div>
              {weeklyData?.days?.map((day, idx) => {
                const date = new Date(day.date);
                const isToday = isSameDay(date, new Date());
                return (
                  <div 
                    key={day.date} 
                    className={`p-3 border-r border-border last:border-r-0 text-center ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <div className="text-sm font-medium">{format(date, 'EEE')}</div>
                    <div className={`text-2xl font-bold mt-1 ${isToday ? 'text-primary' : ''}`}>
                      {format(date, 'd')}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="flex-1 overflow-y-auto">
              {periods.map(period => (
                <div key={`p-${period}`} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border last:border-b-0 min-h-[140px]">
                  {/* Period Label */}
                  <div className="border-r border-border p-2 flex flex-col items-center justify-center bg-muted/10">
                    <span className="text-sm font-semibold text-muted-foreground">P{period}</span>
                  </div>
                  
                  {/* Days for this period */}
                  {weeklyData?.days?.map(day => {
                    const assignmentsForPeriod = day.assignments.filter(a => a.period === period);
                    const isToday = isSameDay(new Date(day.date), new Date());
                    
                    return (
                      <div 
                        key={`${day.date}-p${period}`} 
                        className={`border-r border-border last:border-r-0 p-2 hover:bg-muted/30 transition-colors ${isToday ? 'bg-primary/5' : ''}`}
                      >
                        <div className="flex flex-col gap-2 h-full">
                          {assignmentsForPeriod.map(assignment => (
                            <AssignmentCard 
                              key={assignment.id} 
                              assignment={assignment} 
                              compact 
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
