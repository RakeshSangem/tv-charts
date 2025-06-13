import React, { useEffect, useRef, useState } from "react";

// This function generates a *complete* candle (used for initial historical data)
const generateCandle = (prevCandle) => {
  const open = prevCandle ? prevCandle.close : 100 + Math.random() * 20;
  const volatility = 0.5 + Math.random() * 1.5;
  const change = (Math.random() - 0.5) * volatility * 2;
  const close = open + change;
  const high = Math.max(open, close) + Math.random() * volatility * 0.5;
  const low = Math.min(open, close) - Math.random() * volatility * 0.5;

  return {
    open: parseFloat(open.toFixed(2)),
    high: parseFloat(high.toFixed(2)),
    low: parseFloat(low.toFixed(2)),
    close: parseFloat(close.toFixed(2)),
  };
};

// This function updates the *current* candle for live simulation
const updateLiveCandle = (currentCandle) => {
  const volatility = 0.5 + Math.random() * 1.5;
  const priceChange = (Math.random() - 0.5) * volatility * 0.5; // Reduced price change for more realistic ticks
  const newClose = currentCandle.close + priceChange;

  const newHigh = Math.max(currentCandle.high, newClose);
  const newLow = Math.min(currentCandle.low, newClose);

  return {
    ...currentCandle,
    close: parseFloat(newClose.toFixed(2)),
    high: parseFloat(newHigh.toFixed(2)),
    low: parseFloat(newLow.toFixed(2)),
  };
};

const generateMacd = (prevMacd, prevSignal) => {
  const macd = prevMacd + (Math.random() * 0.2 - 0.1);
  const signal = prevSignal + (Math.random() * 0.15 - 0.075);
  const histValue = macd - signal;

  const histColor =
    histValue >= 0
      ? histValue > 0.05
        ? "#22c55e"
        : "#86efac"
      : histValue < -0.05
        ? "#ef4444"
        : "#fca5a5";

  return {
    macd: parseFloat(macd.toFixed(3)),
    signal: parseFloat(signal.toFixed(3)),
    histValue: parseFloat(histValue.toFixed(3)),
    histColor,
  };
};

const generateIndicator = (prevValue) => {
  const value = prevValue + (Math.random() * 2 - 1);
  return parseFloat(value.toFixed(2));
};

export const generateInitialData = (
  initialCount = 100,
  intervalMinutes = 1
) => {
  const candles = [];
  const macd = [];
  const signal = [];
  const histogram = [];
  const indicators = [];
  const smaData = [];

  let currentDate = new Date("2025-06-01T09:15:00Z");
  let lastCandle = null;
  let lastMacd = 0;
  let lastSignal = 0;
  let lastIndicator = 50;
  const closePrices = [];

  for (let i = 0; i < initialCount; i++) {
    const time = Math.round(currentDate.getTime() / 1000);

    const candle = generateCandle(lastCandle);
    lastCandle = candle;
    candles.push({ time, ...candle });

    closePrices.push(candle.close);
    if (closePrices.length > 9) {
      closePrices.shift();
    }
    const smaValue =
      closePrices.length === 9 ? closePrices.reduce((a, b) => a + b) / 9 : null;
    if (smaValue !== null) {
      smaData.push({ time, value: parseFloat(smaValue.toFixed(2)) });
    }

    const macdData = generateMacd(lastMacd, lastSignal);
    lastMacd = macdData.macd;
    lastSignal = macdData.signal;

    macd.push({ time, value: macdData.macd });
    signal.push({ time, value: macdData.signal });
    histogram.push({
      time,
      value: macdData.histValue,
      color: macdData.histColor,
    });

    lastIndicator = generateIndicator(lastIndicator);
    indicators.push({ time, value: lastIndicator });

    currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);

    const istOffset = 5.5 * 60 * 60 * 1000;
    const currentISTTime = new Date(currentDate.getTime() + istOffset);

    if (
      currentISTTime.getUTCHours() >= 15 &&
      currentISTTime.getUTCMinutes() >= 30 &&
      i < initialCount - 1
    ) {
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      currentDate.setUTCHours(9, 15, 0, 0);
    }
  }
  return { candles, macd, signal, histogram, indicators, sma: smaData };
};

