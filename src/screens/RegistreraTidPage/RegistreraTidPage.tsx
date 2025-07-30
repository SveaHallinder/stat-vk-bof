import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { PlusCircle } from "lucide-react";
import { InsatsCombobox } from "../../components/ui/insats-combobox";
import { KundCombobox } from "../../components/ui/kund-combobox";
import { BehandlareCombobox } from "../../components/ui/behandlare-combobox";
import { getCustomers, getEfforts, getHandlers, getCases, createCase } from "../../lib/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { Customer } from "@/types/types";

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

// Lägg till hjälpfunktion för att få YYYY-MM-DD i svensk tid
function toSwedishDateString(dateStr: string) {
  const d = new Date(dateStr);
  // Skapa datumsträng i svensk tid (YYYY-MM-DD)
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const RegistreraTidPage = (): JSX.Element => {
  type CustomerItem = Customer & { birthYear: number };

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [newEntries, setNewEntries] = useState<TimeEntry[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [efforts, setEfforts] = useState<Effort[]>([]);
  const [newEntryErrors, setNewEntryErrors] = useState<{ [idx: number]: { customer?: string; handler1?: string; effort?: string; date?: string; hours?: string } }>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefillCustomer = searchParams.get("customer") || "";
  const prefillEffort = searchParams.get("effort") || "";

  useEffect(() => {
    getHandlers().then(data => setHandlers(data));
    // Hämta kunder
    getCustomers().then(data => setCustomers(data));
    // Hämta insatser
    getEfforts().then(data => setEfforts(data));
    // Hämta dagens ärenden
    getCases()
      .then(data => {
        const now = new Date();
        const todayLocal = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        const todays = data.filter((c: any) => c.date && toSwedishDateString(c.date) === todayLocal);
        setEntries(todays.map((c: any) => ({
          id: c.id.toString(),
          customer: c.customer_id?.toString() || "",
          handler1: c.handler1_id?.toString() || "",
          handler2: c.handler2_id?.toString() || "",
          effort: c.effort_id?.toString() || "",
          date: c.date?.slice(0, 10) || "",
          hours: c.hours?.toString() || "",
          status: c.status || "Utförd"
        })));
      });
  }, []);

  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const handleAddRow = () => {
    setNewEntries(prev => [{
      id: (Date.now() + Math.random()).toString(),
      customer: prefillCustomer,
      handler1: "",
      handler2: "",
      effort: prefillEffort,
      date: getToday(),
      hours: "",
      status: "Utförd",
    }, ...prev]);
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

  function getHandlerName(id: string) {
    const h = handlers.find(h => h.id.toString() === id);
    return h ? h.name : id || "-";
  }

  function getCustomerName(id: string) {
    const c = customers.find(c => c.id.toString() === id);
    return c ? `${c.initials} ${c.gender} ${c.birthYear}` : id || "-";
  }
  function getEffortName(id: string) {
    const e = efforts.find(e => e.id.toString() === id);
    return e ? e.name : id || "-";
  }

  function validateEntry(entry: TimeEntry) {
    const errors: { customer?: string; handler1?: string; effort?: string; date?: string; hours?: string } = {};
    if (!entry.customer) errors.customer = "Kund måste väljas";
    if (!entry.handler1) errors.handler1 = "Behandlare 1 måste väljas";
    if (!entry.effort) errors.effort = "Insats måste väljas";
    if (!entry.date) errors.date = "Datum måste anges";
    if (!entry.hours || isNaN(Number(entry.hours))) errors.hours = "Timmar måste anges";
    return errors;
  }

  async function saveCase(entry: TimeEntry, idx?: number) {
    // Validera innan vi skickar
    const errors = validateEntry(entry);
    if (Object.keys(errors).length > 0) {
      if (typeof idx === "number") setNewEntryErrors(prev => ({ ...prev, [idx]: errors }));
      return false;
    } else if (typeof idx === "number") {
      setNewEntryErrors(prev => ({ ...prev, [idx]: {} }));
    }

    const payload = {
      customer_id: entry.customer,
      handler1_id: entry.handler1,
      handler2_id: entry.handler2 && entry.handler2 !== "" ? entry.handler2 : null,
      effort_id: entry.effort,
      date: entry.date,
      hours: entry.hours,
      status: entry.status
    };

    console.log("Sparar ärende med payload:", payload);

    try {
      await createCase(payload);
      toast.success("Tid registrerad!");
      return true;
    } catch (err) {
      toast.error("Nätverksfel: " + err);
      return false;
    }
  }


  return (
    <Layout title="Registrera tid">
      <div className="mb-4 text-gray-600 text-base">
        Här kan du registrera nya insatser och se dagens registrerade tider.
      </div>
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
            disabled={newEntries.some((entry) => Object.keys(validateEntry(entry)).length > 0)}
            onClick={async () => {
              let hasError = false;
              const allErrors: typeof newEntryErrors = {};
              for (let i = 0; i < newEntries.length; i++) {
                const entry = newEntries[i];
                const ok = await saveCase(entry, i);
                if (!ok) hasError = true;
                allErrors[i] = validateEntry(entry);
              }
              setNewEntryErrors(allErrors);
              if (hasError) return;
              setEntries(prev => [...newEntries, ...prev]);
              setNewEntries([]);
              setNewEntryErrors({});
            }}
          >
            Spara alla
          </Button>
        )}
      </div>
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <h2 className="text-lg font-bold text-[#17694c]">Dagens registreringar</h2>
            <Button variant="ghost" className="text-[#17694c] underline hover:bg-[#eaf6f1]" onClick={() => navigate("/arendelista")}>Visa alla registreringar</Button>
          </div>
          <div>
            <table className="w-full text-left min-w-[900px]">
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
                    <td className="px-3 py-1 align-middle">
                      <KundCombobox value={newEntry.customer} onChange={value => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, customer: value } : n))} />
                      {newEntryErrors[idx]?.customer && <div className="text-red-500 text-xs mt-1">{newEntryErrors[idx].customer}</div>}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <BehandlareCombobox value={newEntry.handler1} onChange={value => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, handler1: value } : n))} />
                      {newEntryErrors[idx]?.handler1 && <div className="text-red-500 text-xs mt-1">{newEntryErrors[idx].handler1}</div>}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <BehandlareCombobox value={newEntry.handler2} onChange={value => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, handler2: value } : n))} />
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <InsatsCombobox value={newEntry.effort} onChange={value => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, effort: value } : n))} />
                      {newEntryErrors[idx]?.effort && <div className="text-red-500 text-xs mt-1">{newEntryErrors[idx].effort}</div>}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <input type="date" className="border rounded px-2 py-1 w-full" value={newEntry.date} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, date: e.target.value } : n))} />
                      {newEntryErrors[idx]?.date && <div className="text-red-500 text-xs mt-1">{newEntryErrors[idx].date}</div>}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <input type="number" className="border rounded px-2 py-1 w-full" value={newEntry.hours} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, hours: e.target.value } : n))} placeholder="Timmar" />
                      {newEntryErrors[idx]?.hours && <div className="text-red-500 text-xs mt-1">{newEntryErrors[idx].hours}</div>}
                    </td>
                    <td className="px-3 py-1 align-middle">
                      <select className="border rounded px-2 py-1 w-full" value={newEntry.status} onChange={e => setNewEntries(prev => prev.map((n, i) => i === idx ? { ...n, status: e.target.value as any } : n))}>
                        <option value="Utförd">Utförd</option>
                        <option value="Avbokad">Avbokad</option>
                      </select>
                    </td>
                    <td className="px-3 py-1 align-middle text-right flex gap-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => handleCancelNew(idx)}>Avbryt</Button>
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && newEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4 text-[#17694c]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <div className="text-lg font-semibold mb-2">Inga tider har registrerats idag ännu</div>
                        <div className="mb-4">Klicka på <span className="font-semibold text-[#17694c]">Lägg till tid</span> för att skapa en ny registrering.</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, idx) => (
                    editIdx === idx ? (
                      <tr key={entry.id + idx} className="bg-gray-50">
                        <td className="px-6 py-2"><KundCombobox value={editEntry?.customer || ""} onChange={value => setEditEntry(editEntry ? { ...editEntry, customer: value } : null)} /></td>
                        <td className="px-6 py-2"><BehandlareCombobox
                          value={editEntry?.handler1 || ""}
                          onChange={value => setEditEntry(editEntry ? { ...editEntry, handler1: value } : null)}
                        /></td>
                        <td className="px-6 py-2"><BehandlareCombobox
                          value={editEntry?.handler2 || ""}
                          onChange={value => setEditEntry(editEntry ? { ...editEntry, handler2: value } : null)}
                        /></td>
                        <td className="px-6 py-2"><InsatsCombobox value={editEntry?.effort || ""} onChange={value => setEditEntry(editEntry ? { ...editEntry, effort: value } : null)} /></td>
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
                        <td className="px-6 py-4 font-medium text-gray-800">{getCustomerName(entry.customer)}</td>
                        <td className="px-6 py-4 text-gray-600">{getHandlerName(entry.handler1)}</td>
                        <td className="px-6 py-4 text-gray-600">{getHandlerName(entry.handler2)}</td>
                        <td className="px-6 py-4 text-gray-600">{getEffortName(entry.effort)}</td>
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};