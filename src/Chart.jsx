import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
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
  const [containerSize, setContainerSize] = useState();
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

  // --- MACD Legend State ---
  const [macdLegend, setMacdLegend] = useState({
    macd: "--",
    signal: "--",
    histogram: "--",
    time: "",
  });
  const [macdPanePos, setMacdPanePos] = useState({
    top: 0,
    height: 0,
    visible: false,
  });

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

    // Resize observer
    const ro = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ width, height });
        chart.applyOptions({ width, height });
      }
    });
    ro.observe(chartContainerRef.current);

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      ro.disconnect();
    };
  }, []);

  // --- MACD Pane Position Calculation ---
  useEffect(() => {
    if (!containerSize || !chartRef.current) return;

    // Only show MACD legend if MACD is selected
    const macdKey = selectedIndicators.find((i) => i.id === "macd")?.key;
    if (!macdKey || !panesRef.current[macdKey]) {
      setMacdPanePos((pos) => ({ ...pos, visible: false }));
      return;
    }

    // Get pane heights (main + macd)
    const panes = chartRef.current.panes();
    if (panes.length < 2) {
      setMacdPanePos((pos) => ({ ...pos, visible: false }));
      return;
    }
    const mainHeight = panes[0].getHeight();
    const macdHeight = panes[1].getHeight();

    // Position legend just below separator (bottom of main pane)
    setMacdPanePos({
      top: mainHeight,
      height: macdHeight,
      visible: true,
    });
  }, [containerSize, selectedIndicators, panesRef.current]);

  // --- MACD Legend Data Calculation ---
  useEffect(() => {
    if (!chartRef.current) return;

    // Only listen if MACD is present
    const macdKey = selectedIndicators.find((i) => i.id === "macd")?.key;
    if (!macdKey || !panesRef.current[macdKey]) return;

    const macdData = calculateMACD(data, 12, 26, 9);

    // Listen for crosshair moves to update legend
    const chart = chartRef.current;
    const handler = (param) => {
      if (!macdData || !param.time) {
        setMacdLegend({ macd: "--", signal: "--", histogram: "--", time: "" });
        return;
      }
      const idx = macdData.macd.findIndex((d) => d.time === param.time);
      if (idx !== -1) {
        setMacdLegend({
          macd: macdData.macd[idx]?.value?.toFixed(2) ?? "--",
          signal: macdData.signal[idx]?.value?.toFixed(2) ?? "--",
          histogram: macdData.histogram[idx]?.value?.toFixed(2) ?? "--",
          time: new Date(Number(param.time) * 1000).toLocaleDateString(),
        });
      }
    };
    chart.subscribeCrosshairMove(handler);

    return () => chart.unsubscribeCrosshairMove(handler);
  }, [data, selectedIndicators, panesRef.current]);

  // Indicator selection, removal, and update logic remains unchanged...
  // --- (the rest of your code, unchanged, below) ---

  const handleIndicatorSelect = (indicator) => {
    if (!chartRef.current || !Array.isArray(data) || data.length === 0) {
      console.warn("Cannot add indicator: Chart or data not ready");
      return;
    }

    const indicatorKey = `${indicator.id}-${indicator.period || indicator.defaultPeriod || ""}`;

    // Avoid duplicates
    if (selectedIndicators.some((i) => i.key === indicatorKey)) return;

    setSelectedIndicators((prev) => [
      ...prev,
      { ...indicator, key: indicatorKey },
    ]);

    if (indicator.id === "macd") {
      // Create paneIndex based on existing panes in panesRef
      if (!panesRef.current[indicatorKey]) {
        const paneIndex = Object.keys(panesRef.current).length + 1;

        const macdLine = chartRef.current.addSeries(
          LineSeries,
          {
            color: "#6366f1",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            title: "MACD",
          },
          paneIndex
        );

        const signal = chartRef.current.addSeries(
          LineSeries,
          {
            color: "#f59e0b",
            lineWidth: 1,
            priceLineVisible: false,
            lastValueVisible: false,
            title: "Signal",
          },
          paneIndex
        );

        const histogram = chartRef.current.addSeries(
          HistogramSeries,
          {
            color: "#26a69a",
            priceLineVisible: false,
            lastValueVisible: false,
            title: "Histogram",
          },
          paneIndex
        );

        panesRef.current[indicatorKey] = {
          paneIndex,
          macdLine,
          signal,
          histogram,
        };

        const macdData = calculateMACD(data, 12, 26, 9);
        if (macdData?.macd && macdData?.signal && macdData?.histogram) {
          macdLine.setData(macdData.macd.filter((p) => !isNaN(p.value)));
          signal.setData(macdData.signal.filter((p) => !isNaN(p.value)));
          histogram.setData(macdData.histogram.filter((p) => !isNaN(p.value)));
        }
      }
    } else {
      const series = chartRef.current.addSeries(LineSeries, {
        color: getRandomColor(),
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
      });
      seriesMap.current.set(indicatorKey, series);
      const indicatorData = calculateIndicator(data, indicator);
      if (indicatorData) series.setData(indicatorData);
    }
  };

  const handleRemoveIndicator = (indicatorKey) => {
    try {
      if (!chartRef.current) return;

      setSelectedIndicators((prev) =>
        prev.filter((i) => i.key !== indicatorKey)
      );

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

  useEffect(() => {
    if (!chartRef.current || !Array.isArray(data)) {
      console.warn("Cannot update chart: Chart or data not ready");
      return;
    }

    try {
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

      const updatedIndicators = selectedIndicators.map((ind) =>
        ind.id === config.id ? { ...ind, config } : ind
      );
      setSelectedIndicators(updatedIndicators);
    },
    [selectedIndicators, setSelectedIndicators]
  );

  return (
    <div className="relative" style={{ height: "600px", position: "relative" }}>
      <div ref={chartContainerRef} className="w-full h-full" />
      {/* --- MACD LEGEND: Absolute, below main pane, only when MACD is active --- */}
      {macdPanePos.visible && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: macdPanePos.top + 2, // 2px below the separator line
            width: "100%",
            background: "rgba(30, 41, 59, 0.97)",
            border: "1px solid #334155",
            borderRadius: 4,
            padding: "5px 20px",
            fontFamily: "monospace",
            fontSize: 15,
            color: "#d1d5db",
            zIndex: 10,
            pointerEvents: "none",
            boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          }}
        >
          <strong>MACD</strong>
          {"  "}
          MACD: <span style={{ color: "#6366f1" }}>{macdLegend.macd}</span>
          {"  "}Signal:{" "}
          <span style={{ color: "#f59e0b" }}>{macdLegend.signal}</span>
          {"  "}Hist:{" "}
          <span style={{ color: "#26a69a" }}>{macdLegend.histogram}</span>
          {"  "}({macdLegend.time})
        </div>
      )}
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
