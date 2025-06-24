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

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setNewCustomer({ ...newCustomer, [e.target.name]: e.target.value });
  };

  const handleCustomerCancel = () => {
    setOpenModal(null);
    setNewCustomer({ initials: "", gender: "", birthYear: "" });
  };

  const handleCustomerSave = () => {
    // Här kan du koppla på logik för att spara till databas senare
    setOpenModal(null);
    setNewCustomer({ initials: "", gender: "", birthYear: "" });
  };

  // Form state för Registrera tid
  const [registerTime, setRegisterTime] = useState({
    customer: "",
    effort: "",
    handler: "",
    secondary: "",
    date: "",
    timeStart: "",
    timeEnd: "",
    recurring: false,
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
      timeStart: "",
      timeEnd: "",
      recurring: false,
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
      timeStart: "",
      timeEnd: "",
      recurring: false,
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
          <h3 className="text-[#333] text-lg font-medium mb-6 tracking-tight">Snabbåtgärder</h3>
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
            <h2 className="text-xl font-medium text-white tracking-tight">Lägg till ny kund</h2>
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
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Kön</label>
              <select
                name="gender"
                value={newCustomer.gender}
                onChange={handleCustomerChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              >
                <option value="">Välj kön</option>
                <option value="Kvinna">Kvinna</option>
                <option value="Man">Man</option>
                <option value="Annat">Annat</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Födelseår</label>
              <input
                type="text"
                name="birthYear"
                placeholder="ÅÅÅÅ"
                value={newCustomer.birthYear}
                onChange={handleCustomerChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                maxLength={4}
              />
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
            <h2 className="text-xl font-medium text-white tracking-tight">Registrera tid</h2>
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
                <label className="text-[#17694c] font-normal text-base">Tid</label>
                <div className="flex gap-2">
                  <input
                    type="time"
                    name="timeStart"
                    value={registerTime.timeStart}
                    onChange={handleRegisterTimeChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc] w-1/2"
                  />
                  <input
                    type="time"
                    name="timeEnd"
                    value={registerTime.timeEnd}
                    onChange={handleRegisterTimeChange}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc] w-1/2"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="recurring"
                checked={registerTime.recurring}
                onChange={handleRegisterTimeChange}
                className="w-5 h-5 border-gray-300 rounded focus:ring-[#17694c]"
              />
              <label className="text-[#17694c] font-normal">Skapa återkommande besök</label>
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
        <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-0">
          <div className="bg-[#17694c] rounded-t-2xl px-8 pt-7 pb-5 flex items-center justify-between">
            <h2 className="text-xl font-medium text-white tracking-tight">Ta ut statistik</h2>
            <button
              type="button"
              onClick={handleStatistikCancel}
              className="text-white hover:bg-[#145c41] rounded-full p-1.5 transition focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Stäng"
            >
              <X size={24} />
            </button>
          </div>
          <form className="pt-8 pb-10 px-8 flex flex-col gap-7" onSubmit={handleStatistikApply} style={{borderRadius: '0 0 1rem 1rem'}}>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">År</label>
                <select
                  name="year"
                  value={statistik.year}
                  onChange={handleStatistikChange}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                >
                  <option value="2015">2015</option>
                  <option value="2025">2025</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Månad</label>
                <select
                  name="month"
                  value={statistik.month}
                  onChange={handleStatistikChange}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                >
                  <option value="Januari">Januari</option>
                  <option value="Februari">Februari</option>
                  <option value="Mars">Mars</option>
                  <option value="April">April</option>
                  <option value="Maj">Maj</option>
                  <option value="Juni">Juni</option>
                  <option value="Juli">Juli</option>
                  <option value="Augusti">Augusti</option>
                  <option value="September">September</option>
                  <option value="Oktober">Oktober</option>
                  <option value="November">November</option>
                  <option value="December">December</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Kön</label>
                <select
                  name="gender"
                  value={statistik.gender}
                  onChange={handleStatistikChange}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                >
                  <option value="">Välj kön</option>
                  <option value="Kvinna">Kvinna</option>
                  <option value="Man">Man</option>
                  <option value="Annat">Annat</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-1/2">
                <label className="text-[#17694c] font-normal text-base">Ålder</label>
                <input
                  type="text"
                  name="age"
                  placeholder="T.ex. 2009"
                  value={statistik.age}
                  onChange={handleStatistikChange}
                  className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[#17694c] font-normal text-base">Insats</label>
              <select
                name="effort"
                value={statistik.effort}
                onChange={handleStatistikChange}
                className="border border-gray-200 rounded-lg px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#17694c] bg-[#fafbfc]"
              >
                <option value="">Välj insats</option>
                <option value="Samtal">Samtal</option>
                <option value="Samverkan">Samverkan</option>
              </select>
            </div>
            <div className="flex gap-4 justify-center mt-8">
              <button
                type="button"
                onClick={handleStatistikCancel}
                className="px-7 py-3 rounded-full border border-gray-300 text-[#17694c] bg-white font-normal hover:bg-gray-50 transition text-base min-w-[120px]"
              >
                Avbryt
              </button>
              <button
                type="submit"
                className="px-7 py-3 rounded-full bg-[#17694c] text-white font-normal hover:bg-[#145c41] transition text-base min-w-[120px]"
              >
                {showStatistikChart ? "Applicera filter" : "Visa"}
              </button>
            </div>
            {showStatistikChart && (
              <div className="mt-6 bg-gray-100 rounded-lg p-6 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  <div className="text-base font-medium text-gray-800 mb-6">Besök och kunder per insatstyp (2025)</div>
                  <div className="flex gap-6 items-end h-56 mb-2 justify-center w-full">
                    {[
                      { label: "Samtal", besok: 363, kunder: 49 },
                      { label: "rePULSE", besok: 364, kunder: 17 },
                      { label: "Trappan", besok: 304, kunder: 71 },
                      { label: "Hela Barn", besok: 98, kunder: 152 },
                      { label: "KIBB", besok: 413, kunder: 63 },
                      { label: "Ungdomstjänst", besok: 182, kunder: 18 },
                      { label: "Familjesöd", besok: 240, kunder: 72 },
                      { label: "Övrig tid", besok: 367, kunder: 66 },
                    ].map((item, idx, arr) => {
                      const max = Math.max(...arr.map(d => Math.max(d.besok, d.kunder)), 1);
                      return (
                        <div key={idx} className="flex flex-col items-center flex-1 max-w-[48px] min-w-[32px]">
                          <div className="flex gap-1 mb-1 text-sm font-medium justify-center">
                            <span className="text-[#17694c]">{item.besok}</span>
                            <span className="text-[#1769dc]">{item.kunder}</span>
                          </div>
                          <div className="flex gap-1 items-end h-36 w-full justify-center">
                            <div
                              className="bg-[#17694c] rounded-lg transition-all"
                              style={{
                                width: '24%',
                                height: `${Math.max((item.besok / max) * 100, 20)}%`,
                                minHeight: 16,
                              }}
                            />
                            <div
                              className="bg-[#1769dc] rounded-lg transition-all"
                              style={{
                                width: '24%',
                                height: `${Math.max((item.kunder / max) * 100, 20)}%`,
                                minHeight: 16,
                              }}
                            />
                          </div>
                          <div className="text-gray-400 mt-2 font-normal text-xs text-center break-words">{item.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-4 justify-center mt-6">
                  <button type="button" className="px-6 py-2 rounded-full bg-[#e0e0e0] text-[#17694c] font-semibold hover:bg-[#d0d0d0] transition">Exportera som PDF</button>
                  <button type="button" className="px-6 py-2 rounded-full bg-[#e0e0e0] text-[#17694c] font-semibold hover:bg-[#d0d0d0] transition">Ladda ner som Excel</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>
      <p className="text-center text-xs text-gray-500 py-4 mt-auto">
        © 2024 Vallentuna Biståndshandläggare
      </p>
    </div>
  );
};