import { PlusIcon, X } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../components/ui/toggle-group";
import { Modal } from "../../../components/ui/modal";
import { BarChartStatistik } from "./BarChartStatistik";
import { PieChart as RePieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { createCustomer } from '../../../lib/api';

export const MainContent = (): JSX.Element => {
  const statsCards = [
    {
      title: "Kunder totalt",
      value: "46",
      note: "2025 siffror för hela enheten",
    },
    {
      title: "Aktiva insatser",
      value: "3",
      note: "2025 siffror",
    },
    {
      title: "Månadens besök",
      value: "124",
      note: "",
    },
  ];

  const [openModal, setOpenModal] = useState<null | "kund" | "tid" | "statistik">(null);

  const quickActions = [
    { label: "Lägg till kund" },
    { label: "Registrera tid" },
    { label: "Ta ut statistik" },
  ];

  // Form state för Lägg till kund
  const [newCustomer, setNewCustomer] = useState({
    initials: "",
    gender: "",
    birthYear: "",
  });

  const [toast, setToast] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ initials?: string; gender?: string; birthYear?: string }>({});

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleCustomerCancel = () => {
    setOpenModal(null);
    setNewCustomer({ initials: "", gender: "", birthYear: "" });
  };

  const handleCustomerSave = async () => {
    const newErrors: typeof errors = {};
    if (!newCustomer.initials) newErrors.initials = 'Obligatoriskt fält';
    if (!newCustomer.gender) newErrors.gender = 'Obligatoriskt fält';
    if (!newCustomer.birthYear) newErrors.birthYear = 'Obligatoriskt fält';
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
      setToast('Kund registrerad!');
      setTimeout(() => setToast(null), 3000);
      setErrors({});
    } catch (err) {
      setToast('Kunde inte spara kund');
      setTimeout(() => setToast(null), 3000);
    }
  };

  // Form state för Registrera tid
  const [registerTime, setRegisterTime] = useState({
    customer: "",
    effort: "",
    handler: "",
    secondary: "",
    date: "",
    hours: "",
  });

  const handleRegisterTimeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setRegisterTime({
      ...registerTime,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    });
  };

  const handleRegisterTimeCancel = () => {
    setOpenModal(null);
    setRegisterTime({
      customer: "",
      effort: "",
      handler: "",
      secondary: "",
      date: "",
      hours: "",
    });
  };

  const handleRegisterTimeSave = () => {
    setOpenModal(null);
    setRegisterTime({
      customer: "",
      effort: "",
      handler: "",
      secondary: "",
      date: "",
      hours: "",
    });
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

  // Original chartData (weeks) from previous iteration
  const chartDataWeeks = [
    { week: "V. 9", value: 18 },
    { week: "V. 10", value: 22 },
    { week: "V. 11", value: 27 },
    { week: "V. 12", value: 22 },
    { week: "V. 13", value: 18 },
  ];

  // Placeholder for `statType` and `chartType` as they are no longer dropdowns but the toggle group
  // We'll use a state for the selected time period in the toggle group
  const [timePeriod, setTimePeriod] = useState("vecka"); // 'dag', 'vecka', 'månad'

  // Dummy data based on time period
  const getChartDataForPeriod = () => {
    switch (timePeriod) {
      case "dag":
        return [
          { label: "Mån", value: 10 },
          { label: "Tis", value: 15 },
          { label: "Ons", value: 12 },
          { label: "Tor", value: 18 },
          { label: "Fre", value: 14 },
        ];
      case "månad":
        return [
          { label: "Jan", value: 100 },
          { label: "Feb", value: 120 },
          { label: "Mar", value: 150 },
          { label: "Apr", value: 110 },
          { label: "Maj", value: 130 },
        ];
      case "vecka":
      default:
        return chartDataWeeks.map(d => ({ label: d.week, value: d.value })); // Convert week to label for consistency
    }
  };

  const currentChartData = getChartDataForPeriod();

  // Färger för cirkeldiagram - still useful if we re-introduce it or need for other charts
  const pieColors = ["#17694c", "#4bbf73", "#e6a100", "#e64a19"];

  // Summera total för procent
  const total = currentChartData.reduce((sum, d) => sum + d.value, 0);

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

  return (
    <div className="flex-1 flex flex-col items-center">
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
              onClick={() => setOpenModal("tid")}
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
          data={currentChartData.map(d => ({ label: d.label, besok: d.value, kunder: 0 }))}
          titel="Besöksstatistik (Mars)"
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
                <option value="Kvinna">Kvinna</option>
                <option value="Man">Man</option>
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
                className="px-7 py-3 rounded-full bg-[#17694c] text-white font-normal hover:bg-[#145c41] transition text-base min-w-[160px]"
                disabled={!newCustomer.initials || !newCustomer.gender || !newCustomer.birthYear}
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
              <select
                name="customer"
                value={registerTime.customer}
                onChange={handleRegisterTimeChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              >
                <option value="">Välj kund</option>
                <option value="Anna L">Anna L</option>
                <option value="Jessica S">Jessica S</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Insats</label>
              <select
                name="effort"
                value={registerTime.effort}
                onChange={handleRegisterTimeChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              >
                <option value="">Välj insats</option>
                <option value="Samtal">Samtal</option>
                <option value="Samverkan">Samverkan</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Behandlare</label>
              <select
                name="handler"
                value={registerTime.handler}
                onChange={handleRegisterTimeChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              >
                <option value="">Ansvarig behandlare</option>
                <option value="Anna L">Anna L</option>
                <option value="Jessica S">Jessica S</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Sekundär (valfritt)</label>
              <input
                type="text"
                name="secondary"
                placeholder="Sekundär behandlare"
                value={registerTime.secondary}
                onChange={handleRegisterTimeChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
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
                className="px-7 py-3 rounded-full bg-[#17694c] text-white font-normal hover:bg-[#145c41] transition text-base min-w-[160px]"
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
                          label={({ name, value }) => `${value}`}
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
      {/* Toast-meddelande */}
      {toast && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-8 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}
      <p className="text-center text-xs text-gray-500 py-4 mt-auto">
        © 2024 Vallentuna Biståndshandläggare
      </p>
    </div>
  );
};