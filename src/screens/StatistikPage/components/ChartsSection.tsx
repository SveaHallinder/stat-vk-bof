import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "../../../components/ui/toggle-group";

interface ChartsSectionProps {
  selectedPeriod: string;
  selectedUnit: string;
  selectedCategory: string;
}

export const ChartsSection = ({ selectedPeriod, selectedUnit, selectedCategory }: ChartsSectionProps): JSX.Element => {
  // Sample chart data
  const monthlyData = [
    { month: "Jan", cases: 45, customers: 180, hours: 320 },
    { month: "Feb", cases: 52, customers: 195, hours: 380 },
    { month: "Mar", cases: 48, customers: 210, hours: 420 },
    { month: "Apr", cases: 55, customers: 225, hours: 450 },
    { month: "Maj", cases: 60, customers: 240, hours: 480 },
    { month: "Jun", cases: 58, customers: 246, hours: 510 },
  ];

  const categoryData = [
    { category: "Hemtjänst", value: 35, color: "#17694c" },
    { category: "Boende", value: 25, color: "#22c55e" },
    { category: "Personlig assistans", value: 20, color: "#3b82f6" },
    { category: "Dagverksamhet", value: 15, color: "#f59e0b" },
    { category: "Övrigt", value: 5, color: "#6b7280" },
  ];

  const workloadData = [
    { caseworker: "Maria Andersson", cases: 18, hours: 145 },
    { caseworker: "Erik Johansson", cases: 16, hours: 128 },
    { caseworker: "Anna Petersson", cases: 14, hours: 112 },
    { caseworker: "Lars Nilsson", cases: 12, hours: 96 },
    { caseworker: "Sara Lindberg", cases: 15, hours: 120 },
  ];

  return (
    <div className="space-y-8">
      {/* Monthly Trends Chart */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl text-[#333333] font-bold">
              Månadsvis utveckling
            </CardTitle>
            <ToggleGroup type="single" defaultValue="cases" className="flex items-center gap-2">
              <ToggleGroupItem
                value="cases"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Ärenden
              </ToggleGroupItem>
              <ToggleGroupItem
                value="customers"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Kunder
              </ToggleGroupItem>
              <ToggleGroupItem
                value="hours"
                className="px-4 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-sm font-medium"
              >
                Timmar
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-80">
            {/* Y-axis */}
            <div className="flex flex-col justify-between items-end pr-4 py-4 w-16">
              <span className="text-sm text-[#666666]">60</span>
              <span className="text-sm text-[#666666]">45</span>
              <span className="text-sm text-[#666666]">30</span>
              <span className="text-sm text-[#666666]">15</span>
              <span className="text-sm text-[#666666]">0</span>
            </div>

            {/* Chart bars */}
            <div className="flex-1 flex items-end justify-around gap-4 border-l border-gray-200 pl-4">
              {monthlyData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <span className="text-sm text-[#666666] font-medium">
                    {item.cases}
                  </span>
                  <div
                    className="w-16 bg-[#17694c] rounded-t-md transition-all duration-300 hover:bg-[#17694c]/80"
                    style={{ height: `${(item.cases / 60) * 280}px` }}
                  />
                  <span className="text-sm text-[#666666]">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Distribution */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-[#333333] font-bold">
              Fördelning per kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-[#333333]">{item.category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${item.value}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#666666] w-8">
                      {item.value}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Workload Distribution */}
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardHeader>
            <CardTitle className="text-xl text-[#333333] font-bold">
              Arbetsbelastning per handläggare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workloadData.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#333333]">
                      {item.caseworker}
                    </span>
                    <div className="flex items-center gap-4 text-xs text-[#666666]">
                      <span>{item.cases} ärenden</span>
                      <span>{item.hours}h</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#17694c] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.cases / 20) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <CardTitle className="text-xl text-[#333333] font-bold">
            Prestationsmått
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#666666]">Mått</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#666666]">Aktuell period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#666666]">Föregående period</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#666666]">Förändring</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-[#666666]">Målvärde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 text-sm text-[#333333]">Genomsnittlig handläggningstid</td>
                  <td className="py-3 px-4 text-sm text-[#333333]">18 dagar</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">21 dagar</td>
                  <td className="py-3 px-4 text-sm text-green-600">-3 dagar</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">≤ 20 dagar</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-[#333333]">Kundnöjdhet</td>
                  <td className="py-3 px-4 text-sm text-[#333333]">4.2/5</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">3.9/5</td>
                  <td className="py-3 px-4 text-sm text-green-600">+0.3</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">≥ 4.0</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-[#333333]">Andel i tid</td>
                  <td className="py-3 px-4 text-sm text-[#333333]">87%</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">82%</td>
                  <td className="py-3 px-4 text-sm text-green-600">+5%</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">≥ 85%</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-sm text-[#333333]">Återkopplingstid</td>
                  <td className="py-3 px-4 text-sm text-[#333333]">2.1 dagar</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">2.8 dagar</td>
                  <td className="py-3 px-4 text-sm text-green-600">-0.7 dagar</td>
                  <td className="py-3 px-4 text-sm text-[#666666]">≤ 3 dagar</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};