export const useLiveData = (
  initialCount,
  updateInterval = 5000,
  dataIntervalMinutes = 1
) => {
  const [data, setData] = useState(() =>
    generateInitialData(initialCount, dataIntervalMinutes)
  );
  const [isLive, setIsLive] = useState(false);

  const currentCandleActiveTime = useRef(0);
  const previousLastCandleClose = useRef(null);
  const closePricesForSma = useRef([]);

  useEffect(() => {
    if (data.candles.length > 0) {
      const lastCandleTime = data.candles[data.candles.length - 1].time;
      currentCandleActiveTime.current = lastCandleTime;
      previousLastCandleClose.current =
        data.candles[data.candles.length - 1].close;
      closePricesForSma.current = data.candles.map((c) => c.close).slice(-9);
    }
  }, []);

  const toggleLive = () => setIsLive((prev) => !prev);

  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setData((prev) => {
        const newCandles = [...prev.candles];
        const newMacd = [...prev.macd];
        const newSignal = [...prev.signal];
        const newHistogram = [...prev.histogram];
        const newIndicators = [...prev.indicators];
        const newSma = [...prev.sma];

        const currentRealTimeInSeconds = Math.round(Date.now() / 1000);
        const expectedCandleEndTime =
          currentCandleActiveTime.current + dataIntervalMinutes * 60;

        if (currentRealTimeInSeconds >= expectedCandleEndTime) {
          if (newCandles.length > 0) {
            previousLastCandleClose.current =
              newCandles[newCandles.length - 1].close;
          }

          currentCandleActiveTime.current = expectedCandleEndTime;

          const newCandleOpen =
            previousLastCandleClose.current || 100 + Math.random() * 20;
          const newCandle = {
            time: currentCandleActiveTime.current,
            open: parseFloat(newCandleOpen.toFixed(2)),
            high: parseFloat(newCandleOpen.toFixed(2)),
            low: parseFloat(newCandleOpen.toFixed(2)),
            close: parseFloat(newCandleOpen.toFixed(2)),
          };
          newCandles.push(newCandle);

          closePricesForSma.current.push(newCandle.close);
          if (closePricesForSma.current.length > 9) {
            closePricesForSma.current.shift();
          }

          const smaValue =
            closePricesForSma.current.length === 9
              ? closePricesForSma.current.reduce((a, b) => a + b) / 9
              : null;
          if (smaValue !== null) {
            newSma.push({
              time: newCandle.time,
              value: parseFloat(smaValue.toFixed(2)),
            });
          }

          if (newCandles.length > initialCount) {
            newCandles.shift();
            newMacd.shift();
            newSignal.shift();
            newHistogram.shift();
            newIndicators.shift();
            newSma.shift();
          }
        } else {
          if (newCandles.length > 0) {
            const updatedCandle = updateLiveCandle(
              newCandles[newCandles.length - 1]
            );
            newCandles[newCandles.length - 1] = updatedCandle;

            if (closePricesForSma.current.length > 0) {
              closePricesForSma.current[closePricesForSma.current.length - 1] =
                updatedCandle.close;
            }
            const smaValue =
              closePricesForSma.current.length === 9
                ? closePricesForSma.current.reduce((a, b) => a + b) / 9
                : null;
            if (smaValue !== null) {
              if (
                newSma.length > 0 &&
                newSma[newSma.length - 1].time === updatedCandle.time
              ) {
                newSma[newSma.length - 1] = {
                  time: updatedCandle.time,
                  value: parseFloat(smaValue.toFixed(2)),
                };
              } else {
                newSma.push({
                  time: updatedCandle.time,
                  value: parseFloat(smaValue.toFixed(2)),
                });
              }
            }
          }
        }

        const updateTimeForIndicators = currentCandleActiveTime.current;

        const lastMacdVal = newMacd[newMacd.length - 1]?.value || 0;
        const lastSignalVal = newSignal[newSignal.length - 1]?.value || 0;
        const macdData = generateMacd(lastMacdVal, lastSignalVal);
        const lastIndicatorVal =
          newIndicators[newIndicators.length - 1]?.value || 50;
        const newIndicatorValue = generateIndicator(lastIndicatorVal);

        if (
          newMacd.length > 0 &&
          newMacd[newMacd.length - 1].time === updateTimeForIndicators
        ) {
          newMacd[newMacd.length - 1] = {
            time: updateTimeForIndicators,
            value: macdData.macd,
          };
          newSignal[newSignal.length - 1] = {
            time: updateTimeForIndicators,
            value: macdData.signal,
          };
          newHistogram[newHistogram.length - 1] = {
            time: updateTimeForIndicators,
            value: macdData.histValue,
            color: macdData.histColor,
          };
        } else {
          newMacd.push({ time: updateTimeForIndicators, value: macdData.macd });
          newSignal.push({
            time: updateTimeForIndicators,
            value: macdData.signal,
          });
          newHistogram.push({
            time: updateTimeForIndicators,
            value: macdData.histValue,
            color: macdData.histColor,
          });
        }

        if (
          newIndicators.length > 0 &&
          newIndicators[newIndicators.length - 1].time ===
            updateTimeForIndicators
        ) {
          newIndicators[newIndicators.length - 1] = {
            time: updateTimeForIndicators,
            value: newIndicatorValue,
          };
        } else {
          newIndicators.push({
            time: updateTimeForIndicators,
            value: newIndicatorValue,
          });
        }

        return {
          candles: newCandles,
          macd: newMacd,
          signal: newSignal,
          histogram: newHistogram,
          indicators: newIndicators,
          sma: newSma,
        };
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [isLive, updateInterval, dataIntervalMinutes, initialCount]);

  return { data, isLive, toggleLive };
};
