import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./globals.css";
import { DashboardRedesign } from "./screens/DashboardRedesign";
import { KunderPage, CustomerProfile } from "./screens/KunderPage";
import { RegisteraTidPage } from "./screens/RegisteraTidPage";
import { ArendelistaPage } from "./screens/ArendelistaPage";
import { StatistikPage } from "./screens/StatistikPage";
import { AdminPage } from "./screens/AdminPage";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardRedesign />} />
        <Route path="/kunder" element={<KunderPage />} />
        <Route path="/kunder/:id" element={<CustomerProfile />} />
        <Route path="/registrera-tid" element={<RegisteraTidPage />} />
        <Route path="/arendelista" element={<ArendelistaPage />} />
        <Route path="/statistik" element={<StatistikPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);