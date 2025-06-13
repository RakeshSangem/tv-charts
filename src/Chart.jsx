import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";

const generateDummyData = (numEntries) => {
  const candles = [];
  const macd = [];
  const signal = [];
  const histogram = [];

  let lastClose = 100;
  let lastMacd = 0;
  let lastSignal = 0;
  const startDate = new Date("2025-06-01T00:00:00Z");

  for (let i = 0; i < numEntries; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const time = date.toISOString().split("T")[0]; // YYYY-MM-DD

    // Candlestick data
    const open = lastClose;
    const close = open + (Math.random() * 10 - 5);
    const high = Math.max(open, close) + Math.random() * 3;
    const low = Math.min(open, close) - Math.random() * 3;
    candles.push({ time, open, high, low, close });
    lastClose = close;

    // MACD data
    const currentMacd = lastMacd + (Math.random() * 0.4 - 0.2);
    const currentSignal = lastSignal + (Math.random() * 0.3 - 0.15);
    const histValue = currentMacd - currentSignal;

    macd.push({ time, value: currentMacd });
    signal.push({ time, value: currentSignal });

    // Histogram coloring
    const histColor =
      histValue >= 0
        ? histValue > 0.1
          ? "#26a69a"
          : "#83e2ba"
        : histValue < -0.1
          ? "#ef5350"
          : "#ff6b6b";

    histogram.push({ time, value: histValue, color: histColor });

    lastMacd = currentMacd;
    lastSignal = currentSignal;
  }

  return { candles, macd, signal, histogram };
};

const Chart = ({ className = "w-full h-[450px]" }) => {
  const ref = useRef(null);
  const data = useRef(generateDummyData(100)).current;

  useEffect(() => {
    if (!ref.current) return;

    const chart = createChart(ref.current, {
      layout: {
        background: { color: "#fff" },
        textColor: "#333",
      },
      width: ref.current.clientWidth,
      height: ref.current.clientHeight,
      crosshair: {
        mode: 1,
        vertLine: {
          labelBackgroundColor: "#2962FF",
        },
        horzLine: {
          labelBackgroundColor: "#2962FF",
        },
      },
      grid: {
        vertLines: { color: "#f0f0f0" },
        horzLines: { color: "#f0f0f0" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create main candlestick series in the default pane (0)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderVisible: false,
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });
    candleSeries.setData(data.candles);

    // Create MACD line in pane 1
    const macdLine = chart.addSeries(
      LineSeries,
      {
        color: "#2962FF",
        lineWidth: 1,
      },
      1
    );
    macdLine.setData(data.macd);

    // Signal line in pane 1
    const signalLine = chart.addSeries(
      LineSeries,
      {
        color: "#FF6D00",
        lineWidth: 1,
      },
      1
    );
    signalLine.setData(data.signal);

    // Histogram in pane 1
    const histSeries = chart.addSeries(
      HistogramSeries,
      {
        priceFormat: { type: "volume" },
      },
      1
    );
    histSeries.setData(data.histogram);

    // Set initial heights for panes
    requestAnimationFrame(() => {
      const panes = chart.panes();
      if (panes.length >= 2) {
        const mainPane = panes[0];
        const macdPane = panes[1];

        // Set initial heights - main pane takes 70% of the height
        const totalHeight = ref.current.clientHeight;
        mainPane.setHeight(totalHeight * 0.7);
        macdPane.setHeight(totalHeight * 0.3);

        // Configure price scales
        mainPane.priceScale().applyOptions({
          autoScale: true,
          mode: 0,
          visible: true,
          borderVisible: true,
        });

        macdPane.priceScale().applyOptions({
          autoScale: true,
          mode: 0,
          visible: true,
          alignLabels: true,
          borderVisible: false,
        });
      }
    });

    // Handle resize
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0] || !chart) return;
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });

      // Update pane heights on resize
      const panes = chart.panes();
      if (panes.length >= 2) {
        panes[0].setHeight(height * 0.7);
        panes[1].setHeight(height * 0.3);
      }
    });

    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, []); // Empty dependency array since data is a ref

  return <div ref={ref} className={className} />;
};

export default Chart;
