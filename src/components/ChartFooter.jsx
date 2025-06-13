import React, { useState, useEffect } from "react";
import { Calendar, BarChart3 } from "lucide-react";

const ChartFooter = ({
  periods,
  selectedPeriod,
  onPeriodChange,
  onToggleLive,
  isLive,
}) => {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
      const dateStr = istTime
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          timeZone: "Asia/Kolkata",
        })
        .replace(/\//g, "-");
      const timeStr = istTime.toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Kolkata",
      });
      setCurrentTime(`${dateStr} ${timeStr} +05:30`);
    };

    // Update immediately
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-1">
      <div className="bg-slate-900 border-t border-slate-800 px-4 flex items-center justify-between">
        {periods?.map((period) => (
          <button
            key={period.value}
            onClick={() => onPeriodChange(period.value)}
            className={`px-2 py-1 text-sm font-medium rounded-md transition-colors ${
              selectedPeriod === period.value
                ? "bg-indigo-500 text-white"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-3 text-slate-400">
        <button className="p-1 rounded-full hover:bg-slate-700/60 transition-colors">
          <Calendar className="w-4 h-4" />
        </button>
        <button className="p-1 rounded-full hover:bg-slate-700/60 transition-colors">
          <BarChart3 className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-500 font-mono w-[200px]">
          {currentTime}
        </span>
        <span className="text-xs text-slate-500">% log auto</span>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={onToggleLive}
          className={`px-3 py-1 text-sm rounded ${
            isLive
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          } text-white transition-colors`}
        >
          {isLive ? "Stop" : "Start"}
        </button>
      </div>
    </div>
  );
};

export default ChartFooter;
