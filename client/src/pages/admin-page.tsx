import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import UserManagement from "@/components/admin/user-management";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

export default function AdminPage() {
  const { user } = useAuth();
  
  // Redirect non-admin users
  if (user && !user.isAdmin) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
          
          <UserManagement />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
