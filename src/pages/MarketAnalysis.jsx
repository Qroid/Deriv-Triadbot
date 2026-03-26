import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDerivTicks, SYMBOL_MAP } from "../hooks/useDerivTicks";
import { useDerivTrading } from "../hooks/useDerivTrading";
import AssetAnalysisCard from "../components/market/AssetAnalysisCard";
import { Activity, TrendingUp, TrendingDown, Minus, Zap, PlayCircle, Info } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALL_ASSETS = [
  "Volatility 10 Index", "Volatility 25 Index", "Volatility 50 Index",
  "Volatility 75 Index", "Volatility 100 Index",
  "Boom 1000 Index", "Boom 500 Index",
  "Crash 1000 Index", "Crash 500 Index",
  "Step Index", "Range Break 100 Index", "Range Break 200 Index",
];

const CATEGORIES = {
  "All": ALL_ASSETS,
  "Volatility": ALL_ASSETS.filter(a => a.includes("Volatility")),
  "Boom": ALL_ASSETS.filter(a => a.includes("Boom")),
  "Crash": ALL_ASSETS.filter(a => a.includes("Crash")),
  "Other": ALL_ASSETS.filter(a => a.includes("Step") || a.includes("Range")),
};

const STRATEGY_INFO = [
  { name: "Digit Frequency Analysis", desc: "Tracks 0–9 digit distribution with confidence scoring", color: "text-primary" },
  { name: "Trend & Bias Model", desc: "Aligns trades with 50-tick bullish/bearish trends", color: "text-success" },
  { name: "Spike/Step Detection", desc: "Detects immediate Boom/Crash spikes and Step trends", color: "text-accent" },
  { name: "Confidence Filter", desc: "Signals require >70% confidence to be actionable", color: "text-warning" },
];

