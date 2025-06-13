import { useState } from "react";

const IndicatorConfig = ({ indicator, onConfigChange, onClose }) => {
  const [config, setConfig] = useState(indicator.config || {});

  const handleChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const renderConfigFields = () => {
    switch (indicator.id) {
      case "sma":
      case "ema":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Period
              <input
                type="number"
                min="1"
                value={config.period || 20}
                onChange={(e) =>
                  handleChange("period", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        );

      case "bollinger":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Period
              <input
                type="number"
                min="1"
                value={config.period || 20}
                onChange={(e) =>
                  handleChange("period", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Standard Deviation
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={config.stdDev || 2}
                onChange={(e) =>
                  handleChange("stdDev", parseFloat(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        );

      case "macd":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Fast Period
              <input
                type="number"
                min="1"
                value={config.fastPeriod || 12}
                onChange={(e) =>
                  handleChange("fastPeriod", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Slow Period
              <input
                type="number"
                min="1"
                value={config.slowPeriod || 26}
                onChange={(e) =>
                  handleChange("slowPeriod", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Signal Period
              <input
                type="number"
                min="1"
                value={config.signalPeriod || 9}
                onChange={(e) =>
                  handleChange("signalPeriod", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        );

      case "rsi":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Period
              <input
                type="number"
                min="1"
                value={config.period || 14}
                onChange={(e) =>
                  handleChange("period", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        );

      case "stochastic":
        return (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Period
              <input
                type="number"
                min="1"
                value={config.period || 14}
                onChange={(e) =>
                  handleChange("period", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Smooth K
              <input
                type="number"
                min="1"
                value={config.smoothK || 3}
                onChange={(e) =>
                  handleChange("smoothK", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Smooth D
              <input
                type="number"
                min="1"
                value={config.smoothD || 3}
                onChange={(e) =>
                  handleChange("smoothD", parseInt(e.target.value))
                }
                className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-slate-200">
        {indicator.name} Settings
      </h3>
      {renderConfigFields()}
      <div className="flex justify-end space-x-2">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm font-medium text-slate-300 hover:text-slate-200"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfigChange(config);
            onClose();
          }}
          className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default IndicatorConfig;
