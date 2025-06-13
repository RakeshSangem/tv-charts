import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import { Settings, BarChart3, Calendar, Maximize2 } from "lucide-react";
import { useLiveData } from "./utils/chartData";
import ChartHeader from "./components/ChartHeader";
import ChartFooter from "./components/ChartFooter";

const Chart = React.memo(
  ({
    className = "w-full h-[600px]",
    showMacd = true,
    showIndicator = false,
    chartOptions = {},
    candleSeriesOptions = {},
    macdOptions = {},
    indicatorOptions = {},
  }) => {
    const containerRef = useRef(null);
    const chartRef = useRef(null);
    const seriesRef = useRef({
      candle: null,
      macdLine: null,
      signalLine: null,
      histogram: null,
      indicator: null,
      smaLine: null,
    });
    const resizeObserverRef = useRef(null);
    const chartCreationCount = useRef(0);
    const isInitialized = useRef(false);
    const prevDataRef = useRef();

    const [selectedTimeframe, setSelectedTimeframe] = useState("1m");
    const [selectedPeriod, setSelectedPeriod] = useState("1d");

    const { data, isLive, toggleLive } = useLiveData(100, 5000, 1);

    const timeframes = [
      { label: "1m", value: "1m" },
      { label: "5m", value: "5m" },
      { label: "15m", value: "15m" },
      { label: "1h", value: "1h" },
      { label: "4h", value: "4h" },
      { label: "1d", value: "1d" },
    ];

    const periods = [
      { label: "1D", value: "1d" },
      { label: "5D", value: "5d" },
      { label: "1M", value: "1m" },
      { label: "3M", value: "3m" },
      { label: "1Y", value: "1y" },
      { label: "5Y", value: "5y" },
    ];

    // Memoize chart options with improved styling
    const memoizedChartOptions = useMemo(
      () => ({
        layout: {
          background: { type: "solid", color: "#0a0e27" },
          textColor: "#d1d5db",
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          fontSize: 12,
        },
        grid: {
          vertLines: { color: "rgba(99, 102, 241, 0.1)" },
          horzLines: { color: "rgba(99, 102, 241, 0.1)" },
        },
        timeScale: {
          timeVisible: true,
          secondsVisible: false,
          borderColor: "#374151",
          fixLeftEdge: false,
          fixRightEdge: false,
          lockVisibleTimeRangeOnResize: false,
          rightOffset: 12,
          barSpacing: 8,
          minBarSpacing: 4,
          tickMarkFormatter: (time, tickMarkType, locale) => {
            const date = new Date(time * 1000);
            const istOffset = 5.5 * 60;
            const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
            const istDate = new Date(utc + istOffset * 60 * 1000);

            const options = {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            };

            if (tickMarkType === 0) {
              return istDate.toLocaleTimeString(locale, options);
            } else if (tickMarkType === 1) {
              return (
                istDate.toLocaleDateString(locale, {
                  month: "short",
                  day: "numeric",
                }) +
                " " +
                istDate.toLocaleTimeString(locale, options)
              );
            }
            return istDate.toLocaleTimeString(locale, options);
          },
        },
        crosshair: {
          mode: 1,
          vertLine: {
            labelBackgroundColor: "#6366f1",
            color: "rgba(99, 102, 241, 0.3)",
            labelTextColor: "#ffffff",
            style: 0,
            width: 1,
          },
          horzLine: {
            labelBackgroundColor: "#6366f1",
            labelTextColor: "#ffffff",
            color: "rgba(99, 102, 241, 0.3)",
            style: 0,
            width: 1,
          },
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
          vertMouseDrag: true,
          horzMouseDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
          axisDoubleClickReset: true,
        },
        overlayCrosshair: true,
        ...chartOptions,
      }),
      [chartOptions]
    );

    // Memoize series options with improved styling
    const memoizedSeriesOptions = useMemo(
      () => ({
        candle: {
          upColor: "#22c55e",
          downColor: "#ef4444",
          borderUpColor: "#22c55e",
          borderDownColor: "#ef4444",
          wickUpColor: "#22c55e",
          wickDownColor: "#ef4444",
          priceScaleId: "right",
          priceLineVisible: true,
          lastValueVisible: true,
          priceFormat: {
            type: "price",
            precision: 2,
            minMove: 0.01,
          },
          ...candleSeriesOptions,
        },
        macd: {
          line: {
            color: "#6366f1",
            lineWidth: 2,
            priceScaleId: "macd",
            ...macdOptions.line,
          },
          signal: {
            color: "#f59e0b",
            lineWidth: 2,
            priceScaleId: "macd",
            ...macdOptions.signal,
          },
          histogram: {
            priceFormat: { type: "volume" },
            priceScaleId: "macd",
            ...macdOptions.histogram,
          },
        },
        indicator: {
          color: "#8b5cf6",
          lineWidth: 2,
          priceScaleId: "indicator",
          ...indicatorOptions,
        },
        sma: {
          color: "#06b6d4",
          lineWidth: 2,
          priceScaleId: "right",
        },
      }),
      [candleSeriesOptions, macdOptions, indicatorOptions]
    );

    // Initialize chart only once
    useEffect(() => {
      if (!containerRef.current || isInitialized.current) return;

      const initializeChart = () => {
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            console.warn("Chart cleanup warning:", e);
          }
          chartRef.current = null;
        }

        chartCreationCount.current += 1;

        const chart = createChart(containerRef.current, {
          ...memoizedChartOptions,
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });

        chartRef.current = chart;

        seriesRef.current.candle = chart.addSeries(
          CandlestickSeries,
          memoizedSeriesOptions.candle
        );
        seriesRef.current.candle.setData(data.candles);

        seriesRef.current.smaLine = chart.addSeries(
          LineSeries,
          memoizedSeriesOptions.sma
        );
        seriesRef.current.smaLine.setData(data.sma);

        if (showMacd) {
          seriesRef.current.macdLine = chart.addSeries(
            LineSeries,
            memoizedSeriesOptions.macd.line,
            1
          );
          seriesRef.current.signalLine = chart.addSeries(
            LineSeries,
            memoizedSeriesOptions.macd.signal,
            1
          );
          seriesRef.current.histogram = chart.addSeries(
            HistogramSeries,
            memoizedSeriesOptions.macd.histogram,
            1
          );

          seriesRef.current.macdLine.setData(data.macd);
          seriesRef.current.signalLine.setData(data.signal);
          seriesRef.current.histogram.setData(data.histogram);
        }

        if (showIndicator) {
          const paneIndex = showMacd ? 2 : 1;
          seriesRef.current.indicator = chart.addSeries(
            LineSeries,
            memoizedSeriesOptions.indicator,
            paneIndex
          );
          seriesRef.current.indicator.setData(data.indicators);
        }

        requestAnimationFrame(() => {
          if (!chartRef.current) return;

          const panes = chartRef.current.panes();
          if (panes.length === 1) {
            panes[0].setHeight(chartRef.current.options().height || 600);
          } else if (panes.length === 2) {
            panes[0].setHeight(
              (chartRef.current.options().height || 600) * 0.75
            );
            panes[1].setHeight(
              (chartRef.current.options().height || 600) * 0.25
            );
          } else if (panes.length === 3) {
            panes[0].setHeight(
              (chartRef.current.options().height || 600) * 0.5
            );
            panes[1].setHeight(
              (chartRef.current.options().height || 600) * 0.25
            );
            panes[2].setHeight(
              (chartRef.current.options().height || 600) * 0.25
            );
          }

          panes.forEach((pane, index) => {
            const priceScale = pane.priceScale("right");
            if (priceScale) {
              priceScale.applyOptions({
                autoScale: true,
                mode: 0,
                visible: true,
                borderVisible: true,
                borderColor: "#374151",
                scaleMargins: {
                  top: 0.15,
                  bottom: 0.25,
                },
              });
            }

            if (showMacd && index === 1) {
              const macdScale = pane.priceScale("macd");
              if (macdScale) {
                macdScale.applyOptions({
                  autoScale: true,
                  mode: 0,
                  visible: true,
                  borderVisible: false,
                  scaleMargins: {
                    top: 0.15,
                    bottom: 0.25,
                  },
                });
              }
            }

            if (
              showIndicator &&
              ((showMacd && index === 2) || (!showMacd && index === 1))
            ) {
              const indicatorScale = pane.priceScale("indicator");
              if (indicatorScale) {
                indicatorScale.applyOptions({
                  autoScale: true,
                  mode: 0,
                  visible: true,
                  borderVisible: false,
                  scaleMargins: {
                    top: 0.15,
                    bottom: 0.25,
                  },
                });
              }
            }
          });

          chartRef.current.timeScale().fitContent();
        });

        resizeObserverRef.current = new ResizeObserver((entries) => {
          if (!entries[0] || !chartRef.current) return;
          const { width, height } = entries[0].contentRect;
          chartRef.current.applyOptions({ width, height });

          const panes = chartRef.current.panes();
          if (panes.length === 1) {
            panes[0].setHeight(height);
          } else if (panes.length === 2) {
            const newMainPaneHeight = height * 0.75;
            panes[0].setHeight(newMainPaneHeight);
            panes[1].setHeight(height - newMainPaneHeight);
          } else if (panes.length === 3) {
            const newMainPaneHeight = height * 0.5;
            const newMacdPaneHeight = height * 0.25;
            panes[0].setHeight(newMainPaneHeight);
            panes[1].setHeight(newMacdPaneHeight);
            panes[2].setHeight(height - newMainPaneHeight - newMacdPaneHeight);
          }
        });

        resizeObserverRef.current.observe(containerRef.current);
        isInitialized.current = true;
        prevDataRef.current = data;
      };

      initializeChart();

      return () => {
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }

        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            console.warn("Chart cleanup warning:", e);
          }
          chartRef.current = null;
        }
        isInitialized.current = false;
        prevDataRef.current = undefined;
      };
    }, []);

    // Update data when it changes
    useEffect(() => {
      if (!chartRef.current || !isInitialized.current) return;

      if (prevDataRef.current !== data) {
        const hasNewCandle =
          prevDataRef.current &&
          data.candles.length > 0 &&
          prevDataRef.current.candles.length > 0 &&
          data.candles[data.candles.length - 1].time !==
            prevDataRef.current.candles[prevDataRef.current.candles.length - 1]
              .time;

        if (hasNewCandle) {
          seriesRef.current.candle.setData(data.candles);
          seriesRef.current.smaLine.setData(data.sma);
          if (showMacd) {
            seriesRef.current.macdLine.setData(data.macd);
            seriesRef.current.signalLine.setData(data.signal);
            seriesRef.current.histogram.setData(data.histogram);
          }
          if (showIndicator) {
            seriesRef.current.indicator.setData(data.indicators);
          }
        } else if (data.candles.length > 0) {
          const lastCandle = data.candles[data.candles.length - 1];
          seriesRef.current.candle.update(lastCandle);

          const lastSma = data.sma[data.sma.length - 1];
          if (lastSma) {
            seriesRef.current.smaLine.update(lastSma);
          }

          if (showMacd) {
            const lastMacd = data.macd[data.macd.length - 1];
            const lastSignal = data.signal[data.signal.length - 1];
            const lastHistogram = data.histogram[data.histogram.length - 1];
            seriesRef.current.macdLine.update(lastMacd);
            seriesRef.current.signalLine.update(lastSignal);
            seriesRef.current.histogram.update(lastHistogram);
          }
          if (showIndicator) {
            const lastIndicator = data.indicators[data.indicators.length - 1];
            seriesRef.current.indicator.update(lastIndicator);
          }
        }

        prevDataRef.current = data;
      }
    }, [data, showMacd, showIndicator, isLive]);

    const lastCandle = data.candles[data.candles.length - 1];
    const currentPrice = lastCandle ? lastCandle.close : "N/A";
    const previousClose =
      data.candles.length > 1
        ? data.candles[data.candles.length - 2].close
        : lastCandle
          ? lastCandle.open
          : "N/A";
    const change =
      lastCandle && previousClose !== "N/A"
        ? (currentPrice - previousClose).toFixed(2)
        : "N/A";
    const percentChange =
      lastCandle && previousClose !== "N/A"
        ? ((change / previousClose) * 100).toFixed(2)
        : "N/A";

    // Get the height of the main chart pane to position the MACD title
    const mainChartPaneHeight = chartRef.current
      ? chartRef.current.panes()[0]?.getHeight()
      : 0;
    const macdTitleTopPosition =
      mainChartPaneHeight > 0 ? mainChartPaneHeight + 82 : "calc(75% + 10px)"; // Adjusted for header height (72px) + 10px padding

    return (
      <div
        className={`relative bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-xl border border-slate-700/40 overflow-hidden ${className}`}
      >
        {" "}
        {/* Softened gradient, refined shadow, lighter border */}
        {/* Enhanced Header */}
        <ChartHeader
          isLive={isLive}
          currentPrice={currentPrice}
          change={change}
          percentChange={percentChange}
          smaValue={
            data.sma.length > 0
              ? data.sma[data.sma.length - 1].value.toFixed(2)
              : "N/A"
          }
          toggleLive={toggleLive}
          selectedTimeframe={selectedTimeframe}
          setSelectedTimeframe={setSelectedTimeframe}
          timeframes={timeframes}
        />
        {/* Chart Container */}
        <div ref={containerRef} className="w-full h-full pt-[80px] pb-[56px]" />
        {/* MACD Pane Title */}
        {showMacd && (
          <div
            className="absolute left-4 px-2 py-1 rounded-md text-slate-300 text-xs font-semibold z-10"
            style={{ top: macdTitleTopPosition }}
          >
            MACD 12 26 close 9
          </div>
        )}
        {/* Indicator Pane Title (Approximation) */}
        {showIndicator && (
          <div
            className="absolute left-4 px-2 py-1 rounded-md text-slate-300 text-xs font-semibold z-10 bg-red-400"
            style={{ top: "calc(80% + 20px)" }}
          >
            INDICATOR
          </div>
        )}
        {/* Bottom Navigation */}
        <ChartFooter
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          periods={periods}
        />
      </div>
    );
  }
);

Chart.displayName = "Chart";

export default Chart;
