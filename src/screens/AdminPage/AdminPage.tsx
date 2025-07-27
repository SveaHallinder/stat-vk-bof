import React, { useEffect } from "react";
import { Layout } from "../../components/Layout";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Modal } from "../../components/ui/modal";
import { AuditLog } from "../AdminPage/components/AuditLog";


const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">{children}</th>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-gray-50 border-b border-gray-200">{children}</tr>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <td className={`px-6 py-4 text-gray-600 ${className}`}>{children}</td>
);

export const AdminPage = (): JSX.Element => {
  const [insatser, setInsatser] = React.useState<any[]>([]);
  const [openModal, setOpenModal] = React.useState(false);
  const [newInsats, setNewInsats] = React.useState({ name: "", for: "Biståndsbedömda" });
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editInsats, setEditInsats] = React.useState<{ name: string; for: string }>({ name: "", for: "Biståndsbedömda" });
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [handlers, setHandlers] = React.useState<any[]>([]);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [editHandler, setEditHandler] = React.useState<{ id: number, name: string, email: string } | null>(null);
  const [openEditHandlerModal, setOpenEditHandlerModal] = React.useState(false);
  const [showInactive, setShowInactive] = React.useState(false);
  const [showInactiveEfforts, setShowInactiveEfforts] = React.useState(false);

  useEffect(() => {
    fetchEfforts();
  }, [showInactiveEfforts]);

  async function fetchEfforts() {
    try {
      const url = showInactiveEfforts ? "http://localhost:4000/efforts?all=true" : "http://localhost:4000/efforts";
      const res = await fetch(url);
      const data = await res.json();
      setInsatser(data);
    } catch {
      setInsatser([]);
    }
  }

  useEffect(() => {
    fetchHandlers();
  }, [showInactive]);

  async function fetchHandlers() {
    try {
      const url = showInactive ? "http://localhost:4000/handlers?all=true" : "http://localhost:4000/handlers";
      const res = await fetch(url);
      const data = await res.json();
      setHandlers(data);
    } catch {
      setHandlers([]);
    }
  }

  // Lägg till insats
  const handleAddInsats = async () => {
    try {
      const res = await fetch("http://localhost:4000/efforts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newInsats.name, available_for: newInsats.for })
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setInsatser(prev => [...prev, created]);
      setNewInsats({ name: "", for: "Biståndsbedömda" });
      setOpenModal(false);
    } catch {
      alert("Kunde inte spara insats");
    }
  };

  // Redigera insats
  const handleEditInsats = async () => {
    if (editIdx == null) return;
    try {
      const res = await fetch(`http://localhost:4000/efforts/${insatser[editIdx].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editInsats.name, available_for: editInsats.for })
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setInsatser(prev => prev.map(i => i.id === insatser[editIdx].id ? updated : i));
      setOpenEditModal(false);
    } catch {
      alert("Kunde inte uppdatera insats");
    }
  };

  // Radera insats

  const [newHandler, setNewHandler] = React.useState({ name: "", email: "" });
  const [openHandlerModal, setOpenHandlerModal] = React.useState(false);
  const [handlerErrors, setHandlerErrors] = React.useState<{ name?: string; email?: string }>({});

  function validateHandler(handler: { name: string; email: string }) {
    const errors: { name?: string; email?: string } = {};
    if (!handler.name) errors.name = "Namn är obligatoriskt";
    if (!handler.email) errors.email = "E-post är obligatoriskt";
    else if (!/^\S+@\S+\.\S+$/.test(handler.email)) errors.email = "Ogiltig e-postadress";
    return errors;
  }

  async function handleAddHandler() {
    const errors = validateHandler(newHandler);
    setHandlerErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await fetch("http://localhost:4000/handlers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newHandler)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNewHandler({ name: "", email: "" });
      setHandlerErrors({});
      setOpenHandlerModal(false);
      fetchHandlers();
      // Spara inbjudningslänk
      setInviteLink(`http://localhost:5173/invite/${data.inviteToken}`);
    } catch {
      alert("Kunde inte spara behandlare");
    }
  }


  return (
    <Layout title="Admin">
      <Tabs defaultValue="insatser" className="w-full">
        <TabsList className="flex w-full bg-gray-100 rounded-2xl mb-2 p-1 gap-2">
          <TabsTrigger value="insatser" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Insatser</TabsTrigger>
          <TabsTrigger value="behandlare" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Behandlare</TabsTrigger>
          <TabsTrigger value="logg" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Granskningslogg</TabsTrigger>
        </TabsList>
        <TabsContent value="insatser">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
              <div className="flex justify-start mb-4 gap-6 items-center">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setOpenModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny insats
                </Button>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={showInactiveEfforts} onChange={e => setShowInactiveEfforts(e.target.checked)} />
                  Visa inaktiva insatser
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <TableHeader>Insats</TableHeader>
                      <TableHeader>Tillgänglig för</TableHeader>
                      <TableHeader>Åtgärder</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {insatser.map((i, idx) => (
                      <TableRow key={i.id}>
                        <TableCell className={`font-medium ${i.active ? "text-gray-800" : "text-gray-400 italic"}`}>{i.name}</TableCell>
                        <TableCell className={i.active ? "" : "text-gray-400 italic"}>{i.available_for}</TableCell>
                        <TableCell>
                          {i.active ? (
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditIdx(idx);
                              setEditInsats({ name: i.name, for: i.available_for });
                              setOpenEditModal(true);
                            }}>
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={async () => {
                              await fetch(`http://localhost:4000/efforts/${i.id}/activate`, { method: "PUT" });
                              fetchEfforts();
                            }}>
                              Återaktivera
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Lägg till ny insats</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn på insats</label>
                <input type="text" className="border rounded px-3 py-2" value={newInsats.name} onChange={e => setNewInsats({ ...newInsats, name: e.target.value })} placeholder="Namn på insats" />
                <label className="text-sm font-medium text-gray-700">Tillgänglig för</label>
                <select className="border rounded px-3 py-2" value={newInsats.for} onChange={e => setNewInsats({ ...newInsats, for: e.target.value })}>
                  <option value="Biståndsbedömda">Biståndsbedömda</option>
                  <option value="Förebyggande">Förebyggande</option>
                  <option value="Biståndsbedömda, Förebyggande">Biståndsbedömda, Förebyggande</option>
                </select>
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setOpenModal(false)}>Avbryt</Button>
                <Button variant="default" onClick={handleAddInsats}>Spara</Button>
              </div>
            </div>
          </Modal>
          <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Redigera insats</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn på insats</label>
                <input type="text" className="border rounded px-3 py-2" value={editInsats.name} onChange={e => setEditInsats({ ...editInsats, name: e.target.value })} placeholder="Namn på insats" />
                <label className="text-sm font-medium text-gray-700">Tillgänglig för</label>
                <select className="border rounded px-3 py-2" value={editInsats.for} onChange={e => setEditInsats({ ...editInsats, for: e.target.value })}>
                  <option value="Biståndsbedömda">Biståndsbedömda</option>
                  <option value="Förebyggande">Förebyggande</option>
                  <option value="Biståndsbedömda, Förebyggande">Biståndsbedömda, Förebyggande</option>
                </select>
              </div>
              <div className="flex gap-4 justify-between mt-6">
                <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>Radera</Button>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setOpenEditModal(false)}>Avbryt</Button>
                  <Button variant="default" onClick={handleEditInsats}>Spara</Button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Radera insats</h2>
              <p>Är du säker på att du vill avaktivera insatsen?</p>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Avbryt</Button>
                <Button variant="destructive" onClick={async () => {
                  if (editIdx != null) {
                    await fetch(`http://localhost:4000/efforts/${insatser[editIdx].id}/deactivate`, { method: "PUT" });
                    setShowDeleteModal(false);
                    setOpenEditModal(false);
                    fetchEfforts();
                  }
                }}>Avaktivera</Button>
              </div>
            </div>
          </Modal>
        </TabsContent>
        <TabsContent value="behandlare">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
              <div className="flex justify-start mb-4 gap-6 items-center">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setOpenHandlerModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny behandlare
                </Button>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />
                  Visa inaktiva behandlare
                </label>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <TableHeader>Namn</TableHeader>
                      <TableHeader>Mail</TableHeader>
                      <TableHeader>Åtgärder</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {handlers.map(h => (
                      <TableRow key={h.id}>
                        <TableCell className={`font-medium ${h.active ? "text-gray-800" : "text-gray-400 italic"}`}>{h.name}</TableCell>
                        <TableCell className={h.active ? "" : "text-gray-400 italic"}>{h.email}</TableCell>
                        <TableCell>
                          {h.active ? (
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditHandler({ id: h.id, name: h.name, email: h.email });
                              setOpenEditHandlerModal(true);
                            }}>
                              <MoreHorizontal className="w-5 h-5" />
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={async () => {
                              await fetch(`http://localhost:4000/handlers/${h.id}/activate`, { method: "PUT" });
                              fetchHandlers();
                            }}>
                              Återaktivera
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Modal open={openHandlerModal} onClose={() => setOpenHandlerModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Lägg till ny behandlare</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn</label>
                <input
                  type="text"
                  className={`border rounded px-3 py-2 ${handlerErrors.name ? 'border-red-500' : ''}`}
                  value={newHandler.name}
                  onChange={e => {
                    setNewHandler({ ...newHandler, name: e.target.value });
                    setHandlerErrors(prev => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Namn"
                />
                {handlerErrors.name && <span className="text-red-500 text-xs mt-1">{handlerErrors.name}</span>}
                <label className="text-sm font-medium text-gray-700">Mail</label>
                <input
                  type="email"
                  className={`border rounded px-3 py-2 ${handlerErrors.email ? 'border-red-500' : ''}`}
                  value={newHandler.email}
                  onChange={e => {
                    setNewHandler({ ...newHandler, email: e.target.value });
                    setHandlerErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Mail"
                />
                {handlerErrors.email && <span className="text-red-500 text-xs mt-1">{handlerErrors.email}</span>}
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setOpenHandlerModal(false)}>Avbryt</Button>
                <Button variant="default" onClick={handleAddHandler} disabled={!!handlerErrors.name || !!handlerErrors.email || !newHandler.name || !newHandler.email}>Spara</Button>
              </div>
            </div>
          </Modal>
          <Modal open={openEditHandlerModal} onClose={() => setOpenEditHandlerModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Redigera behandlare</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn</label>
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  value={editHandler?.name || ""}
                  onChange={e => setEditHandler(editHandler ? { ...editHandler, name: e.target.value } : null)}
                  placeholder="Namn"
                />
                <label className="text-sm font-medium text-gray-700">Mail</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2"
                  value={editHandler?.email || ""}
                  onChange={e => setEditHandler(editHandler ? { ...editHandler, email: e.target.value } : null)}
                  placeholder="Mail"
                />
              </div>
              <div className="flex gap-4 justify-between mt-6">
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (editHandler) {
                      await fetch(`http://localhost:4000/handlers/${editHandler.id}/deactivate`, { method: "PUT" });
                      setOpenEditHandlerModal(false);
                      fetchHandlers();
                    }
                  }}
                >
                  Radera
                </Button>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setOpenEditHandlerModal(false)}>Avbryt</Button>
                  <Button
                    variant="default"
                    onClick={async () => {
                      if (editHandler) {
                        await fetch(`http://localhost:4000/handlers/${editHandler.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ name: editHandler.name, email: editHandler.email })
                        });
                        setOpenEditHandlerModal(false);
                        fetchHandlers();
                      }
                    }}
                  >
                    Spara
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
          {inviteLink && (
            <div className="fixed top-8 right-8 bg-white border border-green-400 shadow-lg rounded-lg p-6 z-50">
              <div className="mb-2 font-semibold text-green-700">Inbjudningslänk skapad!</div>
              <input
                className="w-full border rounded px-2 py-1 mb-2"
                value={inviteLink}
                readOnly
                onFocus={e => e.target.select()}
              />
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  navigator.clipboard.writeText(inviteLink);
                  alert('Länk kopierad!');
                  setInviteLink(null);
                }}
              >
                Kopiera länk
              </button>
              <button
                className="ml-2 text-gray-500 underline"
                onClick={() => setInviteLink(null)}
              >
                Stäng
              </button>
            </div>
          )}
        </TabsContent>
        <TabsContent value="logg">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
              <AuditLog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};