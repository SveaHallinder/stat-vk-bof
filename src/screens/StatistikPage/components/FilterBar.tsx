import React from "react";
import { Button } from "../../../components/ui/button";
import { FilterIcon, CalendarIcon } from "lucide-react";

interface FilterBarProps {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const FilterBar = ({ 
  selectedPeriod, 
  setSelectedPeriod, 
  selectedUnit, 
  setSelectedUnit,
  selectedCategory,
  setSelectedCategory
}: FilterBarProps): JSX.Element => {
  const periods = [
    { id: "2025", label: "2025" },
    { id: "2024", label: "2024" },
    { id: "q1-2025", label: "Q1 2025" },
    { id: "mars-2025", label: "Mars 2025" },
  ];

  const units = [
    { id: "alla", label: "Alla enheter" },
    { id: "bistand", label: "Biståndsbedömda" },
    { id: "forebyggande", label: "Förebyggande" },
    { id: "familj", label: "Familj & barn" },
  ];

  const categories = [
    { id: "alla", label: "Alla kategorier" },
    { id: "hemtjanst", label: "Hemtjänst" },
    { id: "boende", label: "Boende" },
    { id: "personlig-assistans", label: "Personlig assistans" },
    { id: "dagverksamhet", label: "Dagverksamhet" },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center gap-4 mb-4">
        <FilterIcon className="w-5 h-5 text-[#666666]" />
        <span className="text-lg font-semibold text-[#333333]">Filter</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Period Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-[#666666]" />
            <span className="text-sm font-medium text-[#666666]">Tidsperiod</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {periods.map((period) => (
              <Button
                key={period.id}
                variant={selectedPeriod === period.id ? "default" : "outline"}
                onClick={() => setSelectedPeriod(period.id)}
                size="sm"
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedPeriod === period.id
                    ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                    : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Unit Selection */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-[#666666]">Enhet</span>
          <div className="flex flex-wrap gap-2">
            {units.map((unit) => (
              <Button
                key={unit.id}
                variant={selectedUnit === unit.id ? "default" : "outline"}
                onClick={() => setSelectedUnit(unit.id)}
                size="sm"
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedUnit === unit.id
                    ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                    : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {unit.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-3">
          <span className="text-sm font-medium text-[#666666]">Kategori</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                size="sm"
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                    : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};