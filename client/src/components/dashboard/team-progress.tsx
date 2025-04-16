import { Progress } from "@/components/ui/progress";

interface TeamMember {
  userId: number;
  name: string;
  percentage: number;
}

interface TeamProgressProps {
  teamData: TeamMember[];
}

export default function TeamProgress({ teamData }: TeamProgressProps) {
  // Sort team members by percentage in descending order
  const sortedTeamData = [...teamData].sort((a, b) => b.percentage - a.percentage);
  
  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Progreso del Equipo</h3>
        
        {sortedTeamData.map((member) => (
          <div className="mb-4" key={member.userId}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{member.name}</span>
              <span className="text-sm font-medium text-gray-700">{member.percentage}%</span>
            </div>
            <Progress value={member.percentage} className="h-2.5" />
          </div>
        ))}
        
        {sortedTeamData.length === 0 && (
          <p className="text-gray-500 italic text-sm">Aún no hay datos de progreso del equipo disponibles.</p>
        )}
      </div>
    </div>
  );
}
