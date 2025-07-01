import React from "react";
import { Layout } from "../../components/Layout";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Modal } from "../../components/ui/modal";

const insatserList = [
  { name: "Samtal", for: "Biståndsbedömda" },
  { name: "rePULSE", for: "Biståndsbedömda, Förebyggande" },
  { name: "Trappan", for: "Biståndsbedömda" },
  { name: "Hela Barn", for: "Biståndsbedömda" },
  { name: "KIBB", for: "Biståndsbedömda" },
  { name: "Ungdomstjänst/kontrakt", for: "Biståndsbedömda" },
  { name: "Familjesöd", for: "Förebyggande" },
  { name: "Övrig tid", for: "Biståndsbedömda" },
];

const behandlareList = [
  { name: "Anna M", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Karoline C", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Magnus S", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
  { name: "Oskar P", mail: "mail.mail@mail.se", start: "åååå-mm-dd" },
];

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
  const [insatser, setInsatser] = React.useState(insatserList);
  const [openModal, setOpenModal] = React.useState(false);
  const [newInsats, setNewInsats] = React.useState({ name: "", for: "Biståndsbedömda" });
  const [editIdx, setEditIdx] = React.useState<number | null>(null);
  const [editInsats, setEditInsats] = React.useState<{ name: string; for: string }>({ name: "", for: "Biståndsbedömda" });
  const [openEditModal, setOpenEditModal] = React.useState(false);
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [behandlare, setBehandlare] = React.useState(behandlareList);
  const [openBehandlareModal, setOpenBehandlareModal] = React.useState(false);
  const [newBehandlare, setNewBehandlare] = React.useState({ name: "", mail: "", start: "" });
  const [editBehandlareIdx, setEditBehandlareIdx] = React.useState<number | null>(null);
  const [editBehandlare, setEditBehandlare] = React.useState({ name: "", mail: "", start: "" });
  const [openEditBehandlareModal, setOpenEditBehandlareModal] = React.useState(false);
  const [showDeleteBehandlareModal, setShowDeleteBehandlareModal] = React.useState(false);

  return (
    <Layout activeItem="Admin" title="Admin">
      <Tabs defaultValue="insatser" className="w-full">
        <TabsList className="flex w-full bg-gray-100 rounded-2xl mb-2 p-1 gap-2">
          <TabsTrigger value="insatser" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Insatser</TabsTrigger>
          <TabsTrigger value="behandlare" className="flex-1 py-3 text-base rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-[#17694c] data-[state=inactive]:text-gray-500 transition">Behandlare</TabsTrigger>
        </TabsList>
        <TabsContent value="insatser">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
              <div className="flex justify-start mb-4">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setOpenModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny insats
                </Button>
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
                      <TableRow key={i.name + idx}>
                        <TableCell className="font-medium text-gray-800">{i.name}</TableCell>
                        <TableCell>{i.for}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditIdx(idx);
                            setEditInsats({ name: i.name, for: i.for });
                            setOpenEditModal(true);
                          }}>
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
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
                <Button variant="default" onClick={() => {
                  setInsatser(prev => [...prev, { ...newInsats }]);
                  setNewInsats({ name: "", for: "Biståndsbedömda" });
                  setOpenModal(false);
                }}>Spara</Button>
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
                  <Button variant="default" onClick={() => {
                    if (editIdx !== null) {
                      setInsatser(prev => prev.map((item, i) => i === editIdx ? { ...editInsats } : item));
                      setOpenEditModal(false);
                    }
                  }}>Spara</Button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Radera insats</h2>
              <p>Är du säker på att du vill radera insatsen?</p>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Avbryt</Button>
                <Button variant="destructive" onClick={() => {
                  if (editIdx !== null) {
                    setInsatser(prev => prev.filter((_, i) => i !== editIdx));
                    setShowDeleteModal(false);
                    setOpenEditModal(false);
                  }
                }}>Radera</Button>
              </div>
            </div>
          </Modal>
        </TabsContent>
        <TabsContent value="behandlare">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
              <div className="flex justify-start mb-4">
                <Button variant="outline" className="flex items-center gap-2" onClick={() => setOpenBehandlareModal(true)}>
                  <PlusCircle className="w-5 h-5" /> Lägg till ny behandlare
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <TableHeader>Namn</TableHeader>
                      <TableHeader>Mail</TableHeader>
                      <TableHeader>Startdatum</TableHeader>
                      <TableHeader>Åtgärder</TableHeader>
                    </tr>
                  </thead>
                  <tbody>
                    {behandlare.map((b, idx) => (
                      <TableRow key={b.name + idx}>
                        <TableCell className="font-medium text-gray-800">{b.name}</TableCell>
                        <TableCell>{b.mail}</TableCell>
                        <TableCell>{b.start}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditBehandlareIdx(idx);
                            setEditBehandlare({ ...b });
                            setOpenEditBehandlareModal(true);
                          }}>
                            <MoreHorizontal className="w-5 h-5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <Modal open={openBehandlareModal} onClose={() => setOpenBehandlareModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Lägg till ny behandlare</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn</label>
                <input type="text" className="border rounded px-3 py-2" value={newBehandlare.name} onChange={e => setNewBehandlare({ ...newBehandlare, name: e.target.value })} placeholder="Namn" />
                <label className="text-sm font-medium text-gray-700">Mail</label>
                <input type="email" className="border rounded px-3 py-2" value={newBehandlare.mail} onChange={e => setNewBehandlare({ ...newBehandlare, mail: e.target.value })} placeholder="Mail" />
                <label className="text-sm font-medium text-gray-700">Startdatum</label>
                <input type="date" className="border rounded px-3 py-2" value={newBehandlare.start} onChange={e => setNewBehandlare({ ...newBehandlare, start: e.target.value })} />
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setOpenBehandlareModal(false)}>Avbryt</Button>
                <Button variant="default" onClick={() => {
                  setBehandlare(prev => [...prev, { ...newBehandlare }]);
                  setNewBehandlare({ name: "", mail: "", start: "" });
                  setOpenBehandlareModal(false);
                }}>Spara</Button>
              </div>
            </div>
          </Modal>
          <Modal open={openEditBehandlareModal} onClose={() => setOpenEditBehandlareModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Redigera behandlare</h2>
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-gray-700">Namn</label>
                <input type="text" className="border rounded px-3 py-2" value={editBehandlare.name} onChange={e => setEditBehandlare({ ...editBehandlare, name: e.target.value })} placeholder="Namn" />
                <label className="text-sm font-medium text-gray-700">Mail</label>
                <input type="email" className="border rounded px-3 py-2" value={editBehandlare.mail} onChange={e => setEditBehandlare({ ...editBehandlare, mail: e.target.value })} placeholder="Mail" />
                <label className="text-sm font-medium text-gray-700">Startdatum</label>
                <input type="date" className="border rounded px-3 py-2" value={editBehandlare.start} onChange={e => setEditBehandlare({ ...editBehandlare, start: e.target.value })} />
              </div>
              <div className="flex gap-4 justify-between mt-6">
                <Button variant="destructive" onClick={() => setShowDeleteBehandlareModal(true)}>Radera</Button>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setOpenEditBehandlareModal(false)}>Avbryt</Button>
                  <Button variant="default" onClick={() => {
                    if (editBehandlareIdx !== null) {
                      setBehandlare(prev => prev.map((item, i) => i === editBehandlareIdx ? { ...editBehandlare } : item));
                      setOpenEditBehandlareModal(false);
                    }
                  }}>Spara</Button>
                </div>
              </div>
            </div>
          </Modal>
          <Modal open={showDeleteBehandlareModal} onClose={() => setShowDeleteBehandlareModal(false)}>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-4">Radera behandlare</h2>
              <p>Är du säker på att du vill radera behandlaren?</p>
              <div className="flex gap-4 justify-end mt-6">
                <Button variant="outline" onClick={() => setShowDeleteBehandlareModal(false)}>Avbryt</Button>
                <Button variant="destructive" onClick={() => {
                  if (editBehandlareIdx !== null) {
                    setBehandlare(prev => prev.filter((_, i) => i !== editBehandlareIdx));
                    setShowDeleteBehandlareModal(false);
                    setOpenEditBehandlareModal(false);
                  }
                }}>Radera</Button>
              </div>
            </div>
          </Modal>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};