import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Header } from "./components/Header";
import { TimeRegistrationForm } from "./components/TimeRegistrationForm";
import { RecentEntries } from "./components/RecentEntries";

export const RegisteraTidPage = (): JSX.Element => {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="Registrera tid" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Registrera tid</h1>
              <p className="text-[#666666]">Registrera arbetstid för kunder och aktiviteter</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Time Registration Form */}
              <div className="lg:col-span-2">
                <TimeRegistrationForm />
              </div>

              {/* Recent Entries */}
              <div className="lg:col-span-1">
                <RecentEntries />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};