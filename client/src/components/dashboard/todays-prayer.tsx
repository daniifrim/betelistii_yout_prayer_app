import { Button } from "@/components/ui/button";
import { Check, Loader2, BookMarked } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";

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
    <Card className={`mb-8 border-2 ${isCompleted ? 'border-green-500/50' : 'border-primary/50'}`}>
      <CardContent className="flex flex-col items-center justify-center p-8">
        <h2 className="text-xl font-bold mb-6 text-center">
          ¿Has orado hoy?
        </h2>
        
        <Button
          onClick={handleTogglePrayer}
          disabled={togglePrayerMutation.isPending}
          variant={isCompleted ? "outline" : "default"}
          className={`py-6 px-8 rounded-xl text-lg w-full max-w-md ${
            isCompleted 
              ? "border-2 border-green-500 text-green-600 hover:bg-green-50" 
              : "bg-primary hover:bg-primary/90"
          }`}
          size="lg"
        >
          {togglePrayerMutation.isPending ? (
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          ) : isCompleted ? (
            <Check className="mr-3 h-6 w-6" />
          ) : (
            <BookMarked className="mr-3 h-6 w-6" />
          )}
          {isCompleted ? "¡He orado hoy!" : "He orado hoy"}
        </Button>
      </CardContent>
    </Card>
  );
}
