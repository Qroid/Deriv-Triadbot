/**
 * useDerivTicks — Real Deriv WebSocket tick engine
 * Focused exclusively on Deriv Digits markets (Volatility Indices only).
 * Supports: Rise/Fall · Matches/Differs · Even/Odd · Over/Under
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { APP_CONFIG } from "../lib/config";
import { selectBestContract, computeStatisticalEdge } from '../lib/analysis/digitEngine';

// ─── Symbol Map (Digits markets ONLY) ────────────────────────────────────────
// Boom, Crash, Step Index and Range Break are NOT digits markets — removed.
export const SYMBOL_MAP = {
  "Volatility 10 Index":      "R_10",
  "Volatility 25 Index":      "R_25",
  "Volatility 50 Index":      "R_50",
  "Volatility 75 Index":      "R_75",
  "Volatility 100 Index":     "R_100",
  "Volatility 10 (1s) Index": "1HZ10V",
  "Volatility 25 (1s) Index": "1HZ25V",
  "Volatility 50 (1s) Index": "1HZ50V",
  "Volatility 75 (1s) Index": "1HZ75V",
  "Volatility 100 (1s) Index":"1HZ100V",
};

// ─── Decimal Places per Symbol ────────────────────────────────────────────────
export function getDecimalPlaces(symbol) {
  switch (symbol) {
    case "R_10": case "R_25": return 3;
    case "R_50": case "R_75": return 4;
    default: return 2;
  }
}

// ─── Last Digit Extractor ─────────────────────────────────────────────────────
export function getLastDigit(priceStr, symbol) {
  const decimals = getDecimalPlaces(symbol);
  const formatted = parseFloat(priceStr).toFixed(decimals);
  const d = parseInt(formatted.slice(-1), 10);
  return isNaN(d) ? null : d;
}

// ─── Digit Color Tier ─────────────────────────────────────────────────────────
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

// ─── Price Trend ─────────────────────────────────────────────────────────────
export function calculateTrend(ticks, windowSize = 100) {
  if (ticks.length < windowSize) return "NEUTRAL";
  const recent = ticks.slice(-windowSize).map(t => parseFloat(t));
  const first = recent[0];
  const last = recent[recent.length - 1];
  const diff = ((last - first) / first) * 100;
  if (diff > 0.05) return "BULLISH";
  if (diff < -0.05) return "BEARISH";
  return "NEUTRAL";
}

// ─── Core Autoscan (Digits only — 4 signal families) ─────────────────────────
/**
 * Runs all 4 digit-based analysis families and picks the best signal.
 * Families: Matches/Differs · Over/Under · Odd/Even · Rise/Fall
 * (spike detection removed — not applicable to Volatility Indices)
 */
export function runAutoscan(digitCounts, consecutiveDigits, ticks, asset) {
  const trend = calculateTrend(ticks);

  // Need at least 50 ticks to start analysing
  if (ticks.length < 50) {
    return { type: "COLLECTING", reason: "Collecting ticks…", confidence: 0, trend };
  }

  const symbol = SYMBOL_MAP[asset];
  const digitHistory = ticks.map(t => getLastDigit(t, symbol)).filter(d => d !== null);
  const prices = ticks;

  // Use the master contract selector from digitEngine
  const best = selectBestContract(digitHistory, prices, asset);

  if (!best || !best.contract || best.confidence < 60) {
    return {
      type: "NEUTRAL",
      reason: "Scanning for digit patterns…",
      confidence: best?.confidence ?? 0,
      trend,
    };
  }

  return {
    type: `${best.contract} SIGNAL`,
    contract: best.contract,
    dir: ['RISE', 'CALL', 'OVER'].includes(best.contract) ? 'RISE' : 'FALL',
    barrier: best.barrier,
    confidence: best.confidence,
    reason: best.reason,
    family: best.family,
    trend,
    allAnalysis: best.allAnalysis,
  };
}

// ─── Initial State Builder ────────────────────────────────────────────────────
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
      signal: { type: "COLLECTING", reason: "Initializing…", confidence: 0 },
      symbol,
      decimals,
      isLive: false,
      bestContract: null,
      statEdge: null,
    };
  });
  return state;
}

