import React from "react";
import { Calendar, BarChart3 } from "lucide-react";

const ChartFooter = ({ selectedPeriod, setSelectedPeriod, periods }) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-slate-900/95 to-slate-900/50 backdrop-blur-lg border-t border-slate-700/50 pt-3">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex space-x-1 p-1 bg-slate-800/70 rounded-lg border border-slate-700/70">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                selectedPeriod === p.value
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-700 active:bg-slate-700/80"
              }`}
            >
              {p.label}
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
          <span className="text-xs text-slate-500">14:43:34 (UTC)</span>
          <span className="text-xs text-slate-500">% log auto</span>
        </div>
      </div>
    </div>
  );
};

export default ChartFooter;
