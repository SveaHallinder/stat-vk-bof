import React, { useState, useEffect } from "react";
import { Layout } from "../../components/Layout";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, PlusCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "../../components/ui/badge";
import { Modal } from "../../components/ui/modal";
import { getCustomer, updateCustomer } from "../../lib/api";

export const CustomerProfile = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [newEffortOpen, setNewEffortOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // Lägg till mockdata för insatser
  const mockEfforts = [
    { name: "Repulse", start: "2025-03-25", handlers: ["Anna L", "Jessica S"] },
    { name: "Samverkan", start: "2025-04-02", handlers: ["Anna L", "Malin K"] },
  ];
  const [efforts] = useState(mockEfforts);

  useEffect(() => {
    if (id) {
      getCustomer(id).then(setCustomer).catch(() => setCustomer(null));
    }
  }, [id]);

  if (!customer) {
    return <div className="p-8 text-center text-gray-500">Laddar kunddata...</div>;
  }

  const customerTitle = `${customer.initials} - ${customer.gender} (${customer.birthYear})`;

  const handleOpenEdit = () => {
    setEditCustomer({
      initials: customer.initials || "",
      birthYear: customer.birthYear || "",
      gender: customer.gender || "Flicka",
      startDate: customer.created_at ? customer.created_at.slice(0, 10) : "",
      active: typeof customer.active === "boolean" ? customer.active : true
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editCustomer || !id) return;
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
    } catch (error) {
      alert("Kunde inte spara ändringar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout activeItem="Kunder" title="Kundprofil">
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
              {efforts.length === 0 ? (
                <div className="text-gray-500 text-center py-8">Inga insatser registrerade</div>
              ) : (
                efforts.map((eff, idx) => (
                  <Card key={idx} className="bg-gray-50">
                    <CardContent className="p-4 flex flex-col gap-2">
                      <div className="font-bold text-lg text-gray-800">{eff.name}</div>
                      <div className="text-sm text-gray-600">Start: {eff.start}</div>
                      <div className="text-sm text-gray-600">Behandlare: {eff.handlers.join(", ")}</div>
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
        <div className="p-8">
          <h2 className="text-xl font-semibold mb-4">Redigera kund</h2>
          {(editCustomer !== null) ? (
            <div className="flex flex-col gap-4">
              <label className="text-sm font-medium text-gray-700">Initialer</label>
              <input
                type="text"
                className="border rounded px-3 py-2"
                value={editCustomer.initials}
                onChange={e => setEditCustomer({ ...editCustomer, initials: e.target.value })}
                placeholder="Initialer"
              />
              <label className="text-sm font-medium text-gray-700">Födelseår</label>
              <input
                type="text"
                className="border rounded px-3 py-2"
                value={editCustomer.birthYear}
                onChange={e => setEditCustomer({ ...editCustomer, birthYear: e.target.value })}
                placeholder="Födelseår"
              />
              <label className="text-sm font-medium text-gray-700">Kön</label>
              <select
                className="border rounded px-3 py-2"
                value={editCustomer.gender}
                onChange={e => setEditCustomer({ ...editCustomer, gender: e.target.value })}
              >
                <option value="Flicka">Flicka</option>
                <option value="Pojke">Pojke</option>
                <option value="Icke-binär">Icke-binär</option>
              </select>
              <label className="text-sm font-medium text-gray-700">Startdatum</label>
              <input
                type="date"
                className="border rounded px-3 py-2"
                value={editCustomer.startDate}
                onChange={e => setEditCustomer({ ...editCustomer, startDate: e.target.value })}
                placeholder="Startdatum"
              />
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                className="border rounded px-3 py-2"
                value={editCustomer.active ? "Aktiv" : "Avslutad"}
                onChange={e => setEditCustomer({ ...editCustomer, active: e.target.value === "Aktiv" })}
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
            <Button variant="default" onClick={handleSaveEdit} disabled={saving || !editCustomer}>Spara</Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
};