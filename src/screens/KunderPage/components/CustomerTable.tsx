import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCustomers } from "@/lib/api";
import { Customer } from "@/types/types";

interface CustomerTableProps {
  searchTerm: string;
  selectedFilter: string;
}

export const CustomerTable = ({ searchTerm, selectedFilter }: CustomerTableProps): JSX.Element => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [reactivateId, setReactivateId] = useState<number | null>(null);

  useEffect(() => {
    getCustomers().then(setCustomers).catch(console.error);
  }, []);

  // Filter customers based on search term and selected filter
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = searchTerm === "" || 
      customer.initials.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.id.toString().toLowerCase().includes(searchTerm.toLowerCase());

    const status = customer.active ? "Aktiv" : "Inaktiv";
    const matchesFilter = selectedFilter === "alla" ||
      (selectedFilter === "aktiva" && status === "Aktiv") ||
      (selectedFilter === "inaktiva" && status === "Inaktiv");

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    return status === "Aktiv" 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="bg-white">
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 text-sm font-semibold text-[#666666]">
          <div className="col-span-1">ID</div>
          <div className="col-span-1">Initialer</div>
          <div className="col-span-1">Kön</div>
          <div className="col-span-1">Födelseår</div>
          <div className="col-span-1">Status</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className={`grid grid-cols-5 gap-4 p-4 hover:bg-gray-50 transition-colors ${!customer.active ? 'bg-gray-100 text-gray-400' : ''}`}
            >
              <div className="col-span-1">
                <div className="w-8 h-8 bg-[#17694c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {customer.id}
                </div>
              </div>
              <div className="col-span-1 font-semibold text-[#333333]">{customer.initials}</div>
              <div className="col-span-1 text-[#666666]">{customer.gender}</div>
              <div className="col-span-1 text-[#666666]">{customer.birth_year}</div>
              <div className="col-span-1 flex gap-2 items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.active ? "Aktiv" : "Inaktiv")}`}>
                  {customer.active ? "Aktiv" : "Inaktiv"}
                </span>
                {!customer.active && (
                  <button
                    className="ml-2 text-green-600 underline text-xs"
                    title="Återaktivera kund"
                    onClick={() => setReactivateId(customer.id)}
                  >
                    Återaktivera
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Popup för återaktivering */}
        {reactivateId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
              <div className="text-lg font-semibold mb-4">Vill du återaktivera denna kund?</div>
              <div className="flex gap-4 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setReactivateId(null)}
                  className="min-w-[100px]"
                >
                  Avbryt
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    // Här ska du anropa reactivateCustomer och uppdatera listan, eller skicka upp event till parent
                    setReactivateId(null);
                  }}
                  className="min-w-[100px]"
                >
                  Återaktivera
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-[#666666] text-lg mb-2">Inga kunder hittades</div>
            <div className="text-[#888888] text-sm">
              Prova att ändra dina sökkriterier eller filter
            </div>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-[#666666]">
            Visar {filteredCustomers.length} av {customers.length} kunder
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              Föregående
            </Button>
            <span className="px-3 py-1 bg-[#17694c] text-white rounded text-sm">1</span>
            <Button variant="outline" size="sm" disabled>
              Nästa
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};