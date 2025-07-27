import { useState, useEffect } from "react";
import { Layout } from "../../components/Layout";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, Loader2 } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { getCustomer, updateCustomer, getCustomerEfforts, getCasesForCustomerEffort, updateCase } from "../../lib/api";
import { BehandlareCombobox } from "../../components/ui/behandlare-combobox";
import toast from "react-hot-toast";

export const CustomerProfile = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [editCustomerErrors, setEditCustomerErrors] = useState<{ initials?: string; birthYear?: string; gender?: string }>({});
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [efforts, setEfforts] = useState<any[]>([]);
  const [loadingEfforts, setLoadingEfforts] = useState(true);
  const [openEffort, setOpenEffort] = useState<any | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [editCase, setEditCase] = useState<any | null>(null);
  const [savingCase, setSavingCase] = useState(false);

  useEffect(() => {
    if (id) {
      getCustomer(id).then(setCustomer).catch(() => setCustomer(null));
      setLoadingEfforts(true);
      getCustomerEfforts(id)
        .then(data => setEfforts(data))
        .catch(() => setEfforts([]))
        .finally(() => setLoadingEfforts(false));
    }
  }, [id]);

  // Öppna rätt insats automatiskt om state.openEffort finns
  useEffect(() => {
    if (!efforts || !Array.isArray(efforts) || !location.state || !location.state.openEffort) return;
    const match = efforts.find(eff =>
      eff.effort_name === location.state.openEffort ||
      eff.effort_id === location.state.openEffort
    );
    if (match) {
      handleOpenEffort(match);
    }
  }, [efforts, location.state]);

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Laddar kunddata...</div>;
  }

  const customerTitle = `${customer.initials} - ${customer.gender} (${customer.birthYear})`;

  function validateEditCustomer(c: any) {
    const err: { initials?: string; birthYear?: string; gender?: string } = {};
    if (!c.initials) err.initials = "Obligatoriskt fält";
    if (!c.birthYear) err.birthYear = "Obligatoriskt fält";
    else if (!/^\d{4}$/.test(c.birthYear)) err.birthYear = "Födelseår måste vara 4 siffror";
    if (!c.gender) err.gender = "Obligatoriskt fält";
    return err;
  }

  const handleOpenEdit = () => {
    setEditCustomer({
      initials: customer.initials || "",
      birthYear: customer.birthYear || "",
      gender: customer.gender || "Flicka",
      startDate: customer.created_at ? customer.created_at.slice(0, 10) : "",
      active: typeof customer.active === "boolean" ? customer.active : true
    });
    setEditCustomerErrors({});
    setEditOpen(true);
  };

  const handleEditCustomerChange = (field: string, value: any) => {
    setEditCustomer((prev: any) => {
      let updated;
      if (field === 'active') {
        updated = { ...prev, active: value === 'Aktiv' || value === true };
      } else {
        updated = { ...prev, [field]: value };
      }
      setEditCustomerErrors(validateEditCustomer(updated));
      return updated;
    });
  };

  const handleSaveEdit = async () => {
    if (!editCustomer || !id) return;
    const errors = validateEditCustomer(editCustomer);
    setEditCustomerErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      await updateCustomer(id, {
        initials: editCustomer.initials,
        gender: editCustomer.gender,
        birthYear: Number(editCustomer.birthYear),
        active: editCustomer.active,
        startDate: editCustomer.startDate
      });
      const updated = await getCustomer(id);
      setCustomer(updated);
      setEditOpen(false);
      toast.success("Kund uppdaterad!");
    } catch (error) {
      toast.error("Kunde inte spara ändringar");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEffort = async (effort: any) => {
    setOpenEffort(effort);
    setLoadingCases(true);
    try {
      const data = await getCasesForCustomerEffort(customer.id.toString(), effort.effort_id.toString());
      setCases(data);
    } catch {
      setCases([]);
    } finally {
      setLoadingCases(false);
    }
  };
  const handleCloseEffort = () => {
    setOpenEffort(null);
    setCases([]);
  };

  const handleEditCase = (c: any) => {
    setEditCase({
      ...c,
      handler1_id: c.handler1_id !== undefined && c.handler1_id !== null ? String(c.handler1_id) : "",
      handler2_id: c.handler2_id !== undefined && c.handler2_id !== null ? String(c.handler2_id) : "",
      hours: c.hours || "",
      status: c.status || "Utförd",
      date: c.date ? c.date.slice(0, 10) : ""
    });
  };
  const handleCloseEditCase = () => {
    setEditCase(null);
  };
  const handleSaveEditCase = async () => {
    if (!editCase) return;
    setSavingCase(true);
    try {
      await updateCase(editCase.id, {
        customer_id: customer.id,
        effort_id: openEffort.effort_id,
        date: editCase.date,
        handler1_id: editCase.handler1_id,
        handler2_id: editCase.handler2_id,
        hours: editCase.hours,
        status: editCase.status
      });
      toast.success("Ärendet uppdaterat!");
      // Uppdatera listan
      if (openEffort) {
        const data = await getCasesForCustomerEffort(customer.id.toString(), openEffort.effort_id.toString());
        setCases(data);
      }
      setEditCase(null);
    } catch {
      toast.error("Kunde inte spara ändringar");
    } finally {
      setSavingCase(false);
    }
  };

  return (
    <Layout title="Kundprofil">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/kunder')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-4xl font-light text-[#333]">{customerTitle}</h1>
          <Badge variant={customer.active ? "default" : "destructive"}>{customer.active ? "Aktiv" : "Avslutad"}</Badge>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleOpenEdit}>
          <Edit className="w-4 h-4" /> Redigera kund
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vänsterkolumn: kunduppgifter */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Kunduppgifter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Kund-ID</span>
                <span className="font-medium text-gray-800">{customer.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Initialer</span>
                <span className="font-medium text-gray-800">{customer.initials}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Födelseår</span>
                <span className="font-medium text-gray-800">{customer.birthYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Kön</span>
                <span className="font-medium text-gray-800">{customer.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Startdatum</span>
                <span className="font-medium text-gray-800">{customer.created_at?.slice(0, 10)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Högerkolumn: insatser */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Insatser</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingEfforts ? (
                <div className="text-gray-500 text-center py-8">Laddar insatser...</div>
              ) : efforts.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Inga insatser registrerade för denna kund ännu.</div>
              ) : (
                efforts.map((eff, idx) => (
                  <Card key={idx} className="bg-gray-50 hover:bg-green-50 transition">
                    <CardContent className="p-4 flex flex-col gap-2 relative">
                      <div className="font-bold text-lg text-[#17694c]">{eff.effort_name}</div>
                      <div className="text-sm text-gray-600">Start: {eff.start_date?.slice(0, 10) || '-'}</div>
                      <div className="text-sm text-gray-600 mb-2">Behandlare: {eff.handlers && eff.handlers.filter(Boolean).length > 0 ? eff.handlers.filter(Boolean).join(", ") : '-'}</div>
                      <div className="flex justify-end mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full px-4 py-1 text-xs font-medium shadow-sm border-gray-300 hover:bg-[#eaf6f1] transition"
                          onClick={() => navigate(`/registrera-tid?customer=${customer.id}&effort=${eff.effort_id}`)}
                        >
                          Registrera tid
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Modal för Redigera kund */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)}>
        <div className="p-8 max-w-lg w-full" style={{ minWidth: 500 }}>
          <h2 className="text-xl font-semibold mb-4">Redigera kund</h2>
          {(editCustomer !== null) ? (
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700">Initialer</label>
              <input
                type="text"
                className={`border rounded px-3 py-2 ${editCustomerErrors.initials ? 'border-red-500' : ''}`}
                value={editCustomer.initials}
                onChange={e => handleEditCustomerChange('initials', e.target.value)}
                placeholder="Initialer"
              />
              {editCustomerErrors.initials && <span className="text-red-500 text-xs mt-1">{editCustomerErrors.initials}</span>}
              <label className="text-sm font-medium text-gray-700">Födelseår</label>
              <input
                type="text"
                className={`border rounded px-3 py-2 ${editCustomerErrors.birthYear ? 'border-red-500' : ''}`}
                value={editCustomer.birthYear}
                onChange={e => handleEditCustomerChange('birthYear', e.target.value)}
                placeholder="Födelseår"
              />
              {editCustomerErrors.birthYear && <span className="text-red-500 text-xs mt-1">{editCustomerErrors.birthYear}</span>}
              <label className="text-sm font-medium text-gray-700">Kön</label>
              <select
                className={`border rounded px-3 py-2 ${editCustomerErrors.gender ? 'border-red-500' : ''}`}
                value={editCustomer.gender}
                onChange={e => handleEditCustomerChange('gender', e.target.value)}
              >
                <option value="Flicka">Flicka</option>
                <option value="Pojke">Pojke</option>
                <option value="Icke-binär">Icke-binär</option>
              </select>
              {editCustomerErrors.gender && <span className="text-red-500 text-xs mt-1">{editCustomerErrors.gender}</span>}
              <label className="text-sm font-medium text-gray-700">Startdatum</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={editCustomer.startDate}
                onChange={e => handleEditCustomerChange('startDate', e.target.value)}
                placeholder="Startdatum"
              />
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="border rounded px-3 py-2"
                value={editCustomer.active ? "Aktiv" : "Avslutad"}
                onChange={e => handleEditCustomerChange('active', e.target.value)}
              >
                <option value="Aktiv">Aktiv</option>
                <option value="Avslutad">Avslutad</option>
              </select>
            </div>
          ) : (
            <div className="text-gray-500">Laddar formulär...</div>
          )}
          <div className="flex gap-4 justify-end mt-6">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Avbryt</Button>
            <Button variant="default" onClick={handleSaveEdit} disabled={saving || !editCustomer || Object.keys(editCustomerErrors).length > 0}>
              {saving ? <><Loader2 className="animate-spin w-5 h-5 mr-2 inline"/>Sparar...</> : "Spara"}
            </Button>
          </div>
        </div>
      </Modal>
      {/* Modal för ärenden kopplade till insats */}
      <Modal open={!!openEffort} onClose={handleCloseEffort}>
        <div className="p-8 max-w-xl w-full" style={{ minWidth: 800 }}>
          <h2 className="text-xl font-bold mb-4 text-[#17694c]">
            Ärenden för insats: {openEffort?.effort_name}
          </h2>
          {loadingCases ? (
            <div className="text-gray-500 text-center py-8">Laddar ärenden...</div>
          ) : cases.length === 0 ? (
            <div className="text-gray-500 text-center py-8">Inga ärenden registrerade för denna insats.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider text-xs">Datum</th>
                  <th className="px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider text-xs">Behandlare 1</th>
                  <th className="px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider text-xs">Behandlare 2</th>
                  <th className="px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider text-xs">Timmar</th>
                  <th className="px-4 py-2 font-semibold text-gray-500 uppercase tracking-wider text-xs">Status</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c, idx) => (
                  <tr key={c.id || idx} className="border-b border-gray-100 hover:bg-green-50 cursor-pointer" onClick={() => handleEditCase(c)}>
                    <td className="px-4 py-2">{c.date?.slice(0, 10) || '-'}</td>
                    <td className="px-4 py-2">{c.handler1_name || '-'}</td>
                    <td className="px-4 py-2">{c.handler2_name || '-'}</td>
                    <td className="px-4 py-2">{c.hours || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full font-semibold ${c.status === "Utförd" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
      {/* Modal för redigering av ärende */}
      <Modal open={!!editCase} onClose={handleCloseEditCase}>
        <div className="p-8 max-w-md w-full" style={{ minWidth: 600 }}>
          <h2 className="text-lg font-bold mb-4 text-[#17694c]">Redigera ärende</h2>
          {editCase && (
            <form className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700">Datum</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={editCase.date?.slice(0, 10) || ""}
                onChange={e => setEditCase({ ...editCase, date: e.target.value })}
              />
              <label className="text-sm font-medium text-gray-700">Behandlare 1</label>
              <BehandlareCombobox
                value={editCase.handler1_id || ""}
                onChange={value => setEditCase({ ...editCase, handler1_id: value })}
              />
              <label className="text-sm font-medium text-gray-700">Behandlare 2</label>
              <BehandlareCombobox
                value={editCase.handler2_id || ""}
                onChange={value => setEditCase({ ...editCase, handler2_id: value })}
              />
              <label className="text-sm font-medium text-gray-700">Timmar</label>
              <input
                type="number"
                className="border rounded px-3 py-2"
                value={editCase.hours || ""}
                onChange={e => setEditCase({ ...editCase, hours: e.target.value })}
              />
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="border rounded px-3 py-2"
                value={editCase.status}
                onChange={e => setEditCase({ ...editCase, status: e.target.value })}
              >
                <option value="Utförd">Utförd</option>
                <option value="Avbokad">Avbokad</option>
              </select>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={handleCloseEditCase} disabled={savingCase}>Avbryt</Button>
                <Button variant="default" onClick={handleSaveEditCase} disabled={savingCase}>
                  {savingCase ? <><Loader2 className="animate-spin w-5 h-5 mr-2 inline"/>Sparar...</> : "Spara"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </Layout>
  );
};