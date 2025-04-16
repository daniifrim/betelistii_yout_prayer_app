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
      <Card className="mb-6">
        <CardContent className="py-4 flex justify-center items-center h-36">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="py-4 px-5">
        <div className="flex space-x-3">
          <div className="flex-shrink-0 mt-1">
            <QuoteIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-gray-800 text-lg font-medium mb-2">{quote?.text}</p>
            <p className="text-gray-500 text-sm italic text-right">— {quote?.author}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}