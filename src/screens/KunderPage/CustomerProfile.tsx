import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Edit, PlusCircle, MoreHorizontal } from "lucide-react";
import { Badge } from "../../components/ui/badge";

const mockCustomer = {
  id: "1",
  initials: "AL",
  name: "AL - Flicka (2007)",
  gender: "Flicka",
  birthYear: "2007",
  startDate: "2025-03-25",
  lastVisit: "2025-04-15",
  status: "Aktiv",
};

const mockEfforts = [
  { name: "Repulse", start: "25 mars 2025", handlers: ["Anna L", "Jessica S"] },
  { name: "Samverkan", start: "2 april 2025", handlers: ["Anna L", "Malin K"] },
];

const mockVisits = [
  { date: "26 april 2025, 13:00-14:00", effort: "Repulse (Återbesök)", handler: "Anna L" },
  { date: "3 maj 2025, 10:00-11:00", effort: "Samverkan (Uppföljning)", handler: "Malin K" },
];

export const CustomerProfile = () => {
  const [customer] = useState(mockCustomer);
  const [efforts] = useState(mockEfforts);
  const [visits] = useState(mockVisits);
  const navigate = useNavigate();

  return (
    <Layout activeItem="Kunder" title={customer.name}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/kunder')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-4xl font-light text-[#333]">{customer.name}</h1>
          <Badge variant={customer.status === "Aktiv" ? "default" : "destructive"}>{customer.status}</Badge>
        </div>
        <Button variant="outline" className="gap-2">
          <Edit className="w-4 h-4" /> Redigera kund
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Kunduppgifter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <span className="font-medium text-gray-800">{customer.startDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Senaste besök</span>
                <span className="font-medium text-gray-800">{customer.lastVisit}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Efforts */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Aktiva insatser</CardTitle>
               <Button variant="outline" className="gap-2">
                  <PlusCircle className="w-4 h-4" /> Ny insats
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {efforts.map((eff, idx) => (
                <Card key={idx} className="bg-gray-50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-lg text-gray-800">{eff.name}</p>
                      <p className="text-sm text-gray-600">Start: {eff.start}</p>
                      <p className="text-sm text-gray-600">Behandlare: {eff.handlers.join(", ")}</p>
                    </div>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-5 h-5 text-gray-500" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};