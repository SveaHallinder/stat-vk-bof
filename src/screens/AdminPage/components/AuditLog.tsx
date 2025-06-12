import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { 
  SearchIcon, 
  FilterIcon, 
  DownloadIcon,
  UserIcon,
  FileTextIcon,
  SettingsIcon,
  ShieldIcon,
  AlertTriangleIcon,
  InfoIcon
} from "lucide-react";

export const AuditLog = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("alla");
  const [selectedSeverity, setSelectedSeverity] = useState("alla");

  const auditLogs = [
    {
      id: 1,
      timestamp: "2025-03-25 14:30:15",
      user: "Anna Andersson",
      action: "Användarinloggning",
      category: "Autentisering",
      severity: "Info",
      description: "Lyckad inloggning från IP: 192.168.1.100",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: 2,
      timestamp: "2025-03-25 14:25:42",
      user: "Maria Petersson",
      action: "Ärende skapad",
      category: "Dataändring",
      severity: "Info",
      description: "Nytt ärende skapat för kund AL - Anna Larsson",
      ipAddress: "192.168.1.105",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: 3,
      timestamp: "2025-03-25 14:20:18",
      user: "System",
      action: "Automatisk backup",
      category: "System",
      severity: "Info",
      description: "Daglig databassäkerhetskopiering genomförd",
      ipAddress: "localhost",
      userAgent: "System Process",
    },
    {
      id: 4,
      timestamp: "2025-03-25 14:15:33",
      user: "Erik Johansson",
      action: "Misslyckad inloggning",
      category: "Säkerhet",
      severity: "Varning",
      description: "Felaktigt lösenord för användare erik.johansson@vallentuna.se",
      ipAddress: "192.168.1.110",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: 5,
      timestamp: "2025-03-25 14:10:07",
      user: "Anna Andersson",
      action: "Användarroll ändrad",
      category: "Administration",
      severity: "Kritisk",
      description: "Ändrade roll för Lars Nilsson från Handläggare till Supervisor",
      ipAddress: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: 6,
      timestamp: "2025-03-25 14:05:21",
      user: "Sara Lindberg",
      action: "Dokument nedladdat",
      category: "Dataåtkomst",
      severity: "Info",
      description: "Laddade ner rapport för ärende 2025-001",
      ipAddress: "192.168.1.115",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
    {
      id: 7,
      timestamp: "2025-03-25 13:58:44",
      user: "System",
      action: "Systemfel",
      category: "Fel",
      severity: "Fel",
      description: "Databasanslutning misslyckades temporärt",
      ipAddress: "localhost",
      userAgent: "System Process",
    },
    {
      id: 8,
      timestamp: "2025-03-25 13:55:12",
      user: "Maria Petersson",
      action: "Ärende uppdaterat",
      category: "Dataändring",
      severity: "Info",
      description: "Uppdaterade status för ärende 2025-002 till 'Pågående'",
      ipAddress: "192.168.1.105",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  ];

  const actionTypes = [
    { id: "alla", label: "Alla åtgärder", count: 156 },
    { id: "inloggning", label: "Inloggningar", count: 45 },
    { id: "dataandring", label: "Dataändringar", count: 67 },
    { id: "administration", label: "Administration", count: 23 },
    { id: "sakerhet", label: "Säkerhetshändelser", count: 21 },
  ];

  const severityLevels = [
    { id: "alla", label: "Alla nivåer" },
    { id: "info", label: "Info" },
    { id: "varning", label: "Varning" },
    { id: "fel", label: "Fel" },
    { id: "kritisk", label: "Kritisk" },
  ];

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch = searchTerm === "" || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === "alla" ||
      log.category.toLowerCase().includes(selectedAction);

    const matchesSeverity = selectedSeverity === "alla" ||
      log.severity.toLowerCase() === selectedSeverity;

    return matchesSearch && matchesAction && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Info":
        return "bg-blue-100 text-blue-800";
      case "Varning":
        return "bg-yellow-100 text-yellow-800";
      case "Fel":
        return "bg-red-100 text-red-800";
      case "Kritisk":
        return "bg-red-200 text-red-900";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "Info":
        return <InfoIcon className="w-4 h-4" />;
      case "Varning":
        return <AlertTriangleIcon className="w-4 h-4" />;
      case "Fel":
      case "Kritisk":
        return <AlertTriangleIcon className="w-4 h-4" />;
      default:
        return <InfoIcon className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Autentisering":
      case "Säkerhet":
        return <ShieldIcon className="w-4 h-4 text-[#666666]" />;
      case "Administration":
        return <SettingsIcon className="w-4 h-4 text-[#666666]" />;
      case "Dataändring":
      case "Dataåtkomst":
        return <FileTextIcon className="w-4 h-4 text-[#666666]" />;
      default:
        return <UserIcon className="w-4 h-4 text-[#666666]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Audit Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <InfoIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">156</div>
                <div className="text-sm text-[#666666]">Totala händelser</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">21</div>
                <div className="text-sm text-[#666666]">Säkerhetshändelser</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">3</div>
                <div className="text-sm text-[#666666]">Kritiska händelser</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">18</div>
                <div className="text-sm text-[#666666]">Aktiva användare idag</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <FilterIcon className="w-5 h-5 text-[#666666]" />
              <span className="text-lg font-semibold text-[#333333]">Granskningslogg</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 pl-4 pr-12 py-2 h-10 rounded-lg border border-gray-300 text-sm placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
                  placeholder="Sök i loggarna..."
                />
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
              
              <Button className="bg-[#17694c] hover:bg-[#17694c]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <DownloadIcon className="w-4 h-4" />
                Exportera logg
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Action Type Filters */}
            <div className="flex gap-3">
              {actionTypes.map((action) => (
                <Button
                  key={action.id}
                  variant={selectedAction === action.id ? "default" : "outline"}
                  onClick={() => setSelectedAction(action.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedAction === action.id
                      ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                      : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {action.label}
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    selectedAction === action.id
                      ? "bg-white/20 text-white"
                      : "bg-gray-100 text-[#666666]"
                  }`}>
                    {action.count}
                  </span>
                </Button>
              ))}
            </div>

            {/* Severity Filters */}
            <div className="flex gap-3">
              <span className="text-sm font-medium text-[#666666] flex items-center">Allvarlighetsgrad:</span>
              {severityLevels.map((severity) => (
                <Button
                  key={severity.id}
                  variant={selectedSeverity === severity.id ? "default" : "outline"}
                  onClick={() => setSelectedSeverity(severity.id)}
                  size="sm"
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedSeverity === severity.id
                      ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                      : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {severity.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-[#666666]">
            <div className="col-span-2">Tidpunkt</div>
            <div className="col-span-2">Användare</div>
            <div className="col-span-2">Åtgärd</div>
            <div className="col-span-1">Kategori</div>
            <div className="col-span-1">Allvarlighet</div>
            <div className="col-span-4">Beskrivning</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-2">
                  <div className="text-sm text-[#333333]">{log.timestamp.split(' ')[0]}</div>
                  <div className="text-sm text-[#666666]">{log.timestamp.split(' ')[1]}</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm font-medium text-[#333333]">{log.user}</div>
                  <div className="text-xs text-[#666666]">{log.ipAddress}</div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-[#333333]">{log.action}</div>
                </div>
                
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(log.category)}
                    <span className="text-xs text-[#666666]">{log.category}</span>
                  </div>
                </div>
                
                <div className="col-span-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSeverityColor(log.severity)}`}>
                    {getSeverityIcon(log.severity)}
                    {log.severity}
                  </span>
                </div>
                
                <div className="col-span-4">
                  <div className="text-sm text-[#333333]">{log.description}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-[#666666]">
              Visar {filteredLogs.length} av {auditLogs.length} loggposter
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
    </div>
  );
};