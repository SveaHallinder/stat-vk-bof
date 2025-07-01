import React from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { EyeIcon, EditIcon, TrashIcon, MessageSquareIcon, ClockIcon, AlertTriangleIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CaseTableProps {
  searchTerm: string;
  selectedFilter: string;
  selectedStatus: string;
}

export const CaseTable = ({ searchTerm, selectedFilter, selectedStatus }: CaseTableProps): JSX.Element => {
  // Sample case data
  const cases = [
    {
      id: "2025-001",
      customer: "AL - Anna Larsson",
      title: "Ansökan om personlig assistans",
      description: "Behov av personlig assistans för dagliga aktiviteter",
      status: "Pågående",
      priority: "Hög",
      caseworker: "Maria Andersson",
      created: "2025-03-20",
      updated: "2025-03-25",
      deadline: "2025-04-15",
      category: "Personlig assistans",
      comments: 3,
      timeSpent: "12h 30m",
    },
    {
      id: "2025-002",
      customer: "BN - Benjamin Nilsson",
      title: "Utredning av boendebehov",
      description: "Bedömning av lämpligt boende för ungdom",
      status: "Öppen",
      priority: "Medium",
      caseworker: "Erik Johansson",
      created: "2025-03-22",
      updated: "2025-03-24",
      deadline: "2025-04-20",
      category: "Boende",
      comments: 1,
      timeSpent: "8h 15m",
    },
    {
      id: "2025-003",
      customer: "CL - Clara Lindberg",
      title: "Uppföljning av insats",
      description: "Regelbunden uppföljning av pågående insats",
      status: "Pågående",
      priority: "Låg",
      caseworker: "Anna Petersson",
      created: "2025-03-18",
      updated: "2025-03-24",
      deadline: "2025-04-10",
      category: "Uppföljning",
      comments: 5,
      timeSpent: "6h 45m",
    },
    {
      id: "2025-004",
      customer: "DM - David Månsson",
      title: "Avslutning av ärende",
      description: "Dokumentation och avslutning av genomförd insats",
      status: "Avslutad",
      priority: "Låg",
      caseworker: "Maria Andersson",
      created: "2025-02-15",
      updated: "2025-03-15",
      deadline: "2025-03-30",
      category: "Avslutning",
      comments: 2,
      timeSpent: "4h 20m",
    },
    {
      id: "2025-005",
      customer: "EH - Emma Holmberg",
      title: "Akut behov av stöd",
      description: "Brådskande bedömning av stödbehov",
      status: "Öppen",
      priority: "Hög",
      caseworker: "Erik Johansson",
      created: "2025-03-25",
      updated: "2025-03-25",
      deadline: "2025-03-28",
      category: "Akut",
      comments: 0,
      timeSpent: "2h 10m",
    },
  ];

  const [caseList, setCaseList] = React.useState(cases);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const navigate = useNavigate();

  // Filter cases based on search term and selected filters
  const filteredCases = caseList.filter((caseItem) => {
    const matchesSearch = searchTerm === "" || 
      caseItem.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = selectedFilter === "alla" ||
      (selectedFilter === "mina" && (caseItem.caseworker === "Maria Andersson" || caseItem.caseworker === "Anna Petersson")) ||
      (selectedFilter === "nya" && new Date(caseItem.created) > new Date("2025-03-18")) ||
      (selectedFilter === "prioritet" && caseItem.priority === "Hög");

    const matchesStatus = selectedStatus === "alla" ||
      (selectedStatus === "oppen" && caseItem.status === "Öppen") ||
      (selectedStatus === "pagaende" && caseItem.status === "Pågående") ||
      (selectedStatus === "avslutad" && caseItem.status === "Avslutad") ||
      (selectedStatus === "pausad" && caseItem.status === "Pausad");

    return matchesSearch && matchesFilter && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Öppen":
        return "bg-blue-100 text-blue-800";
      case "Pågående":
        return "bg-yellow-100 text-yellow-800";
      case "Avslutad":
        return "bg-green-100 text-green-800";
      case "Pausad":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Hög":
        return "text-red-600";
      case "Medium":
        return "text-yellow-600";
      case "Låg":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getPriorityIcon = (priority: string) => {
    if (priority === "Hög") {
      return <AlertTriangleIcon className="w-4 h-4 text-red-600" />;
    }
    return null;
  };

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardContent className="p-0">
        {/* Table Header */}
        <div className="grid grid-cols-13 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-[#666666]">
          <div className="col-span-2">Ärendenummer</div>
          <div className="col-span-2">Kund</div>
          <div className="col-span-3">Titel & Beskrivning</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1">Prioritet</div>
          <div className="col-span-1">Behandlare 1</div>
          <div className="col-span-1">Behandlare 2</div>
          <div className="col-span-1">Åtgärder</div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredCases.map((caseItem) => (
            <div key={caseItem.id} className="grid grid-cols-13 gap-4 p-4 hover:bg-gray-50 transition-colors">
              <div className="col-span-2">
                <div className="font-semibold text-[#17694c] text-sm">{caseItem.id}</div>
                <div className="text-xs text-[#666666]">{caseItem.category}</div>
                <div className="text-xs text-[#888888] mt-1">
                  Skapad: {caseItem.created}
                </div>
              </div>
              
              <div className="col-span-2">
                <div className="font-semibold text-[#333333] text-sm">{caseItem.customer}</div>
                <div className="text-xs text-[#666666] mt-1">
                  Uppdaterad: {caseItem.updated}
                </div>
              </div>
              
              <div className="col-span-3">
                <div className="font-semibold text-[#333333] text-sm mb-1">{caseItem.title}</div>
                <div className="text-xs text-[#666666] line-clamp-2">{caseItem.description}</div>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-xs text-[#666666]">
                    <MessageSquareIcon className="w-3 h-3" />
                    {caseItem.comments}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#666666]">
                    <ClockIcon className="w-3 h-3" />
                    {caseItem.timeSpent}
                  </div>
                  {isOverdue(caseItem.deadline) && (
                    <div className="text-xs text-red-600 font-medium">
                      Försenad
                    </div>
                  )}
                </div>
              </div>
              
              <div className="col-span-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                  {caseItem.status}
                </span>
                <div className="text-xs text-[#666666] mt-1">
                  Deadline: {caseItem.deadline}
                </div>
              </div>
              
              <div className="col-span-1">
                <div className={`flex items-center gap-1 text-xs font-medium ${getPriorityColor(caseItem.priority)}`}>
                  {getPriorityIcon(caseItem.priority)}
                  {caseItem.priority}
                </div>
              </div>
              
              <div className="col-span-1">
                <div className="text-sm text-[#333333]">{caseItem.caseworker.split(",")[0] || "-"}</div>
              </div>
              
              <div className="col-span-1">
                <div className="text-sm text-[#333333]">{caseItem.caseworker.split(",")[1] || "-"}</div>
              </div>
              
              <div className="col-span-1">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                    title="Redigera"
                    onClick={() => {
                      // Navigera till kundens sida och visa rätt insats/tid (dummy nu)
                      alert(`Navigera till kundsida för ${caseItem.customer} och öppna rätt insats/tid!`);
                    }}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    title="Radera"
                    onClick={() => setDeleteId(caseItem.id)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Popup för radering */}
        {deleteId && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full flex flex-col items-center">
              <div className="text-lg font-semibold mb-4">Är du säker att du vill radera detta ärende?</div>
              <div className="flex gap-4 mt-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteId(null)}
                  className="min-w-[100px]"
                >
                  Avbryt
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setCaseList(prev => prev.filter(c => c.id !== deleteId));
                    setDeleteId(null);
                  }}
                  className="min-w-[100px]"
                >
                  Radera
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredCases.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-[#666666] text-lg mb-2">Inga ärenden hittades</div>
            <div className="text-[#888888] text-sm">
              Prova att ändra dina sökkriterier eller filter
            </div>
          </div>
        )}

        {/* Table Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-[#666666]">
            Visar {filteredCases.length} av {cases.length} ärenden
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