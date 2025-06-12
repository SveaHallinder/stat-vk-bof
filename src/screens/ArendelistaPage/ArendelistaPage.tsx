import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Header } from "./components/Header";
import { CaseTable } from "./components/CaseTable";
import { FilterBar } from "./components/FilterBar";

export const ArendelistaPage = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("alla");
  const [selectedStatus, setSelectedStatus] = useState("alla");

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="Ärendelista" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Ärendelista</h1>
              <p className="text-[#666666]">Hantera och följ upp alla ärenden</p>
            </div>

            {/* Filter Bar */}
            <FilterBar 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedFilter={selectedFilter}
              setSelectedFilter={setSelectedFilter}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />

            {/* Case Table */}
            <CaseTable 
              searchTerm={searchTerm}
              selectedFilter={selectedFilter}
              selectedStatus={selectedStatus}
            />
          </div>
        </div>
      </div>
    </div>
  );
};