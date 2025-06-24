import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { Edit2, FileText, XCircle, ArrowUpDown } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";

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
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [handlerFilter, setHandlerFilter] = useState("all");

  const filteredCases = cases.filter(c =>
    (search === "" || c.customer.toLowerCase().includes(search.toLowerCase()) || c.effort.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "all" || c.status === statusFilter) &&
    (typeFilter === "all" || c.type === typeFilter) &&
    (handlerFilter === "all" || c.handler === handlerFilter)
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla typer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla typer</SelectItem>
                <SelectItem value="Besök">Besök</SelectItem>
                <SelectItem value="Behandling">Behandling</SelectItem>
              </SelectContent>
            </Select>
            <Select value={handlerFilter} onValueChange={setHandlerFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla handläggare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla handläggare</SelectItem>
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
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Typ</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Handläggare</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((c, idx) => (
                  <tr key={c.customerId + idx} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-4 font-medium text-gray-800">{c.customer}</td>
                    <td className="px-6 py-4 text-gray-600">{c.effort}</td>
                    <td className="px-6 py-4 text-gray-600">{c.date}</td>
                    <td className="px-6 py-4 text-gray-600">{c.type}</td>
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
                    <td className="px-6 py-4 text-gray-600">{c.handler}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 items-center justify-end">
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Ändra">
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Visa historik">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Avsluta ärende">
                          <XCircle className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
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