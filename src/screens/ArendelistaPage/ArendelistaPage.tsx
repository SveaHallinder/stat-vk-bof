import React, { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { Edit2, FileText, XCircle, ArrowUpDown, ArrowDown, ArrowUp } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Button } from "../../components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { format } from 'date-fns';

interface CaseEntry {
  id: string;
  customer_name: string;
  effort_name: string;
  date: string;
  status: string;
  handler1_name: string;
  handler2_name: string;
}

export const ArendelistaPage = (): JSX.Element => {
  const [caseList, setCaseList] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [handler1Filter, setHandler1Filter] = useState("all");
  const [handler2Filter, setHandler2Filter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortField, setSortField] = useState<string>("date");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [selectedRange, setSelectedRange] = useState<{ from?: Date; to?: Date }>({});
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    fetch("http://localhost:4000/cases")
      .then(res => res.json())
      .then(data => setCaseList(data));
  }, []);

  // Hämta statusar från backend
  useEffect(() => {
    setStatusLoading(true);
    setStatusError(null);
    fetch("http://localhost:4000/case-statuses")
      .then(res => {
        if (!res.ok) throw new Error("Kunde inte hämta statusar");
        return res.json();
      })
      .then(data => setStatusOptions(data))
      .catch(err => setStatusError("Kunde inte hämta statusar"))
      .finally(() => setStatusLoading(false));
  }, []);

  // Dynamiska filteralternativ för behandlare 1 och 2
  const handler1Options = Array.from(new Set(caseList.map(c => c.handler1_name).filter(Boolean)));
  const handler2Options = Array.from(new Set(caseList.map(c => c.handler2_name).filter(Boolean)));

  const filteredCases = caseList.filter(c => {
    const s = search.trim().toLowerCase();
    const kund = (c.customer_name || "").toLowerCase();
    const insats = (c.effort_name || "").toLowerCase();
    const behandlare1 = (c.handler1_name || "").toLowerCase();
    const behandlare2 = (c.handler2_name || "").toLowerCase();
    const status = (c.status || "").toLowerCase();
    const date = c.date ? c.date.slice(0, 10) : "";

    const matchesSearch =
      !s || kund.includes(s) || insats.includes(s) || behandlare1.includes(s) || behandlare2.includes(s) || status.includes(s);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesHandler1 = handler1Filter === "all" || c.handler1_name === handler1Filter;
    const matchesHandler2 = handler2Filter === "all" || c.handler2_name === handler2Filter;
    let matchesDate = true;
    if (selectedRange.from && selectedRange.to) {
      matchesDate = date >= selectedRange.from.toISOString().slice(0, 10) && date <= selectedRange.to.toISOString().slice(0, 10);
    } else if (selectedRange.from) {
      matchesDate = date === selectedRange.from.toISOString().slice(0, 10);
    }
    return matchesSearch && matchesStatus && matchesHandler1 && matchesHandler2
      && matchesDate;
  });

  // Sortering
  const sortedCases = [...filteredCases].sort((a, b) => {
    let av = a[sortField] || "";
    let bv = b[sortField] || "";
    // Om det är datum, sortera som datum
    if (sortField === "date") {
      av = av ? new Date(av) : new Date(0);
      bv = bv ? new Date(bv) : new Date(0);
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <Layout activeItem="Ärendelista" title="Ärendelista">
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-4 mb-6 items-center">
            <div className="flex items-center gap-4">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={"w-[260px] justify-start text-left font-normal" + (selectedRange.from ? "" : " text-muted-foreground")}
                  >
                    {selectedRange.from ?
                      (selectedRange.to
                        ? `${format(selectedRange.from, 'yyyy-MM-dd')} – ${format(selectedRange.to, 'yyyy-MM-dd')}`
                        : format(selectedRange.from, 'yyyy-MM-dd'))
                      : "Välj datum eller intervall"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    selected={selectedRange}
                    onSelect={range => {
                      setSelectedRange(range ?? {});
                      // Stäng popup om man valt ett datum (eller ett intervall)
                      if (range?.from && (!range.to || range.to)) setCalendarOpen(false);
                    }}
                    numberOfMonths={1}
                  />
                  {(selectedRange.from || selectedRange.to) && (
                    <div className="flex justify-end p-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedRange({})}>Rensa datum</Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
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
                {statusLoading && <div className="px-4 py-2 text-gray-400">Laddar...</div>}
                {statusError && <div className="px-4 py-2 text-red-500">{statusError}</div>}
                {!statusLoading && !statusError && statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={handler1Filter} onValueChange={setHandler1Filter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla behandlare 1" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla behandlare 1</SelectItem>
                {handler1Options.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={handler2Filter} onValueChange={setHandler2Filter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Alla behandlare 2" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla behandlare 2</SelectItem>
                {handler2Options.map(name => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { label: "Kund", field: "customer_name" },
                    { label: "Insats", field: "effort_name" },
                    { label: "Datum", field: "date" },
                    { label: "Status", field: "status" },
                    { label: "Behandlare 1", field: "handler1_name" },
                    { label: "Behandlare 2", field: "handler2_name" },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm cursor-pointer select-none group"
                      onClick={() => {
                        if (sortField === col.field) {
                          setSortAsc(a => !a);
                        } else {
                          setSortField(col.field);
                          setSortAsc(true);
                        }
                      }}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortField === col.field ? (
                          sortAsc ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />
                        ) : (
                          <ArrowUpDown className="w-4 h-4 opacity-30 group-hover:opacity-60 inline" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {sortedCases.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-gray-400 py-8">Inga ärenden matchar din sökning eller filter.</td></tr>
                ) : sortedCases.map((c, idx) => (
                  <tr key={c.id || idx} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-4 font-medium text-gray-800">{c.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.effort_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.date?.slice(0,10)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                          c.status === "Utförd"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{c.handler1_name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.handler2_name}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 items-center justify-end">
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full"
                          title="Ändra"
                          onClick={() => {
                            // Navigera till kundprofilen och öppna rätt insats
                            if (c.customer_id && c.effort_name) {
                              navigate(`/kunder/${c.customer_id}`, { state: { openEffort: c.effort_name } });
                            }
                          }}
                        >
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full"
                          title="Radera"
                          onClick={() => setDeleteId(c.id)}
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
                      setCaseList(prev => prev.filter(c => c.id !== deleteId));
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