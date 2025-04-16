import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, Flame } from "lucide-react";

interface MemberCardProps {
  member: {
    userId: number;
    name: string;
    percentage: number;
    streak: number;
    totalCompleted: number;
  };
}

export default function MemberCard({ member }: MemberCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{member.name}</h3>
          <span className="text-lg font-semibold text-primary">{member.percentage}%</span>
        </div>
        
        <Progress value={member.percentage} className="h-2 mb-4" />
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Flame className="h-4 w-4 text-orange-500" /> 
            <span>{member.streak} días</span>
          </div>
          
          <div className="flex items-center gap-1">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{member.totalCompleted} oraciones</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}