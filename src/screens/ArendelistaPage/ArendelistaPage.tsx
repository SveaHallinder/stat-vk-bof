import React, { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";
import { getShifts } from "../../lib/api";
import { ShiftEntry } from "@/types/types";
import toast from "react-hot-toast";

export const ArendelistaPage = (): JSX.Element => {
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof ShiftEntry>("date");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getShifts();
        setShifts(data);
      } catch {
        toast.error("Kunde inte hämta besök");
      }
    }
    load();
  }, []);

  const statusOptions = Array.from(new Set(shifts.map(s => s.status))).filter(Boolean);

  const filtered = shifts.filter(s => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term || s.customer_name.toLowerCase().includes(term) || s.effort_name.toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av: any = a[sortField] ?? "";
    const bv: any = b[sortField] ?? "";
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <Layout title="Ärendelista">
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl">
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Sök kund eller insats"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  {[
                    { label: "Kund", field: "customer_name" },
                    { label: "Insats", field: "effort_name" },
                    { label: "Datum", field: "date" },
                    { label: "Timmar", field: "hours" },
                    { label: "Status", field: "status" },
                    { label: "Behandlare 1", field: "handler1_name" },
                    { label: "Behandlare 2", field: "handler2_name" }
                  ].map(col => (
                    <th
                      key={col.field}
                      className="py-2 px-4 cursor-pointer"
                      onClick={() => {
                        const f = col.field as keyof ShiftEntry;
                        if (sortField === f) setSortAsc(a => !a);
                        else {
                          setSortField(f);
                          setSortAsc(true);
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortField === col.field ? (sortAsc ? <ArrowUp size={14} /> : <ArrowDown size={14} />) : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{s.customer_name}</td>
                    <td className="py-2 px-4">{s.effort_name}</td>
                    <td className="py-2 px-4">{s.date?.slice(0,10) ?? "-"}</td>
                    <td className="py-2 px-4">{s.hours}</td>
                    <td className="py-2 px-4">{s.status}</td>
                    <td className="py-2 px-4">{s.handler1_name}</td>
                    <td className="py-2 px-4">{s.handler2_name}</td>
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
