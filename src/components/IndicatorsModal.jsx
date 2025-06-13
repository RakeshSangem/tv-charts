import { useState, useMemo } from "react";
import { BarChart3 } from "lucide-react";
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

  const filteredIndicators = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return {
      mainChart: INDICATORS.mainChart.filter((indicator) =>
        indicator.name.toLowerCase().includes(query)
      ),
      separatePane: INDICATORS.separatePane.filter((indicator) =>
        indicator.name.toLowerCase().includes(query)
      ),
    };
  }, [searchQuery]);

  const handleSelectIndicator = (indicator) => {
    onSelectIndicator(indicator);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Indicator">
      <div className="space-y-4">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search indicators..."
        />

        <div className="space-y-4">
          {filteredIndicators.mainChart.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Main Chart Indicators
              </h4>
              <div className="space-y-1">
                {filteredIndicators.mainChart.map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => handleSelectIndicator(indicator)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {indicator.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredIndicators.separatePane.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                Separate Pane Indicators
              </h4>
              <div className="space-y-1">
                {filteredIndicators.separatePane.map((indicator) => (
                  <button
                    key={indicator.id}
                    onClick={() => handleSelectIndicator(indicator)}
                    className="w-full text-left px-3 py-2 rounded-md text-sm text-slate-200 hover:bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {indicator.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredIndicators.mainChart.length === 0 &&
            filteredIndicators.separatePane.length === 0 && (
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
