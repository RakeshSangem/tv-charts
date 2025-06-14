// src/utils/indicators.js

// Simple Moving Average (SMA)
export const calculateSMA = (data, period) => {
  if (!Array.isArray(data) || data.length < period) {
    return [];
  }

  const sma = [];
  let sum = 0;

  // first window sum
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  sma.push({ time: data[period - 1].time, value: sum / period });

  // slide window
  for (let i = period; i < data.length; i++) {
    sum += data[i].close - data[i - period].close;
    sma.push({ time: data[i].time, value: sum / period });
  }

  return sma;
};

// Exponential Moving Average (EMA)
export const calculateEMA = (data, period) => {
  if (!Array.isArray(data) || data.length < period) {
    return [];
  }

  // Start EMA with SMA of first period
  const ema = [];
  const initialSlice = data.slice(0, period);
  const initialSum = initialSlice.reduce((acc, bar) => acc + bar.close, 0);
  let prevEma = initialSum / period;
  ema.push({ time: data[period - 1].time, value: prevEma });

  const multiplier = 2 / (period + 1);

  for (let i = period; i < data.length; i++) {
    const value = (data[i].close - prevEma) * multiplier + prevEma;
    prevEma = value;
    ema.push({ time: data[i].time, value });
  }

  return ema;
};

// Bollinger Bands
export const calculateBollingerBands = (data, period, stdDev = 2) => {
  if (!Array.isArray(data) || data.length < period) {
    return [];
  }

  const sma = calculateSMA(data, period);
  const bands = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i - (period - 1)].value;
    const variance =
      slice.reduce((sum, bar) => sum + Math.pow(bar.close - mean, 2), 0) /
      period;
    const deviation = Math.sqrt(variance);

    bands.push({
      time: data[i].time,
      upper: mean + stdDev * deviation,
      middle: mean,
      lower: mean - stdDev * deviation,
    });
  }

  return bands;
};

// MACD (Moving Average Convergence Divergence)
export const calculateMACD = (
  data,
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
) => {
  if (!Array.isArray(data) || data.length < slowPeriod + signalPeriod) {
    return { macd: [], signal: [], histogram: [] };
  }

  const fastEma = calculateEMA(data, fastPeriod);
  const slowEma = calculateEMA(data, slowPeriod);
  const macdLine = [];

  // align fastEma and slowEma by time starting at slowPeriod-1
  for (let i = 0; i < slowEma.length; i++) {
    const time = slowEma[i].time;
    const fastPoint = fastEma.find((pt) => pt.time === time);
    if (fastPoint) {
      macdLine.push({ time, value: fastPoint.value - slowEma[i].value });
    }
  }

  // signal line is EMA of macdLine
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // histogram aligned to signalLine
  const histogram = signalLine.map((sigPt, idx) => ({
    time: sigPt.time,
    value: macdLine[idx + signalPeriod - 1].value - sigPt.value,
  }));

  // align macd output to signal timeline
  const macdAligned = macdLine.slice(signalPeriod - 1);

  return {
    macd: macdAligned,
    signal: signalLine,
    histogram,
  };
};

// Relative Strength Index (RSI)
export const calculateRSI = (data, period = 14) => {
  if (!Array.isArray(data) || data.length <= period) {
    return [];
  }

  const rsi = [];
  let gains = 0;
  let losses = 0;

  // initial avg gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) gains += change;
    else losses -= change;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;
  let rs = avgGain / avgLoss;
  rsi.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });

  // subsequent rsi
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    rs = avgGain / avgLoss;

    rsi.push({ time: data[i].time, value: 100 - 100 / (1 + rs) });
  }

  return rsi;
};

// Volume
export const calculateVolume = (data) => {
  if (!Array.isArray(data)) return [];
  return data.map((bar) => ({ time: bar.time, value: bar.volume || 0 }));
};

// Stochastic Oscillator
export const calculateStochastic = (
  data,
  period = 14,
  smoothK = 3,
  smoothD = 3
) => {
  if (!Array.isArray(data) || data.length < period) {
    return { k: [], d: [] };
  }

  const kValues = [];
  const kSeries = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map((d) => d.high));
    const low = Math.min(...slice.map((d) => d.low));
    const close = data[i].close;
    const k = ((close - low) / (high - low)) * 100;
    kValues.push(k);

    if (kValues.length >= smoothK) {
      const sumK = kValues.slice(-smoothK).reduce((a, b) => a + b, 0);
      const kAvg = sumK / smoothK;
      kSeries.push({ time: data[i].time, value: kAvg });
    }
  }

  const dSeries = [];
  for (let i = smoothD - 1; i < kSeries.length; i++) {
    const sumD = kSeries
      .slice(i - smoothD + 1, i + 1)
      .reduce((acc, pt) => acc + pt.value, 0);
    dSeries.push({ time: kSeries[i].time, value: sumD / smoothD });
  }

  return { k: kSeries, d: dSeries };
};

// Master switch
export const calculateIndicator = (data, indicator) => {
  if (!Array.isArray(data) || !data.length) return null;
  const period = indicator.period || indicator.defaultPeriod || 14;

  switch (indicator.id) {
    case "sma":
      return calculateSMA(data, period);
    case "ema":
      return calculateEMA(data, period);
    case "bollinger":
      return calculateBollingerBands(data, period, indicator.stdDev);
    case "rsi":
      return calculateRSI(data, period);
    case "stochastic":
      return calculateStochastic(
        data,
        period,
        indicator.smoothK,
        indicator.smoothD
      );
    case "volume":
      return calculateVolume(data);
    default:
      return null;
  }
};
