import { useEffect, useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { InsatsCombobox } from "../../components/ui/insats-combobox";
import { KundCombobox } from "../../components/ui/kund-combobox";
import { Input } from "../../components/ui/input";
import { addShift, getShifts } from "../../lib/api";
import { ShiftEntry } from "@/types/types";
import toast from "react-hot-toast";

export const RegisteraTidPage = (): JSX.Element => {
  const [customer, setCustomer] = useState("");
  const [effort, setEffort] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [status, setStatus] = useState("Utförd");
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);

  async function loadShifts() {
    try {
      const data = await getShifts();
      setShifts(data);
    } catch (err) {
      toast.error("Kunde inte hämta besök");
    }
  }

  useEffect(() => {
    loadShifts();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addShift({
        customer_id: customer,
        effort_id: effort,
        date,
        hours: Number(hours),
        status
      });
      toast.success("Tid registrerad");
      setCustomer("");
      setEffort("");
      setDate("");
      setHours("");
      setStatus("Utförd");
      loadShifts();
    } catch {
      toast.error("Kunde inte spara besök");
    }
  }

  return (
    <Layout title="Registrera tid">
      <div className="mb-4 text-gray-600 text-base">
        Här kan du registrera nya insatser och se registrerade tider.
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <KundCombobox value={customer} onChange={setCustomer} placeholder="Välj kund" />
        <InsatsCombobox value={effort} onChange={setEffort} placeholder="Välj insats" />
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Input
          type="number"
          step="0.1"
          value={hours}
          onChange={e => setHours(e.target.value)}
          placeholder="Antal timmar"
        />
        <select
          className="w-full p-2 border border-gray-300 rounded"
          value={status}
          onChange={e => setStatus(e.target.value)}
        >
          <option value="Utförd">Utförd</option>
          <option value="Avbokad">Avbokad</option>
        </select>
        <Button type="submit" className="w-full">
          Lägg till tid
        </Button>
      </form>

      <Card className="flex-1 bg-white border border-gray-200 rounded-xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="px-6 py-4">Kund</th>
                  <th className="px-6 py-4">Insats</th>
                  <th className="px-6 py-4">Datum</th>
                  <th className="px-6 py-4">Timmar</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(s => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-2">{s.customer_name}</td>
                    <td className="px-6 py-2">{s.effort_name}</td>
                    <td className="px-6 py-2">{s.date?.slice(0,10) ?? "-"}</td>
                    <td className="px-6 py-2">{s.hours}</td>
                    <td className="px-6 py-2">{s.status}</td>
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

