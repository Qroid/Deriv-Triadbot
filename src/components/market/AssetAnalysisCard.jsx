import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ShieldAlert, Target, Activity, Wifi, WifiOff } from "lucide-react";
import LiveChart from "./LiveChart";
import SignalBadge from "./SignalBadge";
import DigitBoard from "./DigitBoard";
import { getLastDigit, SYMBOL_MAP } from "../../hooks/useDerivTicks";

const SHORT_NAMES = {
  "Volatility 10 Index":       "V10",
  "Volatility 25 Index":       "V25",
  "Volatility 50 Index":       "V50",
  "Volatility 75 Index":       "V75",
  "Volatility 100 Index":      "V100",
  "Volatility 10 (1s) Index":  "V10(1s)",
  "Volatility 25 (1s) Index":  "V25(1s)",
  "Volatility 50 (1s) Index":  "V50(1s)",
  "Volatility 75 (1s) Index":  "V75(1s)",
  "Volatility 100 (1s) Index": "V100(1s)",
};

// Per-contract-family colour config
const FAMILY_CONFIG = {
  MATCHES_DIFFERS: {
    active: "border-amber-400/60 shadow-[0_8px_30px_rgba(245,158,11,0.15)] bg-amber-50/30",
    bar:    "bg-amber-400",
    badge:  "bg-amber-100 text-amber-700 border-amber-200",
    btn:    "bg-amber-500 hover:bg-amber-600 text-white border-b-4 border-amber-700",
  },
  OVER_UNDER: {
    active: "border-teal-400/60 shadow-[0_8px_30px_rgba(20,184,166,0.15)] bg-teal-50/30",
    bar:    "bg-teal-400",
    badge:  "bg-teal-100 text-teal-700 border-teal-200",
    btn:    "bg-teal-500 hover:bg-teal-600 text-white border-b-4 border-teal-700",
  },
  ODD_EVEN: {
    active: "border-purple-400/60 shadow-[0_8px_30px_rgba(168,85,247,0.15)] bg-purple-50/30",
    bar:    "bg-purple-400",
    badge:  "bg-purple-100 text-purple-700 border-purple-200",
    btn:    "bg-purple-500 hover:bg-purple-600 text-white border-b-4 border-purple-700",
  },
  RISE_FALL: {
    active: "border-blue-400/60 shadow-[0_8px_30px_rgba(59,130,246,0.15)] bg-blue-50/30",
    bar:    "bg-blue-400",
    badge:  "bg-blue-100 text-blue-700 border-blue-200",
    btn:    "bg-blue-500 hover:bg-blue-600 text-white border-b-4 border-blue-700",
  },
  DEFAULT: {
    active: "border-primary/60 shadow-[0_8px_30px_rgba(227,28,75,0.12)] bg-primary/[0.02]",
    bar:    "bg-primary",
    badge:  "bg-slate-100 text-slate-600 border-slate-200",
    btn:    "bg-primary hover:bg-primary/90 text-white border-b-4 border-primary",
  },
};

// Mini signal row for the 4-family analysis grid
function AnalysisRow({ label, analysis, shortLabel }) {
  if (!analysis) return (
    <div className="flex justify-between items-center py-1">
      <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">{shortLabel}</span>
      <span className="text-[8px] text-slate-300 font-mono">—</span>
    </div>
  );

  const conf = analysis.confidence ?? analysis.matchesConfidence ?? analysis.differsConfidence ?? 0;
  const contract = analysis.contract ?? '—';
  const color = conf >= 70 ? 'text-success' : conf >= 55 ? 'text-amber-500' : 'text-slate-400';

  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">{shortLabel}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-black text-slate-600">{contract}</span>
        <span className={`text-[9px] font-mono font-black ${color}`}>{conf}%</span>
      </div>
    </div>
  );
}

