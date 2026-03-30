import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useDerivTicks, SYMBOL_MAP } from "../hooks/useDerivTicks";
import { useDerivTrading } from "../hooks/useDerivTrading";
import { useDerivAccount } from "../hooks/useDerivAccount";
import AssetAnalysisCard from "../components/market/AssetAnalysisCard";
import {
  Activity, TrendingUp, TrendingDown, Minus, Zap,
  ChevronDown, ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "../lib/AuthContext";

const ALL_ASSETS = [
  "Volatility 10 Index",
  "Volatility 25 Index",
  "Volatility 50 Index",
  "Volatility 75 Index",
  "Volatility 100 Index",
  "Volatility 10 (1s) Index",
  "Volatility 25 (1s) Index",
  "Volatility 50 (1s) Index",
  "Volatility 75 (1s) Index",
  "Volatility 100 (1s) Index",
];

const CATEGORIES = {
  "All":      ALL_ASSETS,
  "Standard": ALL_ASSETS.filter(a => !a.includes("(1s)")),
  "1-Second": ALL_ASSETS.filter(a => a.includes("(1s)")),
};

const FAMILY_STYLES = {
  "MATCHES_DIFFERS": "bg-amber-100 text-amber-700 border-amber-200",
  "OVER_UNDER":      "bg-teal-100 text-teal-700 border-teal-200",
  "ODD_EVEN":        "bg-purple-100 text-purple-700 border-purple-200",
  "RISE_FALL":       "bg-blue-100 text-blue-700 border-blue-200",
};

export default function Home() {
  const { user } = useAuth();
  const { balance: liveBalance, currency, isAuthorized } = useDerivAccount();
  const balance = isAuthorized ? liveBalance : parseFloat(user?.balance ?? 0);

  const [category, setCategory] = useState("All");
  const [signalFilter, setSignalFilter] = useState("all");
  const [rfStake, setRfStake] = useState(1);
  const [rfTrades, setRfTrades] = useState(4);
  const [isPerfOpen, setIsPerfOpen] = useState(false);

  const [riskConfig, setRiskConfig] = useState({
    maxDailyLossPercent: 10,
    minConfidence: 65,
    maxConsecutiveLosses: 5,
  });

  const marketData = useDerivTicks(ALL_ASSETS);
  const {
    initiateSequentialRapidFire,
    isRapidFireActive,
    sessionStats,
    riskStats,
    strategyPerformance,
    resetRiskSession,
  } = useDerivTrading(balance, riskConfig);

  const assets = CATEGORIES[category] || ALL_ASSETS;

  const filteredAssets = useMemo(() => {
    if (signalFilter === "all") return assets;
    const positiveContracts = ["RISE", "OVER", "MATCHES", "EVEN", "ODD"];
    const negativeContracts = ["FALL", "UNDER", "DIFFERS"];
    if (signalFilter === "positive") return assets.filter(a => {
      const sig = marketData[a]?.bestContract ?? marketData[a]?.signal;
      return positiveContracts.some(c => sig?.contract === c || sig?.type?.includes(c));
    });
    if (signalFilter === "negative") return assets.filter(a => {
      const sig = marketData[a]?.bestContract ?? marketData[a]?.signal;
      return negativeContracts.some(c => sig?.contract === c || sig?.type?.includes(c));
    });
    return assets;
  }, [assets, signalFilter, marketData]);

  const summaryStats = useMemo(() => {
    let positive = 0, negative = 0, neutral = 0;
    const total = ALL_ASSETS.length;
    ALL_ASSETS.forEach(a => {
      const data = marketData[a];
      const confidence = data?.bestContract?.confidence ?? data?.signal?.confidence ?? 0;
      if (confidence >= 70) positive++;
      else if (confidence >= 40) neutral++;
      else negative++;
    });
    return { positive, negative, neutral, total };
  }, [marketData]);

  const liveCount = ALL_ASSETS.filter(a => (marketData[a]?.ticks?.length ?? 0) > 0).length;

  const handleTrade = (asset, signal) => {
    const symbol = SYMBOL_MAP[asset];
    toast.success(`Strategy Execution: ${signal.type}`, {
      description: `Initiating ${rfTrades}× ${signal.contract} trades on ${asset}`,
    });
    initiateSequentialRapidFire(
      rfTrades,
      rfStake,
      signal.contract,
      signal.barrier,
      symbol,
      signal.confidence,
      signal.family
    );
  };

  return (
    <div className="p-4 md:p-6 space-y-6">

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="h-3.5 w-3.5 text-primary" />
              </div>
              <h1 className="text-2xl font-black text-foreground">Live Tick Stream</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Deriv Digits Markets · Rise/Fall · Matches/Differs · Even/Odd · Over/Under
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl p-3 border border-black/5 shadow-sm">
            <div className="text-center px-3 border-r border-black/5">
              <div className="flex items-center gap-1 text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.positive}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Signal</p>
            </div>
            <div className="text-center px-3 border-r border-black/5">
              <div className="flex items-center gap-1 text-slate-400">
                <Minus className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.neutral}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Neutral</p>
            </div>
            <div className="text-center px-3">
              <div className="flex items-center gap-1 text-primary">
                <TrendingDown className="h-3.5 w-3.5" />
                <span className="text-lg font-black font-mono">{summaryStats.negative}</span>
              </div>
              <p className="text-[9px] uppercase tracking-wider text-slate-400 font-black">Weak</p>
            </div>
          </div>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden bg-secondary flex">
          <div className="bg-success transition-all duration-1000"
            style={{ width: `${(summaryStats.positive / summaryStats.total) * 100}%` }} />
          <div className="bg-warning transition-all duration-1000"
            style={{ width: `${(summaryStats.neutral / summaryStats.total) * 100}%` }} />
          <div className="bg-destructive transition-all duration-1000"
            style={{ width: `${(summaryStats.negative / summaryStats.total) * 100}%` }} />
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(FAMILY_STYLES).map(([family, style]) => (
            <span key={family}
              className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${style}`}>
              {family.replace('_', '/')}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-5 space-y-5 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xs font-black uppercase tracking-widest text-primary">Execution & Risk Control</h2>
          </div>
          {riskStats && (
            <Badge
              variant={riskStats.status === 'HALTED' ? 'destructive' : riskStats.status === 'CAUTION' ? 'warning' : 'success'}
              className="font-black text-[9px] uppercase tracking-widest"
            >
              {riskStats.status}
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                  Stake ({currency})
                </Label>
                <Input
                  type="number"
                  value={rfStake}
                  onChange={(e) => setRfStake(Number(e.target.value))}
                  className="h-9 bg-white/50 border-black/10 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">RF Trades</Label>
                <Input
                  type="number"
                  value={rfTrades}
                  onChange={(e) => setRfTrades(Number(e.target.value))}
                  className="h-9 bg-white/50 border-black/10 text-xs font-mono font-bold"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">
                Min Confidence ({riskConfig.minConfidence}%)
              </Label>
              <Slider
                value={[riskConfig.minConfidence]}
                onValueChange={([v]) => setRiskConfig(prev => ({ ...prev, minConfidence: v }))}
                min={50} max={90} step={1}
                className="py-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Max Daily Loss %</Label>
                <Input
                  type="number"
                  value={riskConfig.maxDailyLossPercent}
                  onChange={(e) => setRiskConfig(prev => ({ ...prev, maxDailyLossPercent: Number(e.target.value) }))}
                  className="h-9 bg-white/50 border-black/10 text-xs font-mono font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-widest text-slate-500 font-black">Max Loss Streak</Label>
                <Input
                  type="number"
                  value={riskConfig.maxConsecutiveLosses}
                  onChange={(e) => setRiskConfig(prev => ({ ...prev, maxConsecutiveLosses: Number(e.target.value) }))}
                  className="h-9 bg-white/50 border-black/10 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-black/[0.03] border border-black/5">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Balance</span>
                <span className="text-xs font-black font-mono text-foreground">
                  {currency} {balance.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Session P&L</span>
                <span className={`text-xs font-black font-mono ${sessionStats.profit >= 0 ? 'text-success' : 'text-primary'}`}>
                  {sessionStats.profit >= 0 ? '+' : ''}${sessionStats.profit.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Win Rate</span>
                <span className="text-xs font-black font-mono">
                  {sessionStats.tradesCount > 0
                    ? ((sessionStats.wins / sessionStats.tradesCount) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-primary/10">
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${isRapidFireActive ? "bg-success animate-ping" : "bg-slate-300"}`} />
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">
              {isRapidFireActive ? "Executing Sequence…" : "Risk Manager Active"}
            </span>
          </div>
          <Button
            variant="ghost" size="sm" onClick={resetRiskSession}
            className="h-6 px-2 text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary hover:bg-primary/10"
          >
            Reset Session
          </Button>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-black/[0.03] rounded-xl p-1 border border-black/[0.05]">
          {Object.keys(CATEGORIES).map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                category === cat
                  ? "bg-white text-primary border border-black/[0.05] shadow-sm"
                  : "text-slate-400 hover:text-foreground"
              }`}
            >{cat}</button>
          ))}
        </div>

        <div className="flex gap-1 bg-black/[0.03] rounded-xl p-1 border border-black/[0.05]">
          {[
            { key: "all", label: "All Signals" },
            { key: "positive", label: "↑ Rise/Over/Match" },
            { key: "negative", label: "↓ Fall/Under/Diff" },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setSignalFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                signalFilter === key
                  ? "bg-white text-primary border border-black/[0.05] shadow-sm"
                  : "text-slate-400 hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        <div className="sm:ml-auto flex items-center gap-2 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
          <div className={`h-1 w-1 rounded-full ${liveCount > 0 ? 'bg-success animate-pulse' : 'bg-slate-300'} shadow-[0_0_4px_currentColor]`} />
          {liveCount}/{ALL_ASSETS.length} Live
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No assets match the current filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filteredAssets.map((asset, i) => (
            <AssetAnalysisCard
              key={asset}
              asset={asset}
              data={marketData[asset]}
              index={i}
              onTrade={handleTrade}
            />
          ))}
        </div>
      )}

      <div className="mt-8">
        <Collapsible open={isPerfOpen} onOpenChange={setIsPerfOpen} className="space-y-2">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest">Strategy Performance</h3>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                  Per-asset analytics · Updates after each trade
                </p>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isPerfOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest py-3">Asset</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest">Family</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Trades</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-center">Win Rate</TableHead>
                    <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Avg Conf.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!strategyPerformance || strategyPerformance.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        No data yet. Execute trades to see per-strategy analytics.
                      </TableCell>
                    </TableRow>
                  ) : (
                    strategyPerformance.map((stats) => {
                      const wr = stats.winRate;
                      return (
                        <TableRow key={`${stats.asset}-${stats.family}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-bold text-[11px] py-4">{stats.asset}</TableCell>
                          <TableCell>
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                              FAMILY_STYLES[stats.family] || "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              {(stats.family || '').replace('_', '/')}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-mono text-[11px] font-bold">{stats.trades}</TableCell>
                          <TableCell className={`text-center font-mono text-[11px] font-black ${
                            wr > 55 ? 'text-success' : wr > 45 ? 'text-amber-600' : 'text-primary'
                          }`}>
                            {wr.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-mono text-[11px] text-slate-500">
                            {stats.avgConfidence.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
