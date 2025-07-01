import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { Edit2, FileText, XCircle, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";

interface CaseEntry {
  customerId: string;
  customer: string;
  effort: string;
  date: string;
  status: string;
  handler1: string;
  handler2: string;
}

const initialCases: CaseEntry[] = [
  { customerId: "1", customer: "AL Flicka 2005", effort: "Repulse", date: "2025-03-25", status: "Pågående", handler1: "Anna L", handler2: "-" },
  { customerId: "2", customer: "BN Pojke 2012", effort: "Samverkan", date: "2025-03-24", status: "Avslutad", handler1: "Jessica S", handler2: "-" },
  { customerId: "3", customer: "CL Flicka 2009", effort: "Repulse", date: "2025-03-24", status: "Pågående", handler1: "Anna L", handler2: "-" },
  { customerId: "4", customer: "DM Pojke 2011", effort: "Repulse", date: "2025-02-15", status: "Avslutad", handler1: "Maria A", handler2: "-" },
];

export const ArendelistaPage = (): JSX.Element => {
  const [caseList, setCaseList] = useState<CaseEntry[]>(initialCases);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [handler1Filter, setHandler1Filter] = useState("all");
  const [handler2Filter, setHandler2Filter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredCases = caseList.filter(c =>
    (search === "" || c.customer.toLowerCase().includes(search.toLowerCase()) || c.effort.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || c.status === statusFilter) &&
    (handler1Filter === "all" || c.handler1 === handler1Filter) &&
    (handler2Filter === "all" || c.handler2 === handler2Filter)
  );

  return (
    <Layout activeItem="Ärendelista" title="Ärendelista">
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <Input
              type="text"
              placeholder="Sök kund eller insats..."
              className="max-w-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="Pågående">Pågående</SelectItem>
                <SelectItem value="Avslutad">Avslutad</SelectItem>
              </SelectContent>
            </Select>
            <Select value={handler1Filter} onValueChange={setHandler1Filter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla behandlare 1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla behandlare 1</SelectItem>
                <SelectItem value="Anna L">Anna L</SelectItem>
                <SelectItem value="Jessica S">Jessica S</SelectItem>
                <SelectItem value="Maria A">Maria A</SelectItem>
              </SelectContent>
            </Select>
            <Select value={handler2Filter} onValueChange={setHandler2Filter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla behandlare 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla behandlare 2</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="Anna L">Anna L</SelectItem>
                <SelectItem value="Jessica S">Jessica S</SelectItem>
                <SelectItem value="Maria A">Maria A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Kund</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Insats</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Datum</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Behandlare 1</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Behandlare 2</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c, idx) => (
                  <tr key={c.customerId + idx} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-4 font-medium text-gray-800">{c.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{c.effort}</td>
                    <td className="px-6 py-4 text-gray-600">{c.date}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                          c.status === "Pågående"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.handler1}</td>
                    <td className="px-6 py-4 text-gray-600">{c.handler2}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 items-center justify-end">
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full"
                          title="Ändra"
                          onClick={() => {
                            // Navigera till kundsida och öppna rätt insats/tid (dummy nu)
                            alert(`Navigera till kundsida för ${c.customer} och öppna insats ${c.effort}`);
                          }}
                        >
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full"
                          title="Radera"
                          onClick={() => setDeleteId(c.customerId)}
                        >
                          <XCircle className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Popup för radering */}
          {deleteId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
                <div className="text-lg font-semibold mb-4">Är du säker att du vill radera detta ärende?</div>
                <div className="flex gap-4 mt-2">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteId(null)}
                    className="min-w-[100px]"
                  >
                    Avbryt
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setCaseList(prev => prev.filter(c => c.customerId !== deleteId));
                      setDeleteId(null);
                    }}
                    className="min-w-[100px]"
                  >
                    Radera
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
};