import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Sidebar } from "@/screens/DashboardRedesign/components/Sidebar";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/contexts/AuthContext";
import { User, Menu } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

export const Layout = ({ children, title }: LayoutProps): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [fadeKey, setFadeKey] = useState(0);

  useEffect(() => {
    // Bump key på varje route‑byte för att trigga mjuk fade‑in
    setFadeKey(k => k + 1);
  }, [location.pathname]);

  const handleSearchResult = (result: any) => {
    switch (result.type) {
      case 'customer': {
        navigate(`/kunder/${result.id}`);
        break;
      }
      case 'handler': {
        if (user && user.id === result.id) navigate('/min-profil');
        else navigate(`/admin?handlerId=${result.id}`);
        break;
      }
      case 'effort': {
        navigate(`/admin?effortId=${result.id}`);
        break;
      }
      case 'case': {
        const c = result.data;
        if (c?.customer_id) navigate(`/kunder/${c.customer_id}?caseId=${result.id}`);
        else navigate('/arendelista');
        break;
      }
      case 'shift': {
        const s = result.data;
        if (s?.customer_id) navigate(`/kunder/${s.customer_id}?caseId=${s.case_id}`);
        else if (s?.case_id) navigate(`/arendelista?caseId=${s.case_id}`);
        else navigate('/registrera-tid');
        break;
      }
      default:
        console.warn('Okänd resultattyp:', result.type);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Desktop Sidebar - dold på mobil */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed left-0 top-0 h-full w-[300px] bg-[#17694c] z-50">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Custom header med global sökning */}
        <header className="flex h-24 items-center justify-between bg-white/95 px-4 lg:px-6">
          <div className="max-w-5xl flex flex-row justify-between items-center mx-auto w-full">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Öppna meny"
              >
                <Menu className="w-6 h-6 text-gray-600" />
              </button>
              
              <h1 className="text-h2 font-light text-gray-800">{title}</h1>
            </div>
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Global search - dold på små mobiler */}
              <div className="hidden sm:block">
                <GlobalSearch onResultSelect={handleSearchResult} />
              </div>
              
              {/* User profile section */}
              <div className="flex items-center gap-2 lg:gap-3">
                <button
                  onClick={() => navigate('/min-profil')}
                  className="group flex items-center gap-2 lg:gap-2.5 p-2 lg:p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200 hover:shadow-sm hover:border-gray-200"
                >
                  <div className="w-8 h-8 lg:w-9 lg:h-9 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                    <User className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-green-600" />
                  </div>
                  {/* User info - dold på små mobiler */}
                  <div className="hidden md:block text-left">
                    <div className="text-body-small font-semibold text-gray-900 group-hover:text-gray-800 transition-colors">
                      {user?.name}
                    </div>
                    <div className="text-sm capitalize">
                      {user?.role === 'handler' ? 'Behandlare' : user?.role === 'admin' ? 'Administratör' : user?.role}
                    </div>
                  </div>
                  <div className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6">
          <div key={fadeKey} className="max-w-6xl mx-auto route-fade">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
