import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, FileText, Clock, CheckCircle } from "lucide-react";
import { addShift, getShifts, getCases, getEfforts, getHandlers, getPublicHandlers, createCase, updateShift } from "@/lib/api";
import { KundCombobox } from "@/components/ui/kund-combobox";
import { ShiftEntry, CaseWithNames, Effort, Handler } from "@/types/types";
import { HandlerPublic } from "@/lib/api";
import { LoadingSpinner, Skeleton } from "@/components/ui/loading-spinner";
import { enhancedToast } from "@/components/ui/enhanced-toast";
import { validateForm, schemas } from "@/lib/validation";
import { useKeyboardNavigation, useFocusTrap } from "@/lib/keyboard-navigation";

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
  const { user } = useAuth();
  
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
  const [handlers, setHandlers] = useState<Handler[] | HandlerPublic[]>([]);
  const [shifts, setShifts] = useState<ShiftEntry[]>([]);
  
  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isLoadingCases, setIsLoadingCases] = useState(false);
  const [isLoadingShifts, setIsLoadingShifts] = useState(false);
  
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
  
  // Keyboard navigation
  const { focusFirst } = useKeyboardNavigation();
  
  // Focus trap för modal
  const modalFocusTrapRef = useFocusTrap(showEditModal);
  
  // Keyboard event handlers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S för att spara
      if (event.ctrlKey && event.key === 's') {
        event.preventDefault();
        if (hasUnsavedChanges) {
          saveAllEntries();
        }
      }
      
      // Escape för att stänga modal
      if (event.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
        setEditingShift(null);
      }
      
      // Escape för att stänga ärendeskapande
      if (event.key === 'Escape' && showCreateCase) {
        setShowCreateCase(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasUnsavedChanges, showEditModal, showCreateCase]);

  // Ladda data vid mount
  useEffect(() => {
    async function loadData() {
      setIsLoadingData(true);
      try {
        const [activeCasesData, effortsData, handlersData, shiftsData] = await Promise.all([
          getCases(false), // false = endast aktiva ärenden
          getEfforts(),
          user?.role === 'admin' ? getHandlers(true) : getPublicHandlers(),
          getShifts()
        ]);
        setActiveCases(activeCasesData);
        setEfforts(effortsData);
        setHandlers(handlersData);
        setShifts(shiftsData);
              } catch (error) {
          console.error("Error loading data:", error);
          enhancedToast.error("Kunde inte ladda data. Kontrollera din internetanslutning och försök igen.");
        } finally {
        setIsLoadingData(false);
      }
    }
    loadData();
  }, [user]);
  


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
    // Validera formuläret med Zod
    const formData = {
      customer_id: Number(newCaseCustomerId),
      effort_id: Number(newCaseEffortId),
      handler1_id: Number(newCaseHandler1Id),
      handler2_id: newCaseHandler2Id && newCaseHandler2Id !== "none" ? Number(newCaseHandler2Id) : null,
      active: true
    };

    const validation = validateForm(schemas.case, formData);
    if (!validation.success) {
      enhancedToast.error(`Valideringsfel: ${validation.errors.join(', ')}`);
      return;
    }

    setIsLoadingCases(true);
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
      
      enhancedToast.success("Ärende registrerat");
    } catch (error: any) {
      if (error.error && error.error.includes('samma kombination finns redan')) {
        enhancedToast.error(error.error, { duration: 8000 }); // 8 sekunder
      } else if (error.message && error.message.includes('samma kombination finns redan')) {
        enhancedToast.error('Ett aktivt ärende med samma kombination finns redan för denna kund. Du kan inte skapa flera identiska ärenden.', { duration: 8000 }); // 8 sekunder
      } else {
        enhancedToast.error("Kunde inte skapa ärende. Kontrollera din internetanslutning och försök igen.");
      }
    } finally {
      setIsLoadingCases(false);
    }
  };

  // Spara alla tidsregistreringar
  const saveAllEntries = async () => {
    // Validera alla tidsregistreringar med Zod
    const validationResults = timeEntries.map(entry => ({
      entry,
      validation: validateForm(schemas.timeEntry, {
        caseId: entry.caseId,
        date: entry.date,
        hours: entry.hours,
        status: entry.status
      })
    }));

    const validEntries = validationResults
      .filter(result => result.validation.success)
      .map(result => result.entry);

    if (validEntries.length === 0) {
      enhancedToast.error("Inga giltiga tidsregistreringar att spara");
      return;
    }

    const invalidEntries = validationResults.filter(result => !result.validation.success);
    if (invalidEntries.length > 0) {
      const errorMessages = invalidEntries
        .map(result => 'validation' in result && !result.validation.success ? result.validation.errors.join(', ') : 'Okänt fel')
        .join('; ');
      enhancedToast.error(`Valideringsfel: ${errorMessages}`);
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

      enhancedToast.success(`${validEntries.length} tidsregistreringar sparade framgångsrikt!`, {
        icon: '✅',
        duration: 4000
      });
      
      // Ladda om shifts
      setIsLoadingShifts(true);
      try {
        const updatedShifts = await getShifts();
        setShifts(updatedShifts);
      } catch (error) {
        console.error("Kunde inte ladda om tidsregistreringar:", error);
        enhancedToast.error("Tidsregistreringar sparades men kunde inte ladda om listan");
      } finally {
        setIsLoadingShifts(false);
      }
      
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
      console.error("Error saving shifts:", error);
      enhancedToast.error("Kunde inte spara tidsregistreringarna. Kontrollera din internetanslutning och försök igen.", {
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
      enhancedToast.success("Tidsregistrering uppdaterad!");
    } catch (error) {
      enhancedToast.error("Kunde inte uppdatera tidsregistrering");
    }
  };

  return (
    <Layout title="Registrera tid">
      {/* Responsiv container */}
      <div className="w-full w-auto min-w-full mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">

      {/* Tidsregistreringar - nu först eftersom det är huvudsyftet */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <span>Tidsregistreringar</span>
            </div>
            {hasUnsavedChanges && (
              <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded-full mobile:hidden">
                {getUnsavedCount()} rad(er) redo att sparas
              </span>
            )}
          </CardTitle>
          <p className="mb-2 text-sm max-w-xl">
                Här kan du registrera tidsregistreringar för befintliga aktiva ärenden. 
                Välj ärende, datum, timmar och status. Registrera ett nytt ärende nedan om du inte hittar ärendet i listan.
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingData ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <>
              {/* Tidsregistreringar */}
              <div className="space-y-1 mobile:space-y-2">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="flex flex-col gap-4 p-4 bg-white rounded-lg lg:flex-row" style={{ gridTemplateColumns: '1.75fr auto auto auto' }}>
                    <div className="space-y-2 mobile:flex-1">
                      <Label className="text-sm font-medium text-gray-700">Ärende *</Label>
                      <Select 
                        value={entry.caseId?.toString() || ""} 
                        onValueChange={(value) => updateTimeEntry(entry.id, 'caseId', Number(value))}
                      >
                        <SelectTrigger className="border-gray-300 focus:border-blue-600 focus:ring-blue-600 flex-1 h-10">
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
                    
                    <div className="space-y-2 mobile:flex-1">
                      <Label className="text-sm font-medium text-gray-700">Datum *</Label>
                      <Input
                        type="date"
                        value={entry.date}
                        onChange={(e) => updateTimeEntry(entry.id, 'date', e.target.value)}
                        className="border-gray-300 focus:border-blue-600 focus:ring-blue-600 w-52 h-10 mobile:flex-1"
                      />
                    </div>
                    
                    <div className="space-y-2 mobile:flex-1">
                      <Label className="text-sm font-medium text-gray-700">Timmar *</Label>
                      <Input
                        type="number"
                        min="0.5"
                        step="0.5"
                        value={entry.hours}
                        onChange={(e) => updateTimeEntry(entry.id, 'hours', Number(e.target.value))}
                        className="border-gray-300 focus:border-blue-600 focus:ring-blue-600 w-52 h-10"
                        placeholder="0.5"
                      />
                    </div>
                    
                    <div className="flex items-end gap-2">
                      <div className="w-32">
                        <Select 
                          value={entry.status} 
                          onValueChange={(value) => updateTimeEntry(entry.id, 'status', value)}
                        >
                          <SelectTrigger className="border-gray-300 focus:border-blue-600 focus:ring-blue-600 h-10">
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
                          } text-white transition-colors mb-1 max-h-9 h-full mobile:w-full mobile:min-h-10 mobile:mb-0`}
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Separerad sektion för att registrera ärende - nu underst med samma design */}
      <Card className="mb-6 ">
        <CardHeader className="pb-4">
          <CardTitle className="flex flex-col gap-3 text-gray-800">
            <div className="flex items-center gap-3 mobile:mx-6 mobile:mb-4">
              <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span>Registrera nytt ärende för kund</span>
            </div>
            <div className="flex lg:ml-6 gap-3 mobile:w-full">
              <Button 
                onClick={() => setShowCreateCase(!showCreateCase)} 
                variant="outline"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700 px-4 py-2 font-medium cursor-pointer z-10 relative mobile:w-full mobile:mx-6 mobile:min-h-10 mobile:mb-0 lg:max-w-fit float-left lg:ml-0"
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
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2 flex flex-col">
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
              
              <div className="flex flex-col gap-3 mt-6 pt-4 border-t border-gray-200 lg:flex-row">
                <Button 
                  onClick={handleCreateCase} 
                  disabled={isLoadingCases}
                  className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoadingCases ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Skapar ärende...
                    </>
                  ) : (
                    'Skapa ärende'
                  )}
                </Button>
                <Button 
                  onClick={() => setShowCreateCase(false)} 
                  variant="outline" 
                  disabled={isLoadingCases}
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
      <Card className="mt-8 border-radius-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
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
                  {isLoadingData ? (
                    // Skeleton loading för tabellen
                    [...Array(3)].map((_, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-28" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-4 w-12" /></td>
                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                      </tr>
                    ))
                  ) : shifts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                        <div className="py-8">
                          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">Inga registrerade tider hittades.</p>
                          <p className="text-sm text-gray-400 mt-1">Börja med att registrera tid ovan.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    shifts.map((shift) => (
                      <tr 
                        key={shift.id} 
                        className={`hover:bg-blue-50 border-t border-gray-200 transition-colors cursor-pointer`}
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
                    ))
                  )}
                </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal för att redigera tidsregistrering */}
      {showEditModal && editingShift && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div 
            ref={modalFocusTrapRef}
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            tabIndex={-1}
          >
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
    </div>
    </Layout>
  );
};

