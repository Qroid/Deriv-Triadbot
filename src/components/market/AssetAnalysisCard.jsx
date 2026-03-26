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

  const isActionable = signal?.type === "STRONG BUY" || signal?.type === "STRONG SELL";
  const isBuy = signal?.type?.includes("BUY");
  const isSell = signal?.type?.includes("SELL");

  const borderClass = isActionable
    ? (isBuy ? "border-success/30 shadow-[0_0_20px_hsl(142,71%,45%,0.08)]"
             : "border-destructive/30 shadow-[0_0_20px_hsl(0,72%,51%,0.08)]")
    : "border-border/40 hover:border-border/70";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
      className={`rounded-2xl border bg-card/70 backdrop-blur-sm overflow-hidden transition-all duration-300 ${borderClass}`}
    >
      {/* Signal accent line */}
      <div className={`h-0.5 w-full ${
        isBuy ? "bg-gradient-to-r from-transparent via-success to-transparent" :
        isSell ? "bg-gradient-to-r from-transparent via-destructive to-transparent" :
        "bg-gradient-to-r from-transparent via-border/50 to-transparent"
      }`} />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">{SHORT_NAMES[asset]}</span>
              {signal && signal.type !== "COLLECTING" && <SignalBadge signal={signal} />}
              {data.isLive
                ? <span className="flex items-center gap-0.5 text-[9px] text-success font-bold"><Wifi className="h-2.5 w-2.5" />LIVE</span>
                : <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground/50 font-bold"><WifiOff className="h-2.5 w-2.5" />SIM</span>
              }
            </div>
            <p className="text-[11px] text-muted-foreground">{asset}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-black font-mono text-foreground leading-none">
              {data.price?.toFixed(data.decimals ?? 2)}
            </p>
            <div className={`flex items-center justify-end gap-0.5 mt-0.5 ${isUp ? "text-success" : "text-destructive"}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span className="text-[10px] font-mono font-bold">
                {isUp ? "+" : ""}{data.changePct?.toFixed(2)}%
              </span>
            </div>
            {/* Last digit display */}
            {lastDigit !== null && (
              <div className={`mt-1 text-xl font-black font-mono ${lastDigit % 2 === 0 ? "text-primary" : "text-accent"}`}>
                {lastDigit}
                <span className="text-[9px] font-semibold ml-0.5 opacity-60">{lastDigit % 2 === 0 ? "E" : "O"}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mini chart */}
        <div className="h-16 -mx-1">
          <LiveChart ticks={data.ticks} changePct={data.changePct} />
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