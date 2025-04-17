import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, Flame } from "lucide-react";

interface StatsOverviewProps {
  stats: {
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
  };
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  // Prepare data for the chart
  const chartData = stats.teamProgress.map(member => ({
    name: member.name,
    prayers: member.totalCompleted,
  }));
  
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio'];
  
  // Mock monthly progress data
  const monthlyData = months.map(month => ({
    name: month,
    prayers: Math.floor(Math.random() * 30) + 10, // Random data for demonstration
  }));
  
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Equipo</h2>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-md">Progreso Mensual del Equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="prayers" fill="hsl(222.2 47.4% 11.2%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Top Prayer Warriors</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {stats.topPerformers.map((person, index) => (
                <li key={person.userId} className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center mr-3">
                    <span>{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                    <p className="text-sm text-gray-500">{person.percentage}% completion rate</p>
                  </div>
                  <div className="ml-4">
                    <Trophy className={`h-5 w-5 ${
                      index === 0 ? 'text-yellow-500' : 
                      index === 1 ? 'text-gray-400' : 
                      'text-yellow-700'
                    }`} />
                  </div>
                </li>
              ))}
              
              {stats.topPerformers.length === 0 && (
                <li className="text-gray-500 italic text-sm">No data available yet.</li>
              )}
            </ol>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-md">Current Streak Leaders</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {stats.streakLeaders.map((person, index) => (
                <li key={person.userId} className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center mr-3">
                    <span>{index + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                    <p className="text-sm text-gray-500">{person.streak} day streak</p>
                  </div>
                  <div className="ml-4">
                    <Flame className="h-5 w-5 text-red-500" />
                  </div>
                </li>
              ))}
              
              {stats.streakLeaders.length === 0 && (
                <li className="text-gray-500 italic text-sm">No data available yet.</li>
              )}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
