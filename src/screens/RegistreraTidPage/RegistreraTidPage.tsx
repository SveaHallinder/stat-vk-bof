import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, FileText } from "lucide-react";
import { addShift, getShifts, getCases, getEfforts, getHandlers, createCase } from "@/lib/api";
import { KundCombobox } from "@/components/ui/kund-combobox";
import { ShiftEntry, CaseWithNames, Effort, Handler } from "@/types/types";
import toast from "react-hot-toast";

// Hjälpfunktion för att få dagens datum
function today(): string {
  return new Date().toISOString().split('T')[0];
}

interface TimeEntry {
  id: string;
  caseId: number | null;
  date: string;
  hours: number;
  status: "Utförd" | "Avbokad";
}

export const RegisteraTidPage = (): JSX.Element => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: "1",
      caseId: null,
      date: today(),
      hours: 1,
      status: "Utförd"
    }
  ]);
  
  const [activeCases, setActiveCases] = useState<CaseWithNames[]>([]);
  const [efforts, setEfforts] = useState<Effort[]>([]);
  const [handlers, setHandlers] = useState<Handler[]>([]);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  
  // State för att registrera ärende
  const [showCreateCase, setShowCreateCase] = useState(false);
  const [newCaseCustomerId, setNewCaseCustomerId] = useState<string>("");
  const [newCaseEffortId, setNewCaseEffortId] = useState<string>("");
  const [newCaseHandler1Id, setNewCaseHandler1Id] = useState<string>("");
  const [newCaseHandler2Id, setNewCaseHandler2Id] = useState<string>("");

  // Ladda data vid mount
  useEffect(() => {
    async function loadData() {
      try {
        const [activeCasesData, effortsData, handlersData, shiftsData] = await Promise.all([
          getCases(false), // false = endast aktiva ärenden
          getEfforts(),
          getHandlers(true),
          getShifts()
        ]);
        setActiveCases(activeCasesData);
        setEfforts(effortsData);
        setHandlers(handlersData);
        setShifts(shiftsData);
      } catch (error) {
        toast.error("Kunde inte hämta data");
      }
    }
    loadData();
  }, []);

  // Lägg till ny tidsregistrering
  const addTimeEntry = () => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      caseId: null,
      date: today(),
      hours: 1,
      status: "Utförd"
    };
    setTimeEntries([...timeEntries, newEntry]);
  };

  // Ta bort tidsregistrering
  const removeTimeEntry = (id: string) => {
    if (timeEntries.length > 1) {
      setTimeEntries(timeEntries.filter(entry => entry.id !== id));
    }
  };

  // Uppdatera tidsregistrering
  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: any) => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  // Registrera ärende
  const handleCreateCase = async () => {
    if (!newCaseCustomerId || !newCaseEffortId || !newCaseHandler1Id) {
      toast.error("Fyll i alla obligatoriska fält");
      return;
    }
    
    // Validera att värdena är giltiga nummer
    if (isNaN(Number(newCaseCustomerId)) || isNaN(Number(newCaseEffortId)) || isNaN(Number(newCaseHandler1Id))) {
      toast.error("Ogiltiga nummervärden i formuläret");
      return;
    }
    
    if (newCaseHandler2Id && (isNaN(Number(newCaseHandler2Id)) || Number(newCaseHandler2Id) === 0)) {
      toast.error("Ogiltigt värde för andra behandlare");
      return;
    }

    try {
      const newCase = await createCase({
        customer_id: Number(newCaseCustomerId),
        effort_id: Number(newCaseEffortId),
        handler1_id: Number(newCaseHandler1Id),
        handler2_id: newCaseHandler2Id && newCaseHandler2Id !== "" ? Number(newCaseHandler2Id) : null,
        active: true
      });
      
      // Uppdatera aktiva ärenden
      setActiveCases(prev => [newCase, ...prev]);
      setShowCreateCase(false);
      
      // Återställ formuläret
      setNewCaseCustomerId("");
      setNewCaseEffortId("");
      setNewCaseHandler1Id("");
      setNewCaseHandler2Id("");
      
      toast.success("Ärende registrerat");
    } catch (error: any) {
      console.log("RegistreraTidPage Debug - Fel från API:", error);
      console.log("RegistreraTidPage Debug - error.message:", error.message);
      console.log("RegistreraTidPage Debug - error.error:", error.error);
      
      if (error.error && error.error.includes('samma kombination finns redan')) {
        toast.error(error.error, { duration: 8000 }); // 8 sekunder
      } else if (error.message && error.message.includes('samma kombination finns redan')) {
        toast.error('Ett aktivt ärende med samma kombination finns redan för denna kund. Du kan inte skapa flera identiska ärenden.', { duration: 8000 }); // 8 sekunder
      } else {
        toast.error("Kunde inte skapa ärende");
      }
    }
  };

  // Spara alla tidsregistreringar
  const saveAllEntries = async () => {
    const validEntries = timeEntries.filter(entry => 
      entry.caseId && entry.date && entry.hours > 0
    );

    if (validEntries.length === 0) {
      toast.error("Inga giltiga tidsregistreringar att spara");
      return;
    }

    try {
      for (const entry of validEntries) {
        await addShift({
          case_id: entry.caseId!,
          date: entry.date,
          hours: entry.hours,
          status: entry.status
        });
      }

      toast.success(`${validEntries.length} tidsregistreringar sparade`);
      
      // Ladda om shifts
      const updatedShifts = await getShifts();
      setShifts(updatedShifts);
      
      // Återställ formuläret
      setTimeEntries([{
        id: "1",
        caseId: null,
        date: today(),
        hours: 1,
        status: "Utförd"
      }]);
    } catch (error) {
      toast.error("Kunde inte spara alla tidsregistreringar");
    }
  };

  return (
    <Layout title="Registrera tid">
      <div className="mb-6 text-gray-600 text-base">
        Registrera tid för befintliga aktiva ärenden. Välj ärende, datum, timmar och status.
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tidsregistreringar</span>
            <div className="flex gap-3">
              <Button onClick={addTimeEntry} variant="outline" size="sm" className="bg-white hover:bg-gray-50">
                <Plus className="w-4 h-4 mr-2" />
                Lägg till rad
              </Button>
              <Button 
                onClick={() => setShowCreateCase(!showCreateCase)} 
                variant={showCreateCase ? "outline" : "default"}
                size="sm"
                className={`${showCreateCase ? 'bg-white hover:bg-gray-50' : 'bg-[#17694c] hover:bg-[#145c41] text-white'} transition-colors`}
              >
                <FileText className="w-4 h-4 mr-2" />
                {showCreateCase ? 'Avbryt' : 'Registrera ärende'}
              </Button>
              <Button onClick={saveAllEntries} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Spara alla
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Formulär för att registrera ärende */}
          {showCreateCase && (
            <div className="mb-8 p-6 border-2 border-[#17694c] rounded-xl bg-gradient-to-br from-green-50 to-blue-50 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#17694c] rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#17694c]">Registrera nytt ärende</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="customer" className="text-sm font-medium text-gray-700">Kund *</Label>
                  <KundCombobox 
                    value={newCaseCustomerId} 
                    onChange={setNewCaseCustomerId}
                    placeholder="Välj kund"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effort" className="text-sm font-medium text-gray-700">Insats *</Label>
                  <Select value={newCaseEffortId} onValueChange={setNewCaseEffortId}>
                    <SelectTrigger className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]">
                      <SelectValue placeholder="Välj insats" />
                    </SelectTrigger>
                    <SelectContent>
                      {efforts.map((effort) => (
                        <SelectItem key={effort.id} value={effort.id.toString()}>
                          {effort.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handler1" className="text-sm font-medium text-gray-700">Behandlare 1 *</Label>
                  <Select value={newCaseHandler1Id} onValueChange={setNewCaseHandler1Id}>
                    <SelectTrigger className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]">
                      <SelectValue placeholder="Välj behandlare" />
                    </SelectTrigger>
                    <SelectContent>
                      {handlers.map((handler) => (
                        <SelectItem key={handler.id} value={handler.id.toString()}>
                          {handler.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handler2" className="text-sm font-medium text-gray-700">Behandlare 2 (valfritt)</Label>
                  <Select value={newCaseHandler2Id} onValueChange={setNewCaseHandler2Id}>
                    <SelectTrigger className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]">
                      <SelectValue placeholder="Välj behandlare" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ingen</SelectItem>
                      {handlers.map((handler) => (
                        <SelectItem key={handler.id} value={handler.id.toString()}>
                          {handler.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <Button 
                  onClick={handleCreateCase} 
                  className="bg-[#17694c] hover:bg-[#145c41] text-white px-6 py-2"
                >
                  Skapa ärende
                </Button>
                <Button 
                  onClick={() => setShowCreateCase(false)} 
                  variant="outline" 
                  className="px-6 py-2"
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {/* Tidsregistreringar */}
          <div className="space-y-4">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-5 gap-4 p-6 border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ärende *</Label>
                  <Select 
                    value={entry.caseId?.toString() || ""} 
                    onValueChange={(value) => updateTimeEntry(entry.id, 'caseId', Number(value))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]">
                      <SelectValue placeholder="Välj ärende" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCases.map((caseItem) => (
                        <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                          {caseItem.customer_name} - {caseItem.effort_name} ({caseItem.handler1_name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Datum *</Label>
                  <Input
                    type="date"
                    value={entry.date}
                    onChange={(e) => updateTimeEntry(entry.id, 'date', e.target.value)}
                    className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Timmar *</Label>
                  <Input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={entry.hours}
                    onChange={(e) => updateTimeEntry(entry.id, 'hours', Number(e.target.value))}
                    className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]"
                    placeholder="0.5"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Select 
                    value={entry.status} 
                    onValueChange={(value) => updateTimeEntry(entry.id, 'status', value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#17694c] focus:ring-[#17694c]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Utförd">Utförd</SelectItem>
                      <SelectItem value="Avbokad">Avbokad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  {timeEntries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimeEntry(entry.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Befintliga shifts */}
      <Card className="mt-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-3 text-blue-900">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Registrerade tider
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Kund</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Behandlare 1</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Behandlare 2</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Insats</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Datum</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 uppercase tracking-wider text-sm">Timmar</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift, index) => (
                  <tr key={shift.id} className={`hover:bg-blue-50 border-b border-gray-200 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 font-medium text-gray-800">{shift.customer_name}</td>
                    <td className="px-6 py-4 text-gray-600">{shift.handler1_name}</td>
                    <td className="px-6 py-4 text-gray-600">{shift.handler2_name || "-"}</td>
                    <td className="px-6 py-4 text-gray-600">{shift.effort_name}</td>
                    <td className="px-6 py-4 text-gray-600">{shift.date ? shift.date.slice(0,10) : "-"}</td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{shift.hours}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        shift.status === 'Utförd' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {shift.status}
                      </span>
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