export default function MarketAnalysis() {
  const [category, setCategory] = useState("All");
  const [signalFilter, setSignalFilter] = useState("all");
  const [rfStake, setRfStake] = useState(1);
  const [rfTrades, setRfTrades] = useState(4);
  
  const marketData = useDerivTicks(ALL_ASSETS);
  const { initiateSequentialRapidFire, isRapidFireActive, sessionStats } = useDerivTrading();

  const assets = CATEGORIES[category] || ALL_ASSETS;

  const filteredAssets = useMemo(() => {
    if (signalFilter === "all") return assets;
    if (signalFilter === "positive") return assets.filter(a => marketData[a]?.signal?.type?.includes("UP") || marketData[a]?.signal?.type?.includes("OVER"));
    if (signalFilter === "negative") return assets.filter(a => marketData[a]?.signal?.type?.includes("DOWN") || marketData[a]?.signal?.type?.includes("UNDER"));
    return assets;
  }, [assets, signalFilter, marketData]);

  const summaryStats = useMemo(() => {
    let positive = 0, negative = 0, neutral = 0;
    ALL_ASSETS.forEach(a => {
      const sig = marketData[a]?.signal?.type;
      if (sig?.includes("UP") || sig?.includes("OVER")) positive++;
      else if (sig?.includes("DOWN") || sig?.includes("UNDER")) negative++;
      else neutral++;
    });
    return { positive, negative, neutral };
  }, [marketData]);

  const handleTrade = (asset, signal) => {
    const symbol = SYMBOL_MAP[asset];
    const barrier = signal.barrier || (signal.type.includes("OVER") ? 1 : 8);
    const type = signal.type.includes("OVER") ? "OVER" : "UNDER";
    
    toast.info(`Initiating Rapid Fire on ${asset}`, {
      description: `Firing ${rfTrades} trades at $${rfStake} stake...`,
    });

    initiateSequentialRapidFire(rfTrades, rfStake, type, barrier, symbol);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-foreground">Market Scanner</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Deriv synthetic markets · Digit Frequency · Autoscan · Boom/Crash Spike · Tick Bias
            </p>
          </div>

          {/* Market Sentiment */}
          <div className="flex items-center gap-2 bg-secondary/40 rounded-2xl p-3 border border-border/40">
            <div className="text-center px-3">
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.positive}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Positive</p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="text-center px-3">
              <div className="flex items-center gap-1 text-warning">
                <Minus className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.neutral}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Neutral</p>
            </div>
            <div className="h-8 w-px bg-border/50" />
            <div className="text-center px-3">
              <div className="flex items-center gap-1 text-destructive">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.negative}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Negative</p>
            </div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-secondary flex">
          <div className="bg-success transition-all duration-1000" style={{ width: `${(summaryStats.positive / 12) * 100}%` }} />
          <div className="bg-warning transition-all duration-1000" style={{ width: `${(summaryStats.neutral / 12) * 100}%` }} />
          <div className="bg-destructive transition-all duration-1000" style={{ width: `${(summaryStats.negative / 12) * 100}%` }} />
        </div>
      </motion.div>

      {/* Strategy Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Rapid Fire Configuration */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-1 rounded-2xl border border-primary/30 bg-primary/[0.04] p-4 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-primary">Rapid Fire Config</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Stake ($)</Label>
              <Input 
                type="number" 
                value={rfStake} 
                onChange={(e) => setRfStake(Number(e.target.value))}
                className="h-8 bg-white/50 border-black/10 text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Trades</Label>
              <Input 
                type="number" 
                value={rfTrades} 
                onChange={(e) => setRfTrades(Number(e.target.value))}
                className="h-8 bg-white/50 border-black/10 text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-primary/10">
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${isRapidFireActive ? "bg-success animate-ping" : "bg-slate-300"}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
                {isRapidFireActive ? "Firing Sequence..." : "Engine Idle"}
              </span>
            </div>
            {sessionStats.tradesCount > 0 && (
              <span className={`text-[10px] font-black font-mono ${sessionStats.profit >= 0 ? "text-success" : "text-primary"}`}>
                {sessionStats.profit >= 0 ? "+" : ""}${sessionStats.profit.toFixed(2)}
              </span>
            )}
          </div>
        </motion.div>

        {/* Strategies (now 3 cols) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-2">
          {STRATEGY_INFO.slice(0, 3).map((strat) => (
            <div key={strat.name} className="flex items-start gap-3 bg-white/80 rounded-2xl p-4 border border-black/[0.05] group hover:border-black/[0.1] transition-all duration-300 shadow-sm hover:shadow-md">
              <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${strat.color.replace("text-", "bg-")} shadow-sm`} />
              <div>
                <p className={`text-[11px] font-black uppercase tracking-[0.1em] ${strat.color}`}>{strat.name}</p>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium mt-1">{strat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-black/[0.03] rounded-xl p-1 border border-black/[0.05] overflow-x-auto scrollbar-none">
          {Object.keys(CATEGORIES).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                category === cat ? "bg-white text-primary border border-black/[0.05] shadow-sm" : "text-slate-400 hover:text-foreground"
              }`}
            >{cat}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-black/[0.03] rounded-xl p-1 border border-black/[0.05]">
          {[{ key: "all", label: "All Signals" }, { key: "positive", label: "Bullish/Over" }, { key: "negative", label: "Bearish/Under" }].map(({ key, label }) => (
            <button key={key} onClick={() => setSignalFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                signalFilter === key ? "bg-white text-primary border border-black/[0.05] shadow-sm" : "text-slate-400 hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
          <div className="h-1 w-1 rounded-full bg-success animate-pulse shadow-[0_0_4px_currentColor]" />
          {filteredAssets.length} Assets Online
        </div>
      </div>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assets match the current filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset, i) => (
            <AssetAnalysisCard key={asset} asset={asset} data={marketData[asset]} index={i} onTrade={handleTrade} />
          ))}
        </div>
      )}
    </div>
  );
}