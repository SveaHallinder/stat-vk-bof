import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import { KundCombobox } from "../../components/ui/kund-combobox";
import { BehandlareCombobox } from "../../components/ui/behandlare-combobox";
import { InsatsCombobox } from "../../components/ui/insats-combobox";
import { addShift, getShifts, getCases } from "../../lib/api";
import { ShiftEntry, CaseWithNames } from "@/types/types";
import toast from "react-hot-toast";

type NewEntry = {
  id: string;
  caseId: string;
  customer: string;
  handler1: string;
  handler2: string;
  effort: string;
  date: string;
  hours: string;
  status: string;
};

type EntryErrors = {
  customer?: string;
  handler1?: string;
  effort?: string;
  date?: string;
  hours?: string;
};

export const RegisteraTidPage = (): JSX.Element => {
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  const [cases, setCases] = useState<CaseWithNames[]>([]);
  const [newEntries, setNewEntries] = useState<NewEntry[]>([]);
  const [errors, setErrors] = useState<{ [idx: number]: EntryErrors }>({});

  function getToday() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  useEffect(() => {
    async function load() {
      try {
        const [s, c] = await Promise.all([getShifts(), getCases()]);
        setShifts(s);
        setCases(c);
      } catch {
        toast.error("Kunde inte hämta data");
      }
    }
    load();
  }, []);

  function handleAddRow() {
    setNewEntries(prev => [{
      id: (Date.now() + Math.random()).toString(),
      caseId: "",
      customer: "",
      handler1: "",
      handler2: "",
      effort: "",
      date: getToday(),
      hours: "",
      status: "Utförd"
    }, ...prev]);
  }

  function handleCancelNew(idx: number) {
    setNewEntries(prev => prev.filter((_, i) => i !== idx));
    setErrors(prev => {
      const copy = { ...prev };
      delete copy[idx];
      return copy;
    });
  }

  function handleChange(idx: number, field: keyof NewEntry, value: string) {
    setNewEntries(prev => prev.map((e, i) => i === idx ? { ...e, [field]: value } : e));
  }

  function handleCaseSelect(idx: number, caseId: string) {
    const selected = cases.find(c => c.id.toString() === caseId);
    setNewEntries(prev => prev.map((e, i) => i === idx ? {
      ...e,
      caseId,
      customer: selected ? selected.customer_id.toString() : "",
      handler1: selected ? selected.handler1_id.toString() : "",
      handler2: selected && selected.handler2_id ? selected.handler2_id.toString() : "",
      effort: selected ? selected.effort_id.toString() : ""
    } : e));
  }

  function validateEntry(entry: NewEntry): EntryErrors {
    const err: EntryErrors = {};
    if (!entry.caseId) {
      if (!entry.customer) err.customer = "Kund måste väljas";
      if (!entry.handler1) err.handler1 = "Behandlare 1 måste väljas";
      if (!entry.effort) err.effort = "Insats måste väljas";
    }
    if (!entry.date) err.date = "Datum måste anges";
    if (!entry.hours || isNaN(Number(entry.hours)) || Number(entry.hours) <= 0) err.hours = "Timmar måste vara > 0";
    return err;
  }

  async function saveEntry(entry: NewEntry, idx: number) {
    const err = validateEntry(entry);
    if (Object.keys(err).length > 0) {
      setErrors(prev => ({ ...prev, [idx]: err }));
      return false;
    }
    try {
      if (entry.caseId) {
        await addShift({ case_id: entry.caseId, date: entry.date, hours: Number(entry.hours), status: entry.status });
      } else {
        await addShift({
          customer_id: entry.customer,
          effort_id: entry.effort,
          handler1_id: entry.handler1,
          handler2_id: entry.handler2 || null,
          date: entry.date,
          hours: Number(entry.hours),
          status: entry.status
        });
      }
      return true;
    } catch {
      toast.error("Kunde inte spara tid");
      return false;
    }
  }

  async function handleSaveAll() {
    let okAll = true;
    for (let i = 0; i < newEntries.length; i++) {
      const ok = await saveEntry(newEntries[i], i);
      if (!ok) okAll = false;
    }
    if (!okAll) return;
    toast.success("Tid registrerad");
    try {
      const [s, c] = await Promise.all([getShifts(), getCases()]);
      setShifts(s);
      setCases(c);
    } catch {
      toast.error("Kunde inte hämta uppdaterad data");
    }
    setNewEntries([]);
    setErrors({});
  }

  return (
    <Layout title="Registrera tid">
      <div className="mb-4 text-gray-600 text-base">
        Här kan du registrera nya insatser och se registrerade tider.
      </div>
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] transition shadow-sm"
          onClick={handleAddRow}
        >
          <Plus className="w-5 h-5" />
          Lägg till tid
        </Button>
        {newEntries.length > 0 && (
          <Button
            variant="default"
            className="px-6 py-3 rounded-lg text-lg font-semibold"
            onClick={handleSaveAll}
            disabled={newEntries.some(e => Object.keys(validateEntry(e)).length > 0)}
          >
            Spara alla
          </Button>
        )}
      </div>
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                {newEntries.map((entry, idx) => {
                  const selectedCase = cases.find(c => c.id.toString() === entry.caseId);
                  return (
                    <tr className="bg-gray-50" key={entry.id}>
                      <td className="px-3 py-1 align-middle">
                        <div className="flex flex-col gap-1">
                          <select
                            className="border rounded px-2 py-1 w-full"
                            value={entry.caseId}
                            onChange={e => handleCaseSelect(idx, e.target.value)}
                          >
                            <option value="">Ny kombination</option>
                            {cases.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.customer_name} - {c.effort_name} - {c.handler1_name}{c.handler2_name ? ` & ${c.handler2_name}` : ""}
                              </option>
                            ))}
                          </select>
                          {entry.caseId ? (
                            <div className="px-2 py-1 text-center">{selectedCase?.customer_name}</div>
                          ) : (
                            <KundCombobox value={entry.customer} onChange={v => handleChange(idx, "customer", v)} />
                          )}
                          {errors[idx]?.customer && <div className="text-red-500 text-xs mt-1">{errors[idx].customer}</div>}
                        </div>
                      </td>
                      <td className="px-3 py-1 align-middle">
                        {entry.caseId ? (
                          <div className="px-2 py-1 text-center">{selectedCase?.handler1_name}</div>
                        ) : (
                          <BehandlareCombobox value={entry.handler1} onChange={v => handleChange(idx, "handler1", v)} />
                        )}
                        {errors[idx]?.handler1 && <div className="text-red-500 text-xs mt-1">{errors[idx].handler1}</div>}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        {entry.caseId ? (
                          <div className="px-2 py-1 text-center">{selectedCase?.handler2_name || "-"}</div>
                        ) : (
                          <BehandlareCombobox value={entry.handler2} onChange={v => handleChange(idx, "handler2", v)} />
                        )}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        {entry.caseId ? (
                          <div className="px-2 py-1 text-center">{selectedCase?.effort_name}</div>
                        ) : (
                          <InsatsCombobox value={entry.effort} onChange={v => handleChange(idx, "effort", v)} />
                        )}
                        {errors[idx]?.effort && <div className="text-red-500 text-xs mt-1">{errors[idx].effort}</div>}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <input
                          type="date"
                          className="border rounded px-2 py-1 w-full"
                          value={entry.date}
                          onChange={e => handleChange(idx, "date", e.target.value)}
                        />
                        {errors[idx]?.date && <div className="text-red-500 text-xs mt-1">{errors[idx].date}</div>}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-full"
                          value={entry.hours}
                          onChange={e => handleChange(idx, "hours", e.target.value)}
                          placeholder="Timmar"
                        />
                        {errors[idx]?.hours && <div className="text-red-500 text-xs mt-1">{errors[idx].hours}</div>}
                      </td>
                      <td className="px-3 py-1 align-middle">
                        <select
                          className="border rounded px-2 py-1 w-full"
                          value={entry.status}
                          onChange={e => handleChange(idx, "status", e.target.value)}
                        >
                          <option value="Utförd">Utförd</option>
                          <option value="Avbokad">Avbokad</option>
                        </select>
                      </td>
                      <td className="px-3 py-1 align-middle text-right">
                        <Button size="sm" variant="outline" onClick={() => handleCancelNew(idx)}>
                          Avbryt
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {shifts.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 border-b border-gray-200">
                    <td className="px-6 py-4 font-medium text-gray-800">{s.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.handler1_name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.handler2_name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.effort_name}</td>
                    <td className="px-6 py-4 text-gray-600">{s.date ? s.date.slice(0,10) : "-"}</td>
                    <td className="px-6 py-4 text-gray-600">{s.hours}</td>
                    <td className="px-6 py-4">{s.status}</td>
                    <td className="px-6 py-4 text-right"></td>
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

