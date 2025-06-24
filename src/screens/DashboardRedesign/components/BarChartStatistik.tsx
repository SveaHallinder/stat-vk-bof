import React, { useState } from "react";

interface BarChartStatistikProps {
  data: { label: string; besok: number; kunder: number }[];
  titel: string;
  maxY?: number;
}

export const BarChartStatistik = ({ data, titel, maxY: maxYProp }: BarChartStatistikProps) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; value: string } | null>(null);
  const minBarHeight = 24;
  const maxBesok = Math.max(...data.map(d => d.besok), 1);
  const maxKunder = Math.max(...data.map(d => d.kunder), 1);
  const maxY = maxYProp ?? Math.max(maxBesok, maxKunder, 1);

  return (
    <div className="bg-white rounded-xl p-8 flex flex-col items-center relative">
      <div className="text-base font-medium text-gray-800 mb-6">{titel}</div>
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
          {data.map((item, idx) => (
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
    </div>
  );
}; 