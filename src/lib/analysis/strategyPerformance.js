/**
 * strategyPerformance.js - Track per-asset, per-contract-family win rates to adapt over time.
 */

export class StrategyPerformance {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem('triadbot_perf');
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem('triadbot_perf', JSON.stringify(this.data));
    } catch {}
  }

  key(asset, family) {
    return `${asset}__${family}`;
  }

  record(asset, family, won, confidence) {
    const k = this.key(asset, family);
    if (!this.data[k]) {
      this.data[k] = { trades: [], wins: 0, losses: 0 };
    }
    const entry = { won, confidence, ts: Date.now() };
    this.data[k].trades.push(entry);
    if (this.data[k].trades.length > 200) {
      this.data[k].trades.shift();
    }
    if (won) {
      this.data[k].wins++;
    } else {
      this.data[k].losses++;
    }
    this.save();
  }

  getWinRate(asset, family) {
    const d = this.data[this.key(asset, family)];
    if (!d || d.trades.length < 10) return null;
    const recent = d.trades.slice(-50);
    const wins = recent.filter(t => t.won).length;
    return Math.round((wins / recent.length) * 100);
  }

  shouldAvoid(asset, family) {
    const wr = this.getWinRate(asset, family);
    const d = this.data[this.key(asset, family)];
    return wr !== null && wr < 40 && d.trades.length >= 20;
  }

  getBestFamily(asset) {
    const families = ['MATCHES_DIFFERS', 'OVER_UNDER', 'ODD_EVEN', 'RISE_FALL'];
    let best = null;
    let bestRate = 0;
    families.forEach(f => {
      const wr = this.getWinRate(asset, f);
      if (wr !== null && wr > bestRate && wr > 52) {
        bestRate = wr;
        best = f;
      }
    });
    return best;
  }

  getSummary() {
    return Object.entries(this.data).map(([key, d]) => {
      const [asset, family] = key.split('__');
      const recent = d.trades.slice(-50);
      const wins = recent.filter(t => t.won).length;
      const winRate = recent.length > 0 ? Math.round((wins / recent.length) * 100) : 0;
      const avgConfidence = recent.length > 0 
        ? recent.reduce((sum, t) => sum + (t.confidence || 0), 0) / recent.length 
        : 0;
      
      let status = 'LEARNING';
      if (recent.length >= 10) {
        if (winRate > 55) status = 'STRONG';
        else if (winRate < 45) status = 'WEAK';
        else status = 'NEUTRAL';
      }

      return {
        asset,
        family,
        trades: recent.length,
        totalTrades: d.trades.length,
        wins: d.wins,
        winRate,
        avgConfidence,
        status
      };
    }).sort((a, b) => b.winRate - a.winRate);
  }
}
