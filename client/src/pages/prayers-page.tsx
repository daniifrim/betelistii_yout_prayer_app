import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import PrayerCalendar from "@/components/prayers/prayer-calendar";
import PrayerForm from "@/components/prayers/prayer-form";
import { useQuery } from "@tanstack/react-query";

export default function PrayersPage() {
  const { data: prayers } = useQuery({
    queryKey: ["/api/prayers"],
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <PrayerCalendar prayers={prayers || []} />
          
          <div className="mt-8">
            <PrayerForm />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
