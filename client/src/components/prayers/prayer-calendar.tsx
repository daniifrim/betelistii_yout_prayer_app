import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, parse, isToday, isBefore } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Prayer } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PrayerCalendarProps {
  prayers: Prayer[];
}

export default function PrayerCalendar({ prayers }: PrayerCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Create calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setCalendarDays(daysInMonth);
  }, [currentMonth]);
  
  const prevMonth = () => {
    setCurrentMonth(month => {
      const prevMonthDate = new Date(month);
      prevMonthDate.setMonth(month.getMonth() - 1);
      return prevMonthDate;
    });
  };
  
  const nextMonth = () => {
    setCurrentMonth(month => {
      const nextMonthDate = new Date(month);
      nextMonthDate.setMonth(month.getMonth() + 1);
      return nextMonthDate;
    });
  };
  
  const togglePrayerMutation = useMutation({
    mutationFn: async (date: string) => {
      const res = await apiRequest("POST", "/api/prayers", {
        date: date,
        completed: true,
        notes: ""
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      toast({
        title: "Oración actualizada",
        description: "Tu registro de oración ha sido actualizado."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro de oración.",
        variant: "destructive"
      });
    }
  });
  
  const handleDateClick = (date: Date) => {
    if (isBefore(date, new Date()) || isToday(date)) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      togglePrayerMutation.mutate(formattedDate);
    }
  };
  
  const isPrayerCompleted = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return prayers.some(prayer => prayer.date === formattedDate && prayer.completed);
  };
  
  return (
    <div className="bg-white shadow rounded-lg mb-8">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Calendario de Oraciones</h2>
          <div className="flex space-x-2">
            <button 
              onClick={prevMonth}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Anterior
            </button>
            <span className="text-gray-900 font-medium">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button 
              onClick={nextMonth}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Siguiente
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-2 mb-4">
          <div className="text-center text-sm font-medium text-gray-500">D</div>
          <div className="text-center text-sm font-medium text-gray-500">L</div>
          <div className="text-center text-sm font-medium text-gray-500">M</div>
          <div className="text-center text-sm font-medium text-gray-500">X</div>
          <div className="text-center text-sm font-medium text-gray-500">J</div>
          <div className="text-center text-sm font-medium text-gray-500">V</div>
          <div className="text-center text-sm font-medium text-gray-500">S</div>
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {/* Add empty cells for days before the start of the month */}
          {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, index) => (
            <div key={`empty-start-${index}`} className="h-10"></div>
          ))}
          
          {calendarDays.map((day) => {
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday_ = isToday(day);
            const isPast = isBefore(day, new Date()) && !isToday_;
            const isCompleted = isPrayerCompleted(day);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => handleDateClick(day)}
                disabled={!isCurrentMonth || (!isPast && !isToday_)}
                className={`
                  h-10 w-full rounded-md flex items-center justify-center text-sm font-medium focus:outline-none
                  ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : ''}
                  ${isToday_ ? 'bg-primary text-white' : ''}
                  ${isPast && isCompleted ? 'bg-green-100 text-green-800' : ''}
                  ${isPast && !isCompleted ? 'hover:bg-gray-100' : ''}
                  ${(!isPast && !isToday_) ? 'text-gray-400' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
          
          {/* Add empty cells for days after the end of the month */}
          {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, index) => (
            <div key={`empty-end-${index}`} className="h-10"></div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center">
            <span className="inline-block h-4 w-4 rounded-full bg-green-100 mr-2"></span>
            <span className="text-sm text-gray-500">Completado</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block h-4 w-4 rounded-full bg-primary mr-2"></span>
            <span className="text-sm text-gray-500">Hoy</span>
          </div>
          <div className="flex items-center">
            <span className="inline-block h-4 w-4 rounded-full bg-white border border-gray-200 mr-2"></span>
            <span className="text-sm text-gray-500">Próximo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
