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
            
            {/* User info and logout */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logga ut
              </Button>
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