export default function AssetAnalysisCard({ asset, data, index = 0, onTrade }) {
  if (!data) return null;

  const isUp = data.changePct >= 0;
  const displaySignal = data.bestContract ?? data.signal;
  const confidence = data.bestContract?.confidence ?? data.signal?.confidence ?? 0;
  const contractFamily = data.bestContract?.family ?? null;
  const symbol = SYMBOL_MAP[asset];
  const lastTick = data.ticks?.[data.ticks.length - 1] ?? String(data.price);
  const lastDigit = getLastDigit(lastTick, symbol);
  const totalTicks = data.ticks?.length ?? 0;
  const isLive = data.isLive && totalTicks > 0;

  const isActionable = confidence >= 70 && displaySignal?.contract;
  const familyStyle = FAMILY_CONFIG[contractFamily] ?? FAMILY_CONFIG.DEFAULT;

  const borderClass = isActionable
    ? familyStyle.active
    : "border-border bg-card/60 hover:border-border/15";

  // Sub-analysis from bestContract
  const allAnalysis = data.bestContract?.allAnalysis;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: [0.23, 1, 0.32, 1] }}
      className={`relative rounded-2xl border backdrop-blur-xl overflow-hidden transition-all duration-500 group shadow-sm hover:shadow-md ${borderClass}`}
    >
      {/* Confidence Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-black/[0.03]">
        <motion.div
          className={`h-full transition-all duration-1000 ${isActionable ? familyStyle.bar : 'bg-slate-200'}`}
          animate={{ width: `${confidence}%` }}
        />
      </div>

      <div className="p-5 space-y-3 pt-6">

        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Symbol badge */}
              <div className="px-1.5 py-0.5 rounded bg-black/[0.03] border border-black/[0.05]">
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-foreground/50">
                  {SHORT_NAMES[asset] || asset.substring(0, 5)}
                </span>
              </div>

              {/* Signal badge */}
              {displaySignal && displaySignal.type !== "COLLECTING" && displaySignal.type !== "NEUTRAL" && (
                <SignalBadge signal={displaySignal} />
              )}

              {/* Family badge */}
              {contractFamily && isActionable && (
                <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full border ${familyStyle.badge}`}>
                  {contractFamily.replace('_', '/')}
                </span>
              )}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider truncate max-w-[120px]">
              {asset}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xl font-black font-mono text-foreground tracking-tight leading-none">
              {data.price > 0 ? data.price?.toFixed(data.decimals ?? 2) : "—"}
            </p>
            <div className={`flex items-center justify-end gap-1 mt-1 ${isUp ? "text-success" : "text-destructive"}`}>
              {data.price > 0 && (
                <span className="text-[10px] font-mono font-bold">
                  {isUp ? "▲" : "▼"} {Math.abs(data.changePct ?? 0).toFixed(2)}%
                </span>
              )}
            </div>
            {/* Live / Offline indicator */}
            <div className={`flex items-center justify-end gap-1 mt-1 ${isLive ? 'text-success' : 'text-slate-300'}`}>
              {isLive
                ? <><Wifi className="h-2.5 w-2.5" /><span className="text-[8px] font-black">LIVE</span></>
                : <><WifiOff className="h-2.5 w-2.5" /><span className="text-[8px] font-black">WAIT</span></>
              }
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2 py-2 border-y border-black/[0.03]">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Confidence</span>
            <span className={`text-sm font-black font-mono ${
              confidence >= 70 ? 'text-success' : confidence >= 50 ? 'text-amber-500' : 'text-slate-400'
            }`}>
              {confidence}%
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Trend</span>
            <div className="flex items-center gap-1">
              <Activity className={`h-3 w-3 ${
                displaySignal?.trend === 'BULLISH' ? 'text-success'
                : displaySignal?.trend === 'BEARISH' ? 'text-primary'
                : 'text-slate-300'
              }`} />
              <span className="text-[10px] font-black">{displaySignal?.trend || 'NEUTRAL'}</span>
            </div>
          </div>
        </div>

        {/* Mini price chart */}
        <div className="h-16 -mx-1">
          <LiveChart ticks={data.ticks} changePct={data.changePct} />
        </div>

        {/* Digit Frequency Board */}
        <div className="space-y-1">
          <DigitBoard
            digitCounts={data.digitCounts}
            lastDigit={lastDigit}
            totalTicks={totalTicks}
          />
          {data.statEdge && (
            <div className={`text-[9px] font-black uppercase tracking-tighter text-center ${
              data.statEdge.score > 50 ? 'text-success'
              : data.statEdge.score > 30 ? 'text-amber-500'
              : 'text-slate-400'
            }`}>
              Edge: {data.statEdge.score}% · {data.statEdge.entropyPattern?.replace('_', ' ')}
            </div>
          )}
        </div>

        {/* 4-Family Analysis Grid */}
        {allAnalysis && (
          <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.05] space-y-0.5">
            <p className="text-[8px] font-black uppercase tracking-widest text-slate-300 mb-1.5">All Signal Families</p>
            <AnalysisRow shortLabel="M/D" analysis={allAnalysis.mdAnalysis} />
            <AnalysisRow shortLabel="O/U" analysis={allAnalysis.ouAnalysis} />
            <AnalysisRow shortLabel="O/E" analysis={allAnalysis.oeAnalysis} />
            <AnalysisRow shortLabel="R/F" analysis={allAnalysis.rfAnalysis} />
          </div>
        )}

        {/* Entry Recommendation */}
        {displaySignal?.reason && displaySignal.type !== "COLLECTING" && (
          <div className={`p-2.5 rounded-xl border ${
            isActionable
              ? `${familyStyle.badge} bg-opacity-20`
              : 'bg-black/[0.02] border-black/[0.05]'
          }`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Target className={`h-3 w-3 ${isActionable ? '' : 'text-slate-400'}`} />
              <span className="text-[9px] font-black uppercase tracking-widest">Entry Signal</span>
            </div>
            <p className="text-[10px] text-foreground/80 leading-relaxed font-medium">
              {displaySignal.reason}
            </p>
          </div>
        )}

        {/* Exit Warning */}
        {displaySignal?.exitWarning && (
          <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 animate-pulse">
            <div className="flex items-center gap-1.5 mb-1 text-primary">
              <ShieldAlert className="h-3 w-3" />
              <span className="text-[9px] font-black uppercase tracking-widest">Exit Warning</span>
            </div>
            <p className="text-[10px] text-primary/90 font-bold leading-relaxed">
              {displaySignal.exitWarning}
            </p>
          </div>
        )}

        {/* Trade Action Button */}
        {isActionable ? (
          <button
            onClick={() => onTrade(asset, {
              ...displaySignal,
              family: contractFamily,
              barrier: data.bestContract?.barrier ?? displaySignal.barrier,
              confidence,
              statEdge: data.statEdge,
            })}
            className={`w-full py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-md transform active:scale-[0.98] ${familyStyle.btn}`}
          >
            ▶ Run {displaySignal.contract}
            {displaySignal.barrier !== null && displaySignal.barrier !== undefined
              ? ` (${displaySignal.barrier})`
              : ''}
          </button>
        ) : (
          <div className="w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-400 text-center border border-dashed border-slate-200 bg-slate-50/50">
            {totalTicks < 50
              ? `Collecting… ${totalTicks}/50 ticks`
              : `Waiting for 70%+ Confidence (${confidence}%)`}
          </div>
        )}
      </div>
    </motion.div>
  );
}
