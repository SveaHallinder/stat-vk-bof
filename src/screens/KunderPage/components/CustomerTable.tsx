import React from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { MoreHorizontalIcon, EyeIcon, EditIcon, TrashIcon } from "lucide-react";

interface CustomerTableProps {
  searchTerm: string;
  selectedFilter: string;
}

export const CustomerTable = ({ searchTerm, selectedFilter }: CustomerTableProps): JSX.Element => {
  // Sample customer data
  const customers = [
    {
      id: "AL",
      name: "Anna Larsson",
      personnummer: "200712-1234",
      gender: "Flicka",
      birthYear: "2007",
      address: "Storgatan 12, Vallentuna",
      phone: "070-123 45 67",
      status: "Aktiv",
      lastVisit: "2025-03-25",
      visitType: "Återbesök",
      caseworker: "Maria Andersson",
      notes: "Regelbundna uppföljningar",
    },
    {
      id: "BN",
      name: "Benjamin Nilsson",
      personnummer: "201205-5678",
      gender: "Pojke",
      birthYear: "2012",
      address: "Lindvägen 8, Vallentuna",
      phone: "070-987 65 43",
      status: "Aktiv",
      lastVisit: "2025-03-24",
      visitType: "Nybesök",
      caseworker: "Erik Johansson",
      notes: "Första bedömning genomförd",
    },
    {
      id: "CL",
      name: "Clara Lindberg",
      personnummer: "200903-9012",
      gender: "Flicka",
      birthYear: "2009",
      address: "Skolvägen 15, Vallentuna",
      phone: "070-456 78 90",
      status: "Aktiv",
      lastVisit: "2025-03-24",
      visitType: "Uppföljning",
      caseworker: "Anna Petersson",
      notes: "Planerad insats pågår",
    },
    {
      id: "DM",
      name: "David Månsson",
      personnummer: "201108-3456",
      gender: "Pojke",
      birthYear: "2011",
      address: "Parkgatan 22, Vallentuna",
      phone: "070-234 56 78",
      status: "Inaktiv",
      lastVisit: "2025-02-15",
      visitType: "Avslutning",
      caseworker: "Maria Andersson",
      notes: "Ärende avslutat",
    },
    {
      id: "EH",
      name: "Emma Holmberg",
      personnummer: "200610-7890",
      gender: "Flicka",
      birthYear: "2006",
      address: "Björkvägen 5, Vallentuna",
      phone: "070-345 67 89",
      status: "Aktiv",
      lastVisit: "2025-03-23",
      visitType: "Återbesök",
      caseworker: "Erik Johansson",
      notes: "Kontinuerlig uppföljning",
    },
  ];

  // Filter customers based on search term and selected filter
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch = searchTerm === "" || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.personnummer.includes(searchTerm) ||
      customer.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === "alla" ||
      (selectedFilter === "aktiva" && customer.status === "Aktiv") ||
      (selectedFilter === "inaktiva" && customer.status === "Inaktiv") ||
      (selectedFilter === "nya" && new Date(customer.lastVisit) > new Date("2025-03-01"));

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    return status === "Aktiv" 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-[#666666]">
          <div className="col-span-1">ID</div>
          <div className="col-span-2">Namn</div>
          <div className="col-span-2">Personnummer</div>
          <div className="col-span-1">Kön</div>
          <div className="col-span-2">Senaste besök</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Handläggare</div>
          <div className="col-span-1">Åtgärder</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredCustomers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="col-span-1">
                <div className="w-8 h-8 bg-[#17694c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {customer.id}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="font-semibold text-[#333333]">{customer.name}</div>
                <div className="text-sm text-[#666666]">{customer.gender} ({customer.birthYear})</div>
              </div>
              
              <div className="col-span-2">
                <div className="text-[#333333]">{customer.personnummer}</div>
                <div className="text-sm text-[#666666]">{customer.phone}</div>
              </div>
              
              <div className="col-span-1">
                <span className="text-[#666666]">{customer.gender}</span>
              </div>
              
              <div className="col-span-2">
                <div className="text-[#333333]">{customer.lastVisit}</div>
                <div className="text-sm text-[#666666]">{customer.visitType}</div>
              </div>
              
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                  {customer.status}
                </span>
              </div>
              
              <div className="col-span-2">
                <div className="text-[#333333]">{customer.caseworker}</div>
                <div className="text-sm text-[#666666] truncate">{customer.notes}</div>
              </div>
              
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    title="Visa detaljer"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                    title="Redigera"
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Ta bort"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

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