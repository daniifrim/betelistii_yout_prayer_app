import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavbar from "@/components/layout/mobile-navbar";
import QuickStats from "@/components/dashboard/quick-stats";
import TodaysPrayer from "@/components/dashboard/todays-prayer";
import MonthlyCalendar from "@/components/dashboard/monthly-calendar";
import DailyQuote from "@/components/dashboard/daily-quote";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { user } = useAuth();
  
  interface QuickStatsData {
    streak: number;
    total: number;
    monthlyTotal: number;
  }
  
  const { data: stats } = useQuery<QuickStatsData>({
    queryKey: ["/api/stats/me"],
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
          
          {/* Calendario mensual */}
          <MonthlyCalendar />
          
          {/* Cita diaria inspiradora */}
          <DailyQuote />
          
          {/* Botón grande para oración de hoy */}
          <TodaysPrayer />
          
          {/* Estadísticas personales */}
          {stats && <QuickStats stats={stats} />}
        </div>
      </main>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
}
