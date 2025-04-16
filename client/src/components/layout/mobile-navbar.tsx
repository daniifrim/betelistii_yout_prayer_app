import { Link, useLocation } from "wouter";
import { Home, Calendar, BarChart3, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNavbar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 sm:hidden">
      <div className="grid grid-cols-4 h-16">
        <Link href="/"
          className={`flex flex-col items-center justify-center space-y-1 ${
            location === "/" ? "text-primary" : "text-gray-500"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Inicio</span>
        </Link>
        
        <Link href="/prayers"
          className={`flex flex-col items-center justify-center space-y-1 ${
            location === "/prayers" ? "text-primary" : "text-gray-500"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Oraciones</span>
        </Link>
        
        <Link href="/stats"
          className={`flex flex-col items-center justify-center space-y-1 ${
            location === "/stats" ? "text-primary" : "text-gray-500"
          }`}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-xs">Estadísticas</span>
        </Link>
        
        {user?.isAdmin && (
          <Link href="/admin"
            className={`flex flex-col items-center justify-center space-y-1 ${
              location === "/admin" ? "text-primary" : "text-gray-500"
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs">Admin</span>
          </Link>
        )}
        
        {!user?.isAdmin && (
          <div className="flex flex-col items-center justify-center space-y-1 text-gray-300">
            <Settings className="h-5 w-5" />
            <span className="text-xs">Perfil</span>
          </div>
        )}
      </div>
    </div>
  );
}