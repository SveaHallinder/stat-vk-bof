import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Header } from "./components/Header";
import { UserManagement } from "./components/UserManagement";
import { SystemSettings } from "./components/SystemSettings";
import { AuditLog } from "./components/AuditLog";
import { AdminTabs } from "./components/AdminTabs";

export const AdminPage = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      {/* Left Sidebar */}
      <Sidebar activeItem="Admin" />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Page Title */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-[#333333] mb-2">Administration</h1>
              <p className="text-[#666666]">Hantera användare, system och säkerhet</p>
            </div>

            {/* Admin Tabs */}
            <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Tab Content */}
            <div className="mt-6">
              {activeTab === "users" && <UserManagement />}
              {activeTab === "settings" && <SystemSettings />}
              {activeTab === "audit" && <AuditLog />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};