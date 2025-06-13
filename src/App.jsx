import "./App.css";
import Chart from "./Chart";
import { IndicatorsProvider } from "./context/IndicatorsContext";

const App = () => {
  return (
    <IndicatorsProvider>
      <div className="flex flex-col h-screen bg-slate-900">
        <main className="flex-1 overflow-hidden">
          <div className="h-full w-full bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
            <Chart
              className="w-full h-full"
              symbol="NIFTY 50"
              timeframe="1m"
              period={100}
            />
          </div>
        </main>
      </div>
    </IndicatorsProvider>
  );
};

export default App;
