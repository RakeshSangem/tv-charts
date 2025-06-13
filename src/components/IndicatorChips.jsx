import React from "react";
import { Settings } from "lucide-react";
import { Popover } from "@headlessui/react";
import IndicatorConfig from "./IndicatorConfig";

const IndicatorChips = ({ indicators, onRemoveIndicator, onConfigClick }) => {
  if (!indicators || indicators.length === 0) return null;

  const handleRemove = (indicator) => {
    if (typeof onRemoveIndicator === "function") {
      onRemoveIndicator(
        indicator.key || `${indicator.id}-${indicator.config?.period || 9}`
      );
    }
  };

  const handleConfig = (indicator, newConfig) => {
    if (typeof onConfigClick === "function") {
      onConfigClick({ ...indicator, config: newConfig });
    }
  };

  return (
    <div className="absolute top-16 left-4 z-10 flex flex-wrap gap-2">
      {indicators.map((indicator) => (
        <div
          key={`${indicator.id}-${indicator.config?.period || 9}`}
          className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-1.5 rounded-md border border-slate-700/50"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: indicator.config?.color || "#3b82f6" }}
            />
            <span className="text-xs text-slate-200">
              {indicator.id.toUpperCase()} {indicator.config?.period || 9}
            </span>
          </div>
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={`text-slate-400 hover:text-slate-200 transition-colors focus:outline-none ${
                    open ? "text-slate-200" : ""
                  }`}
                  title="Configure indicator"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Popover.Button>
                <Popover.Panel className="absolute z-50 mt-2 w-72 rounded-md bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="p-4">
                    <IndicatorConfig
                      indicator={indicator}
                      onConfigChange={(config) =>
                        handleConfig(indicator, config)
                      }
                      onClose={() => {}}
                    />
                  </div>
                </Popover.Panel>
              </>
            )}
          </Popover>
          <button
            onClick={() => handleRemove(indicator)}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            title="Remove indicator"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

export default IndicatorChips;
