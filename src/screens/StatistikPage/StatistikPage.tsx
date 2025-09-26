import { useState, useEffect, useRef, useMemo, ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Layout } from "@/components/Layout";
import {
  getStatsSummary,
  getStatsByEffort,
  getEfforts,
  getHandlers,
  getPublicHandlers,
  getCustomers,
  getStatsRaw,
  getStatsByHandler,
  getStatsByGender,
  getStatsByBirthYear,
  getStatsCases,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
// Tunga export-bibliotek laddas dynamiskt vid behov för att minska bundle-storlek
import { Customer, Handler, Effort } from "@/types/types";
import { api } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { useRefresh } from "@/contexts/RefreshContext";

const minBarHeight = 24;
const viewOptions = [
  { value: 'effort', label: 'Insatser' },
  { value: 'handler', label: 'Behandlare' },
  { value: 'gender', label: 'Kön' },
  { value: 'birthYear', label: 'Födelseår' },
  { value: 'cases', label: 'Ärenden' },
] as const;

type ViewMode = typeof viewOptions[number]['value'];

const formatCategoryLabel = (value: string) => value
  .split(',')
  .map(token => {
    const trimmed = token.trim();
    const lower = trimmed.toLowerCase();
    if (lower === 'förebyggande') {
      return 'Förebyggande arbete';
    }
    return trimmed;
  })
  .join(', ');

export const StatistikPage = (): JSX.Element => {
  const { user } = useAuth();
  const { refreshKey } = useRefresh();
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string } | null>(null);
  const [stats, setStats] = useState<{ antal_besok: number; antal_kunder: number; totala_timmar: number; avbokningsgrad: number } | null>(null);
  const [loading, setLoading] = useState(false);
  // Nytt: datumintervall
  const [dateRange, setDateRange] = useState<{ from: Date|null, to: Date|null }>({ from: null, to: null });

  // Stapeldiagram-data
  const [effortData, setEffortData] = useState<any[] | null>(null);
  const [handlerData, setHandlerData] = useState<any[] | null>(null);
  const [genderData, setGenderData] = useState<any[] | null>(null);
  const [birthYearData, setBirthYearData] = useState<any[] | null>(null);
  const [caseData, setCaseData] = useState<any[] | null>(null);
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedEfforts, setSelectedEfforts] = useState<string[]>([]);
  const [selectedEffortCategories, setSelectedEffortCategories] = useState<string[]>([]);
  const [selectedHandlers, setSelectedHandlers] = useState<string[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [includeInactive, setIncludeInactive] = useState<boolean>(false);
  const [shiftStatus, setShiftStatus] = useState<'Alla' | 'Utförd' | 'Avbokad'>('Alla');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('effort');
  const chartRef = useRef<HTMLDivElement>(null);

  const chartSettings = useMemo(() => {
    const formatMeta = (customers?: number, avg?: number) => {
      const parts: string[] = [];
      if (typeof customers === 'number') parts.push(`${customers} kunder`);
      if (typeof avg === 'number' && !Number.isNaN(avg) && avg > 0) {
        parts.push(`${avg.toFixed(2)} h/besök`);
      }
      return parts.join(" • ");
    };

    switch (viewMode) {
      case 'handler':
        return {
          title: 'Besök och timmar per behandlare',
          primaryLabel: 'Besök',
          secondaryLabel: 'Timmar',
          secondarySuffix: ' h',
          showChart: true,
          data: (handlerData || []).map((d: any) => ({
            label: d.handler_name || 'Okänd',
            primaryValue: Number(d.antal_besok) || 0,
            secondaryValue: Number(d.totala_timmar) || 0,
            meta: formatMeta(undefined, d.antal_besok ? (Number(d.totala_timmar || 0) / Number(d.antal_besok || 1)) : undefined),
          })),
        };
      case 'gender':
        return {
          title: 'Besök och timmar per kön',
          primaryLabel: 'Besök',
          secondaryLabel: 'Timmar',
          secondarySuffix: ' h',
          showChart: true,
          data: (genderData || []).map((d: any) => ({
            label: d.gender ?? 'Okänd',
            primaryValue: Number(d.antal_besok) || 0,
            secondaryValue: Number(d.totala_timmar) || 0,
            meta: d.snitt_timmar ? `${Number(d.snitt_timmar).toFixed(2)} h/besök` : '',
          })),
        };
      case 'birthYear':
        return {
          title: 'Besök och timmar per födelseår',
          primaryLabel: 'Besök',
          secondaryLabel: 'Timmar',
          secondarySuffix: ' h',
          showChart: true,
          data: (birthYearData || []).map((d: any) => ({
            label: d.label ?? 'Okänt',
            primaryValue: Number(d.antal_besok) || 0,
            secondaryValue: Number(d.totala_timmar) || 0,
            meta: d.snitt_timmar ? `${Number(d.snitt_timmar).toFixed(2)} h/besök` : '',
          })),
        };
      case 'cases':
        return {
          title: '',
          primaryLabel: 'Besök',
          secondaryLabel: 'Timmar',
          secondarySuffix: ' h',
          showChart: false,
          data: [],
        };
      default:
        return {
          title: 'Besök och timmar per insats',
          primaryLabel: 'Besök',
          secondaryLabel: 'Timmar',
          secondarySuffix: ' h',
          showChart: true,
          data: (effortData || []).map((d: any) => ({
            label: d.effort_name,
            primaryValue: Number(d.antal_besok) || 0,
            secondaryValue: Number(d.totala_timmar) || 0,
            meta: formatMeta(Number(d.antal_kunder) || 0),
          })),
        };
    }
  }, [viewMode, effortData, handlerData, genderData, birthYearData]);

  const { data: chartData, title: chartTitle, primaryLabel: chartPrimaryLabel, secondaryLabel: chartSecondaryLabel, secondarySuffix: chartSecondarySuffix, showChart } = chartSettings;
  const hasChartData = showChart && chartData.length > 0;

  const maxY = useMemo(() => {
    if (!showChart || chartData.length === 0) return 1;
    return Math.max(
      ...chartData.map(d => Math.max(Number(d.primaryValue) || 0, Number(d.secondaryValue) || 0)),
      1
    );
  }, [showChart, chartData]);

  const formatHours = (value: number) => Number(value || 0).toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' h';

  const renderAggregatedTable = () => {
    let rows: any[] = [];
    let columns: { header: string; render: (row: any) => ReactNode; align?: 'left' | 'right' }[] = [];

    if (viewMode === 'handler') {
      rows = handlerData || [];
      columns = [
        { header: 'Behandlare', render: row => row.handler_name || 'Okänd' },
        { header: 'Besök', render: row => Number(row.antal_besok || 0).toLocaleString('sv-SE'), align: 'right' },
        { header: 'Totala timmar', render: row => formatHours(row.totala_timmar || 0), align: 'right' },
        { header: 'Snitt h/besök', render: row => row.antal_besok ? (Number(row.totala_timmar || 0) / Number(row.antal_besok)).toFixed(2) : '0.00', align: 'right' },
      ];
    } else if (viewMode === 'gender') {
      rows = genderData || [];
      columns = [
        { header: 'Kön', render: row => row.gender || 'Okänd' },
        { header: 'Besök', render: row => Number(row.antal_besok || 0).toLocaleString('sv-SE'), align: 'right' },
        { header: 'Totala timmar', render: row => formatHours(row.totala_timmar || 0), align: 'right' },
        { header: 'Snitt h/besök', render: row => row.snitt_timmar ? Number(row.snitt_timmar).toFixed(2) : '0.00', align: 'right' },
      ];
    } else if (viewMode === 'birthYear') {
      rows = birthYearData || [];
      columns = [
        { header: 'Födelseår', render: row => row.label ?? 'Okänt' },
        { header: 'Besök', render: row => Number(row.antal_besok || 0).toLocaleString('sv-SE'), align: 'right' },
        { header: 'Totala timmar', render: row => formatHours(row.totala_timmar || 0), align: 'right' },
        { header: 'Snitt h/besök', render: row => row.snitt_timmar ? Number(row.snitt_timmar).toFixed(2) : '0.00', align: 'right' },
      ];
    } else {
      rows = effortData || [];
      columns = [
        { header: 'Insats', render: row => row.effort_name || 'Okänd' },
        { header: 'Besök', render: row => Number(row.antal_besok || 0).toLocaleString('sv-SE'), align: 'right' },
        { header: 'Totala timmar', render: row => formatHours(row.totala_timmar || 0), align: 'right' },
        { header: 'Kunder', render: row => Number(row.antal_kunder || 0).toLocaleString('sv-SE'), align: 'right' },
      ];
    }

    if (!rows || rows.length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-200">
          Ingen data att visa för valt filter.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.header}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.align === 'right' ? 'text-right' : 'text-left'}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td
                      key={col.header}
                      className={`px-4 py-3 text-sm text-gray-700 ${col.align === 'right' ? 'text-right font-medium' : ''}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCasesTable = () => {
    const rows = caseData || [];
    if (!rows || rows.length === 0) {
      return (
        <div className="bg-white rounded-xl p-6 text-center text-gray-500 border border-gray-200">
          Inga ärenden matchar filtren.
        </div>
      );
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ärende-ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kund</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insats</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Besök</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Timmar</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avbokade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Behandlare</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rows.map((row: any) => (
                <tr key={row.case_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{row.case_id}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{row.customer_initials || '—'}</div>
                    <div className="text-xs text-gray-500">
                      {row.customer_gender || 'Okänd'}{row.customer_birth_year ? ` • ${row.customer_birth_year}` : ''}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{row.effort_name || 'Okänd'}</div>
                    <div className="text-xs text-gray-500">{row.effort_available_for || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{Number(row.antal_besok || 0).toLocaleString('sv-SE')}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatHours(row.totala_timmar || 0)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-right">{Number(row.avbokade_besok || 0).toLocaleString('sv-SE')}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <div>{row.handler1_name || '—'}</div>
                    {row.handler2_name && (
                      <div className="text-xs text-gray-500">{row.handler2_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${row.case_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {row.case_active ? 'Aktiv' : 'Avslutad'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

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
  }, [user, refreshKey]);

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
    // Avbryt ev. pågående hämtningar
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    Promise.all([
      getStatsSummary(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta statistik"); return null; }),
      getStatsByEffort(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta diagramdata"); return null; }),
      getStatsByHandler(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta statistik per behandlare"); return null; }),
      getStatsByGender(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta statistik per kön"); return null; }),
      getStatsByBirthYear(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta statistik per födelseår"); return null; }),
      getStatsCases(params, { signal: controller.signal }).catch(_err => { if ((_err as any)?.name !== 'AbortError') toast.error("Kunde inte hämta ärenden"); return null; })
    ]).then(([statsData, effortData, handlerDataRes, genderDataRes, birthYearDataRes, caseDataRes]) => {
      if (!controller.signal.aborted) {
        setStats(statsData);
        setEffortData(effortData);
        setHandlerData(handlerDataRes);
        setGenderData(genderDataRes);
        setBirthYearData(birthYearDataRes);
        setCaseData(caseDataRes);
      }
    }).finally(() => setLoading(false));
  }

  useEffect(() => {
    const t = setTimeout(() => {
      loadStats();
    }, 300);
    return () => clearTimeout(t);
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
    refreshKey,
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
  const handleExportPDF = async () => {
    try {
      const input = chartRef.current; // diagramkortet
      if (!input) return toast.error("Kunde inte hitta diagrammet för export");
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf')
      ]);
      const canvas = await html2canvas(input);
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
        `Insatskategori: ${selectedEffortCategories.length > 0 ? selectedEffortCategories.map(formatCategoryLabel).join(", ") : "Alla"}`,
        `Behandlare: ${selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla"}`,
        `Kund: ${selectedCustomers.length > 0 ? customerOptions
          .filter(c => selectedCustomers.includes(String(c.id)))
          .map(c => (c.is_group || c.isGroup ? `${c.initials} (Grupp)` : `${c.initials} (${c.birthYear ?? '—'})`))
          .join(", ") : "Alla"}`
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
        pdf.text(String(d.totala_timmar || 0), 114, y);
        pdf.text(String(d.antal_kunder), 164, y);
        y += 6;
      });
      // Summering
      const totalBesok = (effortData || []).reduce((sum, d) => sum + Number(d.antal_besok), 0);
      const totalTimmar = (effortData || []).reduce((sum, d) => sum + Number(d.totala_timmar || 0), 0);
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
          selectedEffortCategories: selectedEffortCategories.length > 0 ? selectedEffortCategories.map(formatCategoryLabel).join(", ") : "Alla",
          selectedGenders: selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla",
          selectedYears: selectedYears.length > 0 ? selectedYears.join(", ") : "Alla",
          selectedHandlers: selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla",
          selectedCustomers: selectedCustomers.length > 0 ? customerOptions
            .filter(c => selectedCustomers.includes(String(c.id)))
            .map(c => (c.is_group || c.isGroup ? `${c.initials} (Grupp)` : `${c.initials} (${c.birthYear ?? '—'})`))
            .join(", ") : "Alla"
        }
      });
      toast.success("PDF exporterad!");
    } catch {
      toast.error("Kunde inte exportera PDF");
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      const XLSX = await import('xlsx');
      const params = buildParams();
      const [
        rawData,
        effortExport,
        handlerExport,
        genderExport,
        birthYearExport,
        casesExport,
      ] = await Promise.all([
        getStatsRaw(params),
        effortData ? Promise.resolve(effortData) : getStatsByEffort(params),
        handlerData ? Promise.resolve(handlerData) : getStatsByHandler(params),
        genderData ? Promise.resolve(genderData) : getStatsByGender(params),
        birthYearData ? Promise.resolve(birthYearData) : getStatsByBirthYear(params),
        caseData ? Promise.resolve(caseData) : getStatsCases(params),
      ]);

      // Bygg filterinfo
      const filterRows = [
        ["Exportdatum:", new Date().toLocaleString("sv-SE")],
        ["Tidsperiod:", dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla"],
        ["Kön:", selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla"],
        ["Födelseår:", selectedYears.length > 0 ? selectedYears.join(", ") : "Alla"],
        ["Insats:", selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla"],
        ["Insatskategori:", selectedEffortCategories.length > 0 ? selectedEffortCategories.map(formatCategoryLabel).join(", ") : "Alla"],
        ["Behandlare:", selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla"],
        ["Kund:", selectedCustomers.length > 0 ? customerOptions
          .filter(c => selectedCustomers.includes(String(c.id)))
          .map(c => (c.is_group || c.isGroup ? `${c.initials} (Grupp)` : `${c.initials} (${c.birthYear ?? '—'})`))
          .join(", ") : "Alla"],
        [],
      ];

      const tableHeader = [
        "Insats",
        "Antal besök",
        "Antal timmar",
        "Antal kunder"
      ];
      const tableRows = (effortExport || []).map((d: any) => [
        d.effort_name,
        Number(d.antal_besok || 0),
        Number(d.totala_timmar || 0),
        Number(d.antal_kunder || 0)
      ]);
      const totalBesok = (effortExport || []).reduce((sum: number, d: any) => sum + Number(d.antal_besok || 0), 0);
      const totalTimmar = (effortExport || []).reduce((sum: number, d: any) => sum + Number(d.totala_timmar || 0), 0);
      const totalKunder = (effortExport || []).reduce((sum: number, d: any) => sum + Number(d.antal_kunder || 0), 0);
      const summaryRow = ["SUMMA", totalBesok, totalTimmar, totalKunder];
      const summarySheetData = [
        ["Statistikrapport"],
        ...filterRows,
        tableHeader,
        ...tableRows,
        summaryRow
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summarySheetData);

      const detailHeader = [
        "Besök-ID",
        "Datum",
        "Status",
        "Timmar",
        "Insats",
        "Insats-ID",
        "Kund",
        "Kund-ID",
        "Kundtyp",
        "Födelseår",
        "Kön",
        "Case-ID",
        "Case aktiv",
        "Kund aktiv",
        "Behandlare 1",
        "Behandlare 2"
      ];

      const detailRows = rawData.map(item => [
        item.shift_id ?? '',
        item.date ? new Date(item.date).toISOString().slice(0, 10) : '',
        item.status ?? '',
        Number(item.hours ?? 0),
        item.effort_name ?? '',
        item.effort_id ?? '',
        item.customer_initials ?? '',
        item.customer_id ?? '',
        item.customer_is_group ? 'Grupp' : 'Individ',
        item.customer_birth_year ?? '',
        item.customer_gender ?? '',
        item.case_id ?? '',
        item.case_active ? 'Ja' : 'Nej',
        item.customer_active ? 'Ja' : 'Nej',
        item.handler1_name ?? '',
        item.handler2_name ?? ''
      ]);

      const detailSummary = rawData.reduce((acc, item) => acc + Number(item.hours ?? 0), 0);
      const detailSummaryRow = Array(detailHeader.length).fill('');
      detailSummaryRow[0] = 'SUMMA';
      detailSummaryRow[3] = detailSummary;
      const detailSheetData = [
        ["Detaljerad statistik"],
        ["Antal poster", rawData.length],
        [],
        detailHeader,
        ...detailRows,
        detailSummaryRow
      ];

      const detailSheet = XLSX.utils.aoa_to_sheet(detailSheetData);
      const lastDetailRow = detailRows.length + 4;
      detailSheet['!autofilter'] = { ref: `A4:${String.fromCharCode(65 + detailHeader.length - 1)}${lastDetailRow}` };

      const handlerSheetData = [
        ["Behandlare"],
        ["Namn", "Besök", "Totala timmar", "Snitt h/besök"],
        ...((handlerExport || []).map((row: any) => [
          row.handler_name || 'Okänd',
          Number(row.antal_besok || 0),
          Number(row.totala_timmar || 0),
          row.antal_besok ? Number(row.totala_timmar || 0) / Number(row.antal_besok) : 0,
        ]))
      ];
      const handlerSheet = XLSX.utils.aoa_to_sheet(handlerSheetData);
      handlerSheet['!autofilter'] = { ref: `A2:D${(handlerExport?.length || 0) + 2}` };

      const genderSheetData = [
        ["Kön"],
        ["Kön", "Besök", "Totala timmar", "Snitt h/besök"],
        ...((genderExport || []).map((row: any) => [
          row.gender || 'Okänd',
          Number(row.antal_besok || 0),
          Number(row.totala_timmar || 0),
          row.snitt_timmar ? Number(row.snitt_timmar) : 0,
        ]))
      ];
      const genderSheet = XLSX.utils.aoa_to_sheet(genderSheetData);
      genderSheet['!autofilter'] = { ref: `A2:D${(genderExport?.length || 0) + 2}` };

      const birthYearSheetData = [
        ["Födelseår"],
        ["Födelseår", "Besök", "Totala timmar", "Snitt h/besök"],
        ...((birthYearExport || []).map((row: any) => [
          row.label ?? 'Okänt',
          Number(row.antal_besok || 0),
          Number(row.totala_timmar || 0),
          row.snitt_timmar ? Number(row.snitt_timmar) : 0,
        ]))
      ];
      const birthYearSheet = XLSX.utils.aoa_to_sheet(birthYearSheetData);
      birthYearSheet['!autofilter'] = { ref: `A2:D${(birthYearExport?.length || 0) + 2}` };

      const casesSheetData = [
        ["Ärenden"],
        ["Ärende-ID", "Kund", "Insats", "Besök", "Totala timmar", "Avbokade", "Behandlare 1", "Behandlare 2", "Aktiv"],
        ...((casesExport || []).map((row: any) => [
          row.case_id,
          row.customer_initials,
          row.effort_name,
          Number(row.antal_besok || 0),
          Number(row.totala_timmar || 0),
          Number(row.avbokade_besok || 0),
          row.handler1_name || '',
          row.handler2_name || '',
          row.case_active ? 'Ja' : 'Nej',
        ]))
      ];
      const casesSheet = XLSX.utils.aoa_to_sheet(casesSheetData);
      casesSheet['!autofilter'] = { ref: `A2:I${(casesExport?.length || 0) + 2}` };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Statistik');
      XLSX.utils.book_append_sheet(wb, detailSheet, 'Detaljer');
      XLSX.utils.book_append_sheet(wb, handlerSheet, 'Behandlare');
      XLSX.utils.book_append_sheet(wb, genderSheet, 'Kön');
      XLSX.utils.book_append_sheet(wb, birthYearSheet, 'Födelseår');
      XLSX.utils.book_append_sheet(wb, casesSheet, 'Ärenden');
      XLSX.writeFile(wb, 'statistik.xlsx');
      
      logExport('Excel', {
        filters: {
          dateRange: dateRange.from && dateRange.to ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}` : "Alla",
          selectedEfforts: selectedEfforts.length > 0 ? effortOptions.filter(e => selectedEfforts.includes(String(e.id))).map(e => e.name).join(", ") : "Alla",
          selectedEffortCategories: selectedEffortCategories.length > 0 ? selectedEffortCategories.map(formatCategoryLabel).join(", ") : "Alla",
          selectedGenders: selectedGenders.length > 0 ? selectedGenders.join(", ") : "Alla",
          selectedYears: selectedYears.length > 0 ? selectedYears.join(", ") : "Alla",
          selectedHandlers: selectedHandlers.length > 0 ? handlerOptions.filter(h => selectedHandlers.includes(String(h.id))).map(h => h.name).join(", ") : "Alla",
          selectedCustomers: selectedCustomers.length > 0 ? customerOptions
            .filter(c => selectedCustomers.includes(String(c.id)))
            .map(c => (c.is_group || c.isGroup ? `${c.initials} (Grupp)` : `${c.initials} (${c.birthYear ?? '—'})`))
            .join(", ") : "Alla"
        }
      });
      
      toast.success(`Excel exporterad! (${rawData.length} rader)`);
    } catch (error) {
      console.error('Excel export failed:', error);
      toast.error("Kunde inte exportera Excel");
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <Layout title="Statistik">
      {/* Responsiv container */}
      <div className="w-full max-w-[350px] mobile:max-w-[350px] mobile:w-full tablet:max-w-2xl lg:max-w-7xl mx-auto px-2 mobile:px-4 tablet:px-6 lg:px-8 flex flex-col gap-6 lg:gap-8 py-4">

      <div className="space-y-6 mobile:space-y-8">
        {/* Filterrad */}
        <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col gap-4 mobile:gap-6 shadow-sm border border-gray-200" data-tour="stats-filter">
        <label className="font-normal text-base mobile:text-lg m-0 p-0 text-black">Filtrera</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-2 items-end">
            <div className="gap-1 w-full flex flex-col" data-tour="stats-filter-daterange">
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
                  { label: "Förebyggande arbete", value: "Förebyggande arbete" },
                  { label: "Biståndsbedömda, Förebyggande arbete", value: "Biståndsbedömda, Förebyggande arbete" },
                  { label: "IUB", value: "IUB" },
                  { label: "Biståndsbedömda, IUB", value: "Biståndsbedömda, IUB" }
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
                options={customerOptions.map(c => {
                  const isGroup = c.is_group || c.isGroup;
                  const label = isGroup ? `${c.initials} (Grupp)` : `${c.initials} (${c.birthYear ?? '—'})`;
                  return { label, value: String(c.id) };
                })}
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
            {/* Uppdatera och Rensa */}
            <div className="flex justify-center mobile:justify-end w-full mobile:w-full gap-2">
              <Button
                variant="default"
                size="default"
                className="text-sm font-medium w-full mobile:w-auto"
                onClick={() => loadStats()}
                data-tour="stats-update-btn"
                disabled={loading}>
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
                data-tour="stats-reset-btn"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mobile:gap-6 text-center" data-tour="stats-summary-cards">
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Totalt antal besök</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? stats.antal_besok.toLocaleString() : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Antal kunder</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? stats.antal_kunder : "-"}</div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Totala besökstimmar</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">
                {stats ? `${stats.totala_timmar.toLocaleString('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} h` : "-"}
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 mobile:p-6 flex flex-col items-center justify-center shadow-sm">
              <div className="text-gray-600 text-xs mobile:text-sm font-medium mb-2 tracking-wide uppercase">Avbokningsgrad</div>
              <div className="text-[#222] text-2xl mobile:text-3xl font-light mt-1">{stats ? `${stats.avbokningsgrad}%` : "-"}</div>
            </div>
          </div>
        )}

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="w-full">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-gray-100 rounded-2xl p-1">
            {viewOptions.map(option => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="text-xs sm:text-sm rounded-xl data-[state=active]:bg-white data-[state=active]:text-[#17694c] data-[state=active]:shadow-sm"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Diagramkort */}
        <div ref={chartRef} className="bg-white rounded-xl p-4 mobile:p-8 flex flex-col items-center relative shadow-sm overflow-x-auto" data-tour="stats-chart">
          {showChart ? (
            <>
              <div className="text-sm mobile:text-base font-medium text-gray-800 mb-2 mobile:mb-4">
                {chartTitle}{' '}
                <span className="text-gray-400 text-xs">({yearLabel})</span>
              </div>
              {hasChartData ? (
                <>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#17694c]" /> {chartPrimaryLabel}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full bg-[#1769dc]" /> {chartSecondaryLabel}
                    </div>
                  </div>
                  <div className="flex w-full h-48 mobile:h-64 mb-4 mobile:mb-6 min-w-max">
                    <div className="flex flex-col justify-between items-end pr-2 mobile:pr-4 py-2 w-8 mobile:w-12 select-none">
                      {[...Array(6)].map((_, i) => {
                        const value = Math.round((maxY / 5) * (5 - i));
                        return (
                          <span key={i} className="text-xs text-gray-400">{value}</span>
                        );
                      })}
                    </div>
                    <div className="flex gap-8 mobile:gap-20 items-end flex-1 h-full justify-center">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1 max-w-[48px] mobile:max-w-[64px] min-w-[32px] mobile:min-w-[40px]">
                          <div className="flex gap-2 mobile:gap-3 items-end w-full justify-center h-32 mobile:h-44">
                            <div
                              className="bg-[#17694c] rounded-lg transition-all duration-700 cursor-pointer relative"
                              style={{
                                width: '28px',
                                height: `${Math.max(((Number(item.primaryValue) || 0) / maxY) * 128, minBarHeight)}px`,
                                minHeight: minBarHeight,
                              }}
                              onMouseEnter={e => {
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                  value: `${chartPrimaryLabel}: ${Number(item.primaryValue || 0).toLocaleString('sv-SE')}`
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                            <div
                              className="bg-[#1769dc] rounded-lg transition-all duration-700 cursor-pointer relative"
                              style={{
                                width: '28px',
                                height: `${Math.max(((Number(item.secondaryValue) || 0) / maxY) * 128, minBarHeight)}px`,
                                minHeight: minBarHeight,
                              }}
                              onMouseEnter={e => {
                                const rect = (e.target as HTMLElement).getBoundingClientRect();
                                setTooltip({
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                  value: `${chartSecondaryLabel}: ${Number(item.secondaryValue || 0).toLocaleString('sv-SE')}${chartSecondarySuffix}`
                                });
                              }}
                              onMouseLeave={() => setTooltip(null)}
                            />
                          </div>
                          <div className="text-gray-700 font-medium text-xs mobile:text-sm text-center mt-4 mobile:mt-6 max-w-[72px] mobile:max-w-[96px] whitespace-nowrap overflow-hidden text-ellipsis">
                            {item.label}
                          </div>
                          {item.meta && (
                            <div className="text-gray-400 text-[11px] mobile:text-xs text-center mt-1 max-w-[90px] leading-tight">
                              {item.meta}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
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
                </>
              ) : (
                <div className="text-gray-400 text-sm py-10">Ingen data att visa för valt filter.</div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-sm py-6 text-center w-full">
              Ärendevyn visar ingen graf. Scrolla ned för att se hela listan på ärenden.
            </div>
          )}
        </div>

        {/* Export-knappar utanför diagrammet */}
        <div className="flex flex-col lg:flex-row mobile:flex-col gap-3 mobile:gap-4 justify-center">
          <Button variant="outline" className="rounded-lg text-sm font-medium w-full mobile:w-auto" onClick={handleExportPDF} data-tour="stats-export-pdf">Exportera som PDF</Button>
          <Button
            className="rounded-lg text-sm font-medium"
            variant="outline"
            onClick={handleExportExcel}
            data-tour="stats-export-excel"
            disabled={loading || isExportingExcel}
          >
            {isExportingExcel ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Exporterar...
              </span>
            ) : (
              'Ladda ner som Excel'
            )}
          </Button>
        </div>

        <div className="mt-6 w-full">
          {viewMode === 'cases' ? renderCasesTable() : renderAggregatedTable()}
        </div>
      </div>

      </div>
    </Layout>
  );
};
