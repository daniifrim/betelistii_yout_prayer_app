import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Loader2,
  BookOpen,
  CalendarCheck,
  CalendarX,
  Timer,
  Play,
  Pause,
  StopCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, isToday, isFuture, formatDuration, intervalToDuration } from "date-fns";
import { es } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface PrayerCardProps {
  selectedDate: Date;
}

interface PrayerData {
  id?: number;
  userId?: number;
  date: string;
  completed: boolean;
  notes?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  duration?: number | null;
}

export default function PrayerCard({ selectedDate }: PrayerCardProps) {
  const queryClient = useQueryClient();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0); // en segundos
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  
  // Estado para registrar cuando comenzamos a orar
  const [prayerStartTime, setPrayerStartTime] = useState<Date | null>(null);

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const isTodaySelected = isToday(selectedDate);
  const isFutureDate = isFuture(selectedDate);
  
  // Use different endpoints based on selected date
  const queryKey = isTodaySelected
    ? ["/api/prayers/today"]
    : [`/api/prayers/date/${formattedDate}`];

  const { data: prayer, isLoading } = useQuery<PrayerData>({
    queryKey,
    enabled: !isFutureDate, // Do not fetch for future dates
  });
  
  // Formatear el tiempo transcurrido en un formato legible
  const formatElapsedTime = (seconds: number) => {
    const duration = intervalToDuration({ start: 0, end: seconds * 1000 });
    const hours = duration.hours ? `${duration.hours}h ` : '';
    const minutes = duration.minutes ? `${duration.minutes}m ` : '';
    const remainingSeconds = duration.seconds ? `${duration.seconds}s` : '';
    
    return `${hours}${minutes}${remainingSeconds}`;
  };
  
  // Iniciar el temporizador
  const startTimer = () => {
    const now = new Date();
    startTimeRef.current = now;
    setPrayerStartTime(now);
    setIsTimerRunning(true);
    
    // Iniciar conteo
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };
  
  // Pausar el temporizador
  const pauseTimer = () => {
    setIsTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  // Detener el temporizador y registrar la oración
  const stopTimer = async () => {
    pauseTimer();
    const endTime = new Date();
    const duration = elapsedTime;
    
    // Enviar datos al servidor
    try {
      const res = await apiRequest("POST", "/api/prayers/today", {
        completed: true,
        startTime: prayerStartTime?.toISOString(),
        endTime: endTime.toISOString(),
        duration: duration
      });
      
      // Resetear el temporizador
      setElapsedTime(0);
      setPrayerStartTime(null);
      
      // Actualizar la cache
      const data = await res.json();
      updateCacheAndInvalidateQueries(data);
      
      // Registrar la actividad
      const timeFormatted = formatElapsedTime(duration);
      await apiRequest("POST", "/api/activities", {
        type: "prayer",
        content: `Completó un tiempo de oración de ${timeFormatted}.`,
        relatedPrayerId: data.id
      });
      
      // Actualizar activities feed
      queryClient.invalidateQueries({
        queryKey: ["/api/activities/recent"],
        refetchType: "all",
      });
    } catch (error) {
      console.error("Error al registrar tiempo de oración:", error);
    }
  };
  
  // Limpiar el intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  const togglePrayerMutation = useMutation({
    mutationFn: async () => {
      const endpoint = isTodaySelected
        ? "/api/prayers/today"
        : `/api/prayers/date/${formattedDate}`;

      const res = await apiRequest("POST", endpoint, {});
      return await res.json();
    },
    onSuccess: async (data) => {
      updateCacheAndInvalidateQueries(data);
      
      // Registrar la actividad solo si se está marcando como completada (no al desmarcar)
      if (data.completed) {
        // Texto diferente dependiendo si es hoy u otro día
        const dateText = isTodaySelected 
          ? "hoy" 
          : `el ${format(selectedDate, "d 'de' MMMM", { locale: es })}`;
        
        await apiRequest("POST", "/api/activities", {
          type: "prayer",
          content: `Marcó su oración como completada ${dateText}.`,
          relatedPrayerId: data.id
        });
        
        // Actualizar activities feed
        queryClient.invalidateQueries({
          queryKey: ["/api/activities/recent"],
          refetchType: "all",
        });
      }
    },
    onError: (error) => {
      console.error("Error al cambiar estado de oración:", error);
    },
  });
  
  // Función para actualizar la caché y refrescar consultas
  const updateCacheAndInvalidateQueries = (data: any) => {
    // Actualización inmediata para mejor experiencia de usuario
    if (isTodaySelected) {
      queryClient.setQueryData(["/api/prayers/today"], data);
    } else {
      queryClient.setQueryData([`/api/prayers/date/${formattedDate}`], data);
    }

    // Forzar actualización de todos los recursos afectados
    // Invalidar y refrescar inmediatamente todas las consultas relacionadas
    queryClient.invalidateQueries({
      queryKey: ["/api/prayers"],
      refetchType: "all",
    });

    // Actualizar otras consultas relacionadas
    queryClient.invalidateQueries({
      queryKey: ["/api/prayers/today"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["/api/stats/me"],
      refetchType: "all",
    });

    // Asegurar que todas las consultas se actualicen
    setTimeout(() => {
      queryClient.invalidateQueries({
        queryKey: ["/api/prayers"],
        refetchType: "all",
      });
    }, 500);
  };

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
            <h2 className="text-lg font-bold text-gray-500">Fecha futura</h2>
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
      return isCompleted ? "¡Gracias por tu oración hoy!" : "¿Has orado hoy?";
    } else {
      const formattedDisplayDate = format(selectedDate, "d 'de' MMMM", {
        locale: es,
      });
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
        : "Toma un momento orar por los jóvenes hoy.";
    } else {
      return isCompleted
        ? "Cada día de oración cuenta! Sigue así."
        : "Puedes actualizar tu registro de oración para esta fecha.";
    }
  };

  // Get button text
  const getButtonText = () => {
    if (isTodaySelected) {
      return isCompleted ? "¡He orado hoy!" : "Marcar como orado";
    } else {
      return isCompleted ? "Desmarcar oración" : "Marcar como orado";
    }
  };

  return (
    <Card
      className={cn(
        "mb-8 border-2 overflow-hidden",
        isCompleted ? "border-green-500/50" : "border-primary/50",
      )}
    >
      <CardHeader
        className={cn(
          "py-3 px-6",
          isCompleted ? "bg-green-50" : "bg-primary/5",
        )}
      >
        <div className="flex items-center justify-center">
          <CalendarCheck
            className={cn(
              "h-5 w-5 mr-2",
              isCompleted ? "text-green-500" : "text-primary",
            )}
          />
          <h2
            className={cn(
              "text-lg font-bold",
              isCompleted ? "text-green-700" : "text-primary/90",
            )}
          >
            {getDateText()}
          </h2>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col items-center justify-center p-6">
        <p className="text-gray-600 mb-6 text-center">{getDescriptionText()}</p>
        
        {/* Mostrar la información de tiempo si está disponible */}
        {isTodaySelected && prayer?.duration && !isTimerRunning && (
          <div className="w-full max-w-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                <Timer className="w-3 h-3 mr-1" />
                Tiempo de oración
              </Badge>
              <span className="text-sm font-medium">
                {formatElapsedTime(prayer.duration)}
              </span>
            </div>
            <Progress value={(prayer.duration / 1800) * 100} max={100} className="h-2" />
          </div>
        )}

        {/* Mostrar el cronómetro si está activo */}
        {isTodaySelected && isTimerRunning && (
          <div className="w-full max-w-md mb-4">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="outline" className="bg-primary/5 text-primary animate-pulse border-primary/20">
                <Timer className="w-3 h-3 mr-1" />
                Orando ahora
              </Badge>
              <span className="text-sm font-medium">
                {formatElapsedTime(elapsedTime)}
              </span>
            </div>
            <Progress value={(elapsedTime / 1800) * 100} max={100} className="h-2" />
          </div>
        )}

        {/* Mostrar controles del cronómetro para el día actual */}
        {isTodaySelected && !isCompleted && !isTimerRunning && (
          <div className="flex gap-2 w-full max-w-md mb-4">
            <Button 
              onClick={startTimer} 
              variant="outline" 
              className="flex-1 border-primary/30 text-primary"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              Iniciar tiempo de oración
            </Button>
          </div>
        )}
        
        {/* Controles de cronómetro en ejecución */}
        {isTodaySelected && isTimerRunning && (
          <div className="flex gap-2 w-full max-w-md mb-4">
            <Button 
              onClick={pauseTimer} 
              variant="outline" 
              className="flex-1 border-yellow-500/50 text-yellow-600"
              size="lg"
            >
              <Pause className="mr-2 h-5 w-5" />
              Pausar
            </Button>
            <Button 
              onClick={stopTimer} 
              variant="outline" 
              className="flex-1 border-green-500/50 text-green-600"
              size="lg"
            >
              <StopCircle className="mr-2 h-5 w-5" />
              Finalizar
            </Button>
          </div>
        )}

        {/* Botón principal para marcar oración */}
        {(!isTodaySelected || !isTimerRunning) && (
          <Button
            onClick={handleTogglePrayer}
            disabled={togglePrayerMutation.isPending || isTimerRunning}
            variant={isCompleted ? "outline" : "default"}
            className={cn(
              "py-6 px-8 rounded-xl text-lg w-full max-w-md",
              isCompleted
                ? "border-2 border-green-500 text-green-600 hover:bg-green-50"
                : "bg-primary hover:bg-primary/90",
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
        )}
      </CardContent>
    </Card>
  );
}
