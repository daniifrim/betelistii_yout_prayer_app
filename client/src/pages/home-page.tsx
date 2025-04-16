import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavbar from "@/components/layout/mobile-navbar";
import QuickStats from "@/components/dashboard/quick-stats";
import TeamProgress from "@/components/dashboard/team-progress";
import TodaysPrayer from "@/components/dashboard/todays-prayer";
import { useQuery } from "@tanstack/react-query";

export default function HomePage() {
  const { user } = useAuth();
  
  interface QuickStatsData {
    streak: number;
    total: number;
    monthlyTotal: number;
  }
  
  interface TeamMember {
    userId: number;
    name: string;
    percentage: number;
  }
  
  interface TeamStatsData {
    teamProgress: TeamMember[];
  }
  
  const { data: stats } = useQuery<QuickStatsData>({
    queryKey: ["/api/stats/me"],
  });
  
  const { data: teamStats } = useQuery<TeamStatsData>({
    queryKey: ["/api/stats/team"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido de nuevo, {user?.name.split(' ')[0]}!
            </h1>
            <p className="text-gray-600">
              Registra tu camino de oración y apoya a nuestro grupo juvenil juntos.
            </p>
          </div>
          
          {stats && <QuickStats stats={stats} />}
          
          <TodaysPrayer />
          
          {teamStats && <TeamProgress teamData={teamStats.teamProgress} />}
        </div>
      </main>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
}
