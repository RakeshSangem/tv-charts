import "./App.css";
import Chart from "./Chart";
import { useState } from "react";

function App() {
  const [showAdditionalPane, setShowAdditionalPane] = useState(false);

  const toggleAdditionalPane = () => setShowAdditionalPane((prev) => !prev);

  return (
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
            setShowAdditionalPane={showAdditionalPane}
            showMacd={true}
            showIndicator={true}
            chartOptions={{
              layout: {
                textColor: "#e2e8f0",
                background: { color: "#1e293b" },
              },
            }}
            candleSeriesOptions={{
              upColor: "#22c55e",
              downColor: "#ef4444",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
