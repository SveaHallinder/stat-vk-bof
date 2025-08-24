import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { getStatsSummary, getStatsByEffort, getEfforts, getHandlers, getPublicHandlers, getCustomers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import * as XLSX from "xlsx";
import { Customer, Handler, Effort } from "@/types/types";
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
  const [selectedHandlers, setSelectedHandlers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
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
    (user?.role === 'admin' ? getHandlers({ all: true }) : getPublicHandlers()).then(setHandlerOptions).catch(() => toast.error("Kunde inte hämta behandlare"));
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
    if (selectedGenders.length > 0) params.gender = selectedGenders.join(",");
    if (selectedYears.length > 0) params.birthYear = selectedYears.join(",");
    if (selectedHandlers.length > 0) params.handler = selectedHandlers.join(",");
    if (selectedCustomers.length > 0) params.customer = selectedCustomers.join(",");
    return params;
  }

  function loadStats() {
    setLoading(true);
    const params = buildParams();
    Promise.all([
      getStatsSummary(params).catch(_err => { toast.error("Kunde inte hämta statistik"); return null; }),
      getStatsByEffort(params).catch(_err => { toast.error("Kunde inte hämta diagramdata"); return null; })
    ]).then(([statsData, effortData]) => {
      setStats(statsData);
      setEffortData(effortData);
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    loadStats();
  }, [dateRange, selectedEfforts, selectedGenders, selectedYears, selectedHandlers, selectedCustomers]);

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
      toast.success("Excel exporterad!");
    } catch {
      toast.error("Kunde inte exportera Excel");
    }
  };

  return (
    <Layout title="Statistik">
      <div className="space-y-8">
        {/* Filterrad */}
        <div className="bg-white rounded-xl p-6 flex flex-col gap-6">
        <label className="font-normal text-lg m-0 p-0 text-black">Filtrera</label>
          <div className="flex flex-wrap gap-6 mb-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="font-normal text-xs text-gray-500">Tidsperiod</label>
              <DateRangePicker value={dateRange} onChange={setDateRange} />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
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
            <div className="flex flex-col gap-1 w-[180px]">
              <label className="font-normal text-xs text-gray-500">Födelseår</label>
              <MultiSelectCombobox options={yearOptions} value={selectedYears} onChange={setSelectedYears} placeholder="Alla år" />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
              <label className="font-normal text-xs text-gray-500">Insats</label>
              <MultiSelectCombobox
                options={effortOptions.map(e => ({ label: e.name, value: String(e.id) }))}
                value={selectedEfforts}
                onChange={setSelectedEfforts}
                placeholder="Alla insatser"
              />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
              <label className="font-normal text-xs text-gray-500">Behandlare</label>
              <MultiSelectCombobox
                options={handlerOptions.map(h => ({ label: h.name, value: String(h.id) }))}
                value={selectedHandlers}
                onChange={setSelectedHandlers}
                placeholder="Alla behandlare"
              />
            </div>
            <div className="flex flex-col gap-1 w-[180px]">
              <label className="font-normal text-xs text-gray-500">Kund</label>
              <MultiSelectCombobox
                options={customerOptions.map(c => ({ label: `${c.initials} (${c.birthYear})`, value: String(c.id) }))}
                value={selectedCustomers}
                onChange={setSelectedCustomers}
                placeholder="Alla kunder"
              />
            </div>
            {/* Rensa alla filter-knapp */}
              <div className="flex justify-end float-right">
                <Button
                  variant="outline"
                  size="default"
                  className="text-sm font-normal"
                  onClick={() => {
                    setDateRange({ from: null, to: null });
                    setSelectedGenders([]);
                    setSelectedYears([]);
                    setSelectedEfforts([]);
                    setSelectedHandlers([]);
                    setSelectedCustomers([]);
                  }}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Totalt antal besök</div>
              <div className="text-[#222] text-3xl font-light mt-1">{stats ? stats.antal_besok.toLocaleString() : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Antal kunder</div>
              <div className="text-[#222] text-3xl font-light mt-1">{stats ? stats.antal_kunder : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Genomsnittlig tid</div>
              <div className="text-[#222] text-3xl font-light mt-1">{stats ? `${stats.genomsnittlig_tid} min` : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
              <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Avbokningsgrad</div>
              <div className="text-[#222] text-3xl font-light mt-1">{stats ? `${stats.avbokningsgrad}%` : "-"}</div>
            </div>
          </div>
        )}

        {/* Diagramkort */}
        <div ref={chartRef} className="bg-white rounded-xl p-8 flex flex-col items-center relative">
          <div className="text-base font-medium text-gray-800 mb-6">Besök och kunder per insatstyp ({yearLabel})</div>
          {effortData && effortData.length > 0 && (
            <div className="flex w-full h-64 mb-6">
              {/* Y-axel */}
              <div className="flex flex-col justify-between items-end pr-4 py-2 w-12 select-none">
                {[...Array(6)].map((_, i) => {
                  const maxY = Math.max(...effortData.map(d => Math.max(Number(d.antal_besok), Number(d.antal_kunder))), 1);
                  const value = Math.round((maxY / 5) * (5 - i));
                  return (
                    <span key={i} className="text-xs text-gray-400">{value}</span>
                  );
                })}
              </div>
              {/* Staplar */}
              <div className="flex gap-20 items-end flex-1 h-full justify-center">
                {effortData.map((item, idx) => {
                  const maxY = Math.max(...effortData.map(d => Math.max(Number(d.antal_besok), Number(d.antal_kunder))), 1);
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 max-w-[56px] min-w-[36px]">
                      {/* Staplar i container med fast höjd */}
                      <div className="flex gap-3 items-end w-full justify-center h-44">
                        <div
                          className="bg-[#17694c] rounded-lg transition-all duration-700 cursor-pointer relative"
                          style={{
                            width: '36px',
                            height: `${Math.max((Number(item.antal_besok) / maxY) * 176, minBarHeight)}px`,
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
                            width: '36px',
                            height: `${Math.max((Number(item.antal_kunder) / maxY) * 176, minBarHeight)}px`,
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
                      <div className="text-gray-400 font-normal text-sm text-center mt-6 max-w-[80px] whitespace-nowrap overflow-hidden">{item.effort_name}</div>
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
          <div className="flex gap-4 justify-center mt-2">
            <Button variant="outline" className="rounded-lg text-sm font-medium" onClick={handleExportPDF}>Exportera som PDF</Button>
            <Button className="rounded-lg text-sm font-medium" variant="outline" onClick={handleExportExcel}>Ladda ner som Excel</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};