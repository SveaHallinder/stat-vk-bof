import React from "react";
import { Card, CardContent } from "../../../components/ui/card";
import { UsersIcon, ClockIcon, TrendingUpIcon, FileTextIcon, AlertCircleIcon, CheckCircleIcon } from "lucide-react";

interface StatsOverviewProps {
  selectedPeriod: string;
  selectedUnit: string;
  selectedCategory: string;
}

export const StatsOverview = ({ selectedPeriod, selectedUnit, selectedCategory }: StatsOverviewProps): JSX.Element => {
  // Sample stats data that would change based on filters
  const stats = [
    {
      title: "Totalt antal kunder",
      value: "246",
      change: "+12%",
      changeType: "positive",
      icon: UsersIcon,
      description: "Jämfört med föregående period",
    },
    {
      title: "Aktiva ärenden",
      value: "89",
      change: "+5%",
      changeType: "positive",
      icon: FileTextIcon,
      description: "Pågående handläggning",
    },
    {
      title: "Genomsnittlig handläggningstid",
      value: "18 dagar",
      change: "-3 dagar",
      changeType: "positive",
      icon: ClockIcon,
      description: "Förbättring från förra månaden",
    },
    {
      title: "Avslutade ärenden",
      value: "156",
      change: "+8%",
      changeType: "positive",
      icon: CheckCircleIcon,
      description: "Under vald period",
    },
    {
      title: "Försenade ärenden",
      value: "12",
      change: "-4",
      changeType: "positive",
      icon: AlertCircleIcon,
      description: "Minskning från förra månaden",
    },
    {
      title: "Nöjdhetsindex",
      value: "4.2/5",
      change: "+0.3",
      changeType: "positive",
      icon: TrendingUpIcon,
      description: "Baserat på kundenkäter",
    },
  ];

  const getChangeColor = (changeType: string) => {
    return changeType === "positive" ? "text-green-600" : "text-red-600";
  };

  const getChangeIcon = (changeType: string) => {
    return changeType === "positive" ? "↗" : "↘";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="bg-white shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-[#17694c]/10 rounded-lg">
                      <IconComponent className="w-5 h-5 text-[#17694c]" />
                    </div>
                    <div className="text-sm font-medium text-[#666666]">
                      {stat.title}
                    </div>
                  </div>
                  
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-[#333333] mb-1">
                      {stat.value}
                    </div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${getChangeColor(stat.changeType)}`}>
                      <span>{getChangeIcon(stat.changeType)}</span>
                      {stat.change}
                    </div>
                  </div>
                  
                  <div className="text-xs text-[#888888]">
                    {stat.description}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};