// ─── Token Resolution (API + localStorage fallback for local dev) ─────────────
async function resolveToken(isVirtual) {
  try {
    const res = await fetch('/api/get-ws-token');
    if (res.ok) {
      const data = await res.json();
      if (data?.token) return data.token;
    }
  } catch {}
  // Fallback for local dev
  const key = isVirtual ? 'deriv_demo_token' : 'deriv_real_token';
  return localStorage.getItem(key)
    || localStorage.getItem('deriv_token')
    || null;
}

// ─── Main Hook ────────────────────────────────────────────────────────────────
const TICK_LIMIT = 1000;

export function useDerivTicks(assets) {
  const [data, setData] = useState(() => buildInitialState(assets));
  const wsRef = useRef(null);
  const stateRef = useRef({});
  const isLiveRef = useRef(false);
  const subscribedRef = useRef(false);

  // Initialise per-asset mutable state
  useEffect(() => {
    assets.forEach(asset => {
      stateRef.current[asset] = {
        ticks: [],
        digitCounts: Array(10).fill(0),
        consecutiveDigits: [],
        totalEven: 0,
        totalOdd: 0,
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
      if (s.consecutiveDigits.length > 3) s.consecutiveDigits.shift();
    }

    const uniqueCounts = [...new Set(s.digitCounts.filter(c => c > 0))];
    const signal = runAutoscan(s.digitCounts, s.consecutiveDigits, s.ticks, asset);
    const openPrice = parseFloat(s.ticks[0]);
    const lastPrice = parseFloat(priceStr);

    setData(prev => {
      const newTicks = [...s.ticks];
      const digitHistory = newTicks.map(t => getLastDigit(t, symbol)).filter(d => d !== null);

      let bestContract = prev[asset]?.bestContract ?? null;
      if (newTicks.length % 5 === 0 && digitHistory.length >= 100) {
        bestContract = selectBestContract(digitHistory, newTicks, asset);
      }

      let statEdge = prev[asset]?.statEdge ?? null;
      if (newTicks.length % 10 === 0 && digitHistory.length >= 100) {
        statEdge = computeStatisticalEdge(digitHistory);
      }

      return {
        ...prev,
        [asset]: {
          ...prev[asset],
          ticks: newTicks,
          price: lastPrice,
          changePct: openPrice > 0 ? ((lastPrice - openPrice) / openPrice) * 100 : 0,
          digitCounts: [...s.digitCounts],
          uniqueCounts,
          consecutiveDigits: [...s.consecutiveDigits],
          totalEven: s.totalEven,
          totalOdd: s.totalOdd,
          signal,
          isLive: isLiveRef.current,
          bestContract,
          statEdge,
        },
      };
    });
  }, []);

  useEffect(() => {
    if (assets.length === 0) return;

    let cancelled = false;

    const startConnection = async () => {
      const token = await resolveToken(true);

      if (cancelled) return;

      if (!token) {
        console.warn('[useDerivTicks] No token available — ticks will not stream.');
        return;
      }

      const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
      wsRef.current = ws;
      subscribedRef.current = false;

      ws.onopen = () => {
        isLiveRef.current = true;
        ws.send(JSON.stringify({ authorize: token }));
      };

      ws.onmessage = (msg) => {
        const res = JSON.parse(msg.data);

        if (res.error) {
          console.error('[useDerivTicks] API error:', res.error.message);
          return;
        }

        if (res.msg_type === 'authorize' && !subscribedRef.current) {
          subscribedRef.current = true;
          // Subscribe to ticks for all digit assets
          assets.forEach(asset => {
            ws.send(JSON.stringify({ ticks: SYMBOL_MAP[asset], subscribe: 1 }));
          });
        }

        if (res.msg_type === 'tick') {
          const symbol = res.tick.symbol;
          const assetName = Object.keys(SYMBOL_MAP).find(k => SYMBOL_MAP[k] === symbol);
          if (assetName) processTick(assetName, res.tick.quote);
        }
      };

      ws.onclose = () => {
        isLiveRef.current = false;
        subscribedRef.current = false;
        // Reconnect after 4s
        if (!cancelled) setTimeout(startConnection, 4000);
      };

      ws.onerror = () => {
        isLiveRef.current = false;
      };
    };

    startConnection();

    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [assets, processTick]);

  return data;
}
