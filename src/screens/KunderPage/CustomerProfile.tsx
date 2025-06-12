import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { useNavigate } from "react-router-dom";

const mockCustomer = {
  id: "1",
  initials: "AL",
  name: "AL - Flicka (2007)",
  gender: "Flicka",
  birthYear: "2007",
  startDate: "2025-03-25",
  lastVisit: "2025-04-15",
  status: "Aktiv",
};

const mockEfforts = [
  { name: "Repulse", start: "25 mars 2025", handlers: ["Anna L", "Jessica S"] },
  { name: "Samverkan", start: "2 april 2025", handlers: ["Anna L", "Malin K"] },
];

const mockVisits = [
  { date: "26 april 2025, 13:00-14:00", effort: "Repulse (Återbesök)", handler: "Anna L" },
  { date: "3 maj 2025, 10:00-11:00", effort: "Samverkan (Uppföljning)", handler: "Malin K" },
];

export const CustomerProfile = () => {
  const [customer] = useState(mockCustomer);
  const [efforts] = useState(mockEfforts);
  const [visits] = useState(mockVisits);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Kunder" />
      <div className="flex-1 flex flex-col px-12 pt-10 pb-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button className="px-4 py-2 rounded-full border border-gray-300 text-[#17694c] bg-white font-semibold hover:bg-gray-50 transition" onClick={() => navigate('/kunder')}>← Tillbaka</button>
          <h2 className="text-2xl font-bold text-[#333] flex items-center gap-3">
            {customer.name}
            <span className="ml-2 px-3 py-1 rounded-full bg-[#eaf6f1] text-[#17694c] text-sm font-semibold">{customer.status}</span>
          </h2>
        </div>
        {/* Kunduppgifter */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 flex items-center justify-between">
          <div className="flex flex-col gap-1 text-lg">
            <div><span className="font-semibold">ID:</span> #{customer.id}</div>
            <div><span className="font-semibold">Initialer:</span> {customer.initials}</div>
            <div><span className="font-semibold">Kön:</span> {customer.gender}</div>
            <div><span className="font-semibold">Födelsedatum:</span> {customer.birthYear}</div>
            <div><span className="font-semibold">Startdatum:</span> {customer.startDate}</div>
            <div><span className="font-semibold">Senaste besök:</span> {customer.lastVisit}</div>
          </div>
          <button className="bg-[#17694c] text-white font-semibold px-6 py-2 rounded-full text-lg hover:bg-[#145c41] transition">Redigera</button>
        </div>
        {/* Aktiva insatser */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#17694c]">Aktiva insatser</h3>
            <button className="bg-[#17694c] text-white font-semibold px-5 py-2 rounded-full text-base hover:bg-[#145c41] transition">+ Ny insats</button>
          </div>
          <div className="flex flex-col gap-4">
            {efforts.map((eff, idx) => (
              <div key={idx} className="flex items-center justify-between bg-[#f6fbf9] rounded-lg px-6 py-4">
                <div>
                  <div className="font-bold text-[#17694c] text-lg">{eff.name}</div>
                  <div className="text-[#666] text-sm">Startdatum: {eff.start}</div>
                  <div className="text-[#666] text-sm">Behandlare: {eff.handlers.join(", ")}</div>
                </div>
                <button className="text-[#888] text-2xl font-bold">⋯</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 