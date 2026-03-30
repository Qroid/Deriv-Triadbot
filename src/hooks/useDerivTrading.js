import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { APP_CONFIG } from '../lib/config';
import { useRiskManager } from '../lib/analysis/riskManager';
import { StrategyPerformance } from '../lib/analysis/strategyPerformance';

/**
 * useDerivTrading — Sequential Rapid Fire trade execution
 * Fixed: processNextRapidFireTrade stored in a ref so WS onmessage closure
 * always sees the latest version (no stale closure bug).
 */

async function resolveToken() {
  try {
    const res = await fetch('/api/get-ws-token');
    if (res.ok) {
      const data = await res.json();
      if (data?.token) return data.token;
    }
  } catch {}
  // Fallback for local dev
  const active = localStorage.getItem('active_loginid');
  const accounts = localStorage.getItem('deriv_accounts');
  if (accounts && active) {
    try {
      const list = JSON.parse(accounts);
      const acc = list.find(a => a.loginid === active);
      if (acc?.token) return acc.token;
    } catch {}
  }
  return localStorage.getItem('deriv_token') || null;
}

export function useDerivTrading(balance = 0, riskConfig = {}) {
  const [sessionStats, setSessionStats] = useState({
    wins: 0, losses: 0, profit: 0, tradesCount: 0,
  });

  const { canTrade, calculateStake, recordResult, resetSession, stats: riskStats }
    = useRiskManager(balance, riskConfig);
  const perfTracker = useRef(new StrategyPerformance());

  const [isRapidFireActive, setIsRapidFireActive] = useState(false);
  const isRapidFireActiveRef = useRef(false);
  const rapidFireQueueRef = useRef([]);
  const wsRef = useRef(null);
  // Store the latest processNextRapidFireTrade in a ref so the WS closure never goes stale
  const processNextRef = useRef(null);

  useEffect(() => {
    isRapidFireActiveRef.current = isRapidFireActive;
  }, [isRapidFireActive]);

  // ── processNextRapidFireTrade ──────────────────────────────────────────────
  const processNextRapidFireTrade = useCallback(() => {
    if (rapidFireQueueRef.current.length === 0) {
      setIsRapidFireActive(false);
      toast.info('Rapid Fire Sequence Completed');
      return;
    }

    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setIsRapidFireActive(false);
      toast.error('WebSocket not connected. Please refresh.');
      return;
    }

    const trade = rapidFireQueueRef.current.shift();
    const requestId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    // Map contract type string → Deriv API contract_type
    const contractTypeMap = {
      OVER:    'DIGITOVER',
      UNDER:   'DIGITUNDER',
      RISE:    'CALL',
      FALL:    'PUT',
      DIFFERS: 'DIGITDIFF',
      MATCHES: 'DIGITMATCH',
      ODD:     'DIGITODD',
      EVEN:    'DIGITEVEN',
      CALL:    'CALL',
      PUT:     'PUT',
    };
    const contractType = contractTypeMap[trade.type] || trade.type;

    const proposalReq = {
      proposal: 1,
      amount: Math.max(0.35, Math.round(trade.amount * 100) / 100),
      basis: 'stake',
      contract_type: contractType,
      currency: 'USD',
      duration: 1,
      duration_unit: 't',
      symbol: trade.symbol,
      passthrough: {
        request_id: requestId,
        confidence: trade.confidence,
        symbol: trade.symbol,
        family: trade.contractFamily,
      },
    };

    // Only digit-type contracts take a barrier
    if (['DIGITOVER', 'DIGITUNDER', 'DIGITDIFF', 'DIGITMATCH'].includes(contractType)) {
      proposalReq.barrier = String(trade.barrier ?? 5);
    }

    ws.send(JSON.stringify(proposalReq));
  }, []);

  // Keep processNextRef in sync
  useEffect(() => {
    processNextRef.current = processNextRapidFireTrade;
  }, [processNextRapidFireTrade]);

  // ── WebSocket Setup ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      const token = await resolveToken();
      if (!token || cancelled) return;

      const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ authorize: token }));

      ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        const requestId = data.passthrough?.request_id;

        if (data.error) {
          toast.error(`Trade Error: ${data.error.message}`);
          if (isRapidFireActiveRef.current) processNextRef.current?.();
          return;
        }

        // Proposal → immediately buy
        if (data.msg_type === 'proposal' && requestId) {
          ws.send(JSON.stringify({
            buy: data.proposal.id,
            price: data.proposal.ask_price,
            passthrough: { request_id: requestId },
          }));
        }

        // Buy confirmed → subscribe to outcome & process next in queue
        if (data.msg_type === 'buy') {
          toast.success('Trade Placed');
          ws.send(JSON.stringify({
            proposal_open_contract: 1,
            contract_id: data.buy.contract_id,
            subscribe: 1,
          }));
          if (isRapidFireActiveRef.current) {
            setTimeout(() => processNextRef.current?.(), 150);
          }
        }

        // Contract settled
        if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract?.is_sold) {
          const contract = data.proposal_open_contract;
          const profit = parseFloat(contract.profit);
          const win = profit > 0;
          const confidence = data.echo_req?.passthrough?.confidence || 0;
          const sym = data.echo_req?.passthrough?.symbol;
          const contractFamily = data.echo_req?.passthrough?.family;

          setSessionStats(prev => ({
            ...prev,
            wins: prev.wins + (win ? 1 : 0),
            losses: prev.losses + (win ? 0 : 1),
            profit: prev.profit + profit,
            tradesCount: prev.tradesCount + 1,
          }));

          recordResult(profit);
          if (sym && contractFamily) {
            perfTracker.current.record(sym, contractFamily, win, confidence);
          }

          if (win) toast.success(`Won: +$${profit.toFixed(2)}`);
          else toast.error(`Lost: -$${Math.abs(profit).toFixed(2)}`);
        }
      };

      ws.onclose = () => {
        if (!cancelled) setTimeout(connect, 5000); // auto-reconnect
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (wsRef.current) wsRef.current.close();
    };
  }, [recordResult]);

  // ── initiateSequentialRapidFire ───────────────────────────────────────────
  const initiateSequentialRapidFire = useCallback((trades, amount, type, barrier, symbol, confidence, contractFamily) => {
    const riskCheck = canTrade(confidence, contractFamily, barrier);
    if (!riskCheck.allowed) {
      toast.error(`Trade blocked: ${riskCheck.reason}`);
      return;
    }

    // Halve stake for under-performing strategies
    if (perfTracker.current.shouldAvoid(symbol, contractFamily)) {
      toast.warning(`${contractFamily} has low win rate on ${symbol}. Stake halved.`);
      amount = amount * 0.5;
    }

    // Use Kelly-adjusted stake from risk manager
    const { stake } = calculateStake(confidence, contractFamily, barrier);
    amount = stake;

    const queue = [];
    for (let i = 0; i < trades; i++) {
      queue.push({ amount, type, barrier, symbol, confidence, contractFamily });
    }
    rapidFireQueueRef.current = queue;
    setIsRapidFireActive(true);
    processNextRef.current?.();
  }, [canTrade, calculateStake]);

  return {
    initiateSequentialRapidFire,
    isRapidFireActive,
    sessionStats,
    riskStats,
    strategyPerformance: perfTracker.current.getSummary(),
    resetRiskSession: resetSession,
    resetStats: () => setSessionStats({ wins: 0, losses: 0, profit: 0, tradesCount: 0 }),
  };
}
