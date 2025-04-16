import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "@shared/schema";
import { Loader2, Quote as QuoteIcon } from "lucide-react";

export default function DailyQuote() {
  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: ["/api/quotes/today"],
  });

  if (isLoading) {
    return (
      <Card className="mb-6 border-primary/20">
        <CardContent className="py-5 flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 overflow-hidden">
      <div className="bg-primary/5 py-2 px-4 border-b border-primary/10">
        <div className="flex items-center gap-2">
          <QuoteIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-primary">Inspiración diaria</h3>
        </div>
      </div>
      <CardContent className="py-5 px-6">
        <p className="text-gray-800 text-lg font-medium mb-3 leading-relaxed">
          "{quote?.text}"
        </p>
        {quote?.author && (
          <p className="text-gray-500 text-sm italic text-right">
            — {quote.author}
          </p>
        )}
      </CardContent>
    </Card>
  );
}