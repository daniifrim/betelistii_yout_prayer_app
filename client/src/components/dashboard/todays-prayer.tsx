import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function TodaysPrayer() {
  const queryClient = useQueryClient();
  
  const { data: todayPrayer, isLoading } = useQuery({
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
  
  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Prayer</h3>
        <div className="mt-5">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading...</span>
            </div>
          ) : (
            <Button
              onClick={handleTogglePrayer}
              disabled={togglePrayerMutation.isPending}
              variant={isCompleted ? "outline" : "default"}
              className={`${isCompleted ? "border-green-500 text-green-500 hover:bg-green-50" : ""}`}
            >
              {togglePrayerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isCompleted ? (
                <Check className="mr-2 h-4 w-4" />
              ) : null}
              {isCompleted ? "Completed" : "Mark as Completed"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
