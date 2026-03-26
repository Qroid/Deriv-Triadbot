import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Zap, Wifi, WifiOff } from "lucide-react";
import LiveChart from "./LiveChart";
import SignalBadge from "./SignalBadge";
import DigitBoard from "./DigitBoard";
import { getLastDigit, SYMBOL_MAP } from "../../hooks/useDerivTicks";

const SHORT_NAMES = {
  "Volatility 10 Index": "V10", "Volatility 25 Index": "V25",
  "Volatility 50 Index": "V50", "Volatility 75 Index": "V75",
  "Volatility 100 Index": "V100", "Boom 1000 Index": "BOOM1000",
  "Boom 500 Index": "BOOM500", "Crash 1000 Index": "CRASH1000",
  "Crash 500 Index": "CRASH500", "Step Index": "STEP",
  "Range Break 100 Index": "RB100", "Range Break 200 Index": "RB200",
};

export default function AssetAnalysisCard({ asset, data, index = 0, onTrade }) {
  if (!data) return null;

  const isUp = data.changePct >= 0;
  const signal = data.signal;
  const symbol = SYMBOL_MAP[asset];
  const lastTick = data.ticks?.[data.ticks.length - 1] ?? String(data.price);
  const lastDigit = getLastDigit(lastTick, symbol);
  const totalTicks = data.ticks?.length ?? 0;

  const totalDigits = data.totalEven + data.totalOdd;
  const evenPct = totalDigits > 0 ? ((data.totalEven / totalDigits) * 100).toFixed(1) : "0.0";
  const oddPct = totalDigits > 0 ? ((data.totalOdd / totalDigits) * 100).toFixed(1) : "0.0";

  const isActionable = signal?.type?.includes("SIGNAL") || signal?.type?.includes("SPIKE");
  const isBuy = signal?.type?.includes("UP") || signal?.type?.includes("OVER");
  const isSell = signal?.type?.includes("DOWN") || signal?.type?.includes("UNDER");

  const borderClass = isActionable
    ? (isBuy ? "border-success/60 shadow-[0_8px_30px_rgb(34,197,94,0.12)] bg-success/[0.02]"
             : "border-destructive/60 shadow-[0_8px_30px_rgb(239,68,68,0.12)] bg-destructive/[0.02]")
    : "border-black/[0.08] hover:border-black/[0.15] bg-white/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: [0.23, 1, 0.32, 1] }}
      className={`rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-500 group shadow-sm hover:shadow-md ${borderClass}`}
    >
      {/* Signal accent line */}
      <div className={`h-[2px] w-full transition-opacity duration-500 ${
        isBuy ? "bg-success" :
        isSell ? "bg-destructive" :
        "bg-black/5"
      }`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.05]">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50">{SHORT_NAMES[asset]}</span>
              </div>
              {signal && signal.type !== "COLLECTING" && <SignalBadge signal={signal} />}
            </div>
            <p className="text-[11px] font-bold text-muted-foreground/50 uppercase tracking-wider">{asset}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black font-mono text-foreground tracking-tight leading-none">
              {data.price?.toFixed(data.decimals ?? 2)}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isUp ? "text-success" : "text-destructive"}`}>
              <span className="text-[10px] font-mono font-bold">
                {isUp ? "▲" : "▼"} {data.changePct?.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="flex items-center justify-between py-1.5 border-y border-black/[0.03]">
          <div className="flex items-center gap-2">
            {data.isLive
              ? <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_hsl(142,71%,45%)] animate-pulse" /><span className="text-[10px] text-success font-black tracking-widest">LIVE</span></div>
              : <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-slate-300" /><span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">Simulation</span></div>
            }
          </div>
          {lastDigit !== null && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-black/[0.03] border border-black/[0.05] ${lastDigit % 2 === 0 ? "text-primary" : "text-accent"}`}>
              <span className="text-sm font-black font-mono">{lastDigit}</span>
              <span className="text-[9px] font-black opacity-40">{lastDigit % 2 === 0 ? "EVEN" : "ODD"}</span>
            </div>
          )}
        </div>

        {/* Mini chart */}
        <div className="h-16 -mx-1">
          <LiveChart ticks={data.ticks} changePct={data.changePct} />
        </div>

        {/* Market Insights */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {signal?.trend && (
            <div className={`px-2 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
              signal.trend === "BULLISH" ? "bg-success/8 text-success border-success/20" :
              signal.trend === "BEARISH" ? "bg-destructive/8 text-destructive border-destructive/20" :
              "bg-secondary/50 text-muted-foreground border-border/20"
            }`}>
              <TrendingUp className={`h-2.5 w-2.5 ${signal.trend === "BEARISH" ? "rotate-180" : ""}`} />
              {signal.trend}
            </div>
          )}
          {signal?.spike && (
            <div className="px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
              <Zap className="h-2.5 w-2.5" />
              {signal.spike.replace("_", " ")}
            </div>
          )}
        </div>

        {/* Odd/Even percentages */}
        <div className="flex gap-2">
          <div className="flex-1 bg-primary/8 rounded-lg px-2.5 py-1.5 text-center border border-primary/10">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Even</p>
            <p className="text-sm font-black font-mono text-primary">{evenPct}%</p>
          </div>
          <div className="flex-1 bg-accent/8 rounded-lg px-2.5 py-1.5 text-center border border-accent/10">
            <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Odd</p>
            <p className="text-sm font-black font-mono text-accent">{oddPct}%</p>
          </div>
          {data.consecutiveDigits?.length >= 2 && (
            <div className="flex-1 bg-secondary/40 rounded-lg px-2.5 py-1.5 text-center border border-border/20">
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-semibold">Last 2</p>
              <p className="text-sm font-black font-mono text-foreground">
                {data.consecutiveDigits.slice(-2).join(" ")}
              </p>
            </div>
          )}
        </div>

        {/* Digit Frequency Board */}
        <DigitBoard
          digitCounts={data.digitCounts}
          uniqueCounts={data.uniqueCounts}
          lastDigit={lastDigit}
          totalTicks={totalTicks}
        />

        {/* Signal reason */}
        {signal?.reason && signal.type !== "COLLECTING" && (
          <div className="border-t border-border/30 pt-2">
            <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
              <Zap className="inline h-2.5 w-2.5 text-primary mr-1" />
              {signal.reason}
            </p>
          </div>
        )}

        {/* Trade Action */}
        {isActionable && signal?.contract && (
          <button
            onClick={() => onTrade(asset, signal)}
            className={`w-full py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${
              isBuy
                ? "bg-success/10 text-success border border-success/25 hover:bg-success/20"
                : "bg-destructive/10 text-destructive border border-destructive/25 hover:bg-destructive/20"
            }`}
          >
            {signal.contract}
          </button>
        )}

        {(!isActionable || !signal?.contract) && (
          <div className="w-full py-2 rounded-xl text-[9px] uppercase tracking-widest text-muted-foreground/40 text-center border border-border/15">
            {signal?.pair ? `Watching pair [${signal.pair[0]}, ${signal.pair[1]}]...` : "Scanning..."}
          </div>
        )}
      </div>
    </motion.div>
  );
}