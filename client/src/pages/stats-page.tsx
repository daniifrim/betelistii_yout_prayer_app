import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MobileNavbar from "@/components/layout/mobile-navbar";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Users } from "lucide-react";
import MemberCard from "@/components/stats/member-card";

interface TeamStats {
  teamProgress: Array<{
    userId: number;
    name: string;
    percentage: number;
    streak: number;
    totalCompleted: number;
  }>;
  topPerformers: Array<{
    userId: number;
    name: string;
    percentage: number;
  }>;
  streakLeaders: Array<{
    userId: number;
    name: string;
    streak: number;
  }>;
}

export default function StatsPage() {
  const { data: teamStats, isLoading } = useQuery<TeamStats>({
    queryKey: ["/api/stats/team"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Grupo Betelistii</h1>
          </div>
          
          <p className="text-gray-600 mb-8">
            Progreso de todos los miembros de nuestro grupo. Unidos en oración.
          </p>
          
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="mt-4 text-gray-500">Cargando estadísticas...</p>
            </div>
          ) : teamStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teamStats.teamProgress
                .sort((a, b) => b.percentage - a.percentage)
                .map(member => (
                  <MemberCard key={member.userId} member={member} />
                ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No hay datos disponibles.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
      <MobileNavbar />
    </div>
  );
}
