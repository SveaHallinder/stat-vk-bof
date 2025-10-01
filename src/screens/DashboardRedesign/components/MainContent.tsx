import { X } from "lucide-react";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { BarChartStatistik } from "./BarChartStatistik";
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createCustomer, createCase, getCases, addShift, getStatsSummary, getStatsByEffort, getPublicHandlers } from '@/lib/api';
import { KundCombobox } from "@/components/ui/kund-combobox";
import { InsatsCombobox } from "@/components/ui/insats-combobox";
import { BehandlareCombobox } from "@/components/ui/behandlare-combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import toast from 'react-hot-toast';
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRefresh } from "@/contexts/RefreshContext";

export const MainContent = (): JSX.Element => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useRefresh();
  // Dynamisk statistik
  const [stats, setStats] = useState<{ antal_besok: number; antal_kunder: number; totala_timmar: number; avbokningsgrad: number } | null>(null);
  const [effortData, setEffortData] = useState<any[] | null>(null);
  const [handlers, setHandlers] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoized date calculations
  const dateRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    return { from, to };
  }, []);

  // Memoized data loading function
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Ladda data parallellt men med bättre felhantering
      const [statsResult, effortResult, handlersResult] = await Promise.allSettled([
        getStatsSummary(dateRange),
        getStatsByEffort(dateRange),
        getPublicHandlers()
      ]);
      
      // Hantera resultaten
      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      }
      
      if (effortResult.status === 'fulfilled') {
        setEffortData(effortResult.value);
      }
      
      if (handlersResult.status === 'fulfilled') {
        setHandlers(handlersResult.value);
      } else {
        // Sätt fallback-data för handlers
        setHandlers([
          { id: "13", name: "Svea" },
          { id: "14", name: "Anders" },
          { id: "15", name: "Sandra" },
          { id: "2", name: "System Admin" }
        ]);
      }
    } catch (error) {
      // Silent error handling
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    // Vänta på att användaren är autentiserad
    if (!user) return;
    
    // Ladda data med en liten fördröjning för att säkerställa att token är redo
    const timer = setTimeout(loadDashboardData, 100);
    return () => clearTimeout(timer);
  }, [user, loadDashboardData, refreshKey]);

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      title: "Aktiva kunder",
      value: stats ? stats.antal_kunder : "-",
      note: "Totalt för hela enheten",
    },
    {
      title: "Aktiva insatser",
      value: effortData ? effortData.length : "-",
      note: "Totalt för hela enheten",
    },
    {
      title: "Antal besök",
      value: stats ? stats.antal_besok : "-",
      note: "Totala besök för månaden",
    },
    {
      title: "Utförda besökstimmar",
      value: stats ? `${stats.totala_timmar.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} ` : "-",
      note: "Totala besökstimmar för månaden",
    },
  ], [stats, effortData]);

  // Memoized chart data
  const chartData = useMemo(() => 
    effortData
      ? effortData.map(d => ({
          label: d.effort_name,
          besok: Number(d.antal_besok),
          kunder: Number(d.antal_kunder),
        }))
      : [], 
    [effortData]
  );

  const [openModal, setOpenModal] = useState<null | "kund" | "tid" | "statistik" | "ny-insats">(null);

  // Form state för Lägg till kund
  const [newCustomer, setNewCustomer] = useState({
    initials: "",
    gender: "",
    birthYear: "",
    isGroup: false,
  });

  const [errors, setErrors] = useState<{ initials?: string; gender?: string; birthYear?: string }>({});

  // Memoized validation function
  const validateCustomer = useCallback((c: typeof newCustomer) => {
    const err: { initials?: string; gender?: string; birthYear?: string } = {};
    if (!c.initials) err.initials = "Obligatoriskt fält";
    if (!c.isGroup) {
      if (!c.gender) err.gender = "Obligatoriskt fält";
      if (!c.birthYear) err.birthYear = "Obligatoriskt fält";
      else if (!/^\d{4}$/.test(c.birthYear)) err.birthYear = "Födelseår måste vara 4 siffror";
    }
    return err;
  }, []);

  const handleCustomerChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target;
    const isCheckbox = target instanceof HTMLInputElement && target.type === 'checkbox';
    let value: string | boolean = isCheckbox ? target.checked : target.value;

    if (target.name === 'initials' && typeof value === 'string') {
      value = value.toUpperCase();
    }

    let updated = { ...newCustomer, [target.name]: value } as typeof newCustomer;
    if (target.name === 'isGroup' && value === true) {
      updated = { ...updated, gender: '', birthYear: '' };
    }
    setNewCustomer(updated);
    setErrors(validateCustomer(updated));
  }, [newCustomer, validateCustomer]);

  const handleCustomerCancel = useCallback(() => {
    setOpenModal(null);
    setNewCustomer({ initials: "", gender: "", birthYear: "", isGroup: false });
    setErrors({});
  }, []);

  const handleCustomerSave = useCallback(async () => {
    const newErrors = validateCustomer(newCustomer);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await createCustomer({
        initials: newCustomer.initials,
        gender: newCustomer.isGroup ? undefined : newCustomer.gender,
        birthYear: newCustomer.isGroup ? undefined : Number(newCustomer.birthYear),
        isGroup: newCustomer.isGroup,
      });
      setOpenModal(null);
      setNewCustomer({ initials: '', gender: '', birthYear: '', isGroup: false });
      toast.success('Kund registrerad!');
      setErrors({});
      triggerRefresh();
    } catch (err) {
      toast.error('Kunde inte spara kund');
    }
  }, [newCustomer, validateCustomer, triggerRefresh]);

  // Form state för Registrera insats
  const [newCase, setNewCase] = useState({
    customerId: "",
    effortId: "",
    handler1Id: "",
    handler2Id: "",
  });

  const [newCaseErrors, setNewCaseErrors] = useState<{ customerId?: string; effortId?: string; handler1Id?: string }>({});
  const [activeCases, setActiveCases] = useState<any[]>([]);

  // Memoized case loading function
  const loadActiveCases = useCallback(async () => {
    try {
      const cases = await getCases(false);
      setActiveCases(cases);
    } catch (error) {
      // Silent error handling
    }
  }, []);

  useEffect(() => {
    // Ladda aktiva insatsn när tid-modalen öppnas
    if (openModal === "tid") {
      loadActiveCases();
    }
  }, [openModal, loadActiveCases]);

  // Ladda aktiva insatsn för dashboard-kortet
  useEffect(() => {
    loadActiveCases();
  }, [loadActiveCases, refreshKey]);

  function validateNewCase(c: typeof newCase) {
    const err: { customerId?: string; effortId?: string; handler1Id?: string } = {};
    if (!c.customerId) err.customerId = "Du måste välja kund";
    if (!c.effortId) err.effortId = "Du måste välja insats";
    if (!c.handler1Id) err.handler1Id = "Du måste välja behandlare";
    return err;
  }

  // Hjälpfunktion för att räkna faktiska fel (inte undefined värden)
  function getActualErrorCount(errors: typeof newCaseErrors): number {
    return Object.keys(errors).filter(key => errors[key as keyof typeof errors]).length;
  }

  const handleNewCaseChange = useCallback((field: string, value: string) => {
    const updated = { ...newCase, [field]: value };
    setNewCase(updated);
    setNewCaseErrors(prev => ({ ...prev, [field]: undefined }));
  }, [newCase]);

  const handleNewCaseCancel = useCallback(() => {
    setOpenModal(null);
    setNewCase({ customerId: "", effortId: "", handler1Id: "", handler2Id: "" });
    setNewCaseErrors({});
  }, []);

  const handleNewCaseSave = useCallback(async () => {
    const newErrors = validateNewCase(newCase);
    setNewCaseErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      await createCase({
        customer_id: Number(newCase.customerId),
        effort_id: Number(newCase.effortId),
        handler1_id: Number(newCase.handler1Id),
        handler2_id: newCase.handler2Id ? Number(newCase.handler2Id) : null,
        active: true
      });
      
      setOpenModal(null);
      setNewCase({ customerId: "", effortId: "", handler1Id: "", handler2Id: "" });
      toast.success('Insats registrerat!');
      setNewCaseErrors({});
      triggerRefresh();
    } catch (err: any) {
      // Silent error handling
      
      if (err.error && err.error.includes('samma kombination finns redan')) {
        toast.error(err.error, { duration: 8000 }); // 8 sekunder
      } else if (err.message && err.message.includes('samma kombination finns redan')) {
        toast.error('Ett aktivt insats med samma kombination finns redan för denna kund. Du kan inte skapa flera identiska insatsn.', { duration: 8000 }); // 8 sekunder
      } else {
        toast.error('Kunde inte skapa insats');
      }
    }
  }, [newCase, validateNewCase, triggerRefresh]);

  // Form state för Registrera tid
  const [registerTime, setRegisterTime] = useState({
    customer: "",   // ska vara ett ID (sträng eller siffra)
    effort: "",     // ska vara ett ID
    handler: "",    // ska vara ett ID
    secondary: "",  // ska vara ett ID eller tom sträng
    date: "",
    hours: ""
  });
  const [registerTimeErrors, setRegisterTimeErrors] = useState<{ customer?: string; date?: string; hours?: string }>({});

  const handleRegisterTimeChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setRegisterTime({
      ...registerTime,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    setRegisterTimeErrors(prev => ({ ...prev, [name]: undefined }));
  }, [registerTime]);

  function validateRegisterTime(rt: typeof registerTime) {
    const err: { customer?: string; date?: string; hours?: string } = {};
    if (!rt.customer) err.customer = "Du måste välja insats";
    if (!rt.date) err.date = "Du måste ange datum";
    if (!rt.hours || isNaN(Number(rt.hours)) || Number(rt.hours) <= 0) err.hours = "Du måste ange antal timmar";
    return err;
  }

  const handleRegisterTimeCancel = useCallback(() => {
    setOpenModal(null);
    setRegisterTime({
      customer: "",
      effort: "",
      handler: "",
      secondary: "",
      date: getToday(),
      hours: "",
    });
    setRegisterTimeErrors({});
  }, []);

  const handleRegisterTimeSave = useCallback(async () => {
    const errors = validateRegisterTime(registerTime);
    setRegisterTimeErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      // Find the selected case to get its details
      const selectedCase = activeCases.find(c => c.id.toString() === registerTime.customer);
      if (!selectedCase) {
        toast.error("Välj ett insats");
        return;
      }

      const shiftData = {
        case_id: selectedCase.id,
        date: registerTime.date,
        hours: Number(registerTime.hours),
        status: "Utförd" as const
      };

      await addShift(shiftData);
      
      // Nollställ formuläret eller visa feedback
      setRegisterTime({
        customer: "",
        effort: "",
        handler: "",
        secondary: "",
        date: getToday(),
        hours: "",
      });
      setOpenModal(null);
      toast.success("Tid registrerad!");
      triggerRefresh();
    } catch (err) {
      toast.error("Kunde inte spara tid");
    }
  }, [registerTime, activeCases, triggerRefresh]);

  // Form state för Ta ut statistik
  const [statistik, setStatistik] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    effortCategory: [] as string[],
    handler: [] as string[],
    gender: [] as string[],
    effort: [] as string[],
  });



  const [showStatistikChart, setShowStatistikChart] = useState(false);

  const handleStatistikApply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Hämta ny data baserat på filter
    try {
      const filteredStats = await getStatsSummary({
        from: statistik.from,
        to: statistik.to,
        effortCategory: statistik.effortCategory.length > 0 ? statistik.effortCategory.join(',') : undefined,
        handler: statistik.handler.length > 0 ? statistik.handler.join(',') : undefined,
        gender: statistik.gender.length > 0 ? statistik.gender.join(',') : undefined,
        insats: statistik.effort.length > 0 ? statistik.effort.join(',') : undefined
      });
      
      const filteredEffortData = await getStatsByEffort({
        from: statistik.from,
        to: statistik.to,
        effortCategory: statistik.effortCategory.length > 0 ? statistik.effortCategory.join(',') : undefined,
        handler: statistik.handler.length > 0 ? statistik.handler.join(',') : undefined,
        gender: statistik.gender.length > 0 ? statistik.gender.join(',') : undefined,
        insats: statistik.effort.length > 0 ? statistik.effort.join(',') : undefined
      });
      
      setStats(filteredStats);
      setEffortData(filteredEffortData);
      setShowStatistikChart(true);
    } catch (error) {
      toast.error('Kunde inte hämta filtrerad data');
    }
  }, [statistik]);

  const handleStatistikCancel = useCallback(() => {
    setOpenModal(null);
    setStatistik({ 
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
      to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
      effortCategory: [], 
      handler: [], 
      gender: [], 
      effort: [] 
    });
    setShowStatistikChart(false);
  }, []);

  // Exportfunktioner
  const handleExportPDF = useCallback(async () => {
    const input = document.getElementById('statistik-export');
    if (!input) return;
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ]);
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'landscape' });
    pdf.addImage(imgData, 'PNG', 10, 10, 270, 150);
    pdf.save('statistik.pdf');
  }, []);

  const handleExportExcel = useCallback(async () => {
    const data = [
      ['Insats', 'Antal besök', 'Antal kunder'],
      ...chartData.map(item => [item.label, item.besok, item.kunder])
    ];
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statistik');
    XLSX.writeFile(wb, 'statistik.xlsx');
  }, [chartData]);

  const getToday = useCallback(() => new Date().toISOString().slice(0, 10), []);

  // Navigera till olika sidor från dashboard-korten
  const handleCardClick = useCallback((destination: string) => {
    switch (destination) {
      case 'customers':
        navigate('/kunder');
        break;
      case 'cases':
        navigate('/arendelista');
        break;
      case 'visits':
        navigate('/statistik');
        break;
    }
  }, [navigate]);

  return (
    <div className="flex-1 flex flex-col items-center min-h-screen bg-[#f5f7fa]">
      {/* Toaster is provided globally in src/index.tsx */}
      {/* Main Content Grid */}
      <div className="w-full max-w-[350px] mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">
        {/* Sammanfattning */}
        <div className="grid grid-cols-1 mobile:grid-cols-1 lg:grid-cols-4 gap-4 mobile:gap-6 w-full" data-tour="stats-cards">
          {isLoading ? (
            // Loading state
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm p-4 mobile:p-6 flex flex-col justify-center animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-10 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
            ))
          ) : (
            statsCards.map((card, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-sm p-2 mobile:p-6 flex flex-col justify-center cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCardClick(['customers', 'cases', 'visits'][index])}
              >
                <div className="text-gray-500 text-sm font-semibold tracking-wide uppercase">
                  {card.title}
                </div>
                <div className="text-2xl mobile:text-3xl lg:text-4xl text-[#222] font-light mt-2">
                  {card.value}
                </div>
                {card.note && (
                  <div className="text-gray-400 text-xs mt-2 font-light">
                    {card.note}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        {/* Snabbåtgärder */}
        <div className="bg-white rounded-xl p-4 sm:p-6 flex flex-col shadow-sm items-start" data-tour="quick-actions">
          <h3 className="text-[#333] text-lg font-light mb-4 sm:mb-6 tracking-tight">Snabbåtgärder</h3>
          <div className="flex laptop:flex-row mobile:flex-col h-auto gap-3 sm:gap-4 lg:gap-8 w-auto mobile:w-full">
            <Button
              variant="outline"
              className="flex-1 w-auto rounded-lg border max-h-10 h-auto border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-4 sm:px-7 py-3 sm:w-full"
              onClick={() => setOpenModal("kund")}
              data-tour="add-customer-btn"
            >
              + Lägg till kund
            </Button>
            <Button
              variant="outline"
              className="flex-1 mobile:h-auto max-h-10 w-auto rounded-lg border border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-4 sm:px-7 py-3 sm:w-full"
              onClick={() => setOpenModal("ny-insats")}
              data-tour="register-case-btn"
            >
              + Registrera insats
            </Button>
            <Button
              variant="outline"
              className="flex-1 w-auto rounded-lg max-h-10 h-auto border border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-4 sm:px-7 py-3 sm:w-full"
              onClick={() => {
                setOpenModal("tid");
                setRegisterTime(rt => ({ ...rt, date: getToday() }));
              }}
              data-tour="register-time-btn"
            >
              + Registrera tid
            </Button>
            <Button
              variant="outline"
              className="flex-1 w-auto rounded-lg border max-h-10 h-auto border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-4 sm:px-7 py-3 sm:w-full"
              onClick={() => setOpenModal("statistik")}
              data-tour="statistics-btn"
            >
              + Ta ut statistik
            </Button>
          </div>
        </div>
        {/* Diagram */}
        <div data-tour="chart-section" className="w-full bg-white rounded-xl p-4 mobile:p-6 shadow-sm">
          <BarChartStatistik
            data={chartData}
            titel={`Besöksstatistik (${new Date().toLocaleString('sv-SE', { month: 'long' })})`}
          />
        </div>
      </div>

      {/* Modals - keeping them as they were before */}
      <Modal open={openModal === "kund"} onClose={handleCustomerCancel}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-0">
          <div className="bg-[#17694c] rounded-t-2xl px-8 pt-7 pb-5 flex items-center justify-between">
            <h2 className="text-xl font-light text-white tracking-tight">Lägg till ny kund</h2>
            <button
              type="button"
              onClick={handleCustomerCancel}
              className="text-white hover:bg-[#145c41] rounded-full p-1.5 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Stäng"
            >
              <X size={24} />
            </button>
          </div>
          <form className="pt-8 pb-10 px-8 flex flex-col gap-7" style={{borderRadius: '0 0 1rem 1rem'}}>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Initialer</label>
              <input
                type="text"
                name="initials"
                placeholder="t.ex. AL"
                value={newCustomer.initials}
                onChange={handleCustomerChange}
                className={`border rounded-lg px-4 py-2 text-base bg-[#fafbfc] focus:outline-none focus:ring-2 ${errors.initials ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
              />
              {errors.initials && <span className="text-red-500 text-sm mt-1">{errors.initials}</span>}
            </div>
            <label className="inline-flex items-center gap-2 text-[#17694c] text-base">
              <input
                type="checkbox"
                name="isGroup"
                checked={newCustomer.isGroup}
                onChange={handleCustomerChange}
                className="rounded border-gray-300 text-[#17694c] focus:ring-[#17694c]"
              />
              Registrera som grupp
            </label>
            {!newCustomer.isGroup && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-[#17694c] font-normal text-base">Kön</label>
                  <select
                    name="gender"
                    value={newCustomer.gender}
                    onChange={handleCustomerChange}
                    className={`border rounded-lg px-4 py-2 text-base bg-[#fafbfc] focus:outline-none focus:ring-2 ${errors.gender ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                  >
                    <option value="">Välj kön</option>
                    <option value="Flicka">Flicka</option>
                    <option value="Pojke">Pojke</option>
                    <option value="Icke-binär">Icke-binär</option>
                  </select>
                  {errors.gender && <span className="text-red-500 text-sm mt-1">{errors.gender}</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[#17694c] font-normal text-base">Födelseår</label>
                  <input
                    type="text"
                    name="birthYear"
                    placeholder="ÅÅÅÅ"
                    value={newCustomer.birthYear}
                    onChange={handleCustomerChange}
                    className={`border rounded-lg px-4 py-2 text-base bg-[#fafbfc] focus:outline-none focus:ring-2 ${errors.birthYear ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#17694c]'}`}
                    maxLength={4}
                  />
                  {errors.birthYear && <span className="text-red-500 text-sm mt-1">{errors.birthYear}</span>}
                </div>
              </>
            )}
            <div className="flex gap-4 justify-center mt-8">
              <button
                type="button"
                onClick={handleCustomerCancel}
                className="px-7 py-3 rounded-full border border-gray-300 text-[#17694c] bg-white font-normal hover:bg-gray-50 transition text-base min-w-[120px]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleCustomerSave}
                className={`px-7 py-3 rounded-full font-normal transition text-base min-w-[160px] ${Object.keys(errors).length > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#17694c] text-white hover:bg-[#145c41]'}`}
                disabled={Object.keys(errors).length > 0}
              >
                Spara och fortsätt
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Registrera insats modal */}
      <Modal open={openModal === "ny-insats"} onClose={handleNewCaseCancel}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-0">
          <div className="bg-[#17694c] rounded-t-2xl px-8 pt-7 pb-5 flex items-center justify-between">
            <h2 className="text-xl font-light text-white tracking-tight">Registrera insats</h2>
            <button
              type="button"
              onClick={handleNewCaseCancel}
              className="text-white hover:bg-[#145c41] rounded-full p-1.5 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Stäng"
            >
              <X size={24} />
            </button>
          </div>
          <form className="pt-8 pb-10 px-8 flex flex-col gap-7" style={{borderRadius: '0 0 1rem 1rem'}}>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Kund</label>
              <KundCombobox 
                value={newCase.customerId} 
                onChange={(value) => handleNewCaseChange('customerId', value)} 
                placeholder="Välj kund" 
              />
              {newCaseErrors.customerId && <span className="text-red-500 text-sm mt-1">{newCaseErrors.customerId}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Insats</label>
              <InsatsCombobox 
                value={newCase.effortId} 
                onChange={(value) => handleNewCaseChange('effortId', value)} 
                placeholder="Välj insats" 
              />
              {newCaseErrors.effortId && <span className="text-red-500 text-sm mt-1">{newCaseErrors.effortId}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Behandlare 1</label>
              <BehandlareCombobox
                value={newCase.handler1Id}
                onChange={(value) => handleNewCaseChange('handler1Id', value)}
              />
              {newCaseErrors.handler1Id && <span className="text-red-500 text-sm mt-1">{newCaseErrors.handler1Id}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Behandlare 2 (valfritt)</label>
              <BehandlareCombobox
                value={newCase.handler2Id}
                onChange={(value) => handleNewCaseChange('handler2Id', value)}
              />
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <button
                type="button"
                onClick={handleNewCaseCancel}
                className="px-7 py-3 rounded-full border border-gray-300 text-[#17694c] bg-white font-normal hover:bg-gray-50 transition text-base min-w-[120px]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleNewCaseSave}
                className={`px-7 py-3 rounded-full font-normal transition text-base min-w-[160px] ${getActualErrorCount(newCaseErrors) > 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#17694c] text-white hover:bg-[#145c41]'}`}
                disabled={getActualErrorCount(newCaseErrors) > 0}
              >
                Spara och fortsätt
                {getActualErrorCount(newCaseErrors) > 0 && (
                  <span className="ml-2 text-xs">({getActualErrorCount(newCaseErrors)} fel)</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal open={openModal === "tid"} onClose={handleRegisterTimeCancel}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-0">
          <div className="bg-[#17694c] rounded-t-2xl px-8 pt-7 pb-5 flex items-center justify-between">
            <h2 className="text-xl font-light text-white tracking-tight">Registrera tid på insats</h2>
            <button
              type="button"
              onClick={handleRegisterTimeCancel}
              className="text-white hover:bg-[#145c41] rounded-full p-1.5 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Stäng"
            >
              <X size={24} />
            </button>
          </div>
          <form className="pt-8 pb-10 px-8 flex flex-col gap-7" style={{borderRadius: '0 0 1rem 1rem'}}>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Välj insats *</label>
              <Select value={registerTime.customer} onValueChange={value => {
                setRegisterTime(rt => ({ ...rt, customer: value }));
                setRegisterTimeErrors(prev => ({ ...prev, customer: undefined }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj insats" />
                </SelectTrigger>
                <SelectContent>
                  {activeCases.map((caseItem) => (
                    <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                      {caseItem.customer_name} - {caseItem.effort_name} ({caseItem.handler1_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {registerTimeErrors.customer && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.customer}</span>}
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Datum *</label>
                <input
                  type="date"
                  name="date"
                  value={registerTime.date}
                  onChange={handleRegisterTimeChange}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                />
                {registerTimeErrors.date && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.date}</span>}
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Timmar *</label>
                <input
                  type="number"
                  name="hours"
                  value={registerTime.hours}
                  onChange={handleRegisterTimeChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                  min={0.5}
                  step={0.5}
                  placeholder="Antal timmar"
                />
                {registerTimeErrors.hours && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.hours}</span>}
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <button
                type="button"
                onClick={handleRegisterTimeCancel}
                className="px-7 py-3 rounded-full border border-gray-300 text-[#17694c] bg-white font-normal hover:bg-gray-50 transition text-base min-w-[120px]"
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={handleRegisterTimeSave}
                className={`px-7 py-3 rounded-full font-normal transition text-base min-w-[160px] ${Object.values(registerTimeErrors).some(Boolean) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#17694c] text-white hover:bg-[#145c41]'}`}
                disabled={Object.values(registerTimeErrors).some(Boolean)}
              >
                Spara tid
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={openModal === "statistik"} onClose={handleStatistikCancel}>
        <div className={`bg-white rounded-2xl shadow-xl p-16 w-full transition-all min-w-[450px] duration-300 ${showStatistikChart ? 'max-w-6xl min-w-[900px] flex flex-col' : 'max-w-4xl'} `}>
          <h2 className="text-2xl font-light mb-8">Ta ut statistik</h2>
          <div className={`flex ${showStatistikChart ? 'flex-row gap-12' : 'flex-col'}`}>
            {/* Vänsterkolumn: Filter */}
            <form className={`flex flex-col gap-6 ${showStatistikChart ? 'w-80 max-w-sm' : 'w-full'}`} onSubmit={handleStatistikApply}>
              <div>
                <label className="block text-sm font-medium text-gray-700">Tidsperiod</label>
                <DateRangePicker
                  value={{
                    from: statistik.from ? new Date(statistik.from) : null,
                    to: statistik.to ? new Date(statistik.to) : null
                  }}
                  onChange={(range) => {
                    setStatistik({
                      ...statistik,
                      from: range.from ? range.from.toISOString().slice(0, 10) : '',
                      to: range.to ? range.to.toISOString().slice(0, 10) : ''
                    });
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Insatskategori</label>
                <MultiSelectCombobox
                  options={[
                    { value: "Biståndsbedömda", label: "Biståndsbedömda" },
                    { value: "Förebyggande arbete", label: "Förebyggande arbete" },
                    { value: "Biståndsbedömda, Förebyggande arbete", label: "Biståndsbedömda, Förebyggande arbete" },
                    { value: "IUB", label: "IUB" },
                    { value: "Biståndsbedömda, IUB", label: "Biståndsbedömda, IUB" }
                  ]}
                  value={statistik.effortCategory}
                  onChange={(values) => setStatistik({ ...statistik, effortCategory: values })}
                  placeholder="Välj insatskategori"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Behandlare</label>
                <MultiSelectCombobox
                  options={handlers?.map(handler => ({ value: handler.id, label: handler.name })) || [
                    { value: "13", label: "Svea" },
                    { value: "14", label: "Anders" },
                    { value: "15", label: "Sandra" },
                    { value: "2", label: "System Admin" }
                  ]}
                  value={statistik.handler}
                  onChange={(values) => setStatistik({ ...statistik, handler: values })}
                  placeholder="Välj behandlare"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Kön</label>
                <MultiSelectCombobox
                  options={[
                    { value: "Pojke", label: "Pojke" },
                    { value: "Flicka", label: "Flicka" },
                    { value: "Icke-binär", label: "Icke-binär" }
                  ]}
                  value={statistik.gender}
                  onChange={(values) => setStatistik({ ...statistik, gender: values })}
                  placeholder="Välj kön"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Insats</label>
                <MultiSelectCombobox
                  options={effortData?.map(effort => ({ value: effort.effort_name, label: effort.effort_name })) || []}
                  value={statistik.effort}
                  onChange={(values) => setStatistik({ ...statistik, effort: values })}
                  placeholder="Välj insats"
                />
              </div>
              <div className="flex gap-4 mt-6">
                <Button variant="outline" type="button" onClick={handleStatistikCancel} className="flex-1 py-3">Avbryt</Button>
                <Button variant="default" type="submit" className="flex-1 py-3 bg-[#17694c] hover:bg-[#145c41]">{showStatistikChart ? 'Applicera filter' : 'Visa diagram'}</Button>
              </div>
            </form>
            {/* Högerkolumn: Diagram och export */}
            {showStatistikChart && (
              <div className="flex-1 flex flex-col gap-8 justify-center items-center" id="statistik-export">
                <div className="w-full flex flex-col items-center">
                  <h3 className="text-xl font-light mb-4">Besök och kunder per insatstyp</h3>
                  
                  {chartData.length === 0 ? (
                    <div className="w-full h-96 flex flex-col items-center justify-center text-center">
                      <div className="text-gray-400 text-lg mb-4">
                        Ingen data hittades med de valda filtren
                      </div>
                      <div className="text-gray-500 text-sm mb-6 max-w-md">
                        Prova att ändra eller ta bort några filter. De valda filtren kan vara för strikta.
                      </div>
                      <div className="flex gap-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setStatistik({ 
                              from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
                              to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
                              effortCategory: [], 
                              handler: [], 
                              gender: [], 
                              effort: [] 
                            });
                            setShowStatistikChart(false);
                          }}
                        >
                          Nollställ filter
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setShowStatistikChart(false)}
                        >
                          Ändra filter
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-full h-96 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={chartData}
                              dataKey="besok"
                              nameKey="label"
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={110}
                              fill="#17694c"
                              label={({ label, value }) => `${label}: ${value}`}
                              labelLine={true}
                            >
                              {chartData.map((_entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={['#17694c', '#4bbf73', '#e6a100', '#e64a19', '#1769dc', '#b36ae2', '#f59e42', '#6b7280'][index % 8]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend layout="horizontal" verticalAlign="bottom" align="center" />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex gap-6 mt-8">
                        <Button variant="outline" onClick={handleExportPDF}>Exportera som PDF</Button>
                        <Button variant="outline" onClick={handleExportExcel}>Ladda ner som Excel</Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
      <p className="text-center text-xs text-gray-500 py-4 mt-auto">
        © 2024 Vallentuna Biståndshandläggare
      </p>
    </div>
  );
};
