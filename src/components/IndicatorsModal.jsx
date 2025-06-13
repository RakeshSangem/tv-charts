import { useState, useMemo } from "react";
import { BarChart3, X } from "lucide-react";
import Modal from "./Modal";
import SearchInput from "./SearchInput";

const INDICATORS = {
  mainChart: [
    {
      id: "sma",
      name: "Simple Moving Average",
      type: "mainChart",
      defaultPeriod: 20,
    },
    {
      id: "ema",
      name: "Exponential Moving Average",
      type: "mainChart",
      defaultPeriod: 20,
    },
    {
      id: "bollinger",
      name: "Bollinger Bands",
      type: "mainChart",
      defaultPeriod: 20,
    },
    { id: "vwap", name: "Volume Weighted Average Price", type: "mainChart" },
  ],
  separatePane: [
    { id: "macd", name: "MACD", type: "separatePane" },
    {
      id: "rsi",
      name: "Relative Strength Index",
      type: "separatePane",
      defaultPeriod: 14,
    },
    { id: "volume", name: "Volume", type: "separatePane" },
    { id: "stochastic", name: "Stochastic Oscillator", type: "separatePane" },
  ],
};

const IndicatorsModal = ({ isOpen, onClose, onSelectIndicator }) => {
  const [searchQuery, setSearchQuery] = useState("");

  const allIndicators = useMemo(() => {
    return [...INDICATORS.mainChart, ...INDICATORS.separatePane];
  }, []);

  const filteredIndicators = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allIndicators.filter((indicator) =>
      indicator.name.toLowerCase().includes(query)
    );
  }, [searchQuery, allIndicators]);

  const handleSelectIndicator = (indicator) => {
    onSelectIndicator(indicator);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <h2 className="text-lg font-medium leading-6 text-slate-100">
            Indicators
          </h2>
          <button
            type="button"
            className="rounded-md text-slate-400 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 border-b border-slate-700">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search"
            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Indicator List */}
        <div className="overflow-y-auto pt-2 pb-4">
          {filteredIndicators.length > 0 ? (
            <>
              <h4 className="text-xs text-slate-400 uppercase px-4 mb-1 tracking-wider font-semibold">
                Script Name
              </h4>
              <div className="space-y-0.5">
                {filteredIndicators.map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => handleSelectIndicator(indicator)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {indicator.name}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-4 text-slate-400">
              No indicators found
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default IndicatorsModal;
