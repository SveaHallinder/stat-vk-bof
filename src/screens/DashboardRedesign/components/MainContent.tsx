import { PlusIcon } from "lucide-react";
import React from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../components/ui/toggle-group";

export const MainContent = (): JSX.Element => {
  const statsCards = [
    {
      title: "Kunder totalt",
      value: "46",
      note: "2025 siffror för hela enheten",
    },
    {
      title: "Aktiva insatser",
      value: "3",
      note: "2025 siffror",
    },
    {
      title: "Månadens besök",
      value: "124",
      note: "",
    },
  ];

  const quickActions = [
    { label: "Lägg till kund" },
    { label: "Registrera tid" },
    { label: "Ta ut statistik" },
  ];

  const chartData = [
    { week: "V. 9", value: 18 },
    { week: "V. 10", value: 22 },
    { week: "V. 11", value: 27 },
    { week: "V. 12", value: 22 },
    { week: "V. 13", value: 18 },
    { week: "V. 14", value: 24 },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <div className="flex flex-col h-32 justify-between">
                <div>
                  <div className="text-[#888888] text-lg font-medium mb-2">
                    {stat.title}
                  </div>
                  <div className="text-[#333333] text-4xl font-bold">
                    {stat.value}
                  </div>
                </div>
                {stat.note && (
                  <div className="text-[#888888] text-sm">
                    {stat.note}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <h3 className="text-[#333333] text-xl font-bold mb-6">
            Snabbåtgärder
          </h3>
          <div className="flex gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="flex items-center gap-3 px-6 py-3 rounded-full border-2 border-[#17694c]/30 text-[#17694c] font-medium text-base hover:bg-[#17694c]/5 transition-colors duration-200"
              >
                <div className="flex items-center justify-center w-8 h-8 bg-[#17694c] rounded-full">
                  <PlusIcon className="h-4 w-4 text-white" />
                </div>
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visit Statistics Chart */}
      <Card className="bg-white shadow-sm border border-gray-200 flex-1">
        <CardContent className="p-6 h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[#333333] text-xl font-bold">
              Besöksstatistik (Mars)
            </h3>

            <ToggleGroup
              type="single"
              defaultValue="vecka"
              className="flex items-center gap-2"
            >
              <ToggleGroupItem
                value="dag"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Dag
              </ToggleGroupItem>
              <ToggleGroupItem
                value="vecka"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Vecka
              </ToggleGroupItem>
              <ToggleGroupItem
                value="månad"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Månad
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Chart Area */}
          <div className="flex h-64">
            {/* Y-axis */}
            <div className="flex flex-col justify-between items-end pr-4 py-4 w-16">
              <span className="text-sm text-[#666666] font-medium">Timmar</span>
              <span className="text-sm text-[#666666]">40</span>
              <span className="text-sm text-[#666666]">30</span>
              <span className="text-sm text-[#666666]">20</span>
              <span className="text-sm text-[#666666]">10</span>
              <span className="text-sm text-[#666666]">0</span>
            </div>

            {/* Chart bars */}
            <div className="flex-1 flex items-end justify-around gap-4 border-l border-gray-200 pl-4">
              {chartData.map((item, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-2"
                >
                  <span className="text-sm text-[#666666] font-medium">
                    {item.value}
                  </span>
                  <div
                    className="w-12 bg-[#17694c] rounded-t-md transition-all duration-300 hover:bg-[#17694c]/80"
                    style={{ height: `${(item.value / 40) * 200}px` }}
                  />
                  <span className="text-sm text-[#666666]">
                    {item.week}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};