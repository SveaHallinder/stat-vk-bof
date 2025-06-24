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
  
  return (
    <Layout activeItem="Registrera tid" title="Registrera tid">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] transition shadow-sm"
        >
          <PlusCircle className="w-5 h-5" />
          Lägg till tid
        </Button>
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
                {entries.map((entry, idx) => (
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
                      <Button variant="ghost">Ändra</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};