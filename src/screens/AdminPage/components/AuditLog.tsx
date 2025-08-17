import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FilterIcon, SearchIcon } from "lucide-react";

export const AuditLog = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");

  // Placeholder för framtida auditlogg-data
  const auditLogs = [];

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <FilterIcon className="w-5 h-5 text-[#666666]" />
              <span className="text-lg font-semibold text-[#333333]">Granskningslogg</span>
            </div>
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 pl-4 pr-12 py-2 h-10 rounded-lg border border-gray-300 text-sm placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
                placeholder="Sök i loggarna..."
              />
              <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          {/* Komponent redo för framtida loggdata */}
          <div className="text-sm text-[#666666]">Ingen data att visa just nu.</div>
        </CardContent>
      </Card>
    </div>
  );
};