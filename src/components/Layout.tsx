import React from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/screens/DashboardRedesign/components/Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps): JSX.Element => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSearchResult = (result: any) => {
    console.log("Valt sökresultat:", result);
    
    // Navigera till befintliga sidor baserat på resultattyp
    switch (result.type) {
      case 'customer':
        // Navigera till kundersida
        navigate('/kunder');
        break;
      case 'handler':
        // Navigera till min profil-sida för vanliga behandlare
        navigate('/min-profil');
        break;
      case 'effort':
        // Navigera till admin-sida (där insatser hanteras)
        navigate('/admin');
        break;
      case 'case':
        // Navigera till ärendelista
        navigate('/arendelista');
        break;
      case 'shift':
        // Navigera till tidregistrering
        navigate('/registrera-tid');
        break;
      default:
        console.warn('Okänd resultattyp:', result.type);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Custom header med global sökning */}
        <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
          <div>
            <h1 className="text-2xl font-light">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch onResultSelect={handleSearchResult} />
            
            {/* User profile section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/min-profil')}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {user?.role === 'handler' ? 'Behandlare' : user?.role === 'admin' ? 'Administratör' : user?.role}
                  </div>
                </div>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
