import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import { useLiveData } from "./hooks/useLiveData";
import ChartHeader from "./components/ChartHeader";
import ChartFooter from "./components/ChartFooter";
import IndicatorChips from "./components/IndicatorChips";
import { useIndicators } from "./context/IndicatorsContext";
import IndicatorConfig from "./components/IndicatorConfig";
import { calculateSMA } from "./utils/indicators";

const Chart = React.memo(
  ({
    className = "w-full h-[600px]",
    chartOptions = {},
    candleSeriesOptions = {},
    symbol = "NIFTY 50",
    timeframe = "1m",
    period = 100,
  }) => {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef({ main: null, indicators: new Map() });
    const resizeObserverRef = useRef(null);
    const isInitialized = useRef(false);
    const initCountRef = useRef(0);
    const [configModalOpen, setConfigModalOpen] = useState(false);
    const [selectedIndicator, setSelectedIndicator] = useState(null);
    const [selectedTimeframe, setSelectedTimeframe] = useState(timeframe);
    const [selectedPeriod, setSelectedPeriod] = useState("1d");
    const [currentPrice, setCurrentPrice] = useState("0.00");
    const [change, setChange] = useState("0.00");
    const [percentChange, setPercentChange] = useState("0.00");
    const [smaValue, setSmaValue] = useState("0.00");
    const timeDisplayRef = useRef(null);

    const { data, isLive, toggleLive, lastPrice } = useLiveData(
      symbol,
      timeframe,
      period
    );
    const { selectedIndicators, addIndicator, removeIndicator } =
      useIndicators();

    // Memoize static data
    const timeframes = useMemo(
      () => [
        { label: "1m", value: "1m" },
        { label: "5m", value: "5m" },
        { label: "15m", value: "15m" },
        { label: "30m", value: "30m" },
        { label: "1h", value: "1h" },
        { label: "4h", value: "4h" },
        { label: "1d", value: "1d" },
      ],
      []
    );

    const periods = useMemo(
      () => [
        { value: "1d", label: "1D" },
        { value: "1w", label: "1W" },
        { value: "1m", label: "1M" },
        { value: "3m", label: "3M" },
        { value: "6m", label: "6M" },
        { value: "1y", label: "1Y" },
        { value: "all", label: "All" },
      ],
      []
    );

    // Memoize chart options
    const memoizedChartOptions = useMemo(
      () => ({
        layout: {
          background: { color: "#1e293b" },
          textColor: "#d1d5db",
        },
        grid: {
          vertLines: { color: "#334155" },
          horzLines: { color: "#334155" },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: "#4b5563",
            style: 0,
          },
          horzLine: {
            width: 1,
            color: "#4b5563",
            style: 0,
          },
        },
        timeScale: {
          borderColor: "#334155",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: "#334155",
        },
        ...chartOptions,
      }),
      [chartOptions]
    );

    // Initialize chart
    useEffect(() => {
      initCountRef.current += 1;
      console.log(`Chart initialization #${initCountRef.current}`, {
        isInitialized: !!chartRef.current,
        hasContainer: !!containerRef.current,
        dataLength: data?.length,
      });

      if (!containerRef.current || chartRef.current) {
        console.log("Skipping chart initialization", {
          hasContainer: !!containerRef.current,
          hasChart: !!chartRef.current,
        });
        return;
      }

      console.log("Creating new chart instance");
      const chart = createChart(containerRef.current, {
        layout: {
          background: { color: "#1e293b" },
          textColor: "#d1d5db",
        },
        grid: {
          vertLines: { color: "#334155" },
          horzLines: { color: "#334155" },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            width: 1,
            color: "#4b5563",
            style: 0,
          },
          horzLine: {
            width: 1,
            color: "#4b5563",
            style: 0,
          },
        },
        timeScale: {
          borderColor: "#334155",
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: "#334155",
        },
      });
      chartRef.current = chart;

      // Create main series
      const mainSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderVisible: false,
        wickUpColor: "#26a69a",
        wickDownColor: "#ef5350",
      });
      seriesRef.current.main = mainSeries;

      // Create time display
      const timeDisplay = document.createElement("div");
      timeDisplay.style.position = "absolute";
      timeDisplay.style.top = "10px";
      timeDisplay.style.right = "10px";
      timeDisplay.style.color = "#d1d5db";
      timeDisplay.style.fontSize = "12px";
      timeDisplay.style.fontFamily = "monospace";
      timeDisplay.style.zIndex = "1";
      containerRef.current.appendChild(timeDisplay);
      timeDisplayRef.current = timeDisplay;

      // Handle resize
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0] && chartRef.current) {
          const { width, height } = entries[0].contentRect;
          chartRef.current.applyOptions({ width, height });
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        console.log("Cleaning up chart instance");
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        if (timeDisplayRef.current) {
          timeDisplayRef.current.remove();
          timeDisplayRef.current = null;
        }
        resizeObserver.disconnect();
      };
    }, []); // Empty dependency array - only run once

    // Update time display
    useEffect(() => {
      if (!timeDisplayRef.current) return;

      const updateTime = () => {
        const now = new Date();
        // Convert to IST (UTC+5:30)
        const istTime = new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
        const timeStr = istTime.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Kolkata",
        });
        timeDisplayRef.current.textContent = `${timeStr} (IST)`;
      };

      // Update immediately
      updateTime();

      // Update every second
      const interval = setInterval(updateTime, 1000);

      return () => clearInterval(interval);
    }, []);

    // Set initial data
    useEffect(() => {
      if (!chartRef.current || !data?.length || !seriesRef.current.main) return;

      console.log("Updating chart data", {
        dataLength: data.length,
        lastCandle: data[data.length - 1],
      });

      const candleData = data.map((candle) => ({
        time: candle.time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

      // Only fit content on initial data load
      const isInitialLoad = !seriesRef.current.main.data().length;
      seriesRef.current.main.setData(candleData);

      if (isInitialLoad) {
        console.log("Fitting content on initial load");
        chartRef.current.timeScale().fitContent();
      }
    }, [data]); // Only depend on data

    // Update LTP
    useEffect(() => {
      if (!lastPrice || !data?.length) return;

      console.log("Updating LTP", {
        lastPrice,
        lastCandle: data[data.length - 1],
      });

      const lastCandle = data[data.length - 1];
      const priceChange = lastPrice - lastCandle.open;
      const percentChange = (priceChange / lastCandle.open) * 100;

      setCurrentPrice(lastPrice.toFixed(2));
      setChange(priceChange.toFixed(2));
      setPercentChange(percentChange.toFixed(2));
    }, [lastPrice, data]); // Only depend on lastPrice and data

    // Handle indicator series creation/removal
    useEffect(() => {
      if (!chartRef.current || !isInitialized.current || !data) {
        return;
      }

      selectedIndicators.forEach((indicator) => {
        if (seriesRef.current.indicators.has(indicator.id)) {
          const series = seriesRef.current.indicators.get(indicator.id);
          if (indicator.type === "sma") {
            const smaData = calculateSMA(data, indicator.period || 9);
            series.setData(
              smaData.map((point) => ({
                time: point.time,
                value: point.value,
              }))
            );
          }
          return;
        }

        let series;
        if (indicator.type === "sma") {
          const smaData = calculateSMA(data, indicator.period || 9);
          series = chartRef.current.addSeries(LineSeries, {
            color: indicator.color || "#3b82f6",
            lineWidth: 2,
            title: `SMA ${indicator.period || 9}`,
          });
          series.setData(
            smaData.map((point) => ({
              time: point.time,
              value: point.value,
            }))
          );
        }

        if (series) {
          seriesRef.current.indicators.set(indicator.id, series);
        }
      });

      // Remove indicators that are no longer selected
      seriesRef.current.indicators.forEach((series, id) => {
        if (!selectedIndicators.find((ind) => ind.id === id)) {
          chartRef.current.removeSeries(series);
          seriesRef.current.indicators.delete(id);
        }
      });
    }, [data, selectedIndicators]);

    const handleConfigChange = useCallback(() => {
      // Handle indicator configuration changes
    }, []);

    return (
      <div className={className}>
        <ChartHeader
          isLive={isLive}
          currentPrice={currentPrice}
          change={change}
          percentChange={percentChange}
          smaValue={smaValue}
          toggleLive={toggleLive}
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          timeframes={timeframes}
          onSelectIndicator={addIndicator}
        />
        <div ref={containerRef} className="w-full h-full" />
        <ChartFooter
          timeframes={timeframes}
          selectedTimeframe={selectedTimeframe}
          onTimeframeChange={setSelectedTimeframe}
          periods={periods}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <IndicatorChips
          indicators={selectedIndicators}
          onRemoveIndicator={removeIndicator}
        />
        {configModalOpen && selectedIndicator && (
          <IndicatorConfig
            indicator={selectedIndicator}
            onConfigChange={handleConfigChange}
            onClose={() => {
              setConfigModalOpen(false);
              setSelectedIndicator(null);
            }}
          />
        )}
      </div>
    );
  }
);

Chart.displayName = "Chart";

export default Chart;
