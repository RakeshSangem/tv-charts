import { createContext, useContext, useState } from "react";

const IndicatorsContext = createContext();

export const useIndicators = () => {
  const context = useContext(IndicatorsContext);
  if (!context) {
    throw new Error("useIndicators must be used within an IndicatorsProvider");
  }
  return context;
};

export const IndicatorsProvider = ({ children }) => {
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  const addIndicator = (indicator) => {
    const defaultConfig = {
      sma: { period: 20, color: "#2962FF" },
      ema: { period: 20, color: "#FF6B6B" },
      bollinger: { period: 20, stdDev: 2, color: "#26a69a" },
      macd: {
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        color: "#2962FF",
      },
      rsi: { period: 14, color: "#2962FF" },
      stochastic: { period: 14, smoothK: 3, smoothD: 3, color: "#2962FF" },
    };

    setSelectedIndicators((prev) => [
      ...prev,
      {
        ...indicator,
        config: {
          ...defaultConfig[indicator.id],
          ...indicator.config,
        },
      },
    ]);
  };

  const removeIndicator = (id) => {
    setSelectedIndicators((prev) => prev.filter((ind) => ind.id !== id));
  };

  const updateIndicatorConfig = (id, config) => {
    setSelectedIndicators((prev) =>
      prev.map((ind) => (ind.id === id ? { ...ind, config } : ind))
    );
  };

  return (
    <IndicatorsContext.Provider
      value={{
        selectedIndicators,
        addIndicator,
        removeIndicator,
        updateIndicatorConfig,
        setSelectedIndicators,
      }}
    >
      {children}
    </IndicatorsContext.Provider>
  );
};
