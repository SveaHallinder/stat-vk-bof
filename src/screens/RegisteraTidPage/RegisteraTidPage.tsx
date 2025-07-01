import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { PlusCircle } from "lucide-react";

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
  const [newEntries, setNewEntries] = useState<TimeEntry[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);

  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const handleAddRow = () => {
    setNewEntries(prev => [{
      id: (Date.now() + Math.random()).toString(),
      customer: "",
      handler1: "",
      handler2: "",
      effort: "",
      date: getToday(),
      hours: "",
      status: "Utförd",
    }, ...prev]);
  };

  const handleSaveNew = (idx: number) => {
    const entry = newEntries[idx];
    setEntries(prev => [entry, ...prev]);
    setNewEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleCancelNew = (idx: number) => {
    setNewEntries(prev => prev.filter((_, i) => i !== idx));
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditEntry({ ...entries[idx] });
  };

  const handleSaveEdit = () => {
    if (editIdx === null || !editEntry) return;
    setEntries(prev => prev.map((e, i) => (i === editIdx ? editEntry : e)));
    setEditIdx(null);
    setEditEntry(null);
  };

  const handleCancelEdit = () => {
    setEditIdx(null);
    setEditEntry(null);
  };

  return (
    <Layout activeItem="Registrera tid" title="Registrera tid">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] transition shadow-sm"
          onClick={handleAddRow}
        >
          <PlusCircle className="w-5 h-5" />
          Lägg till tid
        </Button>
        {newEntries.length > 0 && (
          <Button
            variant="default"
            className="px-6 py-3 rounded-lg text-lg font-semibold"
            onClick={() => {
              setEntries(prev => [...newEntries, ...prev]);
              setNewEntries([]);
            }}
          >
            Spara alla
          </Button>
        )}
      </div>
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Kund</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Behandlare 1</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Behandlare 2</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Insats</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Datum</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Timmar</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {newEntries.map((newEntry, idx) => (
                  <tr className="bg-gray-50" key={newEntry.id}>
                    <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={newEntry.customer} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, customer: e.target.value } : n))} placeholder="Kund" /></td>
                    <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={newEntry.handler1} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, handler1: e.target.value } : n))} placeholder="Behandlare 1" /></td>
                    <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={newEntry.handler2} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, handler2: e.target.value } : n))} placeholder="Behandlare 2" /></td>
                    <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={newEntry.effort} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, effort: e.target.value } : n))} placeholder="Insats" /></td>
                    <td className="px-6 py-2"><input type="date" className="border rounded px-2 py-1 w-full" value={newEntry.date} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, date: e.target.value } : n))} /></td>
                    <td className="px-6 py-2"><input type="number" className="border rounded px-2 py-1 w-full" value={newEntry.hours} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, hours: e.target.value } : n))} placeholder="Timmar" /></td>
                    <td className="px-6 py-2">
                      <select className="border rounded px-2 py-1 w-full" value={newEntry.status} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, status: e.target.value as any } : n))}>
                        <option value="Utförd">Utförd</option>
                        <option value="Avbokad">Avbokad</option>
                      </select>
                    </td>
                    <td className="px-6 py-2 text-right flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleCancelNew(idx)}>Avbryt</Button>
                    </td>
                  </tr>
                ))}
                {entries.map((entry, idx) => (
                  editIdx === idx ? (
                    <tr key={entry.id + idx} className="bg-gray-50">
                      <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={editEntry?.customer || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, customer: e.target.value } : null)} /></td>
                      <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={editEntry?.handler1 || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, handler1: e.target.value } : null)} /></td>
                      <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={editEntry?.handler2 || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, handler2: e.target.value } : null)} /></td>
                      <td className="px-6 py-2"><input type="text" className="border rounded px-2 py-1 w-full" value={editEntry?.effort || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, effort: e.target.value } : null)} /></td>
                      <td className="px-6 py-2"><input type="date" className="border rounded px-2 py-1 w-full" value={editEntry?.date || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, date: e.target.value } : null)} /></td>
                      <td className="px-6 py-2"><input type="number" className="border rounded px-2 py-1 w-full" value={editEntry?.hours || ""} onChange={e => setEditEntry(editEntry ? { ...editEntry, hours: e.target.value } : null)} /></td>
                      <td className="px-6 py-2">
                        <select className="border rounded px-2 py-1 w-full" value={editEntry?.status || "Utförd"} onChange={e => setEditEntry(editEntry ? { ...editEntry, status: e.target.value as any } : null)}>
                          <option value="Utförd">Utförd</option>
                          <option value="Avbokad">Avbokad</option>
                        </select>
                      </td>
                      <td className="px-6 py-2 text-right flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Avbryt</Button>
                        <Button size="sm" variant="default" onClick={handleSaveEdit}>Spara</Button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={entry.id + idx} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-6 py-4 font-medium text-gray-800">{entry.customer}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.handler1}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.handler2}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.effort}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.date}</td>
                      <td className="px-6 py-4 text-gray-600">{entry.hours}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                            entry.status === "Utförd"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {entry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" onClick={() => handleEdit(idx)}>Ändra</Button>
                      </td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};