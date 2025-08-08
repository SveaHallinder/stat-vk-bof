import { useState } from "react";
import { KundCombobox } from "../../../components/ui/kund-combobox";
import { InsatsCombobox } from "../../../components/ui/insats-combobox";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { addShift } from "../../../lib/api";
import toast from "react-hot-toast";

export const ShiftForm = () => {
  const [customer, setCustomer] = useState("");
  const [effort, setEffort] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("");
  const [status, setStatus] = useState("Utförd");

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
      setCustomer("");
      setEffort("");
      setDate("");
      setHours("");
      setStatus("Utförd");
      toast.success("Besök sparat");
    } catch {
      toast.error("Kunde inte spara besök");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-8">
      <KundCombobox value={customer} onChange={setCustomer} placeholder="Välj kund" />
      <InsatsCombobox value={effort} onChange={setEffort} placeholder="Välj insats" />
      <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <Input type="number" step="0.1" value={hours} onChange={e => setHours(e.target.value)} placeholder="Antal timmar" />
      <select className="w-full p-2 border border-gray-300 rounded" value={status} onChange={e => setStatus(e.target.value)}>
        <option value="Utförd">Utförd</option>
        <option value="Avbokad">Avbokad</option>
      </select>
      <Button type="submit" className="w-full">Spara</Button>
    </form>
  );
};
