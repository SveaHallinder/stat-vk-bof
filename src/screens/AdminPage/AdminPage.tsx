import React from "react";
import { Layout } from "../../components/Layout";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

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
                <Button variant="outline" className="flex items-center gap-2">
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
                    {insatserList.map((i, idx) => (
                      <TableRow key={i.name + idx}>
                        <TableCell className="font-medium text-gray-800">{i.name}</TableCell>
                        <TableCell>{i.for}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
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
        </TabsContent>
        <TabsContent value="behandlare">
          <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
            <CardContent className="p-6">
               <div className="flex justify-end mb-4">
                <Button variant="outline" className="flex items-center gap-2">
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
                    {behandlareList.map((b, idx) => (
                      <TableRow key={b.name + idx}>
                        <TableCell className="font-medium text-gray-800">{b.name}</TableCell>
                        <TableCell>{b.mail}</TableCell>
                        <TableCell>{b.start}</TableCell>
                        <TableCell>
                           <Button variant="ghost" size="icon">
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
        </TabsContent>
      </Tabs>
    </Layout>
  );
};