import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  LineType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import { calculateIndicator, calculateMACD } from "./utils/indicators";
import { useLiveData } from "./hooks/useLiveData";
import Modal from "./components/Modal";
import ChartHeader from "./components/ChartHeader";
import ChartFooter from "./components/ChartFooter";
import IndicatorChips from "./components/IndicatorChips";
import IndicatorsModal from "./components/IndicatorsModal";

function getRandomColor() {
  const colors = [
    "#2962ff",
    "#00c853",
    "#ff6d00",
    "#d500f9",
    "#ffd600",
    "#00b8d4",
    "#ff1744",
    "#3d5afe",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

const Chart = React.memo(({ symbol = "NIFTY 50" }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const seriesMap = useRef(new Map());
  const panesRef = useRef({});
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [isIndicatorsModalOpen, setIsIndicatorsModalOpen] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
  const [timeframes] = useState([
    { value: "1m", label: "1m" },
    { value: "5m", label: "5m" },
    { value: "15m", label: "15m" },
    { value: "30m", label: "30m" },
    { value: "1h", label: "1h" },
    { value: "4h", label: "4h" },
    { value: "1d", label: "1d" },
  ]);

  const { data, isLive, toggleLive } = useLiveData(selectedTimeframe, symbol);

  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
  };

  const handleToggleLive = () => {
    toggleLive();
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: "#1e293b" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#334155" },
        horzLines: { color: "#334155" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      timeScale: {
        borderColor: "#334155",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Create main candlestick series in the default pane (0)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderVisible: false,
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = candleSeries;

    // Handle resize
    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;
      const { width, height } =
        chartContainerRef.current.getBoundingClientRect();
      chartRef.current.applyOptions({
        width,
        height,
      });

      // Update pane heights on resize
      const panes = chartRef.current.panes();
      if (panes.length >= 2) {
        panes[0].setHeight(height * 0.7); // Main chart takes 70%
        panes[1].setHeight(height * 0.3); // MACD takes 30%
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Handle indicator selection
  const handleIndicatorSelect = (indicator) => {
    if (
      !chartRef.current ||
      !data ||
      !Array.isArray(data) ||
      data.length === 0
    ) {
      console.warn("Cannot add indicator: Chart or data not ready");
      return;
    }

    try {
      const indicatorKey = `${indicator.id}-${indicator.period || indicator.defaultPeriod || ""}`;

      // Check if indicator already exists
      if (
        selectedIndicators.some(
          (i) => `${i.id}-${i.period || i.defaultPeriod || ""}` === indicatorKey
        )
      ) {
        return;
      }

      // Add to selected indicators
      setSelectedIndicators((prev) => [
        ...prev,
        { ...indicator, key: indicatorKey },
      ]);

      // Handle MACD separately
      if (indicator.id === "macd") {
        if (!panesRef.current) {
          panesRef.current = {};
        }

        if (!panesRef.current[indicatorKey]) {
          // Create MACD line in pane 1
          const macdLineSeries = chartRef.current.addSeries(
            LineSeries,
            {
              color: "#6366f1",
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              title: "MACD",
            },
            1
          );

          const signalSeries = chartRef.current.addSeries(
            LineSeries,
            {
              color: "#f59e0b",
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
              title: "Signal",
            },
            1
          );

          const histogramSeries = chartRef.current.addSeries(
            HistogramSeries,
            {
              color: "#26a69a",
              priceLineVisible: false,
              lastValueVisible: false,
              title: "Histogram",
            },
            1
          );

          // Store references
          panesRef.current[indicatorKey] = {
            macdLine: macdLineSeries,
            signal: signalSeries,
            histogram: histogramSeries,
          };

          // Calculate MACD data
          const macdData = calculateMACD(data, 12, 26, 9);

          if (
            macdData &&
            macdData.macd &&
            macdData.signal &&
            macdData.histogram
          ) {
            // Filter out any NaN values
            const filteredMacd = macdData.macd.filter(
              (item) => !isNaN(item.value)
            );
            const filteredSignal = macdData.signal.filter(
              (item) => !isNaN(item.value)
            );
            const filteredHistogram = macdData.histogram.filter(
              (item) => !isNaN(item.value)
            );

            // Set data
            macdLineSeries.setData(filteredMacd);
            signalSeries.setData(filteredSignal);
            histogramSeries.setData(filteredHistogram);

            // Configure MACD pane price scale
            const panes = chartRef.current.panes();
            if (panes.length >= 2) {
              const macdPane = panes[1];
              macdPane.priceScale().applyOptions({
                autoScale: true,
                mode: 0,
                visible: true,
                alignLabels: true,
                borderVisible: false,
              });
            }
          }
        }
      } else {
        // Handle other indicators
        const series = chartRef.current.addSeries(LineSeries, {
          color: getRandomColor(),
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        seriesMap.current.set(indicatorKey, series);

        const indicatorData = calculateIndicator(data, indicator);
        if (indicatorData) {
          series.setData(indicatorData);
        }
      }
    } catch (error) {
      console.error("Error handling indicators:", error);
    }
  };

  // Handle indicator removal
  const handleRemoveIndicator = (indicatorKey) => {
    try {
      if (!chartRef.current) return;

      // Remove from selected indicators
      setSelectedIndicators((prev) =>
        prev.filter((i) => i.key !== indicatorKey)
      );

      // Handle MACD removal
      if (panesRef.current && panesRef.current[indicatorKey]) {
        const macdSeries = panesRef.current[indicatorKey];
        if (macdSeries.macdLine) {
          chartRef.current.removeSeries(macdSeries.macdLine);
        }
        if (macdSeries.signal) {
          chartRef.current.removeSeries(macdSeries.signal);
        }
        if (macdSeries.histogram) {
          chartRef.current.removeSeries(macdSeries.histogram);
        }
        delete panesRef.current[indicatorKey];
      } else {
        // Remove other indicators
        const series = seriesMap.current.get(indicatorKey);
        if (series) {
          chartRef.current.removeSeries(series);
          seriesMap.current.delete(indicatorKey);
        }
      }
    } catch (error) {
      console.error("Error removing indicator:", error);
    }
  };

  // Update chart data
  useEffect(() => {
    if (!chartRef.current || !Array.isArray(data)) {
      console.warn("Cannot update chart: Chart or data not ready");
      return;
    }

    try {
      // Update candlestick series
      if (!seriesRef.current) {
        seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderVisible: false,
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
        });
      }

      seriesRef.current.setData(data);

      // Update indicators
      selectedIndicators.forEach((indicator) => {
        const indicatorKey = `${indicator.id}-${indicator.period || indicator.defaultPeriod || ""}`;

        if (indicator.id === "macd") {
          const macdData = calculateMACD(data, 12, 26, 9);
          if (macdData && panesRef.current[indicatorKey]) {
            const pane = panesRef.current[indicatorKey];
            if (pane.macdLine && macdData.macd) {
              const filteredMacd = macdData.macd.filter(
                (item) => !isNaN(item.value)
              );
              pane.macdLine.setData(filteredMacd);
            }
            if (pane.signal && macdData.signal) {
              const filteredSignal = macdData.signal.filter(
                (item) => !isNaN(item.value)
              );
              pane.signal.setData(filteredSignal);
            }
            if (pane.histogram && macdData.histogram) {
              const filteredHistogram = macdData.histogram.filter(
                (item) => !isNaN(item.value)
              );
              pane.histogram.setData(filteredHistogram);
            }
          }
        } else {
          const series = seriesMap.current.get(indicatorKey);
          if (series) {
            const indicatorData = calculateIndicator(data, indicator);
            if (indicatorData) {
              series.setData(indicatorData);
            }
          }
        }
      });
    } catch (error) {
      console.error("Error updating chart data:", error);
    }
  }, [data, selectedIndicators]);

  const handleConfigChange = useCallback(
    (config) => {
      if (!selectedIndicators.length) return;

      // Update the indicator configuration
      const updatedIndicators = selectedIndicators.map((ind) =>
        ind.id === config.id ? { ...ind, config } : ind
      );
      setSelectedIndicators(updatedIndicators);
    },
    [selectedIndicators, setSelectedIndicators]
  );

  return (
    <div className="relative" style={{ height: "600px" }}>
      <div ref={chartContainerRef} className="w-full h-full" />
      <ChartHeader
        symbol={symbol}
        timeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
        timeframes={timeframes}
        onSelectIndicator={handleIndicatorSelect}
        isIndicatorsModalOpen={isIndicatorsModalOpen}
        setIsIndicatorsModalOpen={setIsIndicatorsModalOpen}
        isLive={isLive}
        toggleLive={handleToggleLive}
      />
      <ChartFooter
        timeframes={timeframes}
        selectedTimeframe={selectedTimeframe}
        onTimeframeChange={handleTimeframeChange}
        isLive={isLive}
        onToggleLive={handleToggleLive}
      />
      <IndicatorChips
        indicators={selectedIndicators}
        onRemoveIndicator={handleRemoveIndicator}
        onConfigClick={handleConfigChange}
      />
    </div>
  );
});

Chart.displayName = "Chart";

export default Chart;
