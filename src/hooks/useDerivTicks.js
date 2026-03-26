/**
 * useDerivTicks — Real Deriv WebSocket tick engine
 * Connects to wss://ws.derivws.com/websockets/v3
 * Implements the exact analysis from the Binary Bot Controller:
 *  - Last digit extraction (symbol-specific decimal places)
 *  - Digit frequency counts (0–9) with color tiers
 *  - Odd/Even percentage tracking
 *  - Consecutive digit tracking for autoscan
 *  - Autoscan strategy: find 0,1 or 8,9 as least-freq pair → OVER 1 / UNDER 8
 *
 * Falls back to GBM simulation when no API token is stored.
 */

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Symbol Map ───────────────────────────────────────────────────────────────
export const SYMBOL_MAP = {
  "Volatility 10 Index":    "R_10",
  "Volatility 25 Index":    "R_25",
  "Volatility 50 Index":    "R_50",
  "Volatility 75 Index":    "R_75",
  "Volatility 100 Index":   "R_100",
  "Boom 1000 Index":        "BOOM1000",
  "Boom 500 Index":         "BOOM500",
  "Crash 1000 Index":       "CRASH1000",
  "Crash 500 Index":        "CRASH500",
  "Step Index":             "STPIDX",
  "Range Break 100 Index":  "RDBULL100",
  "Range Break 200 Index":  "RDBULL200",
};

// Deriv symbol → decimal places (from the original bot)
export function getDecimalPlaces(symbol) {
  switch (symbol) {
    case "R_10": case "R_25": return 3;
    case "R_50": case "R_75": return 4;
    default: return 2;
  }
}

// Extract last digit from a price string (preserving trailing zeros)
export function getLastDigit(priceStr, symbol) {
  const decimals = getDecimalPlaces(symbol);
  const formatted = parseFloat(priceStr).toFixed(decimals);
  const last = formatted.slice(-1);
  const d = parseInt(last, 10);
  return isNaN(d) ? null : d;
}

// ─── Digit Analysis ───────────────────────────────────────────────────────────
/**
 * Returns color tier for a digit given sorted unique counts.
 * green   = least frequent   → trade signal candidate
 * yellow  = 2nd least frequent
 * orange  = 2nd most frequent
 * red     = most frequent
 * default = all others
 */
export function getDigitColorTier(count, uniqueCounts) {
  if (uniqueCounts.length === 0 || count === 0) return "default";
  const sorted = [...uniqueCounts].sort((a, b) => a - b);
  const min1 = sorted[0];
  const min2 = sorted[1] ?? null;
  const max1 = sorted[sorted.length - 1];
  const max2 = sorted[sorted.length - 2] ?? null;
  if (count === max1) return "red";
  if (max2 !== null && count === max2) return "orange";
  if (count === min1) return "green";
  if (min2 !== null && count === min2) return "yellow";
  return "default";
}

/**
 * Autoscan strategy — direct port from the original bot.
 * Finds the two least-frequent digits. If they form the pair [0,1] or [8,9],
 * checks if those two digits appeared consecutively in recent ticks.
 * Returns a signal object or null.
 */
export function runAutoscan(digitCounts, consecutiveDigits) {
  const sorted = Object.entries(digitCounts)
    .map(([d, c]) => ({ digit: parseInt(d), count: c }))
    .sort((a, b) => a.count - b.count);

  const least = sorted[0].digit;
  const almostLeast = sorted[1].digit;
  const pair = [least, almostLeast].sort((a, b) => a - b).join("");

  let tradeType = null;
  let barrier = null;

  if (pair === "01") { tradeType = "OVER"; barrier = 1; }
  else if (pair === "89") { tradeType = "UNDER"; barrier = 8; }
  else return { type: "NEUTRAL", reason: `Least pair: ${least},${almostLeast} — no valid setup`, pair: null };

  if (consecutiveDigits.length >= 2) {
    const last2 = [
      consecutiveDigits[consecutiveDigits.length - 2],
      consecutiveDigits[consecutiveDigits.length - 1],
    ].sort((a, b) => a - b).join("");

    if (last2 === pair) {
      return {
        type: tradeType === "OVER" ? "STRONG BUY" : "STRONG SELL",
        dir: tradeType === "OVER" ? "RISE" : "FALL",
        contract: tradeType === "OVER" ? "DIGIT OVER 1" : "DIGIT UNDER 8",
        barrier,
        tradeType,
        reason: `Autoscan: digits ${pair[0]} & ${pair[1]} are least frequent AND appeared consecutively`,
        pair,
      };
    } else {
      return {
        type: "NEUTRAL",
        reason: `Least pair [${pair[0]},${pair[1]}] found — waiting for consecutive appearance (last: ${last2})`,
        pair,
      };
    }
  }

  return {
    type: "NEUTRAL",
    reason: `Least pair [${pair[0]},${pair[1]}] — collecting consecutive digits`,
    pair,
  };
}

