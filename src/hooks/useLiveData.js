import { useReducer, useEffect, useCallback, useRef } from "react";

const initialState = {
  data: [],
  isLive: false,
  currentCandle: null,
  lastPrice: null,
  change: 0,
  percentChange: 0,
};

const reducer = (state, action) => {
  let change, percentChange;

  switch (action.type) {
    case "INITIALIZE_DATA":
      return {
        ...state,
        data: action.payload.data,
        currentCandle: action.payload.lastCandle,
        lastPrice: action.payload.lastCandle?.close || null,
        change: 0,
        percentChange: 0,
      };
    case "UPDATE_LTP":
      change = action.payload - state.data[0]?.open || 0;
      percentChange = state.data[0]?.open
        ? ((change / state.data[0].open) * 100).toFixed(2)
        : 0;

      return {
        ...state,
        lastPrice: action.payload,
        change: Number(change.toFixed(2)),
        percentChange: Number(percentChange),
      };
    case "UPDATE_CANDLE":
      return {
        ...state,
        currentCandle: action.payload,
        data: state.data.map((candle, index) =>
          index === state.data.length - 1 ? action.payload : candle
        ),
      };
    case "ADD_NEW_CANDLE":
      return {
        ...state,
        data: action.payload.data,
        currentCandle: action.payload.newCandle,
        lastPrice: action.payload.newCandle.close,
      };
    case "TOGGLE_LIVE":
      return {
        ...state,
        isLive: !state.isLive,
      };
    default:
      return state;
  }
};

const generateInitialCandles = (count, timeframe) => {
  const candles = [];
  let lastCandle = null;
  const basePrice = 100;
  const volatility = 2;

  const timeframeSeconds =
    {
      "1m": 60,
      "5m": 300,
      "15m": 900,
      "30m": 1800,
      "1h": 3600,
      "4h": 14400,
      "1d": 86400,
    }[timeframe] || 60;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.5) * volatility;
    const open = lastCandle ? lastCandle.close : basePrice;
    const high = open + Math.abs(change) + Math.random() * volatility;
    const low = open - Math.abs(change) - Math.random() * volatility;
    const close = open + change;
    const volume = Math.floor(Math.random() * 1000) + 100;

    lastCandle = {
      time:
        i === 0
          ? Math.floor(Date.now() / 1000) - count * timeframeSeconds
          : lastCandle.time + timeframeSeconds,
      open,
      high,
      low,
      close,
      volume,
    };
    candles.push(lastCandle);
  }

  return candles;
};

const generatePriceChange = (lastPrice, volatility = 0.1) => {
  // Generate more realistic price changes with trend persistence
  const trend = Math.random() > 0.5 ? 1 : -1;
  const magnitude = Math.random() * volatility;
  const change = trend * magnitude;
  const newPrice = lastPrice + change;
  return Math.max(0, Number(newPrice.toFixed(2)));
};

const updateCurrentCandle = (currentCandle, lastPrice) => {
  if (!currentCandle) return null;

  return {
    ...currentCandle,
    high: Math.max(currentCandle.high, lastPrice),
    low: Math.min(currentCandle.low, lastPrice),
    close: lastPrice,
    volume: currentCandle.volume + Math.floor(Math.random() * 10),
  };
};

const generateNewCandle = (lastCandle, timeframe) => {
  const volatility = 2;
  const change = (Math.random() - 0.5) * volatility;
  const open = lastCandle.close;
  const high = Math.max(
    open,
    open + Math.abs(change) + Math.random() * volatility
  );
  const low = Math.min(
    open,
    open - Math.abs(change) - Math.random() * volatility
  );
  const close = open + change;
  const volume = Math.floor(Math.random() * 1000) + 100;

  const timeframeSeconds =
    {
      "1m": 60,
      "5m": 300,
      "15m": 900,
      "30m": 1800,
      "1h": 3600,
      "4h": 14400,
      "1d": 86400,
    }[timeframe] || 60;

  return {
    time: lastCandle.time + timeframeSeconds,
    open,
    high,
    low,
    close,
    volume,
  };
};

export const useLiveData = (timeframe = "1m", symbol, period = 100) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const intervalsRef = useRef({ ltp: null, candle: null });
  const isInitializedRef = useRef(false);
  const lastUpdateTimeRef = useRef(Date.now());
  const lastPriceRef = useRef(null);
  const updateCounterRef = useRef({ ltp: 0, candle: 0 });

  const toggleLive = useCallback(() => {
    dispatch({ type: "TOGGLE_LIVE" });
  }, []);

  // Initialize data
  useEffect(() => {
    if (isInitializedRef.current) return;

    const initialCandles = generateInitialCandles(period, timeframe);
    const lastCandle = initialCandles[initialCandles.length - 1];
    lastPriceRef.current = lastCandle.close;

    dispatch({
      type: "INITIALIZE_DATA",
      payload: {
        data: initialCandles,
        lastCandle,
      },
    });

    isInitializedRef.current = true;
  }, [timeframe, period]);

  // Handle live updates
  useEffect(() => {
    if (!state.isLive || !state.currentCandle) {
      return;
    }

    const timeframeSeconds =
      {
        "1m": 60,
        "5m": 300,
        "15m": 900,
        "30m": 1800,
        "1h": 3600,
        "4h": 14400,
        "1d": 86400,
      }[timeframe] || 60;

    // Clear existing intervals
    if (intervalsRef.current.ltp) clearInterval(intervalsRef.current.ltp);
    if (intervalsRef.current.candle) clearInterval(intervalsRef.current.candle);

    // Update LTP every 100ms
    intervalsRef.current.ltp = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      const volatility = Math.min(0.1, timeSinceLastUpdate / 1000);
      const newPrice = generatePriceChange(
        lastPriceRef.current || state.currentCandle.close,
        volatility
      );
      lastPriceRef.current = newPrice;

      const ltpCount = ++updateCounterRef.current.ltp;
      if (ltpCount % 10 === 0) {
        // Log every 10th update to avoid console spam
      }

      dispatch({ type: "UPDATE_LTP", payload: newPrice });
    }, 500);

    // Update candle every second
    intervalsRef.current.candle = setInterval(() => {
      const currentTime = Math.floor(Date.now() / 1000);
      const candleTime = state.currentCandle.time + timeframeSeconds;

      const candleCount = ++updateCounterRef.current.candle;
      console.log(`[useLiveData] Candle Update #${candleCount}`);

      if (currentTime >= candleTime) {
        // Generate new candle
        const newCandle = generateNewCandle(state.currentCandle, timeframe);
        const newData = [...state.data.slice(1), newCandle];
        dispatch({
          type: "ADD_NEW_CANDLE",
          payload: {
            data: newData,
            newCandle,
          },
        });
      } else {
        // Update current candle
        const updatedCandle = updateCurrentCandle(
          state.currentCandle,
          lastPriceRef.current
        );
        if (updatedCandle) {
          dispatch({ type: "UPDATE_CANDLE", payload: updatedCandle });
        }
      }
    }, 1000);

    return () => {
      if (intervalsRef.current.ltp) clearInterval(intervalsRef.current.ltp);
      if (intervalsRef.current.candle)
        clearInterval(intervalsRef.current.candle);
    };
  }, [state.isLive, state.currentCandle, timeframe]);

  return {
    data: state.data,
    isLive: state.isLive,
    toggleLive,
    lastPrice: state.lastPrice,
    change: state.change,
    percentChange: state.percentChange,
  };
};
