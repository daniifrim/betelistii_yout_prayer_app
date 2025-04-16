import { Button } from "@/components/ui/button";
import { Check, Loader2, BookOpen, CalendarCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function TodaysPrayer() {
  const queryClient = useQueryClient();
  
  interface PrayerData {
    id: number;
    userId: number;
    date: string;
    completed: boolean;
  }
  
  const { data: todayPrayer, isLoading } = useQuery<PrayerData>({
    queryKey: ["/api/prayers/today"],
  });
  
  const togglePrayerMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/prayers/today", {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers"] });
    },
  });
  
  const handleTogglePrayer = () => {
    togglePrayerMutation.mutate();
  };
  
  const isCompleted = todayPrayer?.completed;
  
  if (isLoading) {
    return (
      <Card className="mb-8 border-2 border-dashed border-primary/30">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={cn(
      "mb-8 border-2 overflow-hidden",
      isCompleted ? "border-green-500/50" : "border-primary/50"
    )}>
      <CardHeader className={cn(
        "py-3 px-6",
        isCompleted ? "bg-green-50" : "bg-primary/5"
      )}>
        <div className="flex items-center justify-center">
          <CalendarCheck className={cn(
            "h-5 w-5 mr-2",
            isCompleted ? "text-green-500" : "text-primary"
          )} />
          <h2 className={cn(
            "text-lg font-bold",
            isCompleted ? "text-green-700" : "text-primary/90"
          )}>
            {isCompleted ? "¡Gracias por tu oración hoy!" : "¿Has orado hoy?"}
          </h2>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-6 text-center">
          {isCompleted 
            ? "Tu fidelidad en la oración fortalece a todo el grupo." 
            : "Toma un momento para conectar con Dios hoy."}
        </p>
        
        <Button
          onClick={handleTogglePrayer}
          disabled={togglePrayerMutation.isPending}
          variant={isCompleted ? "outline" : "default"}
          className={cn(
            "py-6 px-8 rounded-xl text-lg w-full max-w-md",
            isCompleted 
              ? "border-2 border-green-500 text-green-600 hover:bg-green-50" 
              : "bg-primary hover:bg-primary/90"
          )}
          size="lg"
        >
          {togglePrayerMutation.isPending ? (
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          ) : isCompleted ? (
            <Check className="mr-3 h-6 w-6" />
          ) : (
            <BookOpen className="mr-3 h-6 w-6" />
          )}
          {isCompleted ? "¡He orado hoy!" : "He orado hoy"}
        </Button>
      </CardContent>
    </Card>
  );
}