// ─── GBM Simulation Fallback ─────────────────────────────────────────────────
const SIM_PROFILES = {
  R_10:      { base: 9823.42,  v: 0.0010, type: "volatility" },
  R_25:      { base: 24831.25, v: 0.0025, type: "volatility" },
  R_50:      { base: 5028.452, v: 0.0050, type: "volatility" },
  R_75:      { base: 7634.218, v: 0.0075, type: "volatility" },
  R_100:     { base: 100321.4, v: 0.0100, type: "volatility" },
  BOOM1000:  { base: 98432.15, v: 0.0020, type: "boom",  spikeEvery: 1000, spikeDir: 1 },
  BOOM500:   { base: 98123.45, v: 0.0022, type: "boom",  spikeEvery: 500,  spikeDir: 1 },
  CRASH1000: { base: 7834.21,  v: 0.0020, type: "crash", spikeEvery: 1000, spikeDir: -1 },
  CRASH500:  { base: 7612.33,  v: 0.0022, type: "crash", spikeEvery: 500,  spikeDir: -1 },
  STPIDX:    { base: 9102.10,  v: 0.0001, type: "step",  step: 0.10 },
  RDBULL100: { base: 1287.540, v: 0.0008, type: "range" },
  RDBULL200: { base: 1312.820, v: 0.0008, type: "range" },
};

function simNextPrice(last, profile) {
  if (profile.type === "step") return last + (Math.random() > 0.5 ? 1 : -1) * profile.step;
  if (profile.type === "boom") {
    if (Math.random() < 1 / profile.spikeEvery) return last * (1 + profile.v * 12);
    return last * (1 - Math.abs(Math.random() * profile.v));
  }
  if (profile.type === "crash") {
    if (Math.random() < 1 / profile.spikeEvery) return last * (1 - profile.v * 12);
    return last * (1 + Math.abs(Math.random() * profile.v));
  }
  return last * (1 + (Math.random() - 0.5) * 2 * profile.v);
}

