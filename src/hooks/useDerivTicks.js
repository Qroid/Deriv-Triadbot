/**
 * useDerivTicks — Real Deriv WebSocket tick engine
 * Connects to wss://ws.derivws.com/websockets/v3
 * Implements the exact analysis from the Binary Bot Controller:
 *  - Last digit extraction (symbol-specific decimal places)
 *  - Digit frequency counts (0–9) with color tiers
 *  - Odd/Even percentage tracking
 *  - Consecutive digit tracking for autoscan
 *  - Autoscan strategy: find 0,1 or 8,9 as least-freq pair → OVER 1 / UNDER 8
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { APP_CONFIG } from "../lib/config";

// ─── Symbol Map ───────────────────────────────────────────────────────────────
export const SYMBOL_MAP = {
  "Volatility 10 Index":    "R_10",
  "Volatility 25 Index":    "R_25",
  "Volatility 50 Index":    "R_50",
  "Volatility 75 Index":    "R_75",
  "Volatility 100 Index":   "R_100",
  "Volatility 10 (1s) Index": "1HZ10V",
  "Volatility 25 (1s) Index": "1HZ25V",
  "Volatility 50 (1s) Index": "1HZ50V",
  "Volatility 75 (1s) Index": "1HZ75V",
  "Volatility 100 (1s) Index": "1HZ100V",
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

/**
 * Advanced Matches/Differs Analyzer
 * Implements Streak, Cyclic, and Sequence Analysis
 */
export function analyzeMatchesDiffers(ticks, asset) {
  if (ticks.length < 50) return { type: "COLLECTING", confidence: 0 };

  const symbol = SYMBOL_MAP[asset];
  const lastDigits = ticks.slice(-100).map(t => getLastDigit(t, symbol));
  const lastDigit = lastDigits[lastDigits.length - 1];
  const prevDigit = lastDigits[lastDigits.length - 2];

  // 1. Streak Analysis
  let mdStreaks = []; // Array of booleans: true for Match, false for Differ
  for (let i = 1; i < lastDigits.length; i++) {
    mdStreaks.push(lastDigits[i] === lastDigits[i - 1]);
  }

  const currentMatchStreak = (() => {
    let count = 0;
    for (let i = mdStreaks.length - 1; i >= 0; i--) {
      if (mdStreaks[i]) count++; else break;
    }
    return count;
  })();

  const currentDifferStreak = (() => {
    let count = 0;
    for (let i = mdStreaks.length - 1; i >= 0; i--) {
      if (!mdStreaks[i]) count++; else break;
    }
    return count;
  })();

  // 2. Frequency Analysis (Large Sample)
  const totalTrades = mdStreaks.length;
  const matchCount = mdStreaks.filter(s => s).length;
  const differCount = totalTrades - matchCount;
  const matchPct = (matchCount / totalTrades) * 100;
  const differPct = (differCount / totalTrades) * 100;

  // 3. Cyclic Pattern Detection (Repeating M/D patterns)
  // Look for repeating sequences like [D, D, M, D, D, M]
  const recentPattern = mdStreaks.slice(-6).map(s => s ? 'M' : 'D').join('');
  const cyclicPatterns = {
    "DDMDDM": "MATCHES",
    "MMDMMD": "DIFFERS",
    "DDDDDM": "MATCHES",
    "MMMMMD": "DIFFERS",
  };
  const predictedByCycle = cyclicPatterns[recentPattern];

  // 4. Signal Calculation
  let signal = { type: "NEUTRAL", confidence: 0, reason: "", contract: "", dir: "", barrier: lastDigit };

  // 4a. Digit Frequency Pair Strategy (Least Frequent)
  const sortedDigits = Object.entries(lastDigits.reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {})).sort((a, b) => a[1] - b[1]);
  
  const leastFreq = parseInt(sortedDigits[0]?.[0]);
  const secondLeastFreq = parseInt(sortedDigits[1]?.[0]);

  // 5. MATCHES Logic
  if (currentMatchStreak >= 2 || matchPct > 55 || predictedByCycle === "MATCHES") {
    let confidence = 40;
    if (currentMatchStreak >= 2) confidence += 30;
    if (matchPct > 55) confidence += 20;
    if (predictedByCycle === "MATCHES") confidence += 10;

    signal = {
      type: "MATCH SIGNAL",
      dir: "RISE",
      contract: "MATCHES",
      barrier: lastDigit,
      confidence: Math.min(confidence, 100),
      reason: `Match Streak: ${currentMatchStreak}x. Pattern suggest digit ${lastDigit} repeats.`,
      exitWarning: [8, 9, 0, 1].includes(lastDigit) ? "Extreme digit edge warning." : null
    };
  }
  // 6. DIFFERS Logic
  else if (currentDifferStreak >= 5 || differPct > 70 || predictedByCycle === "DIFFERS") {
    let confidence = 50;
    if (currentDifferStreak >= 5) confidence += 20;
    if (differPct > 70) confidence += 20;
    if (predictedByCycle === "DIFFERS") confidence += 10;

    signal = {
      type: "DIFFERS SIGNAL",
      dir: "FALL",
      contract: "DIFFERS",
      barrier: lastDigit,
      confidence: Math.min(confidence, 100),
      reason: `Differ Streak: ${currentDifferStreak}x. Stable digit volatility.`,
      exitWarning: lastDigit === leastFreq ? "Digit frequency low - potential reversal." : null
    };
  }
  // 7. OVER/UNDER (Least Freq Strategy)
  else if (leastFreq !== undefined) {
    if (leastFreq <= 1) { // 0 or 1 are least frequent -> OVER 1
      signal = {
        type: "OVER SIGNAL",
        dir: "RISE",
        contract: "OVER",
        barrier: 1,
        confidence: 75,
        reason: `Digit ${leastFreq} is cold. Prediction: OVER 1.`,
      };
    } else if (leastFreq >= 8) { // 8 or 9 are least frequent -> UNDER 8
      signal = {
        type: "UNDER SIGNAL",
        dir: "FALL",
        contract: "UNDER",
        barrier: 8,
        confidence: 75,
        reason: `Digit ${leastFreq} is cold. Prediction: UNDER 8.`,
      };
    }
  }

  return signal;
}

