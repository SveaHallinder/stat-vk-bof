import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Header } from "./components/Header";
import { CustomerTable } from "./components/CustomerTable";
import { FilterBar } from "./components/FilterBar";

export const KunderPage = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("alla");

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="Kunder" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Kunder</h1>
              <p className="text-[#666666]">Hantera och visa alla dina kunder</p>
            </div>

            {/* Filter Bar */}
            <FilterBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
            />

            {/* Customer Table */}
            <CustomerTable 
              searchTerm={searchTerm}
              selectedFilter={selectedFilter}
            />
          </div>
        </div>
      </div>
    </div>
  );
};