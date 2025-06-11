import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ClockIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";

export const RecentEntries = (): JSX.Element => {
  const recentEntries = [
    {
      id: 1,
      customer: "AL - Anna Larsson",
      date: "2025-03-25",
      time: "09:15 - 10:30",
      duration: "1h 15m",
      activity: "Hembesök",
      description: "Uppföljning av tidigare insats...",
    },
    {
      id: 2,
      customer: "BN - Benjamin Nilsson",
      date: "2025-03-24",
      time: "14:00 - 15:00",
      duration: "1h 0m",
      activity: "Telefonkontakt",
      description: "Kontroll av nuvarande situation...",
    },
    {
      id: 3,
      customer: "CL - Clara Lindberg",
      date: "2025-03-24",
      time: "10:30 - 11:45",
      duration: "1h 15m",
      activity: "Möte",
      description: "Planering av kommande insatser...",
    },
    {
      id: 4,
      customer: "DM - David Månsson",
      date: "2025-03-23",
      time: "13:00 - 14:30",
      duration: "1h 30m",
      activity: "Utredning",
      description: "Genomgång av dokumentation...",
    },
  ];

  const getTodaysTotal = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntries = recentEntries.filter(entry => entry.date === today);
    
    let totalMinutes = 0;
    todaysEntries.forEach(entry => {
      const [hours, minutes] = entry.duration.replace('h', '').replace('m', '').split(' ');
      totalMinutes += parseInt(hours) * 60 + parseInt(minutes);
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <Card className="bg-[#17694c]/5 border border-[#17694c]/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#17694c] font-medium">Idag totalt</div>
              <div className="text-2xl font-bold text-[#17694c]">{getTodaysTotal()}</div>
            </div>
            <ClockIcon className="w-8 h-8 text-[#17694c]" />
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-[#333333] font-bold">
            Senaste registreringar
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {recentEntries.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 hover:bg-gray-50 transition-colors ${
                  index !== recentEntries.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-[#333333] text-sm mb-1">
                      {entry.customer}
                    </div>
                    <div className="text-xs text-[#666666] mb-2">
                      {entry.date} • {entry.time}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#17694c]/10 text-[#17694c] px-2 py-1 rounded text-xs font-medium">
                        {entry.activity}
                      </span>
                      <span className="text-xs text-[#666666] font-medium">
                        {entry.duration}
                      </span>
                    </div>
                    <div className="text-xs text-[#888888] line-clamp-2">
                      {entry.description}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-600"
                      title="Visa detaljer"
                    >
                      <EyeIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-green-50 hover:text-green-600"
                      title="Redigera"
                    >
                      <EditIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Ta bort"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <Button
              variant="ghost"
              className="w-full text-sm text-[#17694c] hover:bg-[#17694c]/5"
            >
              Visa alla registreringar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};