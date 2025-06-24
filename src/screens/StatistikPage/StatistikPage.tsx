import React, { useState } from "react";
import { Layout } from "../../components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";
import { Input } from "../../components/ui/input";

const tabList = [
  { key: "anpassad", label: "Anpassad" },
  { key: "arsoversikt", label: "Årsöversikt" },
  { key: "insatser", label: "Insatser" },
  { key: "behandlare", label: "Behandlaröversikt" },
  { key: "avbokningar", label: "Avbokningar" },
];

const insatser = ["Alla", "Nybesök", "Repulse", "Uppföljning", "Föräldrarsamtal", "Telefonkontakt"];

const statistik = {
  besok: 1248,
  kunder: 142,
  tid: "45 min",
  avbokning: "18%",
};

// Hämta insatser från AdminPage
const insatserList = [
  { name: "Samtal", for: "Biståndsbedömda" },
  { name: "rePULSE", for: "Biståndsbedömda, Förebyggande" },
  { name: "Trappan", for: "Biståndsbedömda" },
  { name: "Hela Barn", for: "Biståndsbedömda" },
  { name: "KIBB", for: "Biståndsbedömda" },
  { name: "Ungdomstjänst/kontrakt", for: "Biståndsbedömda" },
  { name: "Familjesöd", for: "Förebyggande" },
  { name: "Övrig tid", for: "Biståndsbedömda" },
];

// Generera placeholder-data för varje insats
const chartData = insatserList.map(i => ({
  label: i.name,
  besok: Math.floor(Math.random() * 400) + 50, // 50-449
  kunder: Math.floor(Math.random() * 150) + 10, // 10-159
}));

// Dynamiskt maxvärde för stapeldiagrammet
const maxBesok = Math.max(...chartData.map(d => d.besok), 1);
const maxKunder = Math.max(...chartData.map(d => d.kunder), 1);
const maxY = Math.max(maxBesok, maxKunder, 1); // undvik delning med 0
const minBarHeight = 24; // px

const StatCard = ({ title, value, colorClass }: { title: string, value: string | number, colorClass: string }) => (
  <Card className={`flex-1 ${colorClass} text-white rounded-xl`}>
    <CardContent className="p-6 flex flex-col items-center justify-center">
      <div className="text-lg font-semibold mb-1">{title}</div>
      <div className="text-4xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export const StatistikPage = (): JSX.Element => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string } | null>(null);

  return (
    <Layout activeItem="Statistik" title="Statistik">
      <div className="space-y-8">
        {/* Filterrad */}
        <div className="bg-white rounded-xl p-6 flex flex-col gap-6 items-center">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            <div className="flex flex-col gap-2">
              <label className="font-normal text-xs text-gray-500">Tidsperiod (Från)</label>
              <Input type="date" className="rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-normal text-xs text-gray-500">Tidsperiod (Till)</label>
              <Input type="date" className="rounded-lg text-sm" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-normal text-xs text-gray-500">Insats</label>
              <Select>
                <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Välj insats" /></SelectTrigger>
                <SelectContent>{insatserList.map(i => <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-normal text-xs text-gray-500">Gruppera efter</label>
              <Select>
                <SelectTrigger className="rounded-lg text-sm"><SelectValue placeholder="Välj gruppering" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="insatstyp">Insatstyp</SelectItem>
                  <SelectItem value="kon">Kön</SelectItem>
                  <SelectItem value="alder">Ålder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end w-full">
            <Button className="rounded-lg px-6 text-sm font-normal" variant="outline">Tillämpa</Button>
          </div>
        </div>

        {/* Statistik-kort */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Totalt antal besök</div>
            <div className="text-[#222] text-3xl font-light mt-1">{statistik.besok.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Antal kunder</div>
            <div className="text-[#222] text-3xl font-light mt-1">{statistik.kunder}</div>
          </div>
          <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Genomsnittlig tid</div>
            <div className="text-[#222] text-3xl font-light mt-1">{statistik.tid}</div>
          </div>
          <div className="bg-white rounded-xl p-6 flex flex-col items-center justify-center">
            <div className="text-gray-600 text-sm font-medium mb-2 tracking-wide uppercase">Avbokningsgrad</div>
            <div className="text-[#222] text-3xl font-light mt-1">{statistik.avbokning}</div>
          </div>
        </div>

        {/* Diagramkort */}
        <div className="bg-white rounded-xl p-8 flex flex-col items-center relative">
          <div className="text-base font-medium text-gray-800 mb-6">Besök och kunder per insatstyp (2025)</div>
          <div className="flex w-full h-64 mb-6">
            {/* Y-axel */}
            <div className="flex flex-col justify-between items-end pr-4 py-2 w-12 select-none">
              {[...Array(6)].map((_, i) => {
                const value = Math.round((maxY / 5) * (5 - i));
                return (
                  <span key={i} className="text-xs text-gray-400">{value}</span>
                );
              })}
            </div>
            {/* Staplar */}
            <div className="flex gap-20 items-end flex-1 h-full justify-center">
              {chartData.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 max-w-[56px] min-w-[36px]">
                  {/* Staplar i container med fast höjd */}
                  <div className="flex gap-3 items-end w-full justify-center h-44">
                    <div
                      className="bg-[#17694c] rounded-lg transition-all duration-700 cursor-pointer relative"
                      style={{
                        width: '36px',
                        height: `calc(${Math.max((item.besok / maxY) * 100, (minBarHeight / 176) * 100)}%)`,
                        minHeight: minBarHeight,
                      }}
                      onMouseEnter={e => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          value: `Besök: ${item.besok}`
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                    <div
                      className="bg-[#1769dc] rounded-lg transition-all duration-700 cursor-pointer relative"
                      style={{
                        width: '36px',
                        height: `calc(${Math.max((item.kunder / maxY) * 100, (minBarHeight / 176) * 100)}%)`,
                        minHeight: minBarHeight,
                      }}
                      onMouseEnter={e => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        setTooltip({
                          x: rect.left + rect.width / 2,
                          y: rect.top,
                          value: `Kunder: ${item.kunder}`
                        });
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  </div>
                  {/* Etikett under staplarna */}
                  <div className="text-gray-400 font-normal text-sm text-center mt-6 max-w-[80px] whitespace-nowrap overflow-hidden">{item.label}</div>
                </div>
              ))}
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
          <div className="flex gap-4 justify-center mt-2">
            <Button variant="outline" className="rounded-lg text-sm font-medium">Exportera som PDF</Button>
            <Button className="rounded-lg text-sm font-medium" variant="outline">Ladda ner som Excel</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};