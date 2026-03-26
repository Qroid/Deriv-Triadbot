import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * useDerivTrading - Ported Sequential Rapid Fire & Trade Execution
 * 
 * This hook manages the trade execution lifecycle from the legacy app:
 * 1. Sequential Rapid Fire (initiateSequentialRapidFire)
 * 2. Proposal-to-Buy flow (request -> cache -> purchase)
 * 3. Session Statistics (win/loss/profit)
 */

const AFFILIATE_TOKEN = '3FAF9FB6-DA58-4558-964B-6F0DF4606B4C';

export function useDerivTrading() {
  const [sessionStats, setSessionStats] = useState({
    wins: 0,
    losses: 0,
    profit: 0,
    tradesCount: 0
  });

  const [isRapidFireActive, setIsRapidFireActive] = useState(false);
  const rapidFireQueueRef = useRef([]);
  const wsRef = useRef(null);
  const proposalCacheRef = useRef({});

  // Connect WebSocket for trading
  useEffect(() => {
    const token = localStorage.getItem('deriv_token');
    if (!token) return;

    const ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=100634');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      const requestId = data.passthrough?.request_id;

      if (data.error) {
        toast.error(`Trade Error: ${data.error.message}`);
        if (isRapidFireActive) processNextRapidFireTrade();
        return;
      }

      // 1. Handle Proposal -> Buy
      if (data.msg_type === 'proposal' && requestId) {
        proposalCacheRef.current[requestId] = {
          id: data.proposal.id,
          ask_price: data.proposal.ask_price
        };

        // Immediately Buy (Rapid Fire logic)
        ws.send(JSON.stringify({
          buy: data.proposal.id,
          price: data.proposal.ask_price,
          passthrough: { request_id: requestId, affiliate_token: AFFILIATE_TOKEN }
        }));
      }

      // 2. Handle Buy Completion
      if (data.msg_type === 'buy') {
        toast.success('Trade Placed Successfully');
        // Start watching this specific contract for results
        ws.send(JSON.stringify({
          proposal_open_contract: 1,
          contract_id: data.buy.contract_id,
          subscribe: 1
        }));
        if (isRapidFireActive) {
          setTimeout(processNextRapidFireTrade, 100);
        }
      }

      // 3. Handle Contract Results (Win/Loss)
      if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract.is_sold) {
        const contract = data.proposal_open_contract;
        const profit = parseFloat(contract.profit);
        const win = profit > 0;

        setSessionStats(prev => ({
          ...prev,
          wins: prev.wins + (win ? 1 : 0),
          losses: prev.losses + (win ? 0 : 1),
          profit: prev.profit + profit,
          tradesCount: prev.tradesCount + 1
        }));

        if (win) toast.success(`Trade Won: +$${profit.toFixed(2)}`);
        else toast.error(`Trade Lost: $${Math.abs(profit).toFixed(2)}`);
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isRapidFireActive]);

  const processNextRapidFireTrade = useCallback(() => {
    if (rapidFireQueueRef.current.length === 0) {
      setIsRapidFireActive(false);
      toast.info('Rapid Fire Sequence Completed');
      return;
    }

    const trade = rapidFireQueueRef.current.shift();
    const requestId = `rf_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    let contractType = trade.type === 'OVER' ? 'DIGITOVER' : 'DIGITUNDER';
    if (trade.type === 'RISE') contractType = 'CALL';
    if (trade.type === 'FALL') contractType = 'PUT';
    if (trade.type === 'DIFFERS') contractType = 'DIGITDIFF';

    wsRef.current.send(JSON.stringify({
      proposal: 1,
      amount: trade.amount,
      basis: 'stake',
      contract_type: contractType,
      currency: 'USD',
      duration: 1,
      duration_unit: 't',
      symbol: trade.symbol,
      barrier: trade.barrier,
      passthrough: { request_id: requestId }
    }));
  }, []);

  const initiateSequentialRapidFire = useCallback((trades, amount, type, barrier, symbol) => {
    const queue = [];
    for (let i = 0; i < trades; i++) {
      queue.push({ amount, type, barrier, symbol });
    }
    rapidFireQueueRef.current = queue;
    setIsRapidFireActive(true);
    processNextRapidFireTrade();
  }, [processNextRapidFireTrade]);

  return {
    initiateSequentialRapidFire,
    isRapidFireActive,
    sessionStats,
    resetStats: () => setSessionStats({ wins: 0, losses: 0, profit: 0, tradesCount: 0 })
  };
}
