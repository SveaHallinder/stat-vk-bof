import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { CalendarIcon, ClockIcon, UserIcon, FileTextIcon, SaveIcon } from "lucide-react";

export const TimeRegistrationForm = (): JSX.Element => {
  const [formData, setFormData] = useState({
    customer: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    activity: "",
    description: "",
    location: "",
    travelTime: "",
  });

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

  const calculateDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      const diff = end.getTime() - start.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
    return "";
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
          {/* Customer Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Kund
            </label>
            <select
              value={formData.customer}
              onChange={(e) => handleInputChange("customer", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
              required
            >
              <option value="">Välj kund...</option>
              {customers.map((customer, index) => (
                <option key={index} value={customer}>
                  {customer}
                </option>
              ))}
            </select>
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
              <label className="text-sm font-semibold text-[#333333]">
                Starttid
              </label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => handleInputChange("startTime", e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-[#333333]">
                Sluttid
              </label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => handleInputChange("endTime", e.target.value)}
                className="p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0"
                required
              />
            </div>
          </div>

          {/* Duration Display */}
          {calculateDuration() && (
            <div className="bg-[#17694c]/5 border border-[#17694c]/20 rounded-lg p-3">
              <div className="text-sm text-[#17694c] font-semibold">
                Total tid: {calculateDuration()}
              </div>
            </div>
          )}

          {/* Activity Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#333333] flex items-center gap-2">
              <FileTextIcon className="w-4 h-4" />
              Aktivitet
            </label>
            <select
              value={formData.activity}
              onChange={(e) => handleInputChange("activity", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-[#333333]"
              required
            >
              <option value="">Välj aktivitet...</option>
              {activities.map((activity, index) => (
                <option key={index} value={activity}>
                  {activity}
                </option>
              ))}
            </select>
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