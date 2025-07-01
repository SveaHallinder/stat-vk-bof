import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, SaveIcon } from "lucide-react";

export const TimeRegistrationForm = (): JSX.Element => {
  const [formData, setFormData] = useState({
    customer: "",
    date: new Date().toISOString().split('T')[0],
    activity: "",
    description: "",
    location: "",
    travelTime: "",
    hours: "",
  });

  const [customerSearch, setCustomerSearch] = useState("");
  const [insatsSearch, setInsatsSearch] = useState("");
  const [behandlareSearch, setBehandlareSearch] = useState("");
  const [sekBehandlareSearch, setSekBehandlareSearch] = useState("");
  const insatser = ["Repulse", "Samverkan", "Trappan", "KIBB", "Familjesöd"];
  const behandlare = ["Anna L", "Jessica S", "Malin K", "PNI"];

  const activities = [
    "Hembesök",
    "Telefonkontakt", 
    "Möte",
    "Dokumentation",
    "Utredning",
    "Uppföljning",
    "Rådgivning",
    "Koordinering"
  ];

  const customers = [
    "AL - Anna Larsson (2007)",
    "BN - Benjamin Nilsson (2012)",
    "CL - Clara Lindberg (2009)",
    "DM - David Månsson (2011)",
    "EH - Emma Holmberg (2006)"
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Registrerar tid:", formData);
    // Here you would typically send the data to your backend
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="text-xl text-[#333333] font-bold flex items-center gap-2">
          <ClockIcon className="w-5 h-5 text-[#17694c]" />
          Ny tidsregistrering
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Kund sökbar select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Kund
            </label>
            <input
              type="text"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Sök kund..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
            />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {customers.filter(c => c.toLowerCase().includes(customerSearch.toLowerCase())).map((customer, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-[#eaf6f1] ${formData.customer === customer ? 'bg-[#eaf6f1]' : ''}`}
                  onClick={() => { handleInputChange("customer", customer); setCustomerSearch(customer); }}
                >
                  {customer}
                </div>
              ))}
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Datum
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#333333]">Timmar</label>
              <Input
                type="number"
                value={formData.hours || ""}
                onChange={e => handleInputChange("hours", e.target.value)}
                placeholder="Antal timmar"
                min="0"
                className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
                required
              />
            </div>
          </div>

          {/* Insats sökbar select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Insats
            </label>
            <input
              type="text"
              value={insatsSearch}
              onChange={e => setInsatsSearch(e.target.value)}
              placeholder="Sök insats..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
            />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {insatser.filter(i => i.toLowerCase().includes(insatsSearch.toLowerCase())).map((insats, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-[#eaf6f1] ${formData.activity === insats ? 'bg-[#eaf6f1]' : ''}`}
                  onClick={() => { handleInputChange("activity", insats); setInsatsSearch(insats); }}
                >
                  {insats}
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333]">
              Plats
            </label>
            <Input
              type="text"
              value={formData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="T.ex. Hemma hos kund, Kontor, Telefon..."
              className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
            />
          </div>

          {/* Travel Time */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333]">
              Restid (minuter)
            </label>
            <Input
              type="number"
              value={formData.travelTime}
              onChange={(e) => handleInputChange("travelTime", e.target.value)}
              placeholder="0"
              min="0"
              className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333]">
              Beskrivning
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Beskriv vad som gjordes under besöket..."
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 resize-none"
              required
            />
          </div>

          {/* Behandlare sökbar select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Behandlare
            </label>
            <input
              type="text"
              value={behandlareSearch}
              onChange={e => setBehandlareSearch(e.target.value)}
              placeholder="Sök behandlare..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
            />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {behandlare.filter(b => b.toLowerCase().includes(behandlareSearch.toLowerCase())).map((b, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-[#eaf6f1] ${formData.handler1 === b ? 'bg-[#eaf6f1]' : ''}`}
                  onClick={() => { handleInputChange("handler1", b); setBehandlareSearch(b); }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Sekundär behandlare sökbar select */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Sekundär (valfritt)
            </label>
            <input
              type="text"
              value={sekBehandlareSearch}
              onChange={e => setSekBehandlareSearch(e.target.value)}
              placeholder="Sök sekundär behandlare..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
            />
            <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg bg-white">
              {behandlare.filter(b => b.toLowerCase().includes(sekBehandlareSearch.toLowerCase())).map((b, index) => (
                <div
                  key={index}
                  className={`p-2 cursor-pointer hover:bg-[#eaf6f1] ${formData.handler2 === b ? 'bg-[#eaf6f1]' : ''}`}
                  onClick={() => { handleInputChange("handler2", b); setSekBehandlareSearch(b); }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              className="bg-[#17694c] hover:bg-[#17694c]/90 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold"
            >
              <SaveIcon className="w-4 h-4" />
              Registrera tid
            </Button>
            
            <Button
              type="button"
              variant="outline"
              className="px-6 py-3 rounded-lg border-gray-300 text-[#666666] hover:bg-gray-50"
            >
              Rensa formulär
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};