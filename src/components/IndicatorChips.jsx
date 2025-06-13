import { X, Settings } from "lucide-react";

const IndicatorChips = ({ indicators, onRemoveIndicator, onConfigClick }) => {
  if (!indicators.length) return null;

  return (
    <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
      {indicators.map((indicator) => (
        <div
          key={indicator.id}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md text-sm text-slate-200"
        >
          <span>{indicator.name}</span>
          <button
            onClick={() => onConfigClick(indicator)}
            className="p-1 hover:text-indigo-400 transition-colors"
            title="Configure indicator"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => onRemoveIndicator(indicator.id)}
            className="p-1 hover:text-red-400 transition-colors"
            title="Remove indicator"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default IndicatorChips;
