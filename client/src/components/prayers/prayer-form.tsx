import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function PrayerForm() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const addPrayerMutation = useMutation({
    mutationFn: async (data: { date: string; notes: string }) => {
      const res = await apiRequest("POST", "/api/prayers", {
        date: data.date,
        completed: true,
        notes: data.notes
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prayers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/team"] });
      toast({
        title: "Oración agregada",
        description: "Tus notas de oración han sido guardadas."
      });
      setNotes(""); // Clear the notes field after successful submission
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron guardar las notas de oración.",
        variant: "destructive"
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPrayerMutation.mutate({ date, notes });
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Agregar Notas de Oración</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="prayer-date">Fecha</Label>
            <Input
              type="date"
              id="prayer-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              className="mt-1"
            />
          </div>
          <div className="mb-4">
            <Label htmlFor="prayer-notes">Notas</Label>
            <Textarea
              id="prayer-notes"
              rows={4}
              placeholder="Ingresa notas de oración o intenciones..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={addPrayerMutation.isPending}
            >
              {addPrayerMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar Notas de Oración
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
