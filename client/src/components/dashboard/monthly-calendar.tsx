import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Prayer } from "@shared/schema";
import { es } from 'date-fns/locale';
import { format, isAfter, startOfDay } from 'date-fns';
import { CalendarRange, CalendarDays } from "lucide-react";

interface MonthlyCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export default function MonthlyCalendar({ selectedDate, onSelectDate }: MonthlyCalendarProps) {
  const { data: prayers = [] } = useQuery<Prayer[]>({
    queryKey: ["/api/prayers"],
  });
  
  // Filter completed prayers for highlighting dates
  const completedPrayers = prayers.filter(prayer => prayer.completed);
  
  // Create an array of dates that have completed prayers
  const completedDates = completedPrayers.map(prayer => {
    const [year, month, day] = prayer.date.split('-');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  });
  
  // Disable future dates
  const today = startOfDay(new Date());
  const disabledDays = [
    {
      from: new Date(today.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
      to: new Date(2100, 0, 1), // Far future
    },
  ];

  return (
    <Card className="mb-6 border-primary/20 overflow-hidden">
      <div className="bg-primary/5 py-2 px-4 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <CalendarRange className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-primary">Tus oraciones del mes</h3>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-gray-900">
            {format(selectedDate, 'MMMM yyyy', { locale: es })}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <CalendarDays className="h-4 w-4 mr-1 text-primary" />
            <span>{completedPrayers.length} oraciones</span>
          </div>
        </div>
        
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            if (date && !isAfter(date, today)) {
              onSelectDate(date);
            }
          }}
          className="rounded-md mx-auto"
          locale={es}
          modifiers={{
            completed: completedDates
          }}
          modifiersClassNames={{
            today: "bg-primary/20 text-primary rounded-full font-bold",
            completed: "bg-primary text-white font-bold rounded-full"
          }}
          disabled={disabledDays}
        />
      </CardContent>
    </Card>
  );
}