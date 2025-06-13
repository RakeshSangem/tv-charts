import React, { useState } from "react";
import { BarChart3, Settings, Play, Pause } from "lucide-react";
import TimeframeSelector from "./TimeframeSelector.jsx";
import IndicatorsModal from "./IndicatorsModal";

const ChartHeader = ({
  isLive,
  change,
  percentChange,
  toggleLive,
  selectedTimeframe,
  setSelectedTimeframe,
  timeframes,
  onSelectIndicator,
  isIndicatorsModalOpen,
  setIsIndicatorsModalOpen,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const tooltipText = isLive ? "Pause Live Data" : "Resume Live Data";

  return (
    <div className="absolute top-0 left-0 right-0 h-12 z-20 bg-gradient-to-b from-slate-900/95 to-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
      <div className="flex items-center justify-between px-3 h-full">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold">
              N50
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100">NIFTY 50</h1>
              <p
                className={
                  change > 0 ? "text-green-500 text-xs" : "text-red-500 text-xs"
                }
              >
                {change > 0 ? "+" : ""} {change} ({percentChange}%)
              </p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={toggleLive}
              className="p-1.5 rounded-md text-slate-300 hover:bg-slate-700/50 transition-colors"
              onMouseEnter={() => setIsTooltipVisible(true)}
              onMouseLeave={() => setIsTooltipVisible(false)}
            >
              {isLive ? (
                <Pause size={18} className="text-red-500" />
              ) : (
                <Play size={18} className="text-green-500" />
              )}
            </button>
            {isTooltipVisible && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-slate-700 text-slate-200 text-xs rounded shadow-lg whitespace-nowrap">
                {tooltipText}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <TimeframeSelector
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            timeframes={timeframes}
          />
          <button
            onClick={() => setIsIndicatorsModalOpen(true)}
            className="p-1.5 rounded-md text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center space-x-1"
          >
            <BarChart3 size={18} />
            <span className="text-sm hidden sm:inline">Indicators</span>
          </button>
          <button className="p-1.5 rounded-md text-slate-300 hover:bg-slate-700/50 transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </div>

      <IndicatorsModal
        isOpen={isIndicatorsModalOpen}
        onClose={() => setIsIndicatorsModalOpen(false)}
        onSelectIndicator={onSelectIndicator}
      />
    </div>
  );
};

export default ChartHeader;
