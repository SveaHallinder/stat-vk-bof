import { PlusIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../../../components/ui/toggle-group";
import { Modal } from "../../../components/ui/modal";

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
    <div className="flex-1 flex flex-col items-center bg-[#f8fafb] min-h-screen">
      {/* Main Content Grid */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-12 gap-x-8 gap-y-6 px-8 pb-10 pt-8">
        {/* Stats Cards */}
        {statsCards.map((stat, index) => (
          <Card key={index} className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-6">
              <div className="flex flex-col h-28 justify-between">
                <div>
                  <div className="text-gray-400 text-sm font-light mb-1 tracking-wider uppercase">
                    {stat.title}
                  </div>
                  <div className="text-[#333333] text-4xl font-light">
                    {stat.value}
                  </div>
                </div>
                {stat.note && (
                  <div className="text-gray-400 text-xs mt-1">
                    {stat.note}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Quick Actions */}
        <Card className="col-span-12 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] mt-6">
          <CardContent className="p-6">
            <h3 className="text-[#333333] text-lg font-semibold mb-4 tracking-tight">
              Snabbåtgärder
            </h3>
            <div className="flex gap-4 flex-wrap">
              <Button
                variant="outline"
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-gray-200 text-[#17694c] font-light text-sm bg-white hover:bg-[#eaf6f1] transition flex-shrink-0 shadow-none"
                onClick={() => setOpenModal("kund")}
              >
                <span className="text-lg">+</span> Lägg till kund
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-gray-200 text-[#17694c] font-light text-sm bg-white hover:bg-[#eaf6f1] transition flex-shrink-0 shadow-none"
                onClick={() => setOpenModal("tid")}
              >
                <span className="text-lg">+</span> Registrera tid
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-1 px-4 py-1.5 rounded-lg border border-gray-200 text-[#17694c] font-light text-sm bg-white hover:bg-[#eaf6f1] transition flex-shrink-0 shadow-none"
                onClick={() => setOpenModal("statistik")}
              >
                <span className="text-lg">+</span> Ta ut statistik
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Visit Statistics Chart and Sidebox */}
        <div className="col-span-12 grid grid-cols-12 gap-8 mt-6">
          {/* Chart Card */}
          <Card className="col-span-12 md:col-span-8 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-7">
                <h3 className="text-[#222] text-lg font-light tracking-wide">
                  Besöksstatistik (Mars)
                </h3>
                {/* ToggleGroup för Dag/Vecka/Månad */}
                <ToggleGroup
                  type="single"
                  defaultValue="vecka"
                  className="flex items-center gap-2"
                  onValueChange={value => setTimePeriod(value)}
                >
                  <ToggleGroupItem
                    value="dag"
                    className="px-5 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-base font-medium"
                  >
                    Dag
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="vecka"
                    className="px-5 py-2 rounded-full bg-[#17694c] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-base font-medium"
                  >
                    Vecka
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="månad"
                    className="px-5 py-2 rounded-full bg-[#f0f0f0] data-[state=off]:bg-[#f0f0f0] data-[state=on]:bg-[#17694c] data-[state=on]:text-white text-base font-medium"
                  >
                    Månad
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              {/* Chart Area */}
              <div className="flex h-56">
                {/* Y-axis */}
                <div className="flex flex-col justify-between items-end pr-2 py-2 w-10 text-[12px] text-[#666] font-light">
                  <span>Antal</span>
                  <span>{Math.max(...currentChartData.map(d => d.value))}</span>
                  <span>0</span>
                </div>
                {/* Chart bars */}
                <div className="flex-1 flex items-end justify-around gap-4 pl-2">
                  {currentChartData.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-1"
                    >
                      <span className="text-[12px] text-[#17694c] font-light">
                        {item.value}
                      </span>
                      <div
                        className="w-16 bg-gradient-to-t from-[#17694c] to-[#eaf6f1] rounded-lg"
                        style={{ height: `${(item.value / Math.max(...currentChartData.map(d => d.value))) * 70}px` }}
                      />
                      <span className="text-[12px] text-[#666] font-light mt-1">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side summary box */}
          <Card className="col-span-12 md:col-span-4 bg-white border border-gray-200 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#17694c]"></span>
                  <div className="text-sm text-gray-400 font-light tracking-wide">Mest populär insats</div>
                </div>
                <div className="text-base font-semibold text-[#17694c] mb-1">{currentChartData.reduce((a, b) => (a.value > b.value ? a : b)).label}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-light tracking-wide mb-0">Andel högsta kategori</div>
                <div className="text-base font-light text-[#17694c] mb-1">{Math.round(100 * Math.max(...currentChartData.map(d => d.value)) / total)}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 font-light tracking-wide mb-0">Snitt per kategori</div>
                <div className="text-base font-light text-[#17694c]">{(total / currentChartData.length).toFixed(1)}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals - keeping them as they were before */}
      <Modal open={openModal === "kund"} onClose={handleCustomerCancel}>
        <div className="bg-[#17694c] rounded-t-lg px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Lägg till ny kund</h2>
        </div>
        <form className="pt-8 pb-2 px-8 flex flex-col gap-6 min-w-[320px]">
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Initialer</label>
            <input
              type="text"
              name="initials"
              placeholder="t.ex. AL"
              value={newCustomer.initials}
              onChange={handleCustomerChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Kön</label>
            <select
              name="gender"
              value={newCustomer.gender}
              onChange={handleCustomerChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            >
              <option value="">Välj kön</option>
              <option value="Kvinna">Kvinna</option>
              <option value="Man">Man</option>
              <option value="Annat">Annat</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Födelseår</label>
            <input
              type="text"
              name="birthYear"
              placeholder="ÅÅÅÅ"
              value={newCustomer.birthYear}
              onChange={handleCustomerChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
              maxLength={4}
            />
          </div>
          <div className="flex gap-4 justify-end mt-2">
            <button
              type="button"
              onClick={handleCustomerCancel}
              className="px-6 py-2 rounded-full border border-gray-300 text-[#17694c] bg-white font-semibold hover:bg-gray-50 transition"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleCustomerSave}
              className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition"
            >
              Spara och fortsätt
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={openModal === "tid"} onClose={handleRegisterTimeCancel}>
        <div className="bg-[#17694c] rounded-t-lg px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Registrera tid</h2>
        </div>
        <form className="pt-8 pb-2 px-8 flex flex-col gap-6 min-w-[340px]">
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Kund</label>
            <select
              name="customer"
              value={registerTime.customer}
              onChange={handleRegisterTimeChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            >
              <option value="">Välj kund</option>
              <option value="Anna L">Anna L</option>
              <option value="Jessica S">Jessica S</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Insats</label>
            <select
              name="effort"
              value={registerTime.effort}
              onChange={handleRegisterTimeChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            >
              <option value="">Välj insats</option>
              <option value="Samtal">Samtal</option>
              <option value="Samverkan">Samverkan</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Behandlare</label>
            <select
              name="handler"
              value={registerTime.handler}
              onChange={handleRegisterTimeChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            >
              <option value="">Ansvarig behandlare</option>
              <option value="Anna L">Anna L</option>
              <option value="Jessica S">Jessica S</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Sekundär (valfritt)</label>
            <input
              type="text"
              name="secondary"
              placeholder="Sekundär behandlare"
              value={registerTime.secondary}
              onChange={handleRegisterTimeChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-[#17694c] font-semibold">Datum</label>
              <input
                type="date"
                name="date"
                value={registerTime.date}
                onChange={handleRegisterTimeChange}
                className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
              />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-[#17694c] font-semibold">Tid</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  name="timeStart"
                  value={registerTime.timeStart}
                  onChange={handleRegisterTimeChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c] w-1/2"
                />
                <input
                  type="time"
                  name="timeEnd"
                  value={registerTime.timeEnd}
                  onChange={handleRegisterTimeChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c] w-1/2"
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
            <label className="text-[#17694c] font-semibold">Skapa återkommande besök</label>
          </div>
          <div className="flex gap-4 justify-end mt-2">
            <button
              type="button"
              onClick={handleRegisterTimeCancel}
              className="px-6 py-2 rounded-full border border-gray-300 text-[#17694c] bg-white font-semibold hover:bg-gray-50 transition"
            >
              Avbryt
            </button>
            <button
              type="button"
              onClick={handleRegisterTimeSave}
              className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition"
            >
              Spara och fortsätt
            </button>
          </div>
        </form>
      </Modal>
      <Modal open={openModal === "statistik"} onClose={handleStatistikCancel}>
        <div className="bg-[#17694c] rounded-t-lg px-8 pt-8 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Ta ut statistik</h2>
        </div>
        <form className="pt-8 pb-2 px-8 flex flex-col gap-6 min-w-[340px]" onSubmit={handleStatistikApply}>
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-[#17694c] font-semibold">År</label>
              <select
                name="year"
                value={statistik.year}
                onChange={handleStatistikChange}
                className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
              >
                <option value="2015">2015</option>
                <option value="2025">2025</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-[#17694c] font-semibold">Månad</label>
              <select
                name="month"
                value={statistik.month}
                onChange={handleStatistikChange}
                className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
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
              <label className="text-[#17694c] font-semibold">Kön</label>
              <select
                name="gender"
                value={statistik.gender}
                onChange={handleStatistikChange}
                className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
              >
                <option value="">Välj kön</option>
                <option value="Kvinna">Kvinna</option>
                <option value="Man">Man</option>
                <option value="Annat">Annat</option>
              </select>
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <label className="text-[#17694c] font-semibold">Ålder</label>
              <input
                type="text"
                name="age"
                placeholder="T.ex. 2009"
                value={statistik.age}
                onChange={handleStatistikChange}
                className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[#17694c] font-semibold">Insats</label>
            <select
              name="effort"
              value={statistik.effort}
              onChange={handleStatistikChange}
              className="border border-gray-300 rounded-lg px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-[#17694c]"
            >
              <option value="">Välj insats</option>
              <option value="Samtal">Samtal</option>
              <option value="Samverkan">Samverkan</option>
            </select>
          </div>
          <div className="flex gap-4 justify-end mt-2">
            <button
              type="button"
              onClick={handleStatistikCancel}
              className="px-6 py-2 rounded-full border border-gray-300 text-[#17694c] bg-white font-semibold hover:bg-gray-50 transition"
            >
              Avbryt
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#17694c] text-white font-semibold hover:bg-[#145c41] transition"
            >
              {showStatistikChart ? "Applicera filter" : "Visa"}
            </button>
          </div>
          {showStatistikChart && (
            <div className="mt-6 bg-gray-100 rounded-lg p-6 flex flex-col items-center">
              <div className="w-full h-32 bg-gradient-to-t from-[#17694c]/20 to-[#17694c]/60 rounded mb-4" />
              <button type="button" className="px-6 py-2 rounded-full bg-[#e0e0e0] text-[#17694c] font-semibold hover:bg-[#d0d0d0] transition">Exportera</button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
};