// ─── State Builder ────────────────────────────────────────────────────────────
function buildInitialState(assets) {
  const state = {};
  assets.forEach(asset => {
    const symbol = SYMBOL_MAP[asset];
    const decimals = getDecimalPlaces(symbol);
    const profile = SIM_PROFILES[symbol];
    let price = profile?.base ?? 10000;
    const ticks = [];
    const digitCounts = Array(10).fill(0);
    const consecutiveDigits = [];
    let totalEven = 0, totalOdd = 0;

    for (let i = 0; i < 80; i++) {
      price = simNextPrice(price, profile || { type: "volatility", v: 0.005 });
      const priceStr = price.toFixed(decimals);
      ticks.push(priceStr);
      const d = getLastDigit(priceStr, symbol);
      if (d !== null) {
        digitCounts[d]++;
        if (d % 2 === 0) totalEven++; else totalOdd++;
        if (consecutiveDigits.length === 0 || consecutiveDigits[consecutiveDigits.length - 1] !== d) {
          consecutiveDigits.push(d);
          if (consecutiveDigits.length > 2) consecutiveDigits.shift();
        }
      }
    }

    const uniqueCounts = [...new Set(digitCounts.filter(c => c > 0))];
    const signal = runAutoscan(digitCounts, consecutiveDigits);
    const openPrice = parseFloat(ticks[0]);
    const lastPrice = parseFloat(ticks[ticks.length - 1]);

    state[asset] = {
      ticks,
      price: lastPrice,
      changePct: ((lastPrice - openPrice) / openPrice) * 100,
      digitCounts: [...digitCounts],
      uniqueCounts,
      consecutiveDigits: [...consecutiveDigits],
      totalEven,
      totalOdd,
      signal,
      symbol,
      decimals,
      isLive: false,
    };
  });
  return state;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
const TICK_LIMIT = 1000;

export function useDerivTicks(assets) {
  const [data, setData] = useState(() => buildInitialState(assets));
  const wsRef = useRef(null);
  const stateRef = useRef({}); // Mutable per-asset state (ticks, counts)
  const simIntervalRef = useRef(null);
  const isLiveRef = useRef(false);

  // Initialize mutable state from initial render
  useEffect(() => {
    assets.forEach(asset => {
      const symbol = SYMBOL_MAP[asset];
      const decimals = getDecimalPlaces(symbol);
      const profile = SIM_PROFILES[symbol];
      let price = profile?.base ?? 10000;
      const ticks = [];
      const digitCounts = Array(10).fill(0);
      const consecutiveDigits = [];
      let totalEven = 0, totalOdd = 0;

      for (let i = 0; i < 80; i++) {
        price = simNextPrice(price, profile || { type: "volatility", v: 0.005 });
        const priceStr = price.toFixed(decimals);
        ticks.push(priceStr);
        const d = getLastDigit(priceStr, symbol);
        if (d !== null) {
          digitCounts[d]++;
          if (d % 2 === 0) totalEven++; else totalOdd++;
          if (consecutiveDigits.length === 0 || consecutiveDigits[consecutiveDigits.length - 1] !== d) {
            consecutiveDigits.push(d);
            if (consecutiveDigits.length > 2) consecutiveDigits.shift();
          }
        }
      }
      stateRef.current[asset] = { ticks, digitCounts, consecutiveDigits, totalEven, totalOdd };
    });
  }, []);

  const processTick = useCallback((asset, priceStr) => {
    const symbol = SYMBOL_MAP[asset];
    const decimals = getDecimalPlaces(symbol);
    const s = stateRef.current[asset];
    if (!s) return;

    // Update ticks (cap at TICK_LIMIT)
    s.ticks.push(priceStr);
    if (s.ticks.length > TICK_LIMIT) {
      const removed = s.ticks.shift();
      const oldDigit = getLastDigit(removed, symbol);
      if (oldDigit !== null) {
        s.digitCounts[oldDigit] = Math.max(0, s.digitCounts[oldDigit] - 1);
        if (oldDigit % 2 === 0) s.totalEven = Math.max(0, s.totalEven - 1);
        else s.totalOdd = Math.max(0, s.totalOdd - 1);
      }
    }

    const d = getLastDigit(priceStr, symbol);
    if (d !== null) {
      s.digitCounts[d]++;
      if (d % 2 === 0) s.totalEven++; else s.totalOdd++;
      // Consecutive digit tracking (exact port from original bot)
      if (s.consecutiveDigits.length === 0 || s.consecutiveDigits[s.consecutiveDigits.length - 1] !== d) {
        s.consecutiveDigits.push(d);
      }
      if (s.consecutiveDigits.length > 2) s.consecutiveDigits.shift();
    }

    const uniqueCounts = [...new Set(s.digitCounts.filter(c => c > 0))];
    const signal = runAutoscan(s.digitCounts, s.consecutiveDigits);
    const openPrice = parseFloat(s.ticks[0]);
    const lastPrice = parseFloat(priceStr);

    setData(prev => ({
      ...prev,
      [asset]: {
        ...prev[asset],
        ticks: [...s.ticks],
        price: lastPrice,
        changePct: ((lastPrice - openPrice) / openPrice) * 100,
        digitCounts: [...s.digitCounts],
        uniqueCounts,
        consecutiveDigits: [...s.consecutiveDigits],
        totalEven: s.totalEven,
        totalOdd: s.totalOdd,
        signal,
        isLive: isLiveRef.current,
      }
    }));
  }, []);

  // ── Try real Deriv WS ──
  useEffect(() => {
    const token = localStorage.getItem("deriv_token");

    if (token) {
      // Real WS connection
      const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=100634");
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);

        if (msg.msg_type === "authorize" && !msg.error) {
          isLiveRef.current = true;
          // Request history + subscribe for each asset
          assets.forEach(asset => {
            const symbol = SYMBOL_MAP[asset];
            ws.send(JSON.stringify({
              ticks_history: symbol, end: "latest", count: 500, style: "ticks"
            }));
          });
        }

        if (msg.msg_type === "history" && msg.history?.prices) {
          // Find which asset this history belongs to
          const symbol = msg.echo_req?.ticks_history;
          const asset = assets.find(a => SYMBOL_MAP[a] === symbol);
          if (!asset) return;
          const s = stateRef.current[asset];
          if (!s) return;
          // Seed with real history
          s.ticks = msg.history.prices.map(p => String(p));
          s.digitCounts.fill(0);
          s.totalEven = 0; s.totalOdd = 0;
          s.consecutiveDigits = [];
          s.ticks.forEach(priceStr => {
            const d = getLastDigit(priceStr, symbol);
            if (d !== null) {
              s.digitCounts[d]++;
              if (d % 2 === 0) s.totalEven++; else s.totalOdd++;
              if (s.consecutiveDigits.length === 0 || s.consecutiveDigits[s.consecutiveDigits.length - 1] !== d) {
                s.consecutiveDigits.push(d);
                if (s.consecutiveDigits.length > 2) s.consecutiveDigits.shift();
              }
            }
          });
          // Subscribe to live ticks
          ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        }

        if (msg.msg_type === "tick" && msg.tick) {
          const symbol = msg.tick.symbol;
          const asset = assets.find(a => SYMBOL_MAP[a] === symbol);
          if (asset) processTick(asset, String(msg.tick.quote));
        }
      };

      ws.onclose = () => { isLiveRef.current = false; };

      return () => { ws.close(); };
    } else {
      // ── Simulation fallback ──
      simIntervalRef.current = setInterval(() => {
        assets.forEach(asset => {
          const symbol = SYMBOL_MAP[asset];
          const decimals = getDecimalPlaces(symbol);
          const profile = SIM_PROFILES[symbol] || { type: "volatility", v: 0.005 };
          const s = stateRef.current[asset];
          if (!s || s.ticks.length === 0) return;
          const lastPrice = parseFloat(s.ticks[s.ticks.length - 1]);
          const newPrice = simNextPrice(lastPrice, profile);
          processTick(asset, newPrice.toFixed(decimals));
        });
      }, 700);

      return () => clearInterval(simIntervalRef.current);
    }
  }, [assets, processTick]);

  return data;
}