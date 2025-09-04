import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { useNavigate } from "react-router-dom";
import { XCircle, Plus, ArrowUpDown, ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createCustomer, getCustomers, softDeleteCustomer, reactivateCustomer } from "@/lib/api";
import toast from "react-hot-toast";
import { Customer } from "@/types/types";


type NewCustomer = {
  initials: string;
  gender: string;
  birth_year: number;
  active: boolean;
  startDate: string;
};

export const KunderPage = (): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(50);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [newCustomers, setNewCustomers] = useState<NewCustomer[]>([]);
  const [errors, setErrors] = useState<{ [idx: number]: { initials?: string; gender?: string; birth_year?: string } }>({});
  const [sortField, setSortField] = useState<string>("id");
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const navigate = useNavigate();
  const [savingNew, setSavingNew] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const handleRowClick = (customer: Customer) => {
    navigate(`/kunder/${customer.id}`);
  };

  const handleDelete = async (id: number) => {
    setDeleting(true);
    try {
      await softDeleteCustomer(id.toString());
      const updated = await getCustomers(includeInactive, { page, limit });
      setCustomers(updated);
      setDeleteId(null);
      toast.success("Kund avaktiverad!");
    } catch (err: any) {
      toast.error(err?.message || "Kunde inte avaktivera kund");
    } finally {
      setDeleting(false);
    }
  };

  const handleReactivate = async (id: number) => {
    setReactivating(true);
    try {
      await reactivateCustomer(id.toString());
      const updated = await getCustomers(includeInactive, { page, limit });
      setCustomers(updated);
      toast.success("Kund återaktiverad!");
    } catch (err: any) {
      toast.error(err?.message || "Kunde inte återaktivera kund");
    } finally {
      setReactivating(false);
    }
  };

  const getToday = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const handleAddCustomer = () => {
    setNewCustomers(prev => [
      ...prev,
      { initials: "", gender: "Flicka", birth_year: 0, active: true, startDate: getToday() },
    ]);
  };

  const handleChangeNewCustomer = (idx: number, field: keyof NewCustomer, value: string | number) => {
    // Konvertera initialer till versaler automatiskt
    if (field === 'initials' && typeof value === 'string') {
      value = value.toUpperCase();
    }
    
    setNewCustomers(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
    // Validera direkt när man skriver
    setErrors(prev => {
      const updated = { ...prev };
      const updatedCustomer = { ...newCustomers[idx], [field]: value };
      updated[idx] = validateCustomer(updatedCustomer);
      return updated;
    });
  };

  const handleCancelAdd = (idx: number) => {
    setNewCustomers(prev => prev.filter((_, i) => i !== idx));
  };

  const validateCustomer = (c: NewCustomer) => {
    const err: { initials?: string; gender?: string; birth_year?: string } = {};
    if (!c.initials) err.initials = "Obligatoriskt fält";
    if (!c.gender) err.gender = "Obligatoriskt fält";
    if (!c.birth_year) err.birth_year = "Obligatoriskt fält";
    else if (!/^\d{4}$/.test(c.birth_year.toString())) err.birth_year = "Födelseår måste vara 4 siffror";
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
    setSavingNew(true);
    try {
      await Promise.all(
        newCustomers.map(c =>
          createCustomer({
            initials: c.initials,
            gender: c.gender,
            birthYear: c.birth_year,
            startDate: c.startDate
          })
        )
      );
      const updated = await getCustomers(includeInactive, { page, limit });
      setCustomers(updated);
      setNewCustomers([]);
      setErrors({});
      toast.success("Kund/kunder sparade!");
    } catch (err) {
      toast.error("Kunde inte spara kund/kunder");
    } finally {
      setSavingNew(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    getCustomers(includeInactive, { page, limit })
      .then(setCustomers)
      .catch(() => toast.error("Kunde inte hämta kunder"))
      .finally(() => setIsLoading(false));
  }, [includeInactive, page, limit]);

  // Sortera kunder
  const sortedCustomers = [...customers].sort((a, b) => {
    let av: any = a[sortField as keyof Customer];
    let bv: any = b[sortField as keyof Customer];
    // Om det är datum, sortera som datum
    if (sortField === "created_at") {
      av = av ? new Date(av) : new Date(0);
      bv = bv ? new Date(bv) : new Date(0);
    }
    // Om det är status, sortera på active-flaggan
    if (sortField === "status") {
      av = a.active ? 1 : 0;
      bv = b.active ? 1 : 0;
    }
    if (av < bv) return sortAsc ? -1 : 1;
    if (av > bv) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <Layout title="Kunder">
      {/* Header section */}
      <div className="flex flex-col items-center mobile:flex-row mobile:items-center mobile:justify-between mb-6 mobile:mb-8 gap-4 mobile:gap-0">
        <Button
          variant="outline"
          className="w-full max-w-[350px] mobile:w-full flex items-center justify-center gap-3 px-4 mobile:px-7 py-3 rounded-lg text-base mobile:text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] hover:shadow-md transition"
          onClick={handleAddCustomer}
        >
          <Plus className="w-5 h-5 mobile:w-6 mobile:h-6 font-bold" />
          <span>Lägg till ny kund</span>
        </Button>
        {newCustomers.length > 0 && (
          <Button
            variant="default"
            className="w-full mobile:max-w-[350px] mobile:w-auto px-4 mobile:px-6 py-3 rounded-lg text-base mobile:text-lg font-semibold"
            onClick={handleSaveNewCustomers}
            disabled={savingNew || newCustomers.some((c) => Object.keys(validateCustomer(c)).length > 0)}>
            {savingNew ? <><Loader2 className="animate-spin w-5 h-5 mr-2 inline"/>Sparar...</> : "Spara alla"}
          </Button>
        )}
        <label className="flex items-center gap-2 text-sm mt-2 mobile:mt-0">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
          />
          Inkludera inaktiva kunder
        </label>
      </div>

      {/* Table card */}
      <Card className="flex-1 w-full w-auto min-w-full bg-white rounded-xl shadow-sm mobile:w-full mobile:max-w-[350px]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { label: "Kund-ID", field: "id" },
                    { label: "Initialer", field: "initials" },
                    { label: "Kön", field: "gender" },
                    { label: "Födelseår", field: "birthYear" },
                    { label: "Status", field: "status" },
                    { label: "Startdatum", field: "created_at" },
                  ].map(col => (
                    <th
                      key={col.field}
                      className="px-3 mobile:px-6 py-3 mobile:py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs mobile:text-sm text-center cursor-pointer select-none group"
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
                          sortAsc ? <ArrowUp className="w-3 h-3 mobile:w-4 mobile:h-4 inline" /> : <ArrowDown className="w-3 h-3 mobile:w-4 mobile:h-4 inline" />
                        ) : (
                          <ArrowUpDown className="w-3 h-3 mobile:w-4 mobile:h-4 opacity-30 group-hover:opacity-60 inline" />
                        )}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 mobile:px-6 py-3 mobile:py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs mobile:text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {newCustomers.map((c, idx) => (
                  <tr key={idx} className="bg-gray-50">
                    <td className="px-3 mobile:px-6 py-3 text-gray-400 italic text-center text-xs mobile:text-sm">(genereras)</td>
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <input
                        type="text"
                        placeholder="Initialer"
                        className={`border rounded px-2 py-1 w-full text-center text-xs mobile:text-sm focus:outline-none focus:ring-2 ${errors[idx]?.initials ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                        value={c.initials}
                        onChange={e => handleChangeNewCustomer(idx, "initials", e.target.value)}
                      />
                      {errors[idx]?.initials && <span className="text-red-500 text-xs mt-1 block">{errors[idx].initials}</span>}
                    </td>
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <select
                        className={`border rounded px-2 py-1 w-full text-center text-xs mobile:text-sm focus:outline-none focus:ring-2 ${errors[idx]?.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
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
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <input
                        type="text"
                        placeholder="Födelseår"
                        className={`border rounded px-2 py-1 w-full text-center text-xs mobile:text-sm focus:outline-none focus:ring-2 ${errors[idx]?.birth_year ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                        value={c.birth_year}
                        onChange={e => handleChangeNewCustomer(idx, "birth_year", parseInt(e.target.value) || 0)}
                      />
                      {errors[idx]?.birth_year && <span className="text-red-500 text-xs mt-1 block">{errors[idx].birth_year}</span>}
                    </td>
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <span className="inline-block px-2 mobile:px-3 py-1 text-xs rounded-full font-semibold bg-green-100 text-green-800">
                        Pågående
                      </span>
                    </td>
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <input
                        type="date"
                        className="border rounded px-2 py-1 w-full text-center text-xs mobile:text-sm"
                        value={c.startDate}
                        onChange={e => handleChangeNewCustomer(idx, "startDate", e.target.value)}
                      />
                    </td>
                    <td className="px-3 mobile:px-6 py-3 text-center">
                      <Button size="sm" variant="outline" onClick={() => handleCancelAdd(idx)} className="text-xs mobile:text-sm">
                        Avbryt
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={`hover:bg-gray-50 cursor-pointer border-t border-gray-200 ${!customer.active ? 'bg-gray-100 text-gray-400' : ''}`}
                    onClick={() => handleRowClick(customer)}
                  >
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 font-medium text-center text-xs mobile:text-sm">{customer.id}</td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-center text-xs mobile:text-sm">{customer.active ? customer.initials : '—'}</td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-center text-xs mobile:text-sm">{customer.gender}</td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-center text-xs mobile:text-sm">{customer.birth_year}</td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-center">
                      <span className={`inline-block px-2 mobile:px-3 py-1 text-xs rounded-full font-semibold ${
                        customer.active
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}>
                        {customer.active ? "Pågående" : "Avslutad"}
                      </span>
                    </td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-center text-xs mobile:text-sm">{customer.created_at?.slice(0, 10)}</td>
                    <td className="px-3 mobile:px-6 py-3 mobile:py-4 text-right text-center">
                      <div className="flex gap-2 items-center justify-end" onClick={e => e.stopPropagation()}>
                        {customer.active ? (
                          <button
                            className="p-1.5 mobile:p-2 hover:bg-gray-200 rounded-full"
                            title="Avaktivera kund"
                            onClick={() => setDeleteId(customer.id)}
                          >
                            <XCircle className="w-4 h-4 mobile:w-5 mobile:h-5 text-red-500" />
                          </button>
                        ) : (
                          <button
                            className="p-1.5 mobile:p-2 hover:bg-gray-200 rounded-full"
                            title="Återaktivera kund"
                            onClick={() => handleReactivate(customer.id)}
                            disabled={reactivating}
                          >
                            {reactivating ? <Loader2 className="animate-spin w-3 h-3 mobile:w-4 mobile:h-4 inline"/> : <span className="text-green-600 font-semibold text-xs mobile:text-sm">Återaktivera</span>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className="flex items-center justify-between p-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Sida {page} • Visar {customers.length} rader
            </div>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={isLoading || page === 1}
              >
                Föregående
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={isLoading || customers.length < limit}
              >
                Nästa
              </Button>
            </div>
          </div>
          {/* Popup för radering */}
          {deleteId && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
              <div className="bg-white rounded-lg shadow-lg p-6 mobile:p-8 max-w-sm w-full flex flex-col items-center">
                <div className="text-base mobile:text-lg font-semibold mb-4 text-center">Vill du verkligen radera denna kund?</div>
                <div className="text-sm text-gray-600 mb-4 text-center">Den försvinner inte helt men initialerna raderas permanent.</div>
                <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 mt-2 w-full">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteId(null)}
                    className="w-full mobile:w-auto min-w-[100px]"
                  >
                    Avbryt
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(deleteId)}
                    className="w-full mobile:w-auto min-w-[100px]"
                    disabled={deleting}
                  >
                    {deleting ? <><Loader2 className="animate-spin w-5 h-5 mr-2 inline"/>Raderar...</> : "Radera"}
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
