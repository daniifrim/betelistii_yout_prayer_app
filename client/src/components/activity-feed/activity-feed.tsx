import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, User } from "@shared/schema";
import { formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MessageSquare, 
  Clock, 
  Award, 
  UserCheck, 
  Heart, 
  AlertCircle, 
  Users,
  BookOpen,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ActivityFeed() {
  const { data: activities, isLoading, error } = useQuery<Activity[]>({
    queryKey: ["/api/activities/recent"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Get user name by ID
  const getUserName = (userId: number) => {
    if (!users) return "Usuario";
    const user = users.find(u => u.id === userId);
    return user?.name || "Usuario";
  };
  
  // Get user photo by ID
  const getUserPhoto = (userId: number) => {
    if (!users) return null;
    const user = users.find(u => u.id === userId);
    return user?.photoURL || null;
  };

  // Get user initials for avatar fallback
  const getUserInitials = (userId: number) => {
    const name = getUserName(userId);
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // Format relative time in Spanish
  const formatRelativeTime = (timestamp: string | Date) => {
    try {
      const date = typeof timestamp === 'string' ? parseISO(timestamp) : timestamp;
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: es
      });
    } catch (e) {
      return "Hace un momento";
    }
  };

  // Render activity icon based on type
  const renderActivityIcon = (type: string) => {
    switch (type) {
      case "prayer":
        return <BookOpen className="h-4 w-4" />;
      case "encouragement":
        return <Heart className="h-4 w-4" />;
      case "achievement":
        return <Award className="h-4 w-4" />;
      case "streak":
        return <Clock className="h-4 w-4" />;
      case "join":
        return <UserCheck className="h-4 w-4" />;
      case "intention":
        return <AlertCircle className="h-4 w-4" />;
      case "intention_join":
        return <Users className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  // Get badge color based on activity type
  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case "prayer":
        return "bg-primary/10 hover:bg-primary/20 text-primary";
      case "encouragement":
        return "bg-pink-100 hover:bg-pink-200 text-pink-800";
      case "achievement":
        return "bg-yellow-100 hover:bg-yellow-200 text-yellow-800";
      case "streak":
        return "bg-indigo-100 hover:bg-indigo-200 text-indigo-800";
      case "join":
        return "bg-green-100 hover:bg-green-200 text-green-800";
      case "intention":
        return "bg-red-100 hover:bg-red-200 text-red-800";
      case "intention_join":
        return "bg-purple-100 hover:bg-purple-200 text-purple-800";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary/70" />
        </CardContent>
      </Card>
    );
  }

  if (error || !activities) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-md">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-gray-500">
            No se pudo cargar la actividad reciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Actividad Reciente</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <ScrollArea className="h-[350px] px-6">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-sm text-gray-500 py-8">
                No hay actividad reciente.
              </p>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="flex gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={getUserPhoto(activity.userId) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getUserInitials(activity.userId)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{getUserName(activity.userId)}</span>
                      <Badge 
                        variant="secondary" 
                        className={`${getActivityBadgeColor(activity.type)} text-xs font-normal`}
                      >
                        <span className="mr-1">
                          {renderActivityIcon(activity.type)}
                        </span>
                        {activity.type === "prayer" && "Oró"}
                        {activity.type === "encouragement" && "Envió aliento"}
                        {activity.type === "achievement" && "Logro desbloqueado"}
                        {activity.type === "streak" && "Racha activa"}
                        {activity.type === "join" && "Se unió"}
                        {activity.type === "intention" && "Nueva intención"}
                        {activity.type === "intention_join" && "Se unió a intención"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      {activity.content}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}