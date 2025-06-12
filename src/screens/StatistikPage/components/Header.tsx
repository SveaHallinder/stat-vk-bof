import { SearchIcon, DownloadIcon } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";

export const Header = (): JSX.Element => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - empty for now */}
        <div></div>

        {/* Right side - Export and profile */}
        <div className="flex items-center gap-4">
          <Button className="bg-[#17694c] hover:bg-[#17694c]/90 text-white px-6 py-2 rounded-lg flex items-center gap-2">
            <DownloadIcon className="w-4 h-4" />
            Exportera rapport
          </Button>

          <div className="relative">
            <Input
              className="w-96 pl-4 pr-12 py-2 h-11 rounded-full border-2 border-gray-200 text-base placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
              placeholder="Sök statistik..."
            />
            <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
          </div>

          <Avatar className="w-12 h-12 bg-[#e0e0e0]">
            <AvatarFallback className="text-xl text-[#666666] font-semibold">
              A
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};