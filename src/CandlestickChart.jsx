import React, {
  useEffect,
  useRef,
  useCallback,
  useState,
  useMemo,
} from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import { useRealTimeChartData } from "../hooks/useRealTimeChartData";
import { useWebSocketContext } from "@contexts/WebSocketContext";

/**
 * Utility function to deduplicate time series data by timestamp
 * @param {Array} dataArray - Array of data points with time property
 * @param {Function} mergeFunction - Function to merge duplicate entries (optional)
 * @returns {Array} Deduplicated and sorted array
 */
const deduplicateTimeSeriesData = (dataArray, mergeFunction = null) => {
  const dataMap = new Map();

  for (const point of dataArray) {
    const timeKey = point.time;

    if (dataMap.has(timeKey)) {
      if (mergeFunction) {
        dataMap.set(timeKey, mergeFunction(dataMap.get(timeKey), point));
      } else {
        // Default: use the latest point
        dataMap.set(timeKey, point);
      }
    } else {
      dataMap.set(timeKey, point);
    }
  }

  return Array.from(dataMap.values()).sort((a, b) => a.time - b.time);
};

export const CandlestickChart = ({
  data,
  settings,
  darkMode,
  additionalTraces = [],
  indicatorTraces = [],
  signals = [],
  loading = false,
  selectedInstrument,
  timeInterval,
  currentTime,
  isStraddleMode = false,
  straddleData,
}) => {
  // Remove or comment out all console.log statements
  // console.log({ cahrtData: data });
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const candlestickSeriesRef = useRef();
  const volumeSeriesRef = useRef();
  const isInitialLoadRef = useRef(true);
  const additionalSeriesRef = useRef([]);
  const [showLTPAdjustment, setShowLTPAdjustment] = useState(false);
  const { ltps } = useWebSocketContext();

  // Track current instrument and interval to detect changes
  const currentInstrumentRef = useRef(selectedInstrument?.id);
  const currentIntervalRef = useRef(timeInterval);
  const hasInstrumentChangedRef = useRef(false);

  // Use the custom hook for real-time data processing
  const { processedData, isWorkerReady } = useRealTimeChartData(
    data,
    selectedInstrument,
    timeInterval,
    indicatorTraces,
    isStraddleMode
  );

  // Use processed data for chart rendering
  const chartData = useMemo(() => {
    if (isStraddleMode) {
      // In straddle mode, only use the straddle data
      return data;
    }
    return processedData || data;
  }, [isStraddleMode, processedData, data]);

  // Track change detection for debugging
  useEffect(() => {
    // console.log(
    //   "CandlestickChart: Change detection triggered",
    //   {
    //     instrumentChanged: hasInstrumentChangedRef.current,
    //     intervalChanged: hasIntervalChangedRef.current,
    //     shouldResetPosition: shouldResetPosition,
    //     selectedInstrument: selectedInstrument?.id,
    //     timeInterval,
    //   }
    // );
  }, [selectedInstrument?.id, timeInterval]);

  // LTP adjustment effect
  useEffect(() => {
    if (!ltps || !selectedInstrument?.id || !chartData?.close) {
      return;
    }

    const currentLTP = ltps[selectedInstrument.id];
    if (!currentLTP || typeof currentLTP.lp !== "number") {
      return;
    }

    const lastPrice = chartData.close[0];
    const priceDifference = Math.abs(currentLTP.lp - lastPrice);

    if (priceDifference > lastPrice * 0.02) {
      // console.log(
      //   "Significant price gap detected, showing LTP adjustment:",
      //   {
      //     lastPrice,
      //     currentLTP: currentLTP.lp,
      //     difference: priceDifference,
      //     percentageDiff: (priceDifference / lastPrice) * 100,
      //   }
      // );
      setShowLTPAdjustment(true);
    } else {
      setShowLTPAdjustment(false);
    }
  }, [ltps, selectedInstrument?.id, chartData?.close]);

  // Reset initial load flag when instrument or interval changes to ensure chart fits new data
  useEffect(() => {
    const instrumentChanged =
      currentInstrumentRef.current !== selectedInstrument?.id;
    const intervalChanged = currentIntervalRef.current !== timeInterval;

    if (instrumentChanged || intervalChanged) {
      // console.log(
      //   "🎯 CandlestickChart: Instrument or interval changed, will reset chart position",
      //   {
      //     instrumentChanged,
      //     intervalChanged,
      //     oldInstrument: currentInstrumentRef.current,
      //     newInstrument: selectedInstrument?.id,
      //     oldInterval: currentIntervalRef.current,
      //     newInterval: timeInterval,
      //   }
      // );

      // Mark that we should reset the chart position
      isInitialLoadRef.current = true;
      hasInstrumentChangedRef.current = true;

      // Update refs to track current values
      currentInstrumentRef.current = selectedInstrument?.id;
      currentIntervalRef.current = timeInterval;
    }
  }, [timeInterval, selectedInstrument?.id]);

  // Create chart instance only once
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up previous chart instance to avoid memory leaks
    if (chartRef.current) {
      chartRef.current.remove();
    }

    // Chart options
    const chartOptions = {
      layout: {
        background: { color: darkMode ? "#1a1a1a" : "#ffffff" },
        textColor: darkMode ? "#d1d5db" : "#374151",
      },
      grid: {
        vertLines: { color: darkMode ? "#2d2d2d" : "#e5e7eb" },
        horzLines: { color: darkMode ? "#2d2d2d" : "#e5e7eb" },
      },
      rightPriceScale: {
        borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
        scaleMargins: {
          top: 0.1,
          bottom: isStraddleMode ? 0.2 : 0.1, // More space at bottom for straddle
        },
        visible: true,
        autoScale: true, // Allow chart to adjust scale initially
      },
      timeScale: {
        borderColor: darkMode ? "#2d2d2d" : "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false,
        lockVisibleTimeRangeOnResize: false,
        rightOffset: 12,
        barSpacing: 6,
        minBarSpacing: 3,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          // time is a Unix timestamp (seconds since epoch)
          if (isNaN(time) || time === null) return "Invalid Date";
          const date = new Date(time * 1000);

          // Adjust to IST (UTC+5:30)
          const istOffset = 5.5 * 60; // 5 hours 30 minutes in minutes
          const utc = date.getTime() + date.getTimezoneOffset() * 60 * 1000;
          const istDate = new Date(utc + istOffset * 60 * 1000);

          return istDate.toLocaleTimeString(locale, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          });
        },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: darkMode ? "#4b5563" : "#9ca3af",
          style: 0,
        },
        horzLine: {
          width: 1,
          color: darkMode ? "#4b5563" : "#9ca3af",
          style: 0,
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
      // Set initial chart dimensions based on container
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight || 600, // Fallback height
    };

    chartRef.current = createChart(chartContainerRef.current, chartOptions);

    // Create candlestick series in the main pane (0)
    candlestickSeriesRef.current = chartRef.current.addSeries(
      CandlestickSeries,
      {
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      }
    );

    // Handle resize
    const handleResize = () => {
      if (!chartContainerRef.current || !chartRef.current) return;

      const { width, height } =
        chartContainerRef.current.getBoundingClientRect();
      chartRef.current.applyOptions({
        width,
        height: height || 600,
      });

      // Only update pane heights if they haven't been manually resized
      const panes = chartRef.current.panes();
      const currentHeights = panes.map((pane) => pane.getHeight());
      const totalHeight = currentHeights.reduce((sum, h) => sum + h, 0);

      // If total height is significantly different from container height,
      // it means panes were manually resized. Allow a small tolerance.
      if (Math.abs(totalHeight - height) > 10) {
        // Preserve existing pane ratios if they were manually adjusted
        if (panes.length > 0) {
          const heightRatios = currentHeights.map((h) => h / totalHeight);
          panes.forEach((pane, index) => {
            pane.setHeight(height * heightRatios[index]);
          });
        }
        return;
      }

      // Default proportional height update if no manual adjustment detected
      if (panes.length === 1) {
        panes[0].setHeight(height);
      } else if (panes.length === 2) {
        // Example initial split for 2 panes: 70% main, 30% volume
        panes[0].setHeight(height * 0.7);
        panes[1].setHeight(height * 0.3);
      } else if (panes.length === 3) {
        // Example initial split for 3 panes: 50% main, 25% volume, 25% indicator
        panes[0].setHeight(height * 0.5);
        panes[1].setHeight(height * 0.25);
        panes[2].setHeight(height * 0.25);
      }
    };

    window.addEventListener("resize", handleResize);

    // Initial fit content when chart is created or instrument/interval changes
    if (isInitialLoadRef.current) {
      chartRef.current.timeScale().fitContent();
      isInitialLoadRef.current = false; // Reset flag after initial load
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      additionalSeriesRef.current = [];
    };
  }, [darkMode, isStraddleMode, selectedInstrument?.id, timeInterval]); // Add selectedInstrument.id and timeInterval to dependencies for full re-initialization on change

  // Format data differently for straddle mode
  useEffect(() => {
    if (!chartData || !candlestickSeriesRef.current) return;

    const candleMap = new Map();

    for (let i = 0; i < chartData.time.length; i++) {
      let timeValue = chartData.time[i];
      const close = parseFloat(chartData.close[i]);
      const open = parseFloat(chartData.open[i]);
      const high = parseFloat(chartData.high[i]);
      const low = parseFloat(chartData.low[i]);

      // Handle time, which can be milliseconds, ISO string, or already in seconds
      if (typeof timeValue === "string") {
        timeValue = Math.floor(new Date(timeValue).getTime() / 1000);
      }
      // If it's a large number (milliseconds), convert to seconds
      else if (timeValue > 10000000000) {
        timeValue = Math.floor(timeValue / 1000);
      }

      // Skip invalid timestamps
      if (isNaN(timeValue) || timeValue <= 0) {
        continue;
      }

      // Check if we already have a candle for this timestamp
      if (candleMap.has(timeValue)) {
        // Update existing candle with latest data (merge approach)
        const existingCandle = candleMap.get(timeValue);

        // Update high/low with max/min values
        existingCandle.high = Math.max(existingCandle.high, high);
        existingCandle.low = Math.min(existingCandle.low, low);

        // Use the latest close price
        existingCandle.close = close;

        continue;
      }
      // Ensure open and close are never exactly equal to prevent color instability
      let adjustedOpen = open;
      // if (Math.abs(open - close) < 0.0001) {
      //   // If previous candle exists, follow its trend
      //   if (i > 0 && chartData.close[i - 1] !== undefined) {
      //     // If previous close was higher than current, make this slightly bearish
      //     if (chartData.close[i - 1] > close) {
      //       adjustedOpen = open * 1.0001; // Slightly higher open (red candle)
      //     } else {
      //       adjustedOpen = open * 0.9999; // Slightly lower open (green candle)
      //     }
      //   } else {
      //     // No previous candle, just make a tiny random adjustment
      //     // Use the timeValue to ensure it's consistent for the same candle
      //     const timeBasedSeed = (timeValue % 100) / 100;
      //     adjustedOpen = open * (1 + (timeBasedSeed - 0.5) * 0.0002);
      //   }
      // }

      // Create new candle data
      const candleData = {
        time: timeValue,
        open: adjustedOpen,
        high: high,
        low: low,
        close: close,
      };

      // Store in map to prevent duplicates
      candleMap.set(timeValue, candleData);
    }

    // Convert map to array and sort by time
    const formattedData = Array.from(candleMap.values()).sort(
      (a, b) => a.time - b.time
    );

    // Set data to chart
    candlestickSeriesRef.current.setData(formattedData);

    // Reset position only if instrument/interval changed and we are initially loading
    if (hasInstrumentChangedRef.current && chartRef.current) {
      chartRef.current.timeScale().fitContent();
      hasInstrumentChangedRef.current = false;
    }
  }, [chartData, selectedInstrument?.id, timeInterval]); // Added selectedInstrument and timeInterval as dependencies

  // Update volume data separately
  useEffect(() => {
    if (!chartData || !chartData.time || !chartRef.current) return;

    // Remove existing volume series if it exists
    if (volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current);
    }

    // Calculate volume panel height
    const volumePaneHeight = 0.2;

    // Create a map to deduplicate volume bars by timestamp
    const volumeMap = new Map();

    // Format and deduplicate volume data
    for (let i = 0; i < chartData.time.length; i++) {
      // Handle time, which can be milliseconds, ISO string, or already in seconds
      let timeValue = chartData.time[i];

      // If it's a string (ISO date), convert to milliseconds then to seconds
      if (typeof timeValue === "string") {
        timeValue = Math.floor(new Date(timeValue).getTime() / 1000);
      }
      // If it's a large number (milliseconds), convert to seconds
      else if (timeValue > 10000000000) {
        // If timestamp is in milliseconds (larger than year 2286)
        timeValue = Math.floor(timeValue / 1000);
      }
      // If it's already in seconds, use as is

      // Skip invalid timestamps
      if (isNaN(timeValue) || timeValue <= 0) {
        continue;
      }

      // Check if volume might need scaling (if it's already in millions or billions)
      let volume = chartData.volume[i];

      // If volume is suspiciously small (less than 100), it might already be scaled
      // In that case, scale it up for better visualization
      if (volume < 100 && volume > 0) {
        volume = volume * 1000000; // Scale up by 1M
      }

      // Skip if volume is invalid or zero
      if (isNaN(volume) || volume <= 0) {
        continue;
      }

      // Check if we already have a volume bar for this timestamp
      if (volumeMap.has(timeValue)) {
        // Update existing volume bar with latest data (sum volumes)
        const existingVolumeBar = volumeMap.get(timeValue);
        existingVolumeBar.value = Math.max(existingVolumeBar.value, volume);
        continue;
      }

      // Determine color based on price movement
      const open = chartData.open[i];
      const close = chartData.close[i];

      // Determine color based on price movement with slight randomization for stability
      let color;
      if (Math.abs(close - open) < 0.0001) {
        // If prices are equal, use a neutral color with slight variation
        const timeBasedSeed = (timeValue % 100) / 100;
        color = timeBasedSeed > 0.5 ? "#26a69a" : "#ef5350";
      } else {
        color = close >= open ? "#26a69a" : "#ef5350";
      }

      // Create volume bar data
      const volumeBarData = {
        time: timeValue,
        value: volume,
        color: color,
      };

      // Store in map to prevent duplicates
      volumeMap.set(timeValue, volumeBarData);
    }

    // Convert map to array and sort by time (ascending)
    const volumeData = Array.from(volumeMap.values()).sort(
      (a, b) => a.time - b.time
    );

    // Create volume series in pane 1
    volumeSeriesRef.current = chartRef.current.addSeries(
      HistogramSeries,
      {
        color: "#26a69a",
        priceFormat: {
          type: "volume",
          precision: 0,
          formatter: (value) => {
            if (value >= 1000000000) {
              return (value / 1000000000).toFixed(2) + "B";
            } else if (value >= 1000000) {
              return (value / 1000000).toFixed(2) + "M";
            } else if (value >= 1000) {
              return (value / 1000).toFixed(1) + "K";
            }
            return value.toFixed(0);
          },
        },
        priceScaleId: "volume",
      },
      1
    ); // Pane index 1 for volume

    // Set up volume price scale
    chartRef.current.priceScale("volume").applyOptions({
      scaleMargins: {
        top: 1 - volumePaneHeight,
        bottom: 0,
      },
      visible: false, // Hide the price scale for volume
    });

    // Set volume data
    volumeSeriesRef.current.setData(volumeData);
  }, [chartData, darkMode]);

  // Update additional traces (indicators, etc.) separately
  useEffect(() => {
    if (!chartRef.current) return;

    // Remove existing additional series
    additionalSeriesRef.current.forEach((series) => {
      try {
        chartRef.current.removeSeries(series);
      } catch (e) {
        // Series might already be removed
      }
    });
    additionalSeriesRef.current = [];

    const allTraces = [...additionalTraces, ...indicatorTraces];

    // Process additional traces (indicators, script outputs, etc.)
    allTraces.forEach((trace) => {
      if (!trace || !trace.type) return;

      if (trace.type === "line") {
        const lineSeries = chartRef.current.addSeries(
          LineSeries,
          {
            ...trace.options,
            priceScaleId: trace.options?.priceScaleId || "right",
            lineWidth: trace.options?.lineWidth || 2,
            title: trace.name,
          },
          trace.paneIndex || 0
        ); // Use paneIndex from trace or default to 0 (main pane)

        additionalSeriesRef.current.push(lineSeries);

        if (trace.data && Array.isArray(trace.data)) {
          const formattedData = trace.data
            .filter((point) => point && point.time && point.value != null)
            .map((point) => {
              // Handle time, which can be milliseconds, ISO string, or already in seconds
              let timeValue = point.time;

              // If it's a string (ISO date), convert to milliseconds then to seconds
              if (typeof timeValue === "string") {
                timeValue = Math.floor(new Date(timeValue).getTime() / 1000);
              }
              // If it's a large number (milliseconds), convert to seconds
              else if (timeValue > 10000000000) {
                timeValue = Math.floor(timeValue / 1000);
              }

              return {
                time: timeValue,
                value: point.value,
              };
            })
            .filter((item) => !isNaN(item.time) && item.time > 0);

          // Deduplicate and sort the data
          const deduplicatedData = deduplicateTimeSeriesData(formattedData);
          lineSeries.setData(deduplicatedData);
        }
      } else if (trace.type === "histogram") {
        const histogramSeries = chartRef.current.addSeries(
          HistogramSeries,
          {
            ...trace.options,
            priceScaleId: trace.options?.priceScaleId || "right",
            title: trace.name,
          },
          trace.paneIndex || 0
        ); // Use paneIndex from trace or default to 0 (main pane)

        additionalSeriesRef.current.push(histogramSeries);

        if (trace.data && Array.isArray(trace.data)) {
          const formattedData = trace.data
            .filter((point) => point && point.time && point.value != null)
            .map((point) => {
              let timeValue = point.time;
              if (typeof timeValue === "string") {
                timeValue = Math.floor(new Date(timeValue).getTime() / 1000);
              } else if (timeValue > 10000000000) {
                timeValue = Math.floor(timeValue / 1000);
              }

              return {
                time: timeValue,
                value: point.value,
                color: point.color,
              };
            })
            .filter((item) => !isNaN(item.time) && item.time > 0);

          const deduplicatedData = deduplicateTimeSeriesData(formattedData);
          histogramSeries.setData(deduplicatedData);
        }
      }
    });
  }, [additionalTraces, indicatorTraces]);

  // Update signals separately
  useEffect(() => {
    if (!chartRef.current || !signals || signals.length === 0) return;

    // Add trading signals if provided
    const markersSeries = chartRef.current.addSeries(CandlestickSeries, {
      upColor: "rgba(0,0,0,0)",
      downColor: "rgba(0,0,0,0)",
      borderVisible: false,
      wickUpColor: "rgba(0,0,0,0)",
      wickDownColor: "rgba(0,0,0,0)",
    });

    // Convert signals to markers
    const markers = signals
      .map((signal) => {
        const markerType = signal.type === "buy" ? "arrowUp" : "arrowDown";
        const color = signal.type === "buy" ? "#26a69a" : "#ef5350";

        // Handle time, which can be milliseconds, ISO string, or already in seconds
        let timeValue = signal.time;

        // If it's a string (ISO date), convert to milliseconds then to seconds
        if (typeof timeValue === "string") {
          timeValue = Math.floor(new Date(timeValue).getTime() / 1000);
        }
        // If it's a large number (milliseconds), convert to seconds
        else if (timeValue > 10000000000) {
          // If timestamp is in milliseconds (larger than year 2286)
          timeValue = Math.floor(timeValue / 1000);
        }
        // If it's already in seconds, use as is

        return {
          time: timeValue,
          position: signal.type === "buy" ? "belowBar" : "aboveBar",
          color,
          shape: markerType,
          text: signal.label || (signal.type === "buy" ? "Buy" : "Sell"),
          size: 1.5,
        };
      })
      .filter((marker) => !isNaN(marker.time) && marker.time > 0);

    if (markers.length > 0) {
      // Deduplicate markers by timestamp (keep the latest one for each timestamp)
      const deduplicatedMarkers = deduplicateTimeSeriesData(markers);
      markersSeries.setMarkers(deduplicatedMarkers);
    }
  }, [signals]);

  return (
    <div className="relative w-full h-full">
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Enhanced loading overlay with worker status */}
      {loading && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex flex-col items-center space-y-3">
            {/* Spinner */}
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>

            {/* Status text */}
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Loading chart data...
            </div>

            {/* Worker status indicator */}
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500">
              <div
                className={`w-2 h-2 rounded-full ${
                  isWorkerReady ? "bg-green-500" : "bg-yellow-500"
                }`}
              />
              <span>
                {isWorkerReady ? "Web Worker Active" : "Fallback Mode"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Worker status indicator in top-right corner when not loading */}
      {!loading && (
        <div className="absolute top-2 right-2 z-5">
          <div className="flex items-center space-x-1 bg-black/20 dark:bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                isWorkerReady ? "bg-green-400" : "bg-yellow-400"
              }`}
            />
            <span className="text-xs text-white/80 dark:text-gray-300">
              {isWorkerReady ? "Worker" : "Main"}
            </span>
          </div>
        </div>
      )}

      {/* LTP Auto-adjustment Notification */}
      {showLTPAdjustment && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
            <div className="flex items-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">
                Chart adjusted to current LTP
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
