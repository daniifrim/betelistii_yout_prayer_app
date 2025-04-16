import { CalendarCheck, Flame, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsProps {
  stats: {
    streak: number;
    total: number;
    monthlyTotal: number;
  };
}

export default function QuickStats({ stats }: StatsProps) {
  return (
    <Card className="mb-8 border-primary/20 overflow-hidden">
      <div className="bg-primary/5 py-2 px-4 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-primary">Tus estadísticas</h3>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Racha */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 bg-amber-100 rounded-full p-2">
                <Flame className="h-5 w-5 text-amber-500" />
              </div>
              <h4 className="ml-3 text-sm font-medium text-gray-500">
                Racha actual
              </h4>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {stats.streak}
              </span>
              <span className="ml-2 text-sm text-gray-500">días</span>
            </div>
          </div>

          {/* Este mes */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <h4 className="ml-3 text-sm font-medium text-gray-500">
                Este mes
              </h4>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {stats.monthlyTotal}
              </span>
              <span className="ml-2 text-sm text-gray-500">oraciones</span>
            </div>
          </div>

          {/* Total oraciones */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                <CalendarCheck className="h-5 w-5 text-green-500" />
              </div>
              <h4 className="ml-3 text-sm font-medium text-gray-500">
                Total
              </h4>
            </div>
            <div className="flex items-baseline">
              <span className="text-2xl font-bold text-gray-900">
                {stats.total}
              </span>
              <span className="ml-2 text-sm text-gray-500">oraciones</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
