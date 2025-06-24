import React from "react";
import { Sidebar } from "../screens/DashboardRedesign/components/Sidebar";
import { Header } from "../screens/DashboardRedesign/components/Header";

interface LayoutProps {
  children: React.ReactNode;
  activeItem: string;
  title: string;
}

export const Layout = ({ children, activeItem, title }: LayoutProps): JSX.Element => {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem={activeItem} />
      <div className="flex-1 flex flex-col">
        <Header title={title} />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}; 