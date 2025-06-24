import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import { Edit2, PlusCircle, FileText, XCircle } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

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
  const navigate = useNavigate();

  const handleRowClick = (customer: Customer) => {
    navigate(`/kunder/${customer.id}`);
  };

  return (
    <Layout activeItem="Kunder" title="Kunder">
      <div className="flex items-center justify-between mb-8">
        <Button
          variant="outline"
          className="flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 text-lg text-[#17694c] font-semibold bg-white hover:bg-[#eaf6f1] transition shadow-sm"
          onClick={() => {
            /* Logic to add a customer will be here */
          }}
        >
          <PlusCircle className="w-5 h-5" />
          Lägg till kund
        </Button>
      </div>
      <Card className="flex-1 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Kund-ID</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Initial</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Kön</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Födelseår</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Status</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Startdatum</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Senaste besök</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm text-right">Åtgärder</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, idx) => (
                  <tr key={customer.id + idx} className="hover:bg-gray-50 cursor-pointer border-b border-gray-200" onClick={() => handleRowClick(customer)}>
                    <td className="px-6 py-4 font-medium text-gray-800">{customer.id}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.initials}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.gender}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.birthYear}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 text-xs rounded-full font-semibold ${
                          customer.status === "Pågående"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{customer.startDate}</td>
                    <td className="px-6 py-4 text-gray-600">{customer.lastVisit}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 items-center justify-end" onClick={e => e.stopPropagation()}>
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Ändra kunduppgifter">
                          <Edit2 className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Visa kundhistorik">
                          <FileText className="w-5 h-5 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-200 rounded-full" title="Avsluta kund">
                          <XCircle className="w-5 h-5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
};