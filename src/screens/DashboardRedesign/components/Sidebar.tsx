import { Link, useLocation } from "react-router-dom";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export const Sidebar = (): JSX.Element => {
  const location = useLocation();

  const navItems = [
    { id: 1, name: "Startsida", path: "/", active: location.pathname === "/" },
    { id: 2, name: "Kunder", path: "/kunder", active: location.pathname === "/kunder" },
    { id: 3, name: "Registrera tid", path: "/registrera-tid", active: location.pathname === "/registrera-tid" },
    { id: 4, name: "Ärendelista", path: "/arendelista", active: location.pathname === "/arendelista" },
    { id: 5, name: "Statistik", path: "/statistik", active: location.pathname === "/statistik" },
    { id: 6, name: "Admin", path: "/admin", active: location.pathname === "/admin" },
  ];

  return (
    <aside className="w-[280px] bg-[#17694c] flex flex-col h-screen sticky top-0">
      <div className="flex flex-col items-center gap-12 p-8 flex-1">
        {/* Logo and title section */}
        <div className="flex flex-col items-center">
          <Avatar className="w-20 h-20 bg-white/10">
            <AvatarImage src="/vector-15.svg" alt="Vallentuna logo" />
            <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">
              VA
            </AvatarFallback>
          </Avatar>
          <h2 className="font-light text-white text-2xl mt-4 font-['Arial-Bold',Helvetica]">
            Vallentuna
          </h2>
          <p className="font-normal text-white/80 text-base font-['Arial-Regular',Helvetica]">
            Biståndsbedömda
          </p>
        </div>

        {/* Navigation menu */}
        <nav className="flex flex-col w-full gap-2">
          {navItems.map((item) => (
            <Link key={item.id} to={item.path}>
              <Button
                variant="ghost"
                className={`w-full h-12 flex items-center justify-start px-6 text-lg font-['Arial-${
                  item.active ? "Bold" : "Regular"
                }',Helvetica] ${
                  item.active
                    ? "bg-white text-[#17694c] font-bold shadow-sm"
                    : "bg-transparent text-white font-normal hover:bg-white/10"
                } rounded-lg transition-all duration-200`}
              >
                {item.name}
              </Button>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer link */}
      <div className="p-8">
        <Button
          variant="link"
          className="text-white text-lg font-['Arial-Regular',Helvetica] p-0 hover:text-white/80"
        >
          Till Förebyggande →
        </Button>
      </div>
    </aside>
  );
};
