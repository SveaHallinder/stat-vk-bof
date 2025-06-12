import { SearchIcon } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Input } from "../../../components/ui/input";

export const Header = (): JSX.Element => {
  const userData = {
    name: "Anna",
    date: "Tisdag, 25 mars 2025",
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-8 py-8">
        {/* Welcome message */}
        <div>
          <h1 className="text-3xl font-bold text-[#333333]">Dashboard</h1>
          <div className="mt-1">
            <h2 className="text-gray-500 text-sm">
              Välkommen tillbaka, {userData.name}
            </h2>
            <p className="text-gray-400 text-xs">
              {userData.date}
            </p>
          </div>
        </div>

        {/* Search and profile */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Input
              className="w-64 pl-4 pr-12 py-2 h-11 rounded-full border-2 border-gray-200 text-base placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
              placeholder="Sök kund..."
            />
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>

          <Avatar className="w-10 h-10 bg-[#e0e0e0]">
            <AvatarFallback className="text-base text-[#666666] font-semibold">
              A
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};