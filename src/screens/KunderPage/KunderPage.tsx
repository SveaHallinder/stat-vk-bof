import React, { useState, useEffect } from "react";
import { Layout } from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { XCircle, Plus } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { createCustomer, getCustomers, deleteCustomer } from "../../lib/api";

interface Customer {
  id: string;
  initials: string;
  gender: string;
  birthYear: string;
  startDate: string;
  status: string;
  active: boolean;
  created_at?: string;
}

type NewCustomer = {
  initials: string;
  gender: string;
  birthYear: string;
  active: boolean;
  startDate: string;
};

export const KunderPage = (): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newCustomers, setNewCustomers] = useState<NewCustomer[]>([]);
  const [errors, setErrors] = useState<{ [idx: number]: { initials?: string; gender?: string; birthYear?: string } }>({});
  const navigate = useNavigate();

  const handleRowClick = (customer: Customer) => {
    navigate(`/kunder/${customer.id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCustomer(id);
      const updated = await getCustomers();
      setCustomers(updated);
      setDeleteId(null);
    } catch (err) {
      alert("Kunde inte radera kund");
    }
  };

  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const handleAddCustomer = () => {
    setNewCustomers(prev => [
      ...prev,
      { initials: "", gender: "Flicka", birthYear: "", active: true, startDate: getToday() },
    ]);
  };

  const handleChangeNewCustomer = (idx: number, field: keyof Omit<Customer, "id">, value: string) => {
    setNewCustomers(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    setErrors(prev => ({ ...prev, [idx]: { ...prev[idx], [field]: undefined } }));
  };

  const handleCancelAdd = (idx: number) => {
    setNewCustomers(prev => prev.filter((_, i) => i !== idx));
  };

  const validateCustomer = (c: NewCustomer) => {
    const err: { initials?: string; gender?: string; birthYear?: string } = {};
    if (!c.initials) err.initials = "Obligatoriskt fält";
    if (!c.gender) err.gender = "Obligatoriskt fält";
    if (!c.birthYear) err.birthYear = "Obligatoriskt fält";
    return err;
  };

  const handleSaveNewCustomers = async () => {
    if (newCustomers.length === 0) return;
    let hasError = false;
    const newErrors: typeof errors = {};
    newCustomers.forEach((c, idx) => {
      const err = validateCustomer(c);
      if (Object.keys(err).length > 0) {
        newErrors[idx] = err;
        hasError = true;
      }
    });
    setErrors(newErrors);
    if (hasError) return;
    try {
      for (const c of newCustomers) {
        await createCustomer({
          initials: c.initials,
          gender: c.gender,
          birthYear: Number(c.birthYear),
          startDate: c.startDate
        });
      }
      const updated = await getCustomers();
      setCustomers(updated);
      setNewCustomers([]);
      setErrors({});
    } catch (err) {
      // Visa toast eller annan feedback här om du vill
    }
  };

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, []);

  return (
    <Layout activeItem="Kunder" title="Kunder">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-3 px-7 py-3 rounded-full border border-gray-300 text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] hover:shadow-md transition"
          onClick={handleAddCustomer}
        >
          <Plus className="w-6 h-6 font-bold" />
          <span>Lägg till ny kund</span>
        </Button>
        {newCustomers.length > 0 && (
          <Button
            variant="default"
            className="ml-4 px-6 py-3 rounded-lg text-lg font-semibold"
            onClick={handleSaveNewCustomers}
            disabled={newCustomers.length === 0 || newCustomers.some((c) => !c.initials || !c.gender || !c.birthYear)}
          >
            Spara alla
          </Button>
        )}
      </div>
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Kund-ID</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Initialer</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Kön</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Födelseår</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-center">Startdatum</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {newCustomers.map((c, idx) => (
                  <tr key={idx} className="bg-gray-50">
                    <td className="px-6 py-3 text-gray-400 italic text-center">(genereras)</td>
                    <td className="px-6 py-3 text-center">
                      <input
                        type="text"
                        placeholder="Initialer"
                        className={`border rounded px-2 py-1 w-full text-center focus:outline-none focus:ring-2 ${errors[idx]?.initials ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                        value={c.initials}
                        onChange={e => handleChangeNewCustomer(idx, "initials", e.target.value)}
                      />
                      {errors[idx]?.initials && <span className="text-red-500 text-xs mt-1 block">{errors[idx].initials}</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <select
                        className={`border rounded px-2 py-1 w-full text-center focus:outline-none focus:ring-2 ${errors[idx]?.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                        value={c.gender}
                        onChange={e => handleChangeNewCustomer(idx, "gender", e.target.value)}
                      >
                        <option value="">Välj kön</option>
                        <option value="Flicka">Flicka</option>
                        <option value="Pojke">Pojke</option>
                        <option value="Icke-binär">Icke-binär</option>
                      </select>
                      {errors[idx]?.gender && <span className="text-red-500 text-xs mt-1 block">{errors[idx].gender}</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <input
                        type="text"
                        placeholder="Födelseår"
                        className={`border rounded px-2 py-1 w-full text-center focus:outline-none focus:ring-2 ${errors[idx]?.birthYear ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                        value={c.birthYear}
                        onChange={e => handleChangeNewCustomer(idx, "birthYear", e.target.value)}
                      />
                      {errors[idx]?.birthYear && <span className="text-red-500 text-xs mt-1 block">{errors[idx].birthYear}</span>}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="inline-block px-3 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-800">
                        Pågående
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full text-center"
                        value={c.startDate}
                        onChange={e => handleChangeNewCustomer(idx, "startDate", e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => handleCancelAdd(idx)}>
                        Avbryt
                      </Button>
                    </td>
                  </tr>
                ))}
                {customers.map((customer, idx) => (
                  <tr key={customer.id + idx} className="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onClick={() => handleRowClick(customer)}>
                    <td className="px-6 py-4 font-medium text-gray-800 text-center">{customer.id}</td>
                    <td className="px-6 py-4 text-gray-600 text-center">{customer.initials}</td>
                    <td className="px-6 py-4 text-gray-600 text-center">{customer.gender}</td>
                    <td className="px-6 py-4 text-gray-600 text-center">{customer.birthYear}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                        customer.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {customer.active ? "Pågående" : "Avslutad"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-center">{customer.created_at?.slice(0, 10)}</td>
                    <td className="px-6 py-4 text-right text-center">
                      <div className="flex gap-2 items-center justify-end" onClick={e => e.stopPropagation()}>
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full"
                          title="Radera kund"
                          onClick={() => setDeleteId(customer.id)}
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
                <div className="text-lg font-semibold mb-4">Är du säker att du vill radera denna kund?</div>
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
                    onClick={() => handleDelete(deleteId)}
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