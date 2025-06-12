import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";

const tabList = [
  { key: "anpassad", label: "Anpassad" },
  { key: "arsoversikt", label: "Årsöversikt" },
  { key: "insatser", label: "Insatser" },
  { key: "behandlare", label: "Behandlaröversikt" },
  { key: "avbokningar", label: "Avbokningar" },
];

const insatser = ["Alla", "Nybesök", "Repulse", "Uppföljning", "Föräldrarsamtal", "Telefonkontakt"];

export const StatistikPage = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState("anpassad");
  const [filters, setFilters] = useState({
    from: "",
    to: "",
    insats: "Alla",
    frekvens: "Per månad",
    kon: "",
    alder: "",
    bistand: "",
    gruppera: "Insatstyp",
    diagram: "Stapel",
  });

  // Dummydata för boxar och diagram
  const statistik = {
    besok: 1248,
    kunder: 142,
    tid: "45 min",
    avbokning: "18%",
    andelBistand: "45%",
  };
  const chartData = [
    { label: "Nybesök", besok: 320, kunder: 120 },
    { label: "Repulse", besok: 400, kunder: 142 },
    { label: "Uppföljning", besok: 220, kunder: 80 },
    { label: "Föräldrarsamtal", besok: 140, kunder: 60 },
    { label: "Telefonkontakt", besok: 90, kunder: 40 },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Statistik" />
      <div className="flex-1 flex flex-col px-12 pt-10 pb-4">
        <h1 className="text-3xl font-bold text-[#333] mb-6">Statistik</h1>
        {/* Flikar */}
        <div className="flex gap-2 mb-6">
          {tabList.map(tab => (
            <button
              key={tab.key}
              className={`px-6 py-2 rounded-full font-semibold text-lg transition ${activeTab === tab.key ? "bg-[#17694c] text-white" : "bg-[#eaf6f1] text-[#17694c] hover:bg-[#d2ede1]"}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Filterrad */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 flex flex-wrap gap-4 items-end">
          {activeTab === "anpassad" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Tidsperiod</label>
                <input type="date" className="border rounded px-3 py-2" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} placeholder="Från" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Till</label>
                <input type="date" className="border rounded px-3 py-2" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} placeholder="Till" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Insats</label>
                <select className="border rounded px-3 py-2" value={filters.insats} onChange={e => setFilters(f => ({ ...f, insats: e.target.value }))}>
                  {insatser.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Frekvens</label>
                <select className="border rounded px-3 py-2" value={filters.frekvens} onChange={e => setFilters(f => ({ ...f, frekvens: e.target.value }))}>
                  <option>Per månad</option>
                  <option>Per vecka</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Kön</label>
                <select className="border rounded px-3 py-2" value={filters.kon} onChange={e => setFilters(f => ({ ...f, kon: e.target.value }))}>
                  <option value="">Alla</option>
                  <option value="Kvinna">Kvinna</option>
                  <option value="Man">Man</option>
                  <option value="Annat">Annat</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Kund ålder</label>
                <input type="text" className="border rounded px-3 py-2" value={filters.alder} onChange={e => setFilters(f => ({ ...f, alder: e.target.value }))} placeholder="Ålder" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Gruppera efter</label>
                <select className="border rounded px-3 py-2" value={filters.gruppera} onChange={e => setFilters(f => ({ ...f, gruppera: e.target.value }))}>
                  <option>Insatstyp</option>
                  <option>Kön</option>
                  <option>Ålder</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Diagramtyp</label>
                <select className="border rounded px-3 py-2" value={filters.diagram} onChange={e => setFilters(f => ({ ...f, diagram: e.target.value }))}>
                  <option>Stapel</option>
                  <option>Linje</option>
                </select>
              </div>
              <button className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition mt-6">Tillämpa</button>
            </>
          )}
          {activeTab === "arsoversikt" && (
            <>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">År</label>
                <input type="text" className="border rounded px-3 py-2" placeholder="Välj" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Insats</label>
                <select className="border rounded px-3 py-2">
                  {insatser.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Kön</label>
                <select className="border rounded px-3 py-2">
                  <option value="">Alla</option>
                  <option value="Kvinna">Kvinna</option>
                  <option value="Man">Man</option>
                  <option value="Annat">Annat</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Ålder</label>
                <input type="text" className="border rounded px-3 py-2" placeholder="Välj" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-[#17694c]">Bistånd/Ej bistånd</label>
                <select className="border rounded px-3 py-2">
                  <option value="">Alla</option>
                  <option value="Bistånd">Bistånd</option>
                  <option value="Ej bistånd">Ej bistånd</option>
                </select>
              </div>
              <button className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition mt-6">Tillämpa</button>
            </>
          )}
        </div>
        {/* Statistikboxar */}
        <div className="flex gap-6 mb-8">
          <div className="flex-1 bg-[#eaf6f1] rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-[#17694c] text-lg font-semibold mb-1">Totalt antal besök</div>
            <div className="text-3xl font-bold">{statistik.besok.toLocaleString()}</div>
          </div>
          <div className="flex-1 bg-[#e3f0fa] rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-[#17694c] text-lg font-semibold mb-1">Antal kunder</div>
            <div className="text-3xl font-bold text-[#17694c]">{statistik.kunder}</div>
          </div>
          <div className="flex-1 bg-[#fff7e3] rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-[#e6a100] text-lg font-semibold mb-1">Genomsnittlig tid</div>
            <div className="text-3xl font-bold text-[#e6a100]">{statistik.tid}</div>
          </div>
          <div className="flex-1 bg-[#ffeaea] rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-[#e64a19] text-lg font-semibold mb-1">Avbokningsgrad</div>
            <div className="text-3xl font-bold text-[#e64a19]">{statistik.avbokning}</div>
          </div>
          {activeTab === "arsoversikt" && (
            <div className="flex-1 bg-[#fff7e3] rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-[#e6a100] text-lg font-semibold mb-1">Andel bistånd av alla besök</div>
              <div className="text-3xl font-bold text-[#e6a100]">{statistik.andelBistand}</div>
            </div>
          )}
        </div>
        {/* Diagram */}
        <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
          <div className="text-xl font-bold text-[#17694c] mb-4">Besök och kunder per insatstyp (2025)</div>
          <div className="flex gap-4 items-end h-64 mb-8">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div className="flex gap-1 mb-1">
                  <span className="text-[#17694c] font-bold">{item.besok}</span>
                  <span className="text-blue-500 font-bold">{item.kunder}</span>
                </div>
                <div className="flex gap-2 items-end h-48">
                  <div className="w-8 bg-[#17694c] rounded-t-xl" style={{ height: `${item.besok / 2}px` }} />
                  <div className="w-8 bg-blue-400 rounded-t-xl" style={{ height: `${item.kunder / 2}px` }} />
                </div>
                <div className="text-[#666] mt-2 font-semibold">{item.label}</div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 justify-center">
            <button className="px-6 py-2 rounded-full bg-gray-100 text-[#17694c] font-semibold hover:bg-gray-200 transition">PDF</button>
            <button className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition">↓ Excel</button>
          </div>
        </div>
      </div>
    </div>
  );
};