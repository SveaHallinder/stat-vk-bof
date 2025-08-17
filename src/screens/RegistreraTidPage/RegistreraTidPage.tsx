import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, FileText, Clock, CheckCircle, Edit } from "lucide-react";
import { addShift, getShifts, getCases, getEfforts, getHandlers, createCase, updateShift } from "@/lib/api";
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

  // State för att spara
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // State för att redigera befintlig tidsregistrering
  const [editingShift, setEditingShift] = useState<ShiftEntry | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

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
        
        // Debug logging
        console.log('Data loaded:', {
          activeCases: activeCasesData.length,
          efforts: effortsData.length,
          handlers: handlersData.length,
          shifts: shiftsData.length
        });
      } catch (error) {
        toast.error("Kunde inte hämta data");
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  // Debug useEffect för showCreateCase
  useEffect(() => {
    console.log('showCreateCase changed to:', showCreateCase);
  }, [showCreateCase]);

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
    setHasUnsavedChanges(true);
  };

  // Ta bort tidsregistrering
  const removeTimeEntry = (id: string) => {
    if (timeEntries.length > 1) {
      setTimeEntries(timeEntries.filter(entry => entry.id !== id));
      setHasUnsavedChanges(true);
    }
  };

  // Uppdatera tidsregistrering
  const updateTimeEntry = (id: string, field: keyof TimeEntry, value: any) => {
    setTimeEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
    setHasUnsavedChanges(true);
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
    
    if (newCaseHandler2Id && newCaseHandler2Id !== "none" && (isNaN(Number(newCaseHandler2Id)) || Number(newCaseHandler2Id) === 0)) {
      toast.error("Ogiltigt värde för andra behandlare");
      return;
    }

    try {
      const newCase = await createCase({
        customer_id: Number(newCaseCustomerId),
        effort_id: Number(newCaseEffortId),
        handler1_id: Number(newCaseHandler1Id),
        handler2_id: newCaseHandler2Id && newCaseHandler2Id !== "none" ? Number(newCaseHandler2Id) : null,
        active: true
      });
      
      // Uppdatera aktiva ärenden
      setActiveCases(prev => [newCase, ...prev]);
      setShowCreateCase(false);
      
      // Återställ formuläret
      setNewCaseCustomerId("");
      setNewCaseEffortId("");
      setNewCaseHandler1Id("");
      setNewCaseHandler2Id("none");
      
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

    // Validera att alla obligatoriska fält är ifyllda
    const invalidEntries = timeEntries.filter(entry => 
      !entry.caseId || !entry.date || entry.hours <= 0
    );

    if (invalidEntries.length > 0) {
      toast.error(`${invalidEntries.length} rad(er) saknar obligatorisk information. Kontrollera att alla fält är ifyllda.`);
      return;
    }

    setIsSaving(true);
    try {
      for (const entry of validEntries) {
        await addShift({
          case_id: entry.caseId!,
          date: entry.date,
          hours: entry.hours,
          status: entry.status
        });
      }

      toast.success(`${validEntries.length} tidsregistreringar sparade framgångsrikt!`, {
        icon: '✅',
        duration: 4000
      });
      
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
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Kunde inte spara tidsregistreringarna. Försök igen.", {
        duration: 5000
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Kontrollera om det finns osparade ändringar
  const getUnsavedCount = () => {
    return timeEntries.filter(entry => entry.caseId && entry.date && entry.hours > 0).length;
  };

  // Hantera klick på tidsregistrering
  const handleShiftClick = (shift: ShiftEntry) => {
    setEditingShift(shift);
    setShowEditModal(true);
  };

  // Spara redigerad tidsregistrering
  const handleSaveEditedShift = async () => {
    if (!editingShift) return;
    
    try {
      const updatedShift = await updateShift(editingShift.id.toString(), {
        date: editingShift.date,
        hours: Number(editingShift.hours),
        status: editingShift.status
      });
      
      // Uppdatera listan
      setShifts(prev => prev.map(s => s.id === editingShift.id ? updatedShift : s));
      
      setShowEditModal(false);
      setEditingShift(null);
      toast.success("Tidsregistrering uppdaterad!");
    } catch (error) {
      toast.error("Kunde inte uppdatera tidsregistrering");
    }
  };

  return (
    <Layout title="Registrera tid">
      <div className="mb-6 text-gray-600 text-base">
        <p className="mb-2">
          <strong>Registrera tid</strong> - Här kan du registrera tidsregistreringar för befintliga aktiva ärenden. 
          Välj ärende, datum, timmar och status.
        </p>
        <p className="text-sm text-gray-500">
          <strong>Skillnad från Ärendelista:</strong> Ärendelista visar ärenden/cases, medan denna sida visar tidsregistreringar (shifts) 
          och låter dig skapa nya tidsregistreringar.
        </p>
      </div>

      {/* Tidsregistreringar - nu först eftersom det är huvudsyftet */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span>Tidsregistreringar</span>
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  {getUnsavedCount()} rad(er) redo att sparas
                </span>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Tidsregistreringar */}
          <div className="space-y-1">
            {timeEntries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-4 gap-4 p-4 bg-white rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">Ärende *</Label>
                  <Select 
                    value={entry.caseId?.toString() || ""} 
                    onValueChange={(value) => updateTimeEntry(entry.id, 'caseId', Number(value))}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-600 focus:ring-blue-600">
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
                    className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
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
                    className="border-gray-300 focus:border-blue-600 focus:ring-blue-600"
                    placeholder="0.5"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select 
                      value={entry.status} 
                      onValueChange={(value) => updateTimeEntry(entry.id, 'status', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-blue-600 focus:ring-blue-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Utförd">Utförd</SelectItem>
                        <SelectItem value="Avbokad">Avbokad</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {timeEntries.length === 1 ? (
                    <Button 
                      onClick={saveAllEntries} 
                      size="sm" 
                      disabled={isSaving || !hasUnsavedChanges}
                      className={`${
                        isSaving 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : hasUnsavedChanges 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-300 cursor-not-allowed'
                      } text-white transition-colors`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sparar...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Spara ({getUnsavedCount()})
                        </>
                      )}
                    </Button>
                  ) : (
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
            
            {/* Knapp för att lägga till fler tider - nu över linjen */}
            <div className="pl-4 pt-2 pb-4">
              <Button 
                onClick={addTimeEntry} 
                variant="outline" 
                size="sm" 
                className="bg-white hover:bg-gray-50 border-blue-200 text-blue-700 hover:text-blue-800"
              >
                <Plus className="w-4 h-4 mr-2" />
                Registrera fler tider
              </Button>
            </div>
            
            {/* Spara alla knapp när det finns fler än 1 tidsregistrering - nu under linjen */}
            {timeEntries.length > 1 && (
              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200 pl-4">
                <Button 
                  onClick={saveAllEntries} 
                  disabled={isSaving || !hasUnsavedChanges}
                  className={`${
                    isSaving 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : hasUnsavedChanges 
                        ? 'bg-blue-600 hover:bg-blue-700' 
                        : 'bg-gray-300 cursor-not-allowed'
                  } text-white px-6 py-2`}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sparar alla...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Spara alla ({getUnsavedCount()})
                    </>
                  )}
                </Button>
                <Button 
                  onClick={() => {
                    setTimeEntries([{
                      id: "1",
                      caseId: null,
                      date: today(),
                      hours: 1,
                      status: "Utförd"
                    }]);
                    setHasUnsavedChanges(false);
                  }} 
                  variant="outline" 
                  className="px-6 py-2"
                >
                  Avbryt
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Separerad sektion för att registrera ärende - nu underst med samma design */}
      <Card className="mb-6">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-gray-800">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Registrera nytt ärende för kund
            <div className="ml-auto flex items-center gap-3">
              <Button 
                onClick={() => setShowCreateCase(!showCreateCase)} 
                variant="outline"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 px-4 py-2 font-medium cursor-pointer z-10 relative"
                type="button"
              >
                {showCreateCase ? 'Dölj formulär' : 'Registrera ärende'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        
        {showCreateCase && (
          <CardContent className="pt-0">
            <div className="p-6 bg-white rounded-lg">
              <div className="mb-4 text-sm text-gray-600">
                Fyll i formuläret nedan för att skapa ett nytt ärende:
              </div>
              <div className="grid grid-cols-4 gap-4">
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-600 focus:ring-gray-600">
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-600 focus:ring-gray-600">
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
                    <SelectTrigger className="border-gray-300 focus:border-gray-600 focus:ring-gray-600">
                      <SelectValue placeholder="Välj behandlare" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ingen</SelectItem>
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
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2"
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
          </CardContent>
        )}
      </Card>

      {/* Befintliga shifts */}
      <Card className="mt-8">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <CardTitle className="flex items-center gap-3 text-blue-900">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">Registrerade tider</div>
              <div className="text-sm font-normal text-blue-700">Översikt över alla tidsregistreringar</div>
            </div>
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
                  <tr 
                    key={shift.id} 
                    className={`hover:bg-blue-50 border-b border-gray-200 transition-colors cursor-pointer`}
                    onClick={() => handleShiftClick(shift)}
                  >
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

      {/* Modal för att redigera tidsregistrering */}
      {showEditModal && editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Redigera tidsregistrering</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Kund</Label>
                <div className="text-gray-600">{editingShift.customer_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Insats</Label>
                <div className="text-gray-600">{editingShift.effort_name}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Datum *</Label>
                <Input
                  type="date"
                  value={editingShift.date ? editingShift.date.slice(0,10) : ''}
                  onChange={(e) => setEditingShift({...editingShift, date: e.target.value})}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Timmar *</Label>
                <Input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editingShift.hours}
                  onChange={(e) => setEditingShift({...editingShift, hours: Number(e.target.value)})}
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Status</Label>
                <Select 
                  value={editingShift.status} 
                  onValueChange={(value) => setEditingShift({...editingShift, status: value as "Utförd" | "Avbokad"})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Utförd">Utförd</SelectItem>
                    <SelectItem value="Avbokad">Avbokad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingShift(null);
                }}
              >
                Avbryt
              </Button>
              <Button onClick={handleSaveEditedShift}>
                Spara
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

