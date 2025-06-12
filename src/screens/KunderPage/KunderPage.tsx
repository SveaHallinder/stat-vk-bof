import React, { useState } from "react";
import { Sidebar } from "../DashboardRedesign/components/Sidebar";
import { useNavigate } from "react-router-dom";
import { MoreHorizontal, Edit2, PlusCircle, FileText, XCircle } from "lucide-react";

interface Customer {
  id: string;
  initials: string;
  gender: string;
  birthYear: string;
  startDate: string;
  status: string;
  lastVisit: string;
}

const initialCustomers: Customer[] = [
  { id: "1", initials: "AL", gender: "Flicka", birthYear: "2007", startDate: "2025-03-25", status: "Pågående", lastVisit: "2025-04-15" },
  { id: "2", initials: "BN", gender: "Pojke", birthYear: "2012", startDate: "2025-03-24", status: "Pågående", lastVisit: "2025-04-15" },
  { id: "3", initials: "RE", gender: "Icke-binär", birthYear: "2012", startDate: "2025-03-25", status: "Pågående", lastVisit: "2025-04-15" },
  { id: "4", initials: "AL", gender: "Flicka", birthYear: "2007", startDate: "2025-03-25", status: "Avslutad", lastVisit: "2025-04-15" },
  { id: "5", initials: "AL", gender: "Flicka", birthYear: "2011", startDate: "2025-03-25", status: "Pågående", lastVisit: "2025-04-15" },
];

export const KunderPage = (): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [newRows, setNewRows] = useState<Customer[]>([]);
  const [showAddRow, setShowAddRow] = useState(false);
  const navigate = useNavigate();

  const handleAddRow = () => {
    setShowAddRow(true);
    setNewRows([...newRows, { id: (customers.length + newRows.length + 1).toString(), initials: "", gender: "", birthYear: "", startDate: "", status: "Pågående", lastVisit: "" }]);
  };

  const handleNewRowChange = (idx: number, field: keyof Customer, value: string) => {
    const updated = [...newRows];
    updated[idx][field] = value;
    setNewRows(updated);
  };

  const handleRemoveNewRow = (idx: number) => {
    const updated = [...newRows];
    updated.splice(idx, 1);
    setNewRows(updated);
    if (updated.length === 0) setShowAddRow(false);
  };

  const handleSaveNewRows = () => {
    setCustomers([...customers, ...newRows]);
    setNewRows([]);
    setShowAddRow(false);
  };

  const handleCancel = () => {
    setNewRows([]);
    setShowAddRow(false);
  };

  // Navigera till kundprofil
  const handleRowClick = (customer: Customer) => {
    navigate(`/kunder/${customer.id}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex">
      <Sidebar activeItem="Kunder" />
      <div className="flex-1 flex flex-col">
        <div className="px-12 pt-10 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-[#333]">Kunder</h1>
            <button
              className="bg-[#17694c] text-white font-semibold px-6 py-2 rounded-full text-lg hover:bg-[#145c41] transition"
              onClick={handleAddRow}
            >
              Lägg till kund
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-0 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#eaf6f1] text-[#17694c]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Kund-ID</th>
                  <th className="px-4 py-3 font-semibold">Initial</th>
                  <th className="px-4 py-3 font-semibold">Kön</th>
                  <th className="px-4 py-3 font-semibold">Födelseår</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Startdatum</th>
                  <th className="px-4 py-3 font-semibold">Senaste besök</th>
                  <th className="px-4 py-3 font-semibold">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {showAddRow && newRows.map((row, idx) => (
                  <tr key={idx} className="bg-[#f6fbf9] border-b border-[#eaf6f1]">
                    <td className="px-4 py-2"><input type="text" className="border rounded px-2 py-1 w-16" value={row.id} onChange={e => handleNewRowChange(idx, "id", e.target.value)} /></td>
                    <td className="px-4 py-2"><input type="text" className="border rounded px-2 py-1 w-24" value={row.initials} onChange={e => handleNewRowChange(idx, "initials", e.target.value)} placeholder="Skriv initialer" /></td>
                    <td className="px-4 py-2">
                      <select className="border rounded px-2 py-1 w-28" value={row.gender} onChange={e => handleNewRowChange(idx, "gender", e.target.value)}>
                        <option value="">Välj kön</option>
                        <option value="Flicka">Flicka</option>
                        <option value="Pojke">Pojke</option>
                        <option value="Icke-binär">Icke-binär</option>
                      </select>
                    </td>
                    <td className="px-4 py-2"><input type="text" className="border rounded px-2 py-1 w-20" value={row.birthYear} onChange={e => handleNewRowChange(idx, "birthYear", e.target.value)} placeholder="Välj år" /></td>
                    <td className="px-4 py-2"><span className="inline-block px-3 py-1 rounded-full bg-[#eaf6f1] text-[#17694c] font-semibold">{row.status}</span></td>
                    <td className="px-4 py-2"><input type="date" className="border rounded px-2 py-1 w-32" value={row.startDate} onChange={e => handleNewRowChange(idx, "startDate", e.target.value)} /></td>
                    <td className="px-4 py-2">-</td>
                    <td className="px-4 py-2">
                      <button className="text-red-500 font-bold px-2" onClick={() => handleRemoveNewRow(idx)} type="button">Ta bort</button>
                      <button className="text-green-600 font-bold px-2" onClick={handleSaveNewRows} type="button">Spara</button>
                    </td>
                  </tr>
                ))}
                {customers.map((customer, idx) => (
                  <tr key={customer.id + idx} className="hover:bg-[#f6fbf9] cursor-pointer border-b border-[#eaf6f1]" onClick={() => handleRowClick(customer)}>
                    <td className="px-4 py-2 font-semibold">{customer.id}</td>
                    <td className="px-4 py-2">{customer.initials}</td>
                    <td className="px-4 py-2">{customer.gender}</td>
                    <td className="px-4 py-2">{customer.birthYear}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-3 py-1 rounded-full font-semibold ${customer.status === "Pågående" ? "bg-[#eaf6f1] text-[#17694c]" : "bg-red-100 text-red-600"}`}>{customer.status}</span>
                    </td>
                    <td className="px-4 py-2">{customer.startDate}</td>
                    <td className="px-4 py-2">{customer.lastVisit}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Ändra kunduppgifter"><Edit2 className="w-5 h-5 text-[#17694c]" /></button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Lägg till insats"><PlusCircle className="w-5 h-5 text-[#17694c]" /></button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Visa kundhistorik"><FileText className="w-5 h-5 text-[#17694c]" /></button>
                        <button className="p-1 hover:bg-gray-100 rounded" title="Avsluta kund"><XCircle className="w-5 h-5 text-red-500" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {showAddRow && (
              <div className="flex justify-between items-center px-6 py-4 border-t border-[#eaf6f1] bg-[#f6fbf9]">
                <span className="font-semibold text-[#17694c]">Lägg till kund</span>
                <div className="flex gap-4">
                  <button className="px-6 py-2 rounded-full border border-gray-300 text-[#17694c] bg-white font-semibold hover:bg-gray-50 transition" onClick={handleCancel}>Avbryt</button>
                  <button className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition" onClick={handleSaveNewRows}>Spara och fortsätt</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};