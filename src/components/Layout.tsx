import React from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/screens/DashboardRedesign/components/Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
        <header className="flex h-24 items-center justify-between bg-white/95 px-6">
        <div className="max-w-5xl flex flex-row justify-between items-center mx-auto w-full">
          <div>
            <h1 className="text-h2 font-light text-gray-800">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <GlobalSearch onResultSelect={handleSearchResult} />
            
            {/* User profile section */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/min-profil')}
                className="group flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                  <User className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-left">
                  <div className="text-body-small font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                    {user?.name}
                  </div>
                  <div className="text-sm capitalize">
                    {user?.role === 'handler' ? 'Behandlare' : user?.role === 'admin' ? 'Administratör' : user?.role}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
