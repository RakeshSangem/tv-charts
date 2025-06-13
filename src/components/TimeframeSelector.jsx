import React from "react";

const TimeframeSelector = ({
  selectedTimeframe,
  onTimeframeChange,
  timeframes,
}) => {
  return (
    <div className="flex items-center space-x-1">
      {timeframes.map((tf) => (
        <button
          key={tf.value}
          onClick={() => onTimeframeChange(tf.value)}
          className={`px-2 py-0.5 rounded text-xs font-medium transition-colors duration-200 ${
            tf.value === selectedTimeframe
              ? "bg-indigo-600 text-white shadow-sm"
              : "text-slate-300 hover:bg-slate-700 active:bg-slate-700/80"
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
};

export default TimeframeSelector;
