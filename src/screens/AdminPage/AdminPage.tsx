import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { MoreHorizontal } from "lucide-react";

const insatserList = [
  { name: "Samtal", for: "Biståndsbedömda" },
  { name: "rePULSE", for: "Biståndsbedömda, Förebyggande" },
  { name: "Trappan", for: "Biståndsbedömda" },
  { name: "Hela Barn", for: "Biståndsbedömda" },
  { name: "KIBB", for: "Biståndsbedömda" },
  { name: "Ungdomstjänst/kontrakt", for: "Biståndsbedömda" },
  { name: "Familjesöd", for: "Förebyggande" },
  { name: "Övrig tid", for: "Biståndsbedömda" },
];

const behandlareList = [
  { name: "Anna M", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Karoline C", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Magnus S", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Oskar P", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
];

export const AdminPage = (): JSX.Element => {
  const [tab, setTab] = useState<"insatser" | "behandlare">("insatser");

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Admin" />
      <div className="flex-1 flex flex-col px-12 pt-10 pb-4">
        <h1 className="text-3xl font-bold text-[#333] mb-6">Admin</h1>
        {/* Flikar */}
        <div className="flex gap-2 mb-6">
          <button
            className={`px-6 py-2 rounded-full font-semibold text-lg transition ${tab === "insatser" ? "bg-[#17694c] text-white" : "bg-[#eaf6f1] text-[#17694c] hover:bg-[#d2ede1]"}`}
            onClick={() => setTab("insatser")}
          >
            Insatser
          </button>
          <button
            className={`px-6 py-2 rounded-full font-semibold text-lg transition ${tab === "behandlare" ? "bg-[#17694c] text-white" : "bg-[#eaf6f1] text-[#17694c] hover:bg-[#d2ede1]"}`}
            onClick={() => setTab("behandlare")}
          >
            Behandlare
          </button>
        </div>
        {/* Innehåll */}
        {tab === "insatser" && (
          <div className="bg-white rounded-2xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-[#17694c]">Lägg till ny insats</span>
              <button className="bg-[#17694c] text-white font-semibold px-5 py-2 rounded-full text-base hover:bg-[#145c41] transition">+</button>
            </div>
            <table className="w-full text-left">
              <thead className="bg-[#eaf6f1] text-[#17694c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Insats</th>
                  <th className="px-4 py-3 font-semibold">Tillgänglig för</th>
                  <th className="px-4 py-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {insatserList.map((i, idx) => (
                  <tr key={i.name + idx} className="border-b border-[#eaf6f1]">
                    <td className="px-4 py-2">{i.name}</td>
                    <td className="px-4 py-2">{i.for}</td>
                    <td className="px-4 py-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Åtgärder"><MoreHorizontal className="w-6 h-6 text-[#17694c]" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab === "behandlare" && (
          <div className="bg-white rounded-2xl shadow-md p-8">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xl font-bold text-[#17694c]">Lägg till ny behandlare</span>
              <button className="bg-[#17694c] text-white font-semibold px-5 py-2 rounded-full text-base hover:bg-[#145c41] transition">+</button>
            </div>
            <div className="text-lg font-semibold text-[#17694c] mb-2">Dina aktiva behandlare</div>
            <table className="w-full text-left">
              <thead className="bg-[#eaf6f1] text-[#17694c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Namn</th>
                  <th className="px-4 py-3 font-semibold">Mail</th>
                  <th className="px-4 py-3 font-semibold">Startdatum</th>
                  <th className="px-4 py-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {behandlareList.map((b, idx) => (
                  <tr key={b.name + idx} className="border-b border-[#eaf6f1]">
                    <td className="px-4 py-2">{b.name}</td>
                    <td className="px-4 py-2">{b.mail}</td>
                    <td className="px-4 py-2">{b.start}</td>
                    <td className="px-4 py-2">
                      <button className="p-1 hover:bg-gray-100 rounded" title="Åtgärder"><MoreHorizontal className="w-6 h-6 text-[#17694c]" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};