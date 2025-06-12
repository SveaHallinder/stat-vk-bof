import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";

interface TimeEntry {
  id: string;
  customer: string;
  handler1: string;
  handler2: string;
  effort: string;
  date: string;
  hours: string;
  status: "Utförd" | "Avbokad";
}

const initialEntries: TimeEntry[] = [
  { id: "1", customer: "AL Flicka 2005", handler1: "PNI", handler2: "-", effort: "Repulse", date: "2025-03-25", hours: "1", status: "Avbokad" },
  { id: "2", customer: "AL Flicka 2005", handler1: "PNI", handler2: "-", effort: "Repulse", date: "2025-03-25", hours: "2", status: "Utförd" },
];

export const RegisteraTidPage = (): JSX.Element => {
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries);
  const [newRows, setNewRows] = useState<TimeEntry[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);

  const handleAddRow = () => {
    setShowAddRow(true);
    setNewRows([...newRows, { id: (entries.length + newRows.length + 1).toString(), customer: "", handler1: "", handler2: "", effort: "", date: "", hours: "", status: "Utförd" }]);
  };

  const handleNewRowChange = (idx: number, field: keyof TimeEntry, value: string) => {
    const updated = [...newRows];
    updated[idx][field] = value;
    setNewRows(updated);
  };

  const handleRemoveNewRow = (idx: number) => {
    const updated = [...newRows];
    updated.splice(idx, 1);
    setNewRows(updated);
    if (updated.length === 0) setShowAddRow(false);
  };

  const handleSaveNewRows = () => {
    setEntries([...entries, ...newRows]);
    setNewRows([]);
    setShowAddRow(false);
  };

  const handleCancel = () => {
    setNewRows([]);
    setShowAddRow(false);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Registrera tid" />
      <div className="flex-1 flex flex-col">
        <div className="px-12 pt-10 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#333]">Registrera tid</h1>
            <button
              className="bg-[#17694c] text-white font-semibold px-6 py-2 rounded-full text-lg hover:bg-[#145c41] transition"
              onClick={handleAddRow}
            >
              Lägg till tid
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#eaf6f1] text-[#17694c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kund</th>
                  <th className="px-4 py-3 font-semibold">Behandlare 1</th>
                  <th className="px-4 py-3 font-semibold">Behandlare 2</th>
                  <th className="px-4 py-3 font-semibold">Insats</th>
                  <th className="px-4 py-3 font-semibold">Datum</th>
                  <th className="px-4 py-3 font-semibold">Timmar</th>
                  <th className="px-4 py-3 font-semibold">Utförd/Avbokad</th>
                  <th className="px-4 py-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {showAddRow && newRows.map((row, idx) => (
                  <tr key={idx} className="bg-[#f6fbf9] border-b border-[#eaf6f1]">
                    <td className="px-4 py-2">
                      <input type="text" className="border rounded px-2 py-1 w-32" value={row.customer} onChange={e => handleNewRowChange(idx, "customer", e.target.value)} placeholder="Välj kund" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" className="border rounded px-2 py-1 w-24" value={row.handler1} onChange={e => handleNewRowChange(idx, "handler1", e.target.value)} placeholder="Välj" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" className="border rounded px-2 py-1 w-24" value={row.handler2} onChange={e => handleNewRowChange(idx, "handler2", e.target.value)} placeholder="Välj" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="text" className="border rounded px-2 py-1 w-28" value={row.effort} onChange={e => handleNewRowChange(idx, "effort", e.target.value)} placeholder="Välj insats" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="date" className="border rounded px-2 py-1 w-32" value={row.date} onChange={e => handleNewRowChange(idx, "date", e.target.value)} placeholder="Välj datum" />
                    </td>
                    <td className="px-4 py-2">
                      <input type="number" className="border rounded px-2 py-1 w-16" value={row.hours} onChange={e => handleNewRowChange(idx, "hours", e.target.value)} placeholder="Tid" />
                    </td>
                    <td className="px-4 py-2">
                      <select className="border rounded px-2 py-1 w-24" value={row.status} onChange={e => handleNewRowChange(idx, "status", e.target.value)}>
                        <option value="Utförd">Utförd</option>
                        <option value="Avbokad">Avbokad</option>
                      </select>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-red-500 font-bold px-2" onClick={() => handleRemoveNewRow(idx)} type="button">Ta bort</button>
                      <button className="text-green-600 font-bold px-2" onClick={handleSaveNewRows} type="button">Spara</button>
                    </td>
                  </tr>
                ))}
                {entries.map((entry, idx) => (
                  <tr key={entry.id + idx} className="hover:bg-[#f6fbf9] border-b border-[#eaf6f1]">
                    <td className="px-4 py-2 font-semibold">{entry.customer}</td>
                    <td className="px-4 py-2">{entry.handler1}</td>
                    <td className="px-4 py-2">{entry.handler2}</td>
                    <td className="px-4 py-2">{entry.effort}</td>
                    <td className="px-4 py-2">{entry.date}</td>
                    <td className="px-4 py-2">{entry.hours}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold ${entry.status === "Utförd" ? "bg-[#eaf6f1] text-[#17694c]" : "bg-red-100 text-red-600"}`}>{entry.status}</span>
                    </td>
                    <td className="px-4 py-2">
                      <button className="text-[#17694c] font-bold px-2">Ändra</button>
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