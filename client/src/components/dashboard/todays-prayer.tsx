import { Button } from "@/components/ui/button";
import { Check, Loader2, BookOpen, CalendarCheck, CalendarX } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture } from "date-fns";
import { es } from 'date-fns/locale';

interface PrayerCardProps {
  selectedDate: Date;
}

export default function PrayerCard({ selectedDate }: PrayerCardProps) {
  const queryClient = useQueryClient();
  
  interface PrayerData {
    id?: number;
    userId?: number;
    date: string;
    completed: boolean;
  }
  
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const isTodaySelected = isToday(selectedDate);
  const isFutureDate = isFuture(selectedDate);
  
  // Use different endpoints based on selected date
  const queryKey = isTodaySelected 
    ? ["/api/prayers/today"] 
    : [`/api/prayers/date/${formattedDate}`];
  
  const { data: prayer, isLoading } = useQuery<PrayerData>({
    queryKey,
    enabled: !isFutureDate // Do not fetch for future dates
  });
  
  const togglePrayerMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isTodaySelected 
        ? "/api/prayers/today" 
        : `/api/prayers/date/${formattedDate}`;
      
      const res = await apiRequest("POST", endpoint, {});
      return await res.json();
    },
    onSuccess: (data) => {
      // Immediate update for better UX
      if (isTodaySelected) {
        queryClient.setQueryData(["/api/prayers/today"], data);
      } else {
        queryClient.setQueryData([`/api/prayers/date/${formattedDate}`], data);
      }
      
      // Force refetch all affected resources
      queryClient.invalidateQueries({ queryKey: ["/api/prayers"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/prayers/today"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/me"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"], refetchType: 'all' });
    },
    onError: (error) => {
      console.error("Error toggling prayer:", error);
    }
  });
  
  const handleTogglePrayer = () => {
    if (!isFutureDate) {
      togglePrayerMutation.mutate();
    }
  };
  
  const isCompleted = prayer?.completed;
  
  if (isLoading && !isFutureDate) {
    return (
      <Card className="mb-8 border-2 border-dashed border-primary/30">
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // Handle future dates
  if (isFutureDate) {
    return (
      <Card className="mb-8 border-2 border-gray-200 overflow-hidden opacity-75">
        <CardHeader className="py-3 px-6 bg-gray-50">
          <div className="flex items-center justify-center">
            <CalendarX className="h-5 w-5 mr-2 text-gray-400" />
            <h2 className="text-lg font-bold text-gray-500">
              Fecha futura
            </h2>
          </div>
        </CardHeader>
        
        <CardContent className="flex flex-col items-center justify-center p-6">
          <p className="text-gray-500 mb-6 text-center">
            No puedes registrar oración para una fecha futura.
          </p>
          
          <Button
            disabled={true}
            variant="outline"
            className="py-6 px-8 rounded-xl text-lg w-full max-w-md border border-gray-200 text-gray-400"
            size="lg"
          >
            <CalendarX className="mr-3 h-6 w-6" />
            No disponible
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Get friendly date text
  const getDateText = () => {
    if (isTodaySelected) {
      return isCompleted 
        ? "¡Gracias por tu oración hoy!" 
        : "¿Has orado hoy?";
    } else {
      const formattedDisplayDate = format(selectedDate, "d 'de' MMMM", { locale: es });
      return isCompleted
        ? `¡Gracias por tu oración el ${formattedDisplayDate}!`
        : `¿Oraste el ${formattedDisplayDate}?`;
    }
  };
  
  // Get description text
  const getDescriptionText = () => {
    if (isTodaySelected) {
      return isCompleted 
        ? "Tu fidelidad en la oración fortalece a todo el grupo." 
        : "Toma un momento para conectar con Dios hoy.";
    } else {
      return isCompleted
        ? "Cada día de oración cuenta en tu camino espiritual."
        : "Puedes actualizar tu registro de oración para esta fecha.";
    }
  };
  
  // Get button text
  const getButtonText = () => {
    if (isTodaySelected) {
      return isCompleted 
        ? "¡He orado hoy!" 
        : "He orado hoy";
    } else {
      return isCompleted
        ? "Desmarcar oración"
        : "Marcar como orado";
    }
  };
  
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
            {getDateText()}
          </h2>
        </div>
      </CardHeader>
      
      <CardContent className="flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-6 text-center">
          {getDescriptionText()}
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
          {getButtonText()}
        </Button>
      </CardContent>
    </Card>
  );
}
