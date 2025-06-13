import "./App.css";
import Chart from "./Chart";
import { useState } from "react";
import { IndicatorsProvider } from "./context/IndicatorsContext";

function App() {
  const [showAdditionalPane, setShowAdditionalPane] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");

  const toggleAdditionalPane = () => setShowAdditionalPane((prev) => !prev);

  return (
    <IndicatorsProvider>
      <div className="min-h-screen bg-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={toggleAdditionalPane}
            className="mb-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg"
          >
            {showAdditionalPane ? "Remove Pane" : "Add Pane"}
          </button>
          <div className="bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <Chart
              symbol="NIFTY 50"
              timeframe={selectedTimeframe}
              period={100}
            />
          </div>
        </div>
      </div>
    </IndicatorsProvider>
  );
}

export default App;
