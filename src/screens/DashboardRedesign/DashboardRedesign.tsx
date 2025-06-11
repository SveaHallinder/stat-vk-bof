import React from "react";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { MainContent } from "./components/MainContent";
import { RightSidebar } from "./components/RightSidebar";

export const DashboardRedesign = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex flex-1 gap-6 p-6">
          {/* Main Dashboard Content */}
          <MainContent />
          
          {/* Right Sidebar */}
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};