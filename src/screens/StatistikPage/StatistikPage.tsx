import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Header } from "./components/Header";
import { StatsOverview } from "./components/StatsOverview";
import { ChartsSection } from "./components/ChartsSection";
import { FilterBar } from "./components/FilterBar";

export const StatistikPage = (): JSX.Element => {
  const [selectedPeriod, setSelectedPeriod] = useState("2025");
  const [selectedUnit, setSelectedUnit] = useState("alla");
  const [selectedCategory, setSelectedCategory] = useState("alla");

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="Statistik" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Statistik</h1>
              <p className="text-[#666666]">Översikt och analys av verksamhetsdata</p>
            </div>

            {/* Filter Bar */}
            <FilterBar 
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />

            {/* Stats Overview */}
            <StatsOverview 
              selectedPeriod={selectedPeriod}
              selectedUnit={selectedUnit}
              selectedCategory={selectedCategory}
            />

            {/* Charts Section */}
            <ChartsSection 
              selectedPeriod={selectedPeriod}
              selectedUnit={selectedUnit}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
      </div>
    </div>
  );
};