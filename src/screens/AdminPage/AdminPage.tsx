import React, { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import AuditLog from "./components/AuditLog";
import { Effort, Handler } from "@/types/types";
import toast from "react-hot-toast";
import { api } from "@/lib/apiClient";


const TableHeader = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">{children}</th>
);

const TableRow = ({ children }: { children: React.ReactNode }) => (
  <tr className="hover:bg-gray-50 border-t border-gray-200">{children}</tr>
);

const TableCell = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
  <td className={`px-6 py-4 text-gray-600 ${className}`}>{children}</td>
);

export const AdminPage = (): JSX.Element => {
  const [insatser, setInsatser] = React.useState<Effort[]>([]);
  const [openModal, setOpenModal] = React.useState(false);
  const [newInsats, setNewInsats] = React.useState({ name: "", for: "Biståndsbedömda" });
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editInsats, setEditInsats] = React.useState<{ name: string; for: string }>({ name: "", for: "Biståndsbedömda" });
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [handlers, setHandlers] = React.useState<Handler[]>([]);
  const [inviteToken, setInviteToken] = React.useState<string | null>(null);
  const [inviteVerificationCode, setInviteVerificationCode] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [editHandler, setEditHandler] = React.useState<{ id: number, name: string, email: string } | null>(null);
  const [openEditHandlerModal, setOpenEditHandlerModal] = React.useState(false);
  const [showInactive, setShowInactive] = React.useState(false);
  const [showInactiveEfforts, setShowInactiveEfforts] = React.useState(false);
  
  // Lösenordsåterställning (likt invite-systemet)
  const [resetPasswordToken, setResetPasswordToken] = React.useState<string | null>(null);
  const [resetPasswordCopied, setResetPasswordCopied] = React.useState(false);

  useEffect(() => {
    fetchEfforts();
  }, [showInactiveEfforts]);

  async function fetchEfforts() {
    try {
      const url = showInactiveEfforts ? `/efforts?all=true` : `/efforts`;
      const res = await api(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setInsatser(data);
    } catch {
      toast.error("Kunde inte hämta insatser");
      setInsatser([]);
    }
  }

  useEffect(() => {
    fetchHandlers();
  }, [showInactive]);

  async function fetchHandlers() {
    try {
      const url = showInactive ? `/handlers?all=true` : `/handlers`;
      const res = await api(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHandlers(data);
    } catch {
      toast.error("Kunde inte hämta behandlare");
      setHandlers([]);
    }
  }

  // Lägg till insats
  const handleAddInsats = async () => {
      try {
        const res = await api(`/efforts`, {
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
        toast.error("Kunde inte spara insats");
      }
  };

  // Redigera insats
  const handleEditInsats = async () => {
    if (editIdx == null) return;
      try {
        const res = await api(`/efforts/${insatser[editIdx].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editInsats.name, available_for: editInsats.for })
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setInsatser(prev => prev.map(i => i.id === insatser[editIdx].id ? updated : i));
        setOpenEditModal(false);
      } catch {
        toast.error("Kunde inte uppdatera insats");
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
      // Skapa invite direkt (ingen handler skapas än)
      const inviteRes = await api(`/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: newHandler.email, 
          role: 'handler' 
        })
      });
      if (!inviteRes.ok) {
        const errorData = await inviteRes.json();
        throw new Error(errorData.error || 'Kunde inte skapa inbjudan');
      }
      
      const invite = await inviteRes.json();
      
      // Visa invite-information för admin
      setInviteToken(invite.token);
      setInviteVerificationCode(invite.verification_code);
      
      // Rensa formuläret
      setNewHandler({ name: "", email: "" });
      setHandlerErrors({});
      setOpenHandlerModal(false);
      
      // Uppdatera handlers-listan
      fetchHandlers();
      
      toast.success(`Inbjudan skapad för ${invite.email}`);
      
    } catch (error) {
      console.error('Error creating invite:', error);
      toast.error(error instanceof Error ? error.message : "Kunde inte skapa inbjudan");
    }
  }

  async function generatePasswordResetLink(handlerId: number, handlerEmail: string) {
    try {
      const res = await api(`/handlers/${handlerId}/generate-reset-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: handlerEmail })
      });
      
      if (!res.ok) throw new Error();
      
      const data = await res.json();
      setResetPasswordToken(data.token);
      setResetPasswordCopied(false);
    } catch {
      toast.error("Kunde inte generera återställningslänk");
    }
  }

  return (
    <Layout title="Admin">
      {/* Responsiv container */}
      <div className="w-full max-w-[350px] mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">

      <Tabs defaultValue="insatser" className="w-full">
        <TabsList className="flex w-full bg-gray-100 rounded-2xl mb-2 p-1 gap-2">
          <TabsTrigger value="insatser" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Insatser</TabsTrigger>
          <TabsTrigger value="behandlare" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Behandlare</TabsTrigger>
          <TabsTrigger value="logg" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Granskningslogg</TabsTrigger>
        </TabsList>
        <TabsContent value="insatser">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-4 mobile:p-6">
              <div className="flex flex-col mobile:flex-col justify-start mb-4 gap-4 mobile:gap-6 items-start mobile:items-center mobile:w-full">
                <Button variant="outline" className="flex items-center gap-2 w-full mobile:w-auto" onClick={() => setOpenModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny insats
                </Button>
                <label className="flex items-center gap-2 text-sm w-full mobile:w-auto">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await api(`/efforts/${i.id}/activate`, { method: "PUT" });
                                  if (!res.ok) throw new Error();
                                  fetchEfforts();
                                } catch {
                                  toast.error("Kunde inte aktivera insats");
                                }
                              }}
                            >
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
            <div className="p-4 mobile:p-8">
              <h2 className="text-lg mobile:text-xl font-semibold mb-4">Lägg till ny insats</h2>
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
              <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 justify-end mt-6">
                <Button variant="outline" className="w-full mobile:w-auto" onClick={() => setOpenModal(false)}>Avbryt</Button>
                <Button variant="default" className="w-full mobile:w-auto" onClick={handleAddInsats}>Spara</Button>
              </div>
            </div>
          </Modal>
          <Modal open={openEditModal} onClose={() => setOpenEditModal(false)}>
            <div className="p-4 mobile:p-8">
              <h2 className="text-lg mobile:text-xl font-semibold mb-4">Redigera insats</h2>
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
              <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 justify-between mt-6">
                <Button variant="destructive" className="w-full mobile:w-auto" onClick={() => setShowDeleteModal(true)}>Radera</Button>
                <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4">
                  <Button variant="outline" className="w-full mobile:w-auto" onClick={() => setOpenEditModal(false)}>Avbryt</Button>
                  <Button variant="default" className="w-full mobile:w-auto" onClick={handleEditInsats}>Spara</Button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="p-4 mobile:p-8">
              <h2 className="text-lg mobile:text-xl font-semibold mb-4">Radera insats</h2>
              <p>Är du säker på att du vill avaktivera insatsen?</p>
              <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 justify-end mt-6">
                <Button variant="outline" className="w-full mobile:w-auto" onClick={() => setShowDeleteModal(false)}>Avbryt</Button>
                <Button
                  variant="destructive"
                  className="w-full mobile:w-auto"
                  onClick={async () => {
                    if (editIdx != null) {
                      try {
                        const res = await api(`/efforts/${insatser[editIdx].id}/deactivate`, { method: "PUT" });
                        if (!res.ok) throw new Error();
                        setShowDeleteModal(false);
                        setOpenEditModal(false);
                        fetchEfforts();
                      } catch {
                        toast.error("Kunde inte avaktivera insats");
                      }
                    }
                  }}
                >
                  Avaktivera
                </Button>
              </div>
            </div>
          </Modal>
        </TabsContent>
        <TabsContent value="behandlare">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-4 mobile:p-6">
              <div className="flex flex-col mobile:flex-col justify-start mb-4 gap-4 mobile:gap-6 items-start mobile:items-center">
                <Button variant="outline" className="flex items-center gap-2 w-full mobile:w-auto" onClick={() => setOpenHandlerModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny behandlare
                </Button>
                <label className="flex items-center gap-2 text-sm w-full mobile:w-auto">
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const res = await api(`/handlers/${h.id}/activate`, { method: "PUT" });
                                  if (!res.ok) throw new Error();
                                  fetchHandlers();
                                } catch {
                                  toast.error("Kunde inte aktivera behandlare");
                                }
                              }}
                            >
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
            <div className="p-4 mobile:p-8">
              <h2 className="text-lg mobile:text-xl font-semibold mb-4">Lägg till ny behandlare</h2>
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
              <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 justify-end mt-6">
                <Button variant="outline" className="w-full mobile:w-auto" onClick={() => setOpenHandlerModal(false)}>Avbryt</Button>
                <Button variant="default" className="w-full mobile:w-auto" onClick={handleAddHandler} disabled={!!handlerErrors.name || !!handlerErrors.email || !newHandler.name || !newHandler.email}>Spara</Button>
              </div>
            </div>
          </Modal>
          <Modal open={openEditHandlerModal} onClose={() => setOpenEditHandlerModal(false)}>
            <div className="p-4 mobile:p-8">
              <h2 className="text-lg mobile:text-xl font-semibold mb-4">Redigera behandlare</h2>
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
                
                {/* Lösenordsåterställning */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full text-sm"
                    onClick={() => {
                      if (editHandler) {
                        generatePasswordResetLink(editHandler.id, editHandler.email);
                      }
                    }}
                  >
                    🔐 Skicka återställningslänk för glömt lösenord
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Genererar en unik länk som du kan skicka till behandlaren
                  </p>
                </div>
              </div>
              <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4 justify-between mt-6">
                <Button
                  variant="destructive"
                  className="w-full mobile:w-auto"
                  onClick={async () => {
                    if (editHandler) {
                      try {
                        const res = await api(`/handlers/${editHandler.id}/deactivate`, { method: "PUT" });
                        if (!res.ok) throw new Error();
                        setOpenEditHandlerModal(false);
                        fetchHandlers();
                      } catch {
                        toast.error("Kunde inte avaktivera behandlare");
                      }
                    }
                  }}
                >
                  Radera
                </Button>
                <div className="flex flex-col mobile:flex-row gap-3 mobile:gap-4">
                  <Button variant="outline" className="w-full mobile:w-auto" onClick={() => setOpenEditHandlerModal(false)}>Avbryt</Button>
                  <Button
                    variant="default"
                    className="w-full mobile:w-auto"
                    onClick={async () => {
                      if (editHandler) {
                        try {
                          const res = await api(`/handlers/${editHandler.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: editHandler.name, email: editHandler.email })
                          });
                          if (!res.ok) throw new Error();
                          setOpenEditHandlerModal(false);
                          fetchHandlers();
                        } catch {
                          toast.error("Kunde inte spara behandlare");
                        }
                      }
                    }}
                  >
                    Spara
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
          {/* Popup för lösenordsåterställning */}
          {resetPasswordToken && (
            <div className="fixed top-8 right-8 bg-white border border-blue-400 shadow-lg rounded-lg p-4 mobile:p-6 z-50 max-w-md">
              <div className="mb-4">
                <div className="font-semibold text-blue-700 text-base mobile:text-lg mb-2">🔐 Lösenordsåterställning skapad!</div>
                <div className="text-sm text-gray-600 mb-4">
                  Skicka följande information till behandlaren:
                </div>
              </div>



              {/* Återställningslänk */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 Återställningslänk
                </label>
                <div className="flex flex-col mobile:flex-row items-center gap-2">
                  <input
                    className="w-full border rounded px-2 py-2 text-sm"
                    value={`${window.location.origin}/reset-password/${resetPasswordToken}`}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 w-full mobile:w-auto"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/reset-password/${resetPasswordToken}`);
                      setResetPasswordCopied(true);
                      setTimeout(() => setResetPasswordCopied(false), 2000);
                    }}
                  >
                    Kopiera
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Denna länk går ut om 1 timme
                </div>
              </div>

              {/* Status */}
              {resetPasswordCopied && (
                <div className="text-green-600 text-sm text-center mb-3">
                  ✅ Kopierat till urklipp!
                </div>
              )}

              <div className="text-center">
                <button
                  className="text-gray-500 underline text-sm"
                  onClick={() => setResetPasswordToken(null)}
                >
                  Stäng
                </button>
              </div>
            </div>
          )}

          {inviteToken && (
            <div className="fixed top-8 right-8 bg-white border border-green-400 shadow-lg rounded-lg p-4 mobile:p-6 z-50 max-w-md">
              <div className="mb-4">
                <div className="font-semibold text-green-700 text-base mobile:text-lg mb-2">🎉 Inbjudning skapad!</div>
                <div className="text-sm text-gray-600 mb-4">
                  Skicka följande information till användaren:
                </div>
              </div>

              {/* Verifieringskod */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔐 Verifieringskod (8 siffror)
                </label>
                <div className="flex flex-col mobile:flex-row items-center gap-2">
                  <input
                    className="w-full border rounded px-3 py-2 font-mono text-lg tracking-widest text-center bg-gray-50"
                    value={inviteVerificationCode || "Laddar..."}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 w-full mobile:w-auto"
                    onClick={() => {
                      if (inviteVerificationCode) {
                        navigator.clipboard.writeText(inviteVerificationCode);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }
                    }}
                  >
                    Kopiera
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Denna kod går ut om 24 timmar
                </div>
              </div>

              {/* Invite-länk */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🔗 Inbjudningslänk
                </label>
                <div className="flex flex-col mobile:flex-row items-center gap-2">
                  <input
                    className="w-full border rounded px-2 py-2 text-sm"
                    value={`${window.location.origin}/invite/${inviteToken}`}
                    readOnly
                    onFocus={e => e.target.select()}
                  />
                  <button
                    className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 w-full mobile:w-auto"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteToken}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    Kopiera
                  </button>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Denna länk går ut om 7 dagar
                </div>
              </div>

              {/* Status */}
              {copied && (
                <div className="text-green-600 text-sm text-center mb-3">
                  ✅ Kopierat till urklipp!
                </div>
              )}

              <div className="text-center">
                <button
                  className="text-gray-500 underline text-sm"
                  onClick={() => setInviteToken(null)}
                >
                  Stäng
                </button>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="logg">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-4 mobile:p-6">
              <AuditLog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      </div>
    </Layout>
  );
};