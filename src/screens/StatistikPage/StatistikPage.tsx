import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { getStatsSummary, getStatsByEffort, getEfforts, getHandlers, getPublicHandlers, getCustomers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Customer, Handler, Effort } from "@/types/types";
import { api } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";

const minBarHeight = 24;

export const StatistikPage = (): JSX.Element => {
  const { user } = useAuth();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string } | null>(null);
  const [stats, setStats] = useState<{ antal_besok: number; antal_kunder: number; genomsnittlig_tid: number; avbokningsgrad: number } | null>(null);
  const [loading, setLoading] = useState(false);
  // Nytt: datumintervall
  const [dateRange, setDateRange] = useState<{ from: Date|null, to: Date|null }>({ from: null, to: null });

  // Stapeldiagram-data
  const [effortData, setEffortData] = useState<any[] | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedEfforts, setSelectedEfforts] = useState<string[]>([]);
  const [selectedEffortCategories, setSelectedEffortCategories] = useState<string[]>([]);
  const [selectedHandlers, setSelectedHandlers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [shiftStatus, setShiftStatus] = useState<'Alla' | 'Utförd' | 'Avbokad'>('Alla');
  // Valbara alternativ
  type CustomerItem = Customer & { birthYear: number };

  const [effortOptions, setEffortOptions] = useState<Effort[]>([]);
  const [handlerOptions, setHandlerOptions] = useState<Handler[]>([]);
  const [customerOptions, setCustomerOptions] = useState<CustomerItem[]>([]);
  // Födelseårsalternativ (hårdkodat för demo, kan hämtas från kunder)
  const [yearOptions, setYearOptions] = useState<{ label: string; value: string }[]>([]);
  const yearLabel = (() => {
    if (dateRange.from && dateRange.to) {
      const fy = dateRange.from.getFullYear();
      const ty = dateRange.to.getFullYear();
      return fy === ty ? fy : `${fy}-${ty}`;
    }
    return new Date().getFullYear();
  })();

  // Hämta filteralternativ vid mount
  useEffect(() => {
    getEfforts().then(setEffortOptions).catch(() => toast.error("Kunde inte hämta insatser"));
    (user?.role === 'admin' ? getHandlers(true) : getPublicHandlers()).then((data) => setHandlerOptions(data as Handler[])).catch(() => toast.error("Kunde inte hämta behandlare"));
    getCustomers(true).then((data) => {
      // Konvertera Customer[] till CustomerItem[] genom att säkerställa att birthYear finns
      const customerItems: CustomerItem[] = data
        .filter((c: any) => typeof c.birthYear === "number")
        .map((c: any) => ({
          ...c,
          birthYear: c.birthYear,
        }));
      setCustomerOptions(customerItems);

      // Unika födelseår som string
      const years = Array.from(new Set(customerItems.map((c) => c.birthYear)))
        .filter(Boolean)
        .map(String)
        .sort((a, b) => Number(b) - Number(a));
      setYearOptions(years.map((y: string) => ({ label: y, value: y })));
    }).catch(() => toast.error("Kunde inte hämta kunder"));
  }, [user]);

  // Bygg query params från filter
  function buildParams() {
    const params: any = {};
    if (dateRange.from) params.from = dateRange.from.toISOString().slice(0, 10);
    if (dateRange.to) params.to = dateRange.to.toISOString().slice(0, 10);
    if (selectedEfforts.length > 0) params.insats = selectedEfforts.join(",");
    if (selectedEffortCategories.length > 0) params.effortCategory = selectedEffortCategories.join(",");
    if (selectedGenders.length > 0) params.gender = selectedGenders.join(",");
    if (selectedYears.length > 0) params.birthYear = selectedYears.join(",");
    if (selectedHandlers.length > 0) params.handler = selectedHandlers.join(",");
    if (selectedCustomers.length > 0) params.customer = selectedCustomers.join(",");
    if (includeInactive) params.includeInactive = true;
    if (shiftStatus && shiftStatus !== 'Alla') params.shiftStatus = shiftStatus;
    
    return params;
  }

  const abortRef = useRef<AbortController | null>(null);

  function loadStats() {
    setLoading(true);
    const params = buildParams();
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    Promise.all([
      getStatsSummary(params, { signal: controller.signal }).catch(_err => { if (_err?.name !== 'AbortError') toast.error("Kunde inte hämta statistik"); return null; }),
      getStatsByEffort(params, { signal: controller.signal }).catch(_err => { if (_err?.name !== 'AbortError') toast.error("Kunde inte hämta diagramdata"); return null; })

    ]).then(([statsData, effortData]) => {
      if (!controller.signal.aborted) {
        setStats(statsData);
        setEffortData(effortData);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStats();
  }, [
    dateRange,
    selectedEfforts,
    selectedEffortCategories,
    selectedGenders,
    selectedYears,
    selectedHandlers,
    selectedCustomers,
    includeInactive,
    shiftStatus,
  ]);

  // Logga export
  const logExport = async (exportType: string, filters: any) => {
    try {
      const payload = {
        action: 'EXPORT',
        entityType: 'data',
        entityName: exportType,
        details: { event: 'data_exported', export_type: exportType, filters }
      };
      await api('/audit/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.error('Failed to log export:', error);
    }
  };

  // Exportfunktioner
  const handleExportPDF = () => {
    const input = chartRef.current; // diagramkortet
    if (!input) return toast.error("Kunde inte hitta diagrammet för export");
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      // Rubrik och datum
      pdf.setFontSize(18);
      pdf.text("Statistikrapport", 14, 18);
      pdf.setFontSize(10);
      pdf.text(`Exportdatum: ${new Date().toLocaleString("sv-SE")}`, 14, 26);
      // Filterinfo
      let y = 34;
      const filterInfo = [
        `Tidsperiod: ${dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla"}`,
        `Kön: ${selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla"}`,
        `Födelseår: ${selectedYears.length > 0 ? selectedYears.join(", ") : "Alla"}`,
        `Insats: ${selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla"}`,
        `Insatskategori: ${selectedEffortCategories.length > 0 ? selectedEffortCategories.join(", ") : "Alla"}`,
        `Behandlare: ${selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla"}`,
        `Kund: ${selectedCustomers.length > 0 ? customerOptions.filter(c => selectedCustomers.includes(String(c.id))).map(c => `${c.initials} (${c.birthYear})`).join(", ") : "Alla"}`
      ];
      filterInfo.forEach(row => {
        pdf.text(row, 14, y);
        y += 7;
      });
      // Diagram
      pdf.addImage(imgData, 'PNG', 14, y, 120, 60);
      y += 68;
      // Tabellhuvud
      pdf.setFontSize(12);
      pdf.text("Insats", 14, y);
      pdf.text("Antal besök", 64, y);
      pdf.text("Antal timmar", 114, y);
      pdf.text("Antal kunder", 164, y);
      y += 7;
      pdf.setFontSize(10);
      // Tabellrader
      (effortData || []).forEach(d => {
        pdf.text(String(d.effort_name), 14, y);
        pdf.text(String(d.antal_besok), 64, y);
        pdf.text(String(d.antal_timmar || 0), 114, y);
        pdf.text(String(d.antal_kunder), 164, y);
        y += 6;
      });
      // Summering
      const totalBesok = (effortData || []).reduce((sum, d) => sum + Number(d.antal_besok), 0);
      const totalTimmar = (effortData || []).reduce((sum, d) => sum + Number(d.antal_timmar || 0), 0);
      const totalKunder = (effortData || []).reduce((sum, d) => sum + Number(d.antal_kunder), 0);
      pdf.setFontSize(11);
      pdf.text("SUMMA", 14, y);
      pdf.text(String(totalBesok), 64, y);
      pdf.text(String(totalTimmar), 114, y);
      pdf.text(String(totalKunder), 164, y);
      pdf.save('statistik.pdf');
      
      // Logga export
      logExport('PDF', {
        filters: {
          dateRange: dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla",
          selectedEfforts: selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla",
          selectedEffortCategories: selectedEffortCategories.length > 0 ? selectedEffortCategories.join(", ") : "Alla",
          selectedGenders: selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla",
          selectedYears: selectedYears.length > 0 ? selectedYears.join(", ") : "Alla",
          selectedHandlers: selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla",
          selectedCustomers: selectedCustomers.length > 0 ? customerOptions.filter(c => selectedCustomers.includes(String(c.id))).map(c => `${c.initials} (${c.birthYear})`).join(", ") : "Alla"
        }
      });
      
      toast.success("PDF exporterad!");
    }).catch(() => toast.error("Kunde inte exportera PDF"));
  };

  const handleExportExcel = () => {
    try {
      // Bygg filterinfo
      const filterRows = [
        ["Exportdatum:", new Date().toLocaleString("sv-SE")],
        ["Tidsperiod:", dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla"],
        ["Kön:", selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla"],
        ["Födelseår:", selectedYears.length > 0 ? selectedYears.join(", ") : "Alla"],
        ["Insats:", selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla"],
        ["Insatskategori:", selectedEffortCategories.length > 0 ? selectedEffortCategories.join(", ") : "Alla"],
        ["Behandlare:", selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla"],
        ["Kund:", selectedCustomers.length > 0 ? customerOptions.filter(c => selectedCustomers.includes(String(c.id))).map(c => `${c.initials} (${c.birthYear})`).join(", ") : "Alla"],
        [],
      ];
      // Tabellhuvud
      const tableHeader = [
        "Insats",
        "Antal besök",
        "Antal timmar",
        "Antal kunder"
      ];
      // Tabellrader
      const tableRows = (effortData || []).map(d => [
        d.effort_name,
        d.antal_besok,
        d.antal_timmar || 0,
        d.antal_kunder
      ]);
      // Summering
      const totalBesok = (effortData || []).reduce((sum, d) => sum + Number(d.antal_besok), 0);
      const totalTimmar = (effortData || []).reduce((sum, d) => sum + Number(d.antal_timmar || 0), 0);
      const totalKunder = (effortData || []).reduce((sum, d) => sum + Number(d.antal_kunder), 0);
      const summaryRow = ["SUMMA", totalBesok, totalTimmar, totalKunder];
      // Bygg hela arket
      const data = [
        ["Statistikrapport"],
        ...filterRows,
        tableHeader,
        ...tableRows,
        summaryRow
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Statistik');
      XLSX.writeFile(wb, 'statistik.xlsx');
      
      // Logga export
      logExport('Excel', {
        filters: {
          dateRange: dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla",
          selectedEfforts: selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla",
          selectedEffortCategories: selectedEffortCategories.length > 0 ? selectedEffortCategories.join(", ") : "Alla",
          selectedGenders: selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla",
          selectedYears: selectedYears.length > 0 ? selectedYears.join(", ") : "Alla",
          selectedHandlers: selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla",
          selectedCustomers: selectedCustomers.length > 0 ? customerOptions.filter(c => selectedCustomers.includes(String(c.id))).map(c => `${c.initials} (${c.birthYear})`).join(", ") : "Alla"
        }
      });
      
      toast.success("Excel exporterad!");
    } catch {
      toast.error("Kunde inte exportera Excel");
    }
  };

  return (
    <Layout title="Statistik">
      {/* Responsiv container */}
      <div className="w-full max-w-[350px] mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">

      <div className="space-y-6 mobile:space-y-8">
        {/* Filterrad */}
        <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col gap-4 mobile:gap-6 shadow-sm border border-gray-200">
        <label className="font-normal text-base mobile:text-lg m-0 p-0 text-black">Filtrera</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-2 items-end">
            <div className="gap-1 w-full flex flex-col">
              <label className="font-normal text-xs text-gray-500">Tidsperiod</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Kön</label>
              <MultiSelectCombobox
                options={[
                  { label: "Flicka", value: "Flicka" },
                  { label: "Pojke", value: "Pojke" },
                  { label: "Icke-binär", value: "Icke-binär" },
                ]}
                value={selectedGenders}
                onChange={setSelectedGenders}
                placeholder="Alla kön"
              />
            </div>
            <div className="flex flex-col gap-1 w-full ">
              <label className="font-normal text-xs text-gray-500">Födelseår</label>
              <MultiSelectCombobox options={yearOptions} value={selectedYears} onChange={setSelectedYears} placeholder="Alla år" />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Insats</label>
              <MultiSelectCombobox
                options={effortOptions.map(e => ({ label: e.name, value: String(e.id) }))}
                value={selectedEfforts}
                onChange={setSelectedEfforts}
                placeholder="Alla insatser"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Insatskategori</label>
              <MultiSelectCombobox
                options={[
                  { label: "Biståndsbedömda", value: "Biståndsbedömda" },
                  { label: "Biståndsbedömda, Förebyggande", value: "Biståndsbedömda, Förebyggande" },
                  { label: "Förebyggande", value: "Förebyggande" }
                ]}
                value={selectedEffortCategories}
                onChange={setSelectedEffortCategories}
                placeholder="Alla kategorier"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Tidsstatus</label>
              <Select value={shiftStatus} onValueChange={(v) => setShiftStatus(v as any)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Alla" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alla">Alla</SelectItem>
                  <SelectItem value="Utförd">Utförd</SelectItem>
                  <SelectItem value="Avbokad">Avbokad</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Behandlare</label>
              <MultiSelectCombobox
                options={handlerOptions.map(h => ({ label: h.name, value: String(h.id) }))}
                value={selectedHandlers}
                onChange={setSelectedHandlers}
                placeholder="Alla behandlare"
              />
            </div>
            <div className="flex flex-col gap-1 w-full">
              <label className="font-normal text-xs text-gray-500">Kund</label>
              <MultiSelectCombobox
                options={customerOptions.map(c => ({ label: `${c.initials} (${c.birthYear})`, value: String(c.id) }))}
                value={selectedCustomers}
                onChange={setSelectedCustomers}
                placeholder="Alla kunder"
              />
            </div>
            <div className="flex items-end w-full h-10">
              <label className="flex items-center gap-2 text-sm px-3 py-2 border rounded-lg bg-white w-full justify-center md:justify-start">
                <input type="checkbox" checked={includeInactive} onChange={(e) => setIncludeInactive(e.target.checked)} />
                Inkludera inaktiva
              </label>
            </div>

            <div className="flex justify-center mobile:justify-end w-full mobile:w-full gap-2">
              <Button
                variant="default"
                size="default"
                className="text-sm font-medium w-full mobile:w-auto"
                onClick={() => loadStats()}
                disabled={loading}
                aria-label="Uppdatera statistik"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uppdaterar...
                  </>
                ) : (
                  'Uppdatera'
                )}
              >
                {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uppdaterar...</>) : 'Uppdatera'}
              </Button>
              <Button
                variant="outline"
                size="default"
                className="text-sm font-normal w-full mobile:w-auto"
                onClick={() => {
                  setDateRange({ from: null, to: null });
                  setSelectedGenders([]);
                  setSelectedYears([]);
                  setSelectedEfforts([]);
                  setSelectedEffortCategories([]);
                  setSelectedHandlers([]);
                  setSelectedCustomers([]);
                  setIncludeInactive(false);
                  setShiftStatus('Alla');
                }}
                aria-label="Rensa alla filter"
              >
                Rensa alla filter
              </Button>
            </div>
          </div>
        </div>

        {/* Statistik-kort */}
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="animate-spin w-10 h-10 text-[#17694c] mr-3" />
            <span className="text-lg text-[#17694c]">Laddar statistik...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mobile:gap-6 text-center">
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Totalt antal besök</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? stats.antal_besok.toLocaleString() : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Antal kunder</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? stats.antal_kunder : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Genomsnittlig tid</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? `${stats.genomsnittlig_tid} min` : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Avbokningsgrad</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? `${stats.avbokningsgrad}%` : "-"}</div>
            </div>
          </div>
        )}

        {/* Diagramkort */}
        <div ref={chartRef} className="bg-white rounded-xl p-4 mobile:p-8 flex flex-col items-center relative shadow-sm overflow-x-auto">
          <div className="text-sm mobile:text-base font-medium text-gray-800 mb-4 mobile:mb-6">Besök och kunder per insatstyp ({yearLabel})</div>
          {effortData && effortData.length > 0 && (
            <div className="flex w-full h-48 mobile:h-64 mb-4 mobile:mb-6 min-w-max">
              {/* Y-axel */}
              <div className="flex flex-col justify-between items-end pr-2 mobile:pr-4 py-2 w-8 mobile:w-12 select-none">
                {[...Array(6)].map((_, i) => {
                  const maxY = Math.max(...effortData.map(d => Math.max(Number(d.antal_besok), Number(d.antal_kunder))), 1);
                  const value = Math.round((maxY / 5) * (5 - i));
                  return (
                    <span key={i} className="text-xs text-gray-400">{value}</span>
                  );
                })}
              </div>
              {/* Staplar */}
              <div className="flex gap-8 mobile:gap-20 items-end flex-1 h-full justify-center">
                {effortData.map((item, idx) => {
                  const maxY = Math.max(...effortData.map(d => Math.max(Number(d.antal_besok), Number(d.antal_kunder))), 1);
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 max-w-[40px] mobile:max-w-[56px] min-w-[28px] mobile:min-w-[36px]">
                      {/* Staplar i container med fast höjd */}
                      <div className="flex gap-2 mobile:gap-3 items-end w-full justify-center h-32 mobile:h-44">
                        <div
                          className="bg-[#17694c] rounded-lg transition-all duration-700 cursor-pointer relative"
                          style={{
                            width: '28px',
                            height: `${Math.max((Number(item.antal_besok) / maxY) * 128, minBarHeight)}px`,
                            minHeight: minBarHeight,
                          }}
                          onMouseEnter={e => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              value: `Besök: ${item.antal_besok}`
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                        <div
                          className="bg-[#1769dc] rounded-lg transition-all duration-700 cursor-pointer relative"
                          style={{
                            width: '28px',
                            height: `${Math.max((Number(item.antal_kunder) / maxY) * 128, minBarHeight)}px`,
                            minHeight: minBarHeight,
                          }}
                          onMouseEnter={e => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              value: `Kunder: ${item.antal_kunder}`
                            });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />
                      </div>
                      {/* Etikett under staplarna */}
                      <div className="text-gray-400 font-normal text-xs mobile:text-sm text-center mt-4 mobile:mt-6 max-w-[60px] mobile:max-w-[80px] whitespace-nowrap overflow-hidden">{item.effort_name}</div>
                    </div>
                  );
                })}
              </div>
              {/* Tooltip */}
              {tooltip && (
                <div
                  className="pointer-events-none fixed z-50 px-3 py-1.5 rounded-lg bg-white shadow text-sm text-[#17694c] font-medium border border-gray-200"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y - 36,
                    transform: 'translate(-50%, -100%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tooltip.value}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Export-knappar utanför diagrammet */}
        <div className="flex flex-col lg:flex-row mobile:flex-col gap-3 mobile:gap-4 justify-center">
          <Button variant="outline" className="rounded-lg text-sm font-medium w-full mobile:w-auto" onClick={handleExportPDF}>Exportera som PDF</Button>
          <Button className="rounded-lg text-sm font-medium" variant="outline" onClick={handleExportExcel}>Ladda ner som Excel</Button>
        </div>
      </div>

      </div>
    </Layout>
  );
};
