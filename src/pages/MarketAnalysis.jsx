import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDerivTicks } from "../hooks/useDerivTicks";
import AssetAnalysisCard from "../components/market/AssetAnalysisCard";
import { Activity, TrendingUp, TrendingDown, Minus, Zap } from "lucide-react";
import { toast } from "sonner";

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
  { name: "Digit Frequency Analysis", desc: "Tracks 0–9 digit distribution across 1000 ticks", color: "text-primary" },
  { name: "Autoscan Strategy", desc: "Detects least-freq 0,1 pair (OVER 1) or 8,9 pair (UNDER 8)", color: "text-success" },
  { name: "Consecutive Digit Watch", desc: "Triggers only when pair appears consecutively", color: "text-warning" },
  { name: "Boom/Crash Spike Model", desc: "Spike direction bias from tick behaviour", color: "text-accent" },
];

export default function MarketAnalysis() {
  const [category, setCategory] = useState("All");
  const [signalFilter, setSignalFilter] = useState("all");
  const marketData = useDerivTicks(ALL_ASSETS);

  const assets = CATEGORIES[category] || ALL_ASSETS;

  const filteredAssets = useMemo(() => {
    if (signalFilter === "all") return assets;
    if (signalFilter === "buy") return assets.filter(a => marketData[a]?.signal?.type?.includes("BUY"));
    if (signalFilter === "sell") return assets.filter(a => marketData[a]?.signal?.type?.includes("SELL"));
    return assets;
  }, [assets, signalFilter, marketData]);

  const summaryStats = useMemo(() => {
    let buys = 0, sells = 0, neutral = 0;
    ALL_ASSETS.forEach(a => {
      const sig = marketData[a]?.signal?.type;
      if (sig?.includes("BUY")) buys++;
      else if (sig?.includes("SELL")) sells++;
      else neutral++;
    });
    return { buys, sells, neutral };
  }, [marketData]);

  const handleTrade = (asset, signal) => {
    toast.success(`${signal.contract} signal on ${asset}`, {
      description: `Direction: ${signal.dir} — ${signal.reason}`,
      duration: 4000,
    });
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
                <span className="text-lg font-black font-mono">{summaryStats.buys}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Buy</p>
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
                <span className="text-lg font-black font-mono">{summaryStats.sells}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Sell</p>
            </div>
          </div>
        </div>

        {/* Sentiment bar */}
        <div className="h-1.5 rounded-full overflow-hidden bg-secondary flex">
          <div className="bg-success transition-all duration-1000" style={{ width: `${(summaryStats.buys / 12) * 100}%` }} />
          <div className="bg-warning transition-all duration-1000" style={{ width: `${(summaryStats.neutral / 12) * 100}%` }} />
          <div className="bg-destructive transition-all duration-1000" style={{ width: `${(summaryStats.sells / 12) * 100}%` }} />
        </div>
      </motion.div>

      {/* Strategy Legend */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {STRATEGY_INFO.map((strat) => (
          <div key={strat.name} className="flex items-start gap-2 bg-secondary/20 rounded-xl p-3 border border-border/20">
            <div className={`mt-1 h-1.5 w-1.5 rounded-full shrink-0 ${strat.color.replace("text-", "bg-")}`} />
            <div>
              <p className={`text-[11px] font-bold ${strat.color}`}>{strat.name}</p>
              <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{strat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 border border-border/30 overflow-x-auto scrollbar-none">
          {Object.keys(CATEGORIES).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === cat ? "bg-primary/10 text-primary border border-primary/15" : "text-muted-foreground hover:text-foreground"
              }`}
            >{cat}</button>
          ))}
        </div>
        <div className="flex gap-1 bg-secondary/30 rounded-xl p-1 border border-border/30">
          {[{ key: "all", label: "All" }, { key: "buy", label: "Buy" }, { key: "sell", label: "Sell" }].map(({ key, label }) => (
            <button key={key} onClick={() => setSignalFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                signalFilter === key ? "bg-primary/10 text-primary border border-primary/15" : "text-muted-foreground hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>
        <div className="sm:ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          {filteredAssets.length} assets · Live ticks
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