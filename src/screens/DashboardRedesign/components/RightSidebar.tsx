import React from "react";
import { Button } from "../../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Separator } from "../../../components/ui/separator";

export const RightSidebar = (): JSX.Element => {
  const todaysAppointments = [
    {
      time: "09:15",
      patient: "AL",
      year: "2007",
      type: "Återbesök",
      highlighted: false,
    },
    {
      time: "09:15",
      patient: "AL",
      year: "2007",
      type: "Återbesök",
      highlighted: false,
    },
    {
      time: "10:30",
      patient: "KJ",
      year: "2010",
      type: "Nybesök",
      highlighted: true,
    },
  ];

  const recentCustomers = [
    {
      id: "AL",
      gender: "Flicka",
      year: "2007",
      date: "25 mars",
      visitType: "Återbesök",
    },
    {
      id: "BN",
      gender: "Pojke",
      year: "2012",
      date: "24 mars",
      visitType: "Nybesök",
    },
    {
      id: "CL",
      gender: "Flicka",
      year: "2009",
      date: "24 mars",
      visitType: "Uppföljning",
    },
  ];

  return (
    <div className="w-80 flex flex-col gap-6">
      {/* Today's appointments card */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#333333] font-bold">
            Idag (25 mars)
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="text-[#666666] text-sm mb-4">
            Bokade besök: 7
          </div>

          <div className="space-y-3">
            {todaysAppointments.map((appointment, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  appointment.highlighted
                    ? "bg-[#17694c]/5 border-[#17694c]/20"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`text-sm font-medium ${
                    appointment.highlighted ? "text-[#17694c]" : "text-[#666666]"
                  }`}
                >
                  {appointment.time} - {appointment.patient} ({appointment.year})
                </div>
                <div
                  className={`text-sm ${
                    appointment.highlighted ? "text-[#17694c]" : "text-[#666666]"
                  }`}
                >
                  {appointment.type}
                </div>
              </div>
            ))}

            <Button
              variant="ghost"
              className="w-full text-sm text-[#17694c] hover:bg-[#17694c]/5"
            >
              Visa alla
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent customers card */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#333333] font-bold">
            Senaste kunder
          </CardTitle>
          <Separator />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {recentCustomers.map((customer, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gray-50 border border-gray-200"
              >
                <div className="text-sm font-bold text-[#666666]">
                  {customer.id} - {customer.gender} ({customer.year})
                </div>
                <div className="text-xs text-[#888888] mt-1">
                  {customer.date} - {customer.visitType}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};