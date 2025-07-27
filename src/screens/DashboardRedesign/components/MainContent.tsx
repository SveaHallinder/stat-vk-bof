import { X } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Modal } from "../../../components/ui/modal";
import { BarChartStatistik } from "./BarChartStatistik";
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { createCustomer } from '../../../lib/api';
import { KundCombobox } from "../../../components/ui/kund-combobox";
import { InsatsCombobox } from "../../../components/ui/insats-combobox";
import { BehandlareCombobox } from "../../../components/ui/behandlare-combobox";
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { getStatsSummary, getStatsByEffort } from "../../../lib/api";

export const MainContent = (): JSX.Element => {
  // Dynamisk statistik
  const [stats, setStats] = useState<{ antal_besok: number; antal_kunder: number; genomsnittlig_tid: number; avbokningsgrad: number } | null>(null);
  const [effortData, setEffortData] = useState<any[] | null>(null);

  useEffect(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
    getStatsSummary({ from, to }).then(setStats);
    getStatsByEffort({ from, to }).then(setEffortData);
  }, []);

  const statsCards = [
    {
      title: "Kunder totalt",
      value: stats ? stats.antal_kunder : "-",
      note: `${new Date().getFullYear()} siffror för hela enheten`,
    },
    {
      title: "Aktiva insatser",
      value: effortData ? effortData.length : "-",
      note: `${new Date().getFullYear()} siffror`,
    },
    {
      title: "Månadens besök",
      value: stats ? stats.antal_besok : "-",
      note: "",
    },
  ];

  const chartData = effortData
    ? effortData.map(d => ({
        label: d.effort_name,
        besok: Number(d.antal_besok),
        kunder: Number(d.antal_kunder),
      }))
    : [];

  const [openModal, setOpenModal] = useState<null | "kund" | "tid" | "statistik">(null);

  // Form state för Lägg till kund
  const [newCustomer, setNewCustomer] = useState({
    initials: "",
    gender: "",
    birthYear: "",
  });

  const [errors, setErrors] = useState<{ initials?: string; gender?: string; birthYear?: string }>({});

  function validateCustomer(c: typeof newCustomer) {
    const err: { initials?: string; gender?: string; birthYear?: string } = {};
    if (!c.initials) err.initials = "Obligatoriskt fält";
    if (!c.gender) err.gender = "Obligatoriskt fält";
    if (!c.birthYear) err.birthYear = "Obligatoriskt fält";
    else if (!/^\d{4}$/.test(c.birthYear)) err.birthYear = "Födelseår måste vara 4 siffror";
    return err;
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const updated = { ...newCustomer, [e.target.name]: e.target.value };
    setNewCustomer(updated);
    setErrors(validateCustomer(updated));
  };

  const handleCustomerCancel = () => {
    setOpenModal(null);
    setNewCustomer({ initials: "", gender: "", birthYear: "" });
    setErrors({});
  };

  const handleCustomerSave = async () => {
    const newErrors = validateCustomer(newCustomer);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    try {
      await createCustomer({
        initials: newCustomer.initials,
        gender: newCustomer.gender,
        birthYear: Number(newCustomer.birthYear)
      });
      setOpenModal(null);
      setNewCustomer({ initials: '', gender: '', birthYear: '' });
      toast.success('Kund registrerad!');
      setErrors({});
    } catch (err) {
      toast.error('Kunde inte spara kund');
    }
  };

  // Form state för Registrera tid
  const [registerTime, setRegisterTime] = useState({
    customer: "",   // ska vara ett ID (sträng eller siffra)
    effort: "",     // ska vara ett ID
    handler: "",    // ska vara ett ID
    secondary: "",  // ska vara ett ID eller tom sträng
    date: "",
    hours: ""
  });
  const [registerTimeErrors, setRegisterTimeErrors] = useState<{ customer?: string; effort?: string; handler?: string; date?: string; hours?: string }>({});

  const handleRegisterTimeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setRegisterTime({
      ...registerTime,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
    setRegisterTimeErrors(prev => ({ ...prev, [name]: undefined }));
  };

  function validateRegisterTime(rt: typeof registerTime) {
    const err: { customer?: string; effort?: string; handler?: string; date?: string; hours?: string } = {};
    if (!rt.customer) err.customer = "Du måste välja kund";
    if (!rt.effort) err.effort = "Du måste välja insats";
    if (!rt.handler) err.handler = "Du måste välja behandlare";
    if (!rt.date) err.date = "Du måste ange datum";
    if (!rt.hours || isNaN(Number(rt.hours))) err.hours = "Du måste ange antal timmar";
    return err;
  }

  const handleRegisterTimeCancel = () => {
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
  };

  const handleRegisterTimeSave = async () => {
    const errors = validateRegisterTime(registerTime);
    setRegisterTimeErrors(errors);
    if (Object.keys(errors).length > 0) return;

    // Bygg payload med ID:n
    const payload = {
      customer_id: registerTime.customer,           // ID (sträng/siffra)
      effort_id: registerTime.effort,               // ID
      handler1_id: registerTime.handler,            // ID
      handler2_id: registerTime.secondary || null,  // ID eller null
      date: registerTime.date,
      hours: registerTime.hours,
      status: "Utförd" // eller vad du vill sätta
    };


    try {
      const res = await fetch("http://localhost:4000/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const text = await res.text();
        toast.error("Kunde inte spara ärende: " + text);
        return;
      }
      // Nollställ formuläret eller visa feedback
      setRegisterTime({
        customer: "",
        effort: "",
        handler: "",
        secondary: "",
        date: "",
        hours: ""
      });
      toast.success("Tid registrerad!");
    } catch (err) {
      toast.error("Nätverksfel: " + err);
    }
  };

  // Form state för Ta ut statistik
  const [statistik, setStatistik] = useState({
    year: "2015",
    month: "Januari",
    gender: "",
    age: "",
    effort: "",
  });

  const handleStatistikChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setStatistik({ ...statistik, [e.target.name]: e.target.value });
  };

  const [showStatistikChart, setShowStatistikChart] = useState(false);

  const handleStatistikApply = (e: React.FormEvent) => {
    e.preventDefault();
    setShowStatistikChart(true);
  };

  const handleStatistikCancel = () => {
    setOpenModal(null);
    setStatistik({ year: "2015", month: "Januari", gender: "", age: "", effort: "" });
    setShowStatistikChart(false);
  };

  // Exportfunktioner
  const handleExportPDF = () => {
    const input = document.getElementById('statistik-export');
    if (!input) return;
    html2canvas(input).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape' });
      pdf.addImage(imgData, 'PNG', 10, 10, 270, 150);
      pdf.save('statistik.pdf');
    });
  };

  const handleExportExcel = () => {
    const data = [
      ['Insats', 'Antal'],
      ['Samtal', 363],
      ['rePULSE', 364],
      ['Trappan', 304],
      ['Hela Barn', 98],
      ['KIBB', 413],
      ['Ungdomstjänst', 182],
      ['Familjesöd', 240],
      ['Övrig tid', 367],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statistik');
    XLSX.writeFile(wb, 'statistik.xlsx');
  };

  const getToday = () => new Date().toISOString().slice(0, 10);

  return (
    <div className="flex-1 flex flex-col items-center">
      <Toaster position="top-center" toastOptions={{ duration: 2500 }} />
      {/* Main Content Grid */}
      <div className="w-full max-w-7xl mx-auto px-8 flex flex-col gap-8">
        {/* Statistik-kort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-sm p-6 flex flex-col justify-center"
            >
              <div className="text-gray-500 text-sm font-semibold tracking-wide uppercase">
                {stat.title}
              </div>
              <div className="text-4xl text-[#222] font-light mt-2">
                {stat.value}
              </div>
              {stat.note && (
                <div className="text-gray-400 text-xs mt-2">
                  {stat.note}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Snabbåtgärder */}
        <div className="bg-white rounded-xl p-6 flex flex-col items-start">
          <h3 className="text-[#333] text-lg font-light mb-6 tracking-tight">Snabbåtgärder</h3>
          <div className="flex gap-8 flex-wrap">
            <Button
              variant="outline"
              className="rounded-lg border border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-7 py-3 min-w-[180px]"
              onClick={() => setOpenModal("kund")}
            >
              + Lägg till kund
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-7 py-3 min-w-[180px]"
              onClick={() => {
                setOpenModal("tid");
                setRegisterTime(rt => ({ ...rt, date: getToday() }));
              }}
            >
              + Registrera tid
            </Button>
            <Button
              variant="outline"
              className="rounded-lg border border-gray-200 text-[#17694c] font-normal text-base bg-white hover:bg-[#eaf6f1] transition px-7 py-3 min-w-[180px]"
              onClick={() => setOpenModal("statistik")}
            >
              + Ta ut statistik
            </Button>
          </div>
        </div>
        {/* Diagram */}
        <BarChartStatistik
          data={chartData}
          titel={`Besöksstatistik (${new Date().toLocaleString('sv-SE', { month: 'long' })})`}
        />
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
      <Modal open={openModal === "tid"} onClose={handleRegisterTimeCancel}>
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-0">
          <div className="bg-[#17694c] rounded-t-2xl px-8 pt-7 pb-5 flex items-center justify-between">
            <h2 className="text-xl font-light text-white tracking-tight">Registrera tid</h2>
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
              <label className="text-[#17694c] font-normal text-base">Kund</label>
              <KundCombobox value={registerTime.customer} onChange={value => {
                setRegisterTime(rt => ({ ...rt, customer: value }));
                setRegisterTimeErrors(prev => ({ ...prev, customer: undefined }));
              }} placeholder="Välj kund" />
              {registerTimeErrors.customer && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.customer}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Insats</label>
              <InsatsCombobox value={registerTime.effort} onChange={value => {
                setRegisterTime(rt => ({ ...rt, effort: value }));
                setRegisterTimeErrors(prev => ({ ...prev, effort: undefined }));
              }} placeholder="Välj insats" />
              {registerTimeErrors.effort && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.effort}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Behandlare</label>
              <BehandlareCombobox
                value={registerTime.handler}
                onChange={value => {
                  setRegisterTime(rt => ({ ...rt, handler: value }));
                  setRegisterTimeErrors(prev => ({ ...prev, handler: undefined }));
                }}
              />
              {registerTimeErrors.handler && <span className="text-red-500 text-xs mt-1">{registerTimeErrors.handler}</span>}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Sekundär (valfritt)</label>
              <BehandlareCombobox
                value={registerTime.secondary}
                onChange={value => setRegisterTime(rt => ({ ...rt, secondary: value }))}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Datum</label>
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
                <label className="text-[#17694c] font-normal text-base">Timmar</label>
                <input
                  type="number"
                  name="hours"
                  value={registerTime.hours}
                  onChange={handleRegisterTimeChange}
                  className="w-full border rounded px-3 py-2 mt-1"
                  min={0}
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
                Spara och fortsätt
              </button>
            </div>
          </form>
        </div>
      </Modal>
      <Modal open={openModal === "statistik"} onClose={handleStatistikCancel}>
        <div className={`bg-white rounded-2xl shadow-xl p-10 w-full transition-all duration-300 ${showStatistikChart ? 'max-w-6xl min-w-[900px] flex flex-col' : 'max-w-lg'} `}>
          <h2 className="text-2xl font-light mb-8">Ta ut statistik</h2>
          <div className={`flex ${showStatistikChart ? 'flex-row gap-12' : 'flex-col'}`}>
            {/* Vänsterkolumn: Filter */}
            <form className={`flex flex-col gap-6 ${showStatistikChart ? 'w-80 max-w-sm' : ''}`} onSubmit={handleStatistikApply}>
              <div>
                <label className="block text-sm font-medium text-gray-700">År</label>
                <select name="year" value={statistik.year} onChange={handleStatistikChange} className="w-full border rounded px-3 py-2">
                  <option value="2015">2015</option>
                  <option value="2016">2016</option>
                  <option value="2017">2017</option>
                  <option value="2018">2018</option>
                  <option value="2019">2019</option>
                  <option value="2020">2020</option>
                  <option value="2021">2021</option>
                  <option value="2022">2022</option>
                  <option value="2023">2023</option>
                  <option value="2024">2024</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Månad</label>
                <select name="month" value={statistik.month} onChange={handleStatistikChange} className="w-full border rounded px-3 py-2">
                  <option>Januari</option>
                  <option>Februari</option>
                  <option>Mars</option>
                  <option>April</option>
                  <option>Maj</option>
                  <option>Juni</option>
                  <option>Juli</option>
                  <option>Augusti</option>
                  <option>September</option>
                  <option>Oktober</option>
                  <option>November</option>
                  <option>December</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Kön</label>
                <select name="gender" value={statistik.gender} onChange={handleStatistikChange} className="w-full border rounded px-3 py-2">
                  <option value="">Välj kön</option>
                  <option value="Flicka">Flicka</option>
                  <option value="Pojke">Pojke</option>
                  <option value="Icke-binär">Icke-binär</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Ålder</label>
                <input name="age" value={statistik.age} onChange={handleStatistikChange} className="w-full border rounded px-3 py-2" placeholder="T.Ex. 2009" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Insats</label>
                <select name="effort" value={statistik.effort} onChange={handleStatistikChange} className="w-full border rounded px-3 py-2">
                  <option value="">Välj insats</option>
                  <option value="Samtal">Samtal</option>
                  <option value="rePULSE">rePULSE</option>
                  <option value="Trappan">Trappan</option>
                  <option value="Hela Barn">Hela Barn</option>
                  <option value="KIBB">KIBB</option>
                  <option value="Ungdomstjänst/kontrakt">Ungdomstjänst/kontrakt</option>
                  <option value="Familjesöd">Familjesöd</option>
                  <option value="Övrig tid">Övrig tid</option>
                </select>
              </div>
              <div className="flex gap-4 mt-4">
                <Button variant="outline" type="button" onClick={handleStatistikCancel}>Avbryt</Button>
                <Button variant="default" type="submit">{showStatistikChart ? 'Applicera filter' : 'Visa diagram'}</Button>
              </div>
            </form>
            {/* Högerkolumn: Diagram och export */}
            {showStatistikChart && (
              <div className="flex-1 flex flex-col gap-8 justify-center items-center" id="statistik-export">
                <div className="w-full flex flex-col items-center">
                  <h3 className="text-xl font-light mb-4">Besök och kunder per insatstyp ({statistik.year})</h3>
                  <div className="w-full h-96 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={[
                            { name: 'Samtal', value: 363 },
                            { name: 'rePULSE', value: 364 },
                            { name: 'Trappan', value: 304 },
                            { name: 'Hela Barn', value: 98 },
                            { name: 'KIBB', value: 413 },
                            { name: 'Ungdomstjänst', value: 182 },
                            { name: 'Familjesöd', value: 240 },
                            { name: 'Övrig tid', value: 367 },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={110}
                          fill="#17694c"
                          label={({ value }) => `${value}`}
                          labelLine={true}
                        >
                          {[
                            '#17694c', '#4bbf73', '#e6a100', '#e64a19', '#1769dc', '#b36ae2', '#f59e42', '#6b7280'
                          ].map((color, idx) => (
                            <Cell key={`cell-${idx}`} fill={color} />
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