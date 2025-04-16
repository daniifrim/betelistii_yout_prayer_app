import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavbar from "@/components/layout/mobile-navbar";
import QuickStats from "@/components/dashboard/quick-stats";
import PrayerCard from "@/components/dashboard/todays-prayer";
import MonthlyCalendar from "@/components/dashboard/monthly-calendar";
import DailyQuote from "@/components/dashboard/daily-quote";
import ActivityFeed from "@/components/activity-feed/activity-feed";
import { useQuery } from "@tanstack/react-query";
import { useState } from 'react';
import { startOfDay } from 'date-fns';
import { useIsMobile } from "@/hooks/use-mobile";

export default function HomePage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const isMobile = useIsMobile();
  
  interface QuickStatsData {
    streak: number;
    total: number;
    monthlyTotal: number;
  }
  
  const { data: stats } = useQuery<QuickStatsData>({
    queryKey: ["/api/stats/me"],
    // Para sincronizar datos, usamos refetchInterval en lugar de callback manual
    refetchInterval: 2000,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido, {user?.name.split(' ')[0]}!
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
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
            
            {/* Feed de actividad (Columna lateral en desktop, debajo en móvil) */}
            <div className={isMobile ? "mt-8" : ""}>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
}
