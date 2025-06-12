import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { Edit2, FileText, XCircle } from "lucide-react";

interface CaseEntry {
  customerId: string;
  customer: string;
  effort: string;
  date: string;
  type: string;
  status: string;
  handler: string;
}

const initialCases: CaseEntry[] = [
  { customerId: "1", customer: "AL Flicka 2005", effort: "Repulse", date: "2025-03-25", type: "Besök", status: "Pågående", handler: "Anna L" },
  { customerId: "2", customer: "BN Pojke 2012", effort: "Samverkan", date: "2025-03-24", type: "Behandling", status: "Avslutad", handler: "Jessica S" },
  { customerId: "3", customer: "CL Flicka 2009", effort: "Repulse", date: "2025-03-24", type: "Besök", status: "Pågående", handler: "Anna L" },
  { customerId: "4", customer: "DM Pojke 2011", effort: "Repulse", date: "2025-02-15", type: "Behandling", status: "Avslutad", handler: "Maria A" },
];

export const ArendelistaPage = (): JSX.Element => {
  const [cases] = useState<CaseEntry[]>(initialCases);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [handlerFilter, setHandlerFilter] = useState("");
  const [sortBy, setSortBy] = useState<keyof CaseEntry>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Filtrera och sortera listan
  const filtered = cases
    .filter(c =>
      (!search || c.customer.toLowerCase().includes(search.toLowerCase()) || c.effort.toLowerCase().includes(search.toLowerCase())) &&
      (!statusFilter || c.status === statusFilter) &&
      (!typeFilter || c.type === typeFilter) &&
      (!handlerFilter || c.handler === handlerFilter)
    )
    .sort((a, b) => {
      if (sortDir === "asc") return a[sortBy].localeCompare(b[sortBy]);
      return b[sortBy].localeCompare(a[sortBy]);
    });

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Ärendelista" />
      <div className="flex-1 flex flex-col">
        <div className="px-12 pt-10 pb-4">
          <h1 className="text-3xl font-bold text-[#333] mb-6">Ärendelista</h1>
          <div className="flex flex-wrap gap-4 mb-4 items-end">
            <input
              type="text"
              placeholder="Sök kund, insats eller datum..."
              className="border rounded-lg px-4 py-2 text-lg w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="border rounded-lg px-3 py-2 text-lg" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Alla status</option>
              <option value="Pågående">Pågående</option>
              <option value="Avslutad">Avslutad</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-lg" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="">Alla typer</option>
              <option value="Besök">Besök</option>
              <option value="Behandling">Behandling</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-lg" value={handlerFilter} onChange={e => setHandlerFilter(e.target.value)}>
              <option value="">Alla handläggare</option>
              <option value="Anna L">Anna L</option>
              <option value="Jessica S">Jessica S</option>
              <option value="Maria A">Maria A</option>
            </select>
            <select className="border rounded-lg px-3 py-2 text-lg" value={sortBy} onChange={e => setSortBy(e.target.value as keyof CaseEntry)}>
              <option value="date">Sortera på datum</option>
              <option value="customer">Sortera på kund</option>
              <option value="effort">Sortera på insats</option>
              <option value="status">Sortera på status</option>
            </select>
            <button className="px-4 py-2 rounded bg-gray-100 text-[#17694c] font-semibold" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>{sortDir === "asc" ? "↑" : "↓"}</button>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#eaf6f1] text-[#17694c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kund-ID</th>
                  <th className="px-4 py-3 font-semibold">Kund</th>
                  <th className="px-4 py-3 font-semibold">Insats</th>
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Typ</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Handläggare</th>
                  <th className="px-4 py-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, idx) => (
                  <tr key={c.customerId + idx} className="hover:bg-[#f6fbf9] border-b border-[#eaf6f1]">
                    <td className="px-4 py-2 font-semibold">{c.customerId}</td>
                    <td className="px-4 py-2">{c.customer}</td>
                    <td className="px-4 py-2">{c.effort}</td>
                    <td className="px-4 py-2">{c.date}</td>
                    <td className="px-4 py-2">{c.type}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold ${c.status === "Pågående" ? "bg-[#eaf6f1] text-[#17694c]" : "bg-red-100 text-red-600"}`}>{c.status}</span>
                    </td>
                    <td className="px-4 py-2">{c.handler}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 items-center">
                        <button className="p-1 hover:bg-gray-100 rounded" title="Ändra"><Edit2 className="w-5 h-5 text-[#17694c]" /></button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Visa historik"><FileText className="w-5 h-5 text-[#17694c]" /></button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Avsluta ärende"><XCircle className="w-5 h-5 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};