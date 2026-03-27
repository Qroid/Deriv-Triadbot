import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Zap, ShieldAlert, Target, Activity } from "lucide-react";
import LiveChart from "./LiveChart";
import SignalBadge from "./SignalBadge";
import { getLastDigit, SYMBOL_MAP } from "../../hooks/useDerivTicks";

const SHORT_NAMES = {
  "Volatility 10 Index": "V10", "Volatility 25 Index": "V25",
  "Volatility 50 Index": "V50", "Volatility 75 Index": "V75",
  "Volatility 100 Index": "V100",
  "Volatility 10 (1s) Index": "V10(1s)", "Volatility 25 (1s) Index": "V25(1s)",
  "Volatility 50 (1s) Index": "V50(1s)", "Volatility 75 (1s) Index": "V75(1s)",
  "Volatility 100 (1s) Index": "V100(1s)",
  "Boom 1000 Index": "B1000", "Boom 500 Index": "B500",
  "Crash 1000 Index": "C1000", "Crash 500 Index": "C500",
  "Step Index": "STEP", "Range Break 100 Index": "RB100", "Range Break 200 Index": "RB200",
};

export default function AssetAnalysisCard({ asset, data, index = 0, onTrade }) {
  if (!data) return null;

  const isUp = data.changePct >= 0;
  const signal = data.signal;
  const symbol = SYMBOL_MAP[asset];
  const lastTick = data.ticks?.[data.ticks.length - 1] ?? String(data.price);
  const lastDigit = getLastDigit(lastTick, symbol);
  const totalTicks = data.ticks?.length ?? 0;

  const isActionable = signal?.confidence >= 70;
  const isMatches = signal?.contract === "MATCHES";
  const isDiffers = signal?.contract === "DIFFERS";

  const borderClass = isActionable
    ? (isMatches ? "border-success/60 shadow-[0_8px_30px_rgb(34,197,94,0.12)] bg-success/[0.02]"
                 : "border-primary/60 shadow-[0_8px_30px_rgb(227,28,75,0.12)] bg-primary/[0.02]")
    : "border-border bg-card/60 hover:border-border/15";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-500 group shadow-sm hover:shadow-md ${borderClass}`}
    >
      {/* Confidence Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-black/[0.03]">
        <motion.div 
          className={`h-full transition-all duration-1000 ${isActionable ? 'bg-success' : 'bg-slate-300'}`}
          animate={{ width: `${signal?.confidence || 0}%` }}
        />
      </div>

      <div className="p-5 space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.05]">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50">{SHORT_NAMES[asset] || asset.substring(0,4)}</span>
              </div>
              {signal && signal.type !== "COLLECTING" && <SignalBadge signal={signal} />}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wider truncate max-w-[120px]">{asset}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black font-mono text-foreground tracking-tight leading-none">
              {data.price > 0 ? data.price?.toFixed(data.decimals ?? 2) : "—"}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isUp ? "text-success" : "text-destructive"}`}>
              <span className="text-[10px] font-mono font-bold">
                {data.price > 0 ? `${isUp ? "▲" : "▼"} ${data.changePct?.toFixed(2)}%` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Cyclic Analysis Stats */}
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-black/[0.03]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Confidence</span>
            <span className={`text-sm font-black font-mono ${isActionable ? 'text-success' : 'text-slate-400'}`}>
              {signal?.confidence || 0}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Market Bias</span>
            <div className="flex items-center gap-1">
              <Activity className={`h-3 w-3 ${signal?.trend === 'BULLISH' ? 'text-success' : signal?.trend === 'BEARISH' ? 'text-primary' : 'text-slate-300'}`} />
              <span className="text-[10px] font-black">{signal?.trend || 'NEUTRAL'}</span>
            </div>
          </div>
        </div>

        {/* Mini chart */}
        <div className="h-20 -mx-1">
          <LiveChart ticks={data.ticks} changePct={data.changePct} />
        </div>

        {/* Entry/Exit Trading Signal Box */}
        <div className="space-y-2">
          {signal?.reason && signal.type !== "COLLECTING" && (
            <div className={`p-2.5 rounded-xl border ${isActionable ? 'bg-success/5 border-success/20' : 'bg-black/[0.02] border-black/[0.05]'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <Target className={`h-3 w-3 ${isActionable ? 'text-success' : 'text-slate-400'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest">Entry Recommendation</span>
              </div>
              <p className="text-[10px] text-foreground/80 leading-relaxed font-medium">
                {signal.reason}
              </p>
            </div>
          )}

          {signal?.exitWarning && (
            <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-pulse">
              <div className="flex items-center gap-1.5 mb-1 text-primary">
                <ShieldAlert className="h-3 w-3" />
                <span className="text-[9px] font-black uppercase tracking-widest">Exit Warning</span>
              </div>
              <p className="text-[10px] text-primary/90 font-bold leading-relaxed">
                {signal.exitWarning}
              </p>
            </div>
          )}
        </div>

        {/* Trade Action */}
        {isActionable && signal?.contract && (
          <button
            onClick={() => onTrade(asset, signal)}
            className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md transform active:scale-[0.98] ${
              isMatches
                ? "bg-success text-white border-b-4 border-success-dark hover:bg-success/90"
                : "bg-primary text-white border-b-4 border-primary-dark hover:bg-primary/90"
            }`}
          >
            Run {signal.contract}
          </button>
        )}

        {(!isActionable || !signal?.contract) && (
          <div className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 text-center border border-dashed border-slate-200 bg-slate-50/50">
            Waiting for 70%+ Confidence...
          </div>
        )}
      </div>
    </motion.div>
  );
}
