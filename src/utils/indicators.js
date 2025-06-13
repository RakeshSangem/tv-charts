// Simple Moving Average (SMA)
export const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push({ time: data[i].time, value: null });
      continue;
    }
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, curr) => acc + curr.close, 0);
    sma.push({ time: data[i].time, value: sum / period });
  }
  return sma;
};

// Exponential Moving Average (EMA)
export const calculateEMA = (data, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let prevEMA = sum / period;
  ema.push({ time: data[period - 1].time, value: prevEMA });

  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i].close - prevEMA) * multiplier + prevEMA;
    ema.push({ time: data[i].time, value: currentEMA });
    prevEMA = currentEMA;
  }

  return ema;
};

// Bollinger Bands
export const calculateBollingerBands = (data, period, stdDev = 2) => {
  const sma = calculateSMA(data, period);
  const bands = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const mean = sma[i].value;
    const squaredDiffs = slice.map((d) => Math.pow(d.close - mean, 2));
    const variance = squaredDiffs.reduce((acc, curr) => acc + curr, 0) / period;
    const standardDeviation = Math.sqrt(variance);

    bands.push({
      time: data[i].time,
      upper: mean + standardDeviation * stdDev,
      middle: mean,
      lower: mean - standardDeviation * stdDev,
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
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  const macdLine = [];
  const signalLine = [];
  const histogram = [];

  // Calculate MACD Line
  for (let i = slowPeriod - 1; i < data.length; i++) {
    const macdValue =
      fastEMA[i - (slowPeriod - fastPeriod)].value - slowEMA[i].value;
    macdLine.push({ time: data[i].time, value: macdValue });
  }

  // Calculate Signal Line (EMA of MACD)
  const signalEMA = calculateEMA(macdLine, signalPeriod);
  signalLine.push(...signalEMA);

  // Calculate Histogram
  for (let i = 0; i < signalLine.length; i++) {
    histogram.push({
      time: signalLine[i].time,
      value: macdLine[i + signalPeriod - 1].value - signalLine[i].value,
    });
  }

  return { macdLine, signalLine, histogram };
};

// Relative Strength Index (RSI)
export const calculateRSI = (data, period = 14) => {
  const rsi = [];
  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change >= 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // First RSI value
  let rs = avgGain / avgLoss;
  let rsiValue = 100 - 100 / (1 + rs);
  rsi.push({ time: data[period].time, value: rsiValue });

  // Calculate RSI for remaining data points
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    let currentGain = 0;
    let currentLoss = 0;

    if (change >= 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

    rs = avgGain / avgLoss;
    rsiValue = 100 - 100 / (1 + rs);
    rsi.push({ time: data[i].time, value: rsiValue });
  }

  return rsi;
};

// Volume
export const calculateVolume = (data) => {
  return data.map((d) => ({
    time: d.time,
    value: d.volume,
  }));
};

// Stochastic Oscillator
export const calculateStochastic = (
  data,
  period = 14,
  smoothK = 3,
  smoothD = 3
) => {
  const stoch = [];
  const kValues = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const high = Math.max(...slice.map((d) => d.high));
    const low = Math.min(...slice.map((d) => d.low));
    const close = data[i].close;

    const k = ((close - low) / (high - low)) * 100;
    kValues.push(k);

    if (kValues.length >= smoothK) {
      const kSmooth =
        kValues.slice(-smoothK).reduce((acc, curr) => acc + curr, 0) / smoothK;
      stoch.push({ time: data[i].time, k: kSmooth });
    }
  }

  // Calculate D line (SMA of K)
  const dValues = [];
  for (let i = smoothD - 1; i < stoch.length; i++) {
    const dSmooth =
      stoch
        .slice(i - smoothD + 1, i + 1)
        .reduce((acc, curr) => acc + curr.k, 0) / smoothD;
    dValues.push({ time: stoch[i].time, d: dSmooth });
  }

  return {
    k: stoch.slice(smoothD - 1).map((s, i) => ({ time: s.time, value: s.k })),
    d: dValues.map((d) => ({ time: d.time, value: d.d })),
  };
};
