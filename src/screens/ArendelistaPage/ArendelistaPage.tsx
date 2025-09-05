import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUp, ArrowDown } from "lucide-react";
import { getCases } from "@/lib/api";
import { CaseWithNames } from "@/types/types";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const ArendelistaPage = (): JSX.Element => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseWithNames[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof CaseWithNames>("created_at");
  const [sortAsc, setSortAsc] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCases(includeInactive, { page, limit }); // styr via checkbox
        setCases(data);
      } catch {
        toast.error("Kunde inte hämta ärenden");
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const data = await getCases(includeInactive, { signal: controller.signal }); // styr via checkbox
        setCases(data);
      } catch (err: any) {
        if (err?.name !== 'AbortError') toast.error("Kunde inte hämta ärenden");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [includeInactive, page, limit]);

  const statusOptions = ["Aktivt", "Inaktivt"];

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = cases.filter(c => {
    const term = debouncedSearch.toLowerCase();
    const matchesSearch =
      !term || 
      (c.customer_name || "").toLowerCase().includes(term) || 
      (c.effort_name || "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || (c.active ? "Aktivt" : "Inaktivt") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    const av: any = a[sortField] ?? "";
    const bv: any = b[sortField] ?? "";
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  // Navigera till kundens profil med ärendet markerat
  const handleCaseClick = (caseItem: CaseWithNames) => {
    navigate(`/kunder/${caseItem.customer_id}?caseId=${caseItem.id}`);
  };

  return (
    <Layout title="Ärendelista">
      {/* Responsiv container */}
      <div className="w-full max-w-[350px] mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">

      <Card className="flex-1 bg-white rounded-xl">
        <CardContent className="p-4 mobile:p-6">
          <div className="flex flex-col mobile:flex-row gap-4 mb-4 items-start mobile:items-center">
            <Input
              placeholder="Sök kund eller insats"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full mobile:max-w-xs h-10"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full mobile:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                {statusOptions.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
              />
              Inkludera inaktiva
            </label>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  {[
                    { label: "Kund", field: "customer_name" },
                    { label: "Insats", field: "effort_name" },
                    { label: "Startdatum", field: "created_at" },
                    { label: "Status", field: "active" },
                    { label: "Behandlare 1", field: "handler1_name" },
                    { label: "Behandlare 2", field: "handler2_name" }
                  ].map(col => (
                    <th
                      key={col.field}
                      className="py-2 mobile:py-3 px-2 mobile:px-4 cursor-pointer text-xs mobile:text-sm"
                      onClick={() => {
                        const f = col.field as keyof CaseWithNames;
                        if (sortField === f) setSortAsc(a => !a);
                        else {
                          setSortField(f);
                          setSortAsc(true);
                        }
                      }}
                    >
                      <div className="flex items-center gap-1">
                        {col.label}
                        {sortField === col.field && (
                          sortAsc ? <ArrowUp size={14} className="mobile:w-4 mobile:h-4" /> : <ArrowDown size={14} className="mobile:w-4 mobile:h-4" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => (
                  <tr 
                    key={c.id} 
                    className="border-t hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => handleCaseClick(c)}
                  >
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4 group-hover:text-[#17694c] group-hover:font-medium text-xs mobile:text-sm">{(c as any).customer_active === false || c.customer_name === 'ANONYM' ? '—' : c.customer_name}</td>
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4 group-hover:text-[#17694c] text-xs mobile:text-sm">{c.effort_name}</td>
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4 text-xs mobile:text-sm">
                      {new Date(c.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        c.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {c.active ? 'Aktivt' : 'Inaktivt'}
                      </span>
                    </td>
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4 group-hover:text-[#17694c] text-xs mobile:text-sm">{c.handler1_name}</td>
                    <td className="py-2 mobile:py-3 px-2 mobile:px-4 group-hover:text-[#17694c] text-xs mobile:text-sm">{c.handler2_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between mt-3">
            <div className="text-sm text-gray-500">Sida {page} • Visar {cases.length} rader</div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Per sida</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={limit}
                onChange={(e) => { setPage(1); setLimit(parseInt(e.target.value) || 25); }}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <button
                className="px-3 py-1 border rounded text-sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={loading || page === 1}
              >
                Föregående
              </button>
              <button
                className="px-3 py-1 border rounded text-sm"
                onClick={() => setPage(p => p + 1)}
                disabled={loading || cases.length < limit}
              >
                Nästa
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      </div>
    </Layout>
  );
};
