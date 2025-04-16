import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavbar from "@/components/layout/mobile-navbar";
import QuickStats from "@/components/dashboard/quick-stats";
import PrayerCard from "@/components/dashboard/todays-prayer";
import MonthlyCalendar from "@/components/dashboard/monthly-calendar";
import DailyQuote from "@/components/dashboard/daily-quote";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState, useEffect, useCallback } from 'react';
import { startOfDay } from 'date-fns';

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Función para forzar actualización de datos
  const forcePrayerUpdate = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    // Forzar refrescar los datos
    queryClient.invalidateQueries({ queryKey: ["/api/prayers"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats/me"] });
  }, []);
  
  // Configurar un intervalo para mantener los datos sincronizados
  useEffect(() => {
    // Actualizar datos cada 3 segundos
    const interval = setInterval(() => {
      forcePrayerUpdate();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [forcePrayerUpdate]);
  
  interface QuickStatsData {
    streak: number;
    total: number;
    monthlyTotal: number;
  }
  
  const { data: stats } = useQuery<QuickStatsData>({
    queryKey: ["/api/stats/me", refreshTrigger],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de nuevo, {user?.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">
              Tu jornada personal de oración en Betelistii.
            </p>
          </div>
          
          {/* Calendario mensual con selección de fecha */}
          <MonthlyCalendar 
            selectedDate={selectedDate} 
            onSelectDate={setSelectedDate}
          />
          
          {/* Tarjeta de oración que refleja la fecha seleccionada */}
          <PrayerCard selectedDate={selectedDate} />
          
          {/* Cita diaria inspiradora */}
          <DailyQuote />
          
          {/* Estadísticas personales */}
          {stats && <QuickStats stats={stats} />}
        </div>
      </main>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
}