export function detectSpike(ticks, asset) {
  if (ticks.length < 5) return null;
  const last = parseFloat(ticks[ticks.length - 1]);
  const prev = parseFloat(ticks[ticks.length - 2]);
  const diff = ((last - prev) / prev) * 100;

  if (asset.includes("Boom") && diff > 0.2) return "SPIKE_UP";
  if (asset.includes("Crash") && diff < -0.2) return "SPIKE_DOWN";
  return null;
}

/**
 * Main Market Analysis Orchestrator
 */
export function runAutoscan(digitCounts, consecutiveDigits, ticks, asset) {
  const trend = calculateTrend(ticks);
  const spike = detectSpike(ticks, asset);
  
  // 1. Spike Priority
  if (spike) {
    const isUp = spike === "SPIKE_UP";
    return {
      type: isUp ? "SPIKE UP" : "SPIKE DOWN",
      dir: isUp ? "RISE" : "FALL",
      contract: isUp ? "BOOM BUY" : "CRASH SELL",
      confidence: 100,
      trend,
      spike,
      reason: `Immediate ${spike.replace("_", " ")} momentum!`,
    };
  }

  // 2. Matches/Differs Logic (New core strategy)
  const mdSignal = analyzeMatchesDiffers(ticks, asset);
  if (mdSignal.confidence >= 70) {
    return { ...mdSignal, trend };
  }

  // 3. Fallback to Neutral
  return { 
    type: "NEUTRAL", 
    reason: "Scanning for cyclic M/D patterns or streaks...", 
    confidence: 0,
    trend 
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
  const stateRef = useRef({}); 
  const isLiveRef = useRef(false);

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
    const s = stateRef.current[asset];
    if (!s) return;

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

  useEffect(() => {
    const token = localStorage.getItem("deriv_token");
    if (token) {
      const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));
      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.msg_type === "authorize" && !msg.error) {
          isLiveRef.current = true;
          assets.forEach(asset => {
            const symbol = SYMBOL_MAP[asset];
            ws.send(JSON.stringify({ ticks_history: symbol, end: "latest", count: 1000, style: "ticks" }));
          });
        }
        if (msg.msg_type === "history" && msg.history?.prices) {
          const symbol = msg.echo_req?.ticks_history;
          const asset = assets.find(a => SYMBOL_MAP[a] === symbol);
          if (!asset) return;
          const s = stateRef.current[asset];
          if (!s) return;
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
          ws.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        }
        if (msg.msg_type === "tick" && msg.tick) {
          const asset = assets.find(a => SYMBOL_MAP[a] === msg.tick.symbol);
          if (asset) processTick(asset, String(msg.tick.quote));
        }
      };
      ws.onclose = () => { isLiveRef.current = false; };
      return () => { ws.close(); };
    }
  }, [assets, processTick]);

  return data;
}
