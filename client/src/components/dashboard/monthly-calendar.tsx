import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Prayer } from "@shared/schema";
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

export default function MonthlyCalendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
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

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Calendario de Oración</CardTitle>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border mx-auto"
          locale={es}
          modifiers={{
            completed: completedDates
          }}
          modifiersClassNames={{
            today: "bg-primary/20 text-primary rounded-full",
            completed: "bg-primary/10 text-primary font-bold rounded-full"
          }}
        />
      </CardContent>
    </Card>
  );
}