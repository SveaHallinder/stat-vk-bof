import { Bell, Search } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
}

export const Header = ({ title }: HeaderProps): JSX.Element => {
  const userData = {
    name: "Anna",
    date: "Tisdag, 25 mars 2025",
  };

  return (
    <header className="flex h-20 items-center justify-between border-b border-gray-200 bg-white px-8">
      <div>
        <h1 className="text-2xl font-light">{title}</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={22} />
          <Input
            className="w-64 pl-12 pr-4 py-2 h-11 rounded-full border-2 border-gray-200 text-base placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
            placeholder="Sök kund..."
          />
        </div>

        <Avatar className="w-10 h-10 bg-[#e0e0e0]">
          <AvatarFallback className="text-base text-[#666666] font-semibold">
            A
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
};