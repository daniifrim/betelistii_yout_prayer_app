import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import StatsOverview from "@/components/stats/stats-overview";
import { useQuery } from "@tanstack/react-query";

export default function StatsPage() {
  const { data: teamStats, isLoading } = useQuery({
    queryKey: ["/api/stats/team"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Statistics</h1>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading statistics...</p>
            </div>
          ) : (
            teamStats && <StatsOverview stats={teamStats} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
