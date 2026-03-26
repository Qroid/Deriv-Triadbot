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
 * Enhanced Market Analysis Engine
 * Ported and improved from professional binary bot strategies.
 */

export function calculateTrend(ticks, windowSize = 1000) {
  if (ticks.length < windowSize) return "NEUTRAL";
  const recent = ticks.slice(-windowSize).map(t => parseFloat(t));
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = ((last - first) / first) * 100;
  
  if (diff > 0.05) return "BULLISH";
  if (diff < -0.05) return "BEARISH";
  return "NEUTRAL";
}

export function detectSpike(ticks, asset) {
  if (ticks.length < 5) return null;
  const last = parseFloat(ticks[ticks.length - 1]);
  const prev = parseFloat(ticks[ticks.length - 2]);
  const diff = ((last - prev) / prev) * 100;

  if (asset.includes("Boom") && diff > 0.2) return "SPIKE_UP";
  if (asset.includes("Crash") && diff < -0.2) return "SPIKE_DOWN";
  if (asset.includes("Step")) {
    const consecutive = ticks.slice(-10).map((t, i, arr) => {
      if (i === 0) return true;
      const d = parseFloat(t) - parseFloat(arr[i-1]);
      return d > 0;
    });
    const ups = consecutive.filter(u => u).length;
    if (ups >= 8) return "STEP_UP";
    if (ups <= 2) return "STEP_DOWN";
  }
  return null;
}

/**
 * Enhanced Autoscan strategy with Confidence Score.
 * Returns a detailed signal object.
 */
export function runAutoscan(digitCounts, consecutiveDigits, ticks, asset) {
  const sorted = Object.entries(digitCounts)
    .map(([d, c]) => ({ digit: parseInt(d), count: c }))
    .sort((a, b) => a.count - b.count);

  const least = sorted[0].digit;
  const almostLeast = sorted[1].digit;
  const pair = [least, almostLeast].sort((a, b) => a - b).join("");
  
  // Calculate frequency gap (how much less frequent are they?)
  const avgCount = Object.values(digitCounts).reduce((a, b) => a + b, 0) / 10;
  const gap = (avgCount - sorted[0].count) / avgCount;
  
  let confidence = Math.min(Math.round(gap * 200), 100); // 0-100 score
  let tradeType = null;
  let barrier = null;

  if (pair === "01") { tradeType = "OVER"; barrier = 1; }
  else if (pair === "89") { tradeType = "UNDER"; barrier = 8; }
  
  const trend = calculateTrend(ticks);
  const spike = detectSpike(ticks, asset);

  // High priority for Spikes on Boom/Crash
  if (spike) {
    const isUp = spike === "SPIKE_UP";
    return {
      type: isUp ? "SPIKE UP" : "SPIKE DOWN",
      dir: isUp ? "RISE" : "FALL",
      contract: isUp ? "BOOM BUY" : "CRASH SELL",
      confidence: 100,
      trend,
      spike,
      reason: `Detected immediate ${spike.replace("_", " ")} on ${asset}. Catch the momentum!`,
      pair: null
    };
  }

  // Boost confidence if trend aligns
  if (tradeType === "OVER" && trend === "BULLISH") confidence += 15;
  if (tradeType === "UNDER" && trend === "BEARISH") confidence += 15;
  if (spike) confidence += 30; // Spikes are high-conviction events

  confidence = Math.min(confidence, 100);

  if (!tradeType) {
    return { 
      type: "NEUTRAL", 
      reason: `Least pair: ${least},${almostLeast} — no setup`, 
      confidence: 0,
      trend,
      pair 
    };
  }

  const isConsecutive = consecutiveDigits.length >= 2 && 
    [consecutiveDigits[consecutiveDigits.length - 2], consecutiveDigits[consecutiveDigits.length - 1]]
    .sort((a, b) => a - b).join("") === pair;

  if (isConsecutive) {
    const isOver = tradeType === "OVER";
    return {
      type: isOver ? "OVER SIGNAL" : "UNDER SIGNAL",
      dir: isOver ? "RISE" : "FALL",
      contract: isOver ? "DIGIT OVER 1" : "DIGIT UNDER 8",
      barrier,
      tradeType,
      confidence,
      trend,
      spike,
      reason: `Digit Pattern: ${pair} is the least frequent pair AND appeared consecutively. High probability for ${isOver ? "Over 1" : "Under 8"}.`,
      pair,
    };
  }

  return {
    type: "NEUTRAL",
    reason: `Potential ${tradeType} setup with ${pair} (${confidence}% confidence). Waiting for consecutive appearance.`,
    confidence: Math.round(confidence / 2),
    trend,
    pair,
  };
}

// ─── State Builder ────────────────────────────────────────────────────────────
function buildInitialState(assets) {
  const state = {};
  assets.forEach(asset => {
    const symbol = SYMBOL_MAP[asset];
    const decimals = getDecimalPlaces(symbol);
    
    state[asset] = {
      ticks: [],
      price: 0,
      changePct: 0,
      digitCounts: Array(10).fill(0),
      uniqueCounts: [],
      consecutiveDigits: [],
      totalEven: 0,
      totalOdd: 0,
      signal: { type: "COLLECTING", reason: "Initializing...", confidence: 0 },
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
  const isLiveRef = useRef(false);

  // Initialize mutable state
  useEffect(() => {
    assets.forEach(asset => {
      stateRef.current[asset] = { 
        ticks: [], 
        digitCounts: Array(10).fill(0), 
        consecutiveDigits: [], 
        totalEven: 0, 
        totalOdd: 0 
      };
    });
  }, [assets]);

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
    const signal = runAutoscan(s.digitCounts, s.consecutiveDigits, s.ticks, asset);
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
              ticks_history: symbol, end: "latest", count: 1000, style: "ticks"
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
    }
  }, [assets, processTick]);

  return data;
}