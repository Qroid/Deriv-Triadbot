import { useState, useCallback, useRef } from 'react';

/**
 * SyntheticRiskManager - Risk system built for Deriv synthetic contract types.
 */
export class SyntheticRiskManager {
  constructor(config = {}) {
    this.config = {
      maxDailyLossPercent: config.maxDailyLossPercent ?? 10,
      maxConsecutiveLosses: config.maxConsecutiveLosses ?? 5,
      maxDailyTrades: config.maxDailyTrades ?? 100,
      minConfidence: config.minConfidence ?? 65,
      cooldownMs: config.cooldownMs ?? 30000,
      sessionProfitTargetPercent: config.sessionProfitTargetPercent ?? 20,
    };
    this.session = this.loadSession();
  }

  loadSession() {
    const today = new Date().toDateString();
    const stored = (() => {
      try {
        const data = localStorage.getItem('triadbot_risk');
        return data ? JSON.parse(data) : {};
      } catch {
        return {};
      }
    })();
    if (stored.date !== today) {
      return {
        date: today,
        pnl: 0,
        trades: 0,
        wins: 0,
        losses: 0,
        consecutiveLosses: 0,
        consecutiveWins: 0,
        lastTradeTime: 0
      };
    }
    return stored;
  }

  saveSession() {
    try {
      localStorage.setItem('triadbot_risk', JSON.stringify(this.session));
    } catch {}
  }

  canTrade(balance, confidence, contractFamily) {
    const s = this.session;
    const now = Date.now();
    
    // Cooldown check
    const cooldown = this.config.cooldownMs * Math.max(1, s.consecutiveLosses - 2);
    if (now - s.lastTradeTime < cooldown && s.consecutiveLosses >= 3) {
      return {
        allowed: false,
        reason: `Cooling down after ${s.consecutiveLosses} losses. Wait ${Math.ceil((cooldown - (now - s.lastTradeTime)) / 1000)}s`,
        waitMs: cooldown - (now - s.lastTradeTime)
      };
    }
    if (confidence < this.config.minConfidence) {
      return { allowed: false, reason: `Confidence ${confidence}% below minimum ${this.config.minConfidence}%` };
    }
    if (s.trades >= this.config.maxDailyTrades) {
      return { allowed: false, reason: `Daily trade limit (${this.config.maxDailyTrades}) reached` };
    }
    if (s.pnl < -(balance * this.config.maxDailyLossPercent / 100)) {
      return { allowed: false, reason: `Daily loss limit reached. PnL: $${s.pnl.toFixed(2)}` };
    }
    if (s.consecutiveLosses >= this.config.maxConsecutiveLosses) {
      return { allowed: false, reason: `${s.consecutiveLosses} consecutive losses. Take a break.` };
    }
    if (s.pnl > (balance * this.config.sessionProfitTargetPercent / 100)) {
      return { allowed: true, reason: `Profit target hit! Consider stopping. PnL: +$${s.pnl.toFixed(2)}` };
    }
    return { allowed: true, reason: null };
  }

  calculateStake(balance, confidence, contractFamily, barrier) {
    let stake = 0.35;
    const confProb = confidence / 100;

    if (contractFamily === 'DIFFERS') {
      stake = Math.min(balance * 0.02, balance * 0.005 + (confProb - 0.65) * balance * 0.03);
    } else if (contractFamily === 'MATCHES') {
      const payout = 35;
      const kelly = (confProb * payout - (1 - confProb)) / (payout || 1);
      stake = Math.min(balance * 0.01, 5, Math.max(0.35, balance * Math.max(0, kelly * 0.25)));
    } else if (contractFamily === 'OVER_UNDER') {
      const winProb = barrier !== null ? Math.min(0.9, (barrier <= 4 ? (9 - barrier) / 10 : barrier / 10)) : 0.6;
      const payout = barrier !== null ? (barrier === 4 || barrier === 5 ? 0.95 : barrier <= 2 || barrier >= 7 ? 0.12 : 0.35) : 0.95;
      const kelly = (winProb * payout - (1 - winProb)) / (payout || 1);
      stake = Math.max(0.35, Math.min(balance * 0.03, balance * Math.max(0, kelly * 0.25)));
    } else if (contractFamily === 'ODD_EVEN') {
      const payout = 0.95;
      const kelly = (confProb * payout - (1 - confProb)) / (payout || 1);
      stake = Math.max(0.35, Math.min(balance * 0.02, balance * Math.max(0, kelly * 0.25)));
    } else if (contractFamily === 'RISE_FALL') {
      const payout = 0.95;
      const kelly = (confProb * payout - (1 - confProb)) / (payout || 1);
      stake = Math.max(0.35, Math.min(balance * 0.015, balance * Math.max(0, kelly * 0.25)));
    }

    return {
      stake: Math.max(0.35, Math.round(stake * 100) / 100),
      reasoning: `${contractFamily} @ ${confidence}% confidence. Kelly-derived stake.`
    };
  }

  recordResult(profit) {
    this.session.pnl += profit;
    this.session.trades++;
    this.session.lastTradeTime = Date.now();
    if (profit > 0) {
      this.session.wins++;
      this.session.consecutiveLosses = 0;
      this.session.consecutiveWins++;
    } else {
      this.session.losses++;
      this.session.consecutiveWins = 0;
      this.session.consecutiveLosses++;
    }
    this.saveSession();
  }

  getStats() {
    const s = this.session;
    const total = s.wins + s.losses;
    return {
      ...s,
      winRate: total > 0 ? Math.round(s.wins / total * 100) : 0,
      status: s.consecutiveLosses >= this.config.maxConsecutiveLosses ? 'HALTED' 
        : s.trades >= this.config.maxDailyTrades ? 'DAILY_LIMIT' 
        : s.pnl < 0 && Math.abs(s.pnl) > 0 ? 'CAUTION' 
        : 'ACTIVE'
    };
  }

  resetSession() {
    this.session = {
      date: new Date().toDateString(),
      pnl: 0,
      trades: 0,
      wins: 0,
      losses: 0,
      consecutiveLosses: 0,
      consecutiveWins: 0,
      lastTradeTime: 0
    };
    this.saveSession();
  }
}

export function useRiskManager(balance, config) {
  const manager = useRef(new SyntheticRiskManager(config));
  const [stats, setStats] = useState(() => manager.current.getStats());
  
  const canTrade = useCallback((confidence, contractFamily, barrier) => 
    manager.current.canTrade(balance, confidence, contractFamily, barrier), [balance]);
  
  const calculateStake = useCallback((confidence, contractFamily, barrier) => 
    manager.current.calculateStake(balance, confidence, contractFamily, barrier), [balance]);
  
  const recordResult = useCallback((profit) => {
    manager.current.recordResult(profit);
    setStats(manager.current.getStats());
  }, []);
  
  const resetSession = useCallback(() => {
    manager.current.resetSession();
    setStats(manager.current.getStats());
  }, []);

  return { canTrade, calculateStake, recordResult, resetSession, stats };
}
