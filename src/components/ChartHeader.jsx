import React from "react";
import {
  Play,
  Pause,
  Settings,
  BarChart3,
  TrendingUp,
  Calendar,
  Maximize2,
  Download,
} from "lucide-react";

const ChartHeader = ({
  isLive,
  currentPrice,
  change,
  percentChange,
  smaValue,
  toggleLive,
  selectedTimeframe,
  setSelectedTimeframe,
  timeframes,
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-900/95 to-slate-900/50 backdrop-blur-lg border-b border-slate-700/50 pb-3">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-100">NIFTY 50</h1>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-md text-xs font-medium">
                  NSE
                </span>
                {isLive && (
                  <div className="flex items-center space-x-2 text-sm">
                    <span
                      className={`text-xl font-bold ${isPositive ? "text-green-400" : isNegative ? "text-red-400" : "text-slate-300"}`}
                    >
                      {currentPrice}
                    </span>
                    <span
                      className={`text-sm ${isPositive ? "text-green-300" : isNegative ? "text-red-300" : "text-slate-400"}`}
                    >
                      {change} (
                      <span className="font-medium">{percentChange}%</span>)
                    </span>
                  </div>
                )}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                MA 9 close 0 SMA 9{" "}
                <span className="text-blue-400 font-medium">{smaValue}</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1 p-1 bg-slate-800/70 rounded-lg border border-slate-700/70">
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setSelectedTimeframe(tf.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${tf.value === selectedTimeframe ? "bg-indigo-600 text-white shadow-sm" : "text-slate-300 hover:bg-slate-700 active:bg-slate-700/80"}`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="p-2 rounded-full text-slate-400 hover:bg-slate-700/60 transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full text-slate-400 hover:bg-slate-700/60 transition-colors">
            <Maximize2 className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full text-slate-400 hover:bg-slate-700/60 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={toggleLive}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md ${isLive ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}`}
          >
            {isLive ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            <span>{isLive ? "Stop Live" : "Start Live"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartHeader;
