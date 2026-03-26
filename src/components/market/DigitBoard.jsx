import { getDigitColorTier } from "../../hooks/useDerivTicks";

const TIER_STYLES = {
  green:   { bg: "bg-success/15",     text: "text-success",     border: "border-success/40 shadow-sm",     label: "Least" },
  yellow:  { bg: "bg-warning/15",     text: "text-warning-700",  border: "border-warning/30",     label: "2nd Least" },
  orange:  { bg: "bg-orange-500/15",  text: "text-orange-600",  border: "border-orange-500/30",  label: "2nd Most" },
  red:     { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/40 shadow-sm", label: "Most" },
  default: { bg: "bg-black/[0.03]",   text: "text-slate-400",   border: "border-black/[0.05]", label: "" },
};

export default function DigitBoard({ digitCounts, uniqueCounts, lastDigit, totalTicks }) {
  if (!digitCounts || totalTicks === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400">Digit Frequency</p>
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          <p className="text-[9px] text-slate-400 font-mono font-bold tracking-tighter">{totalTicks} TICKS</p>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {digitCounts.map((count, digit) => {
          const tier = getDigitColorTier(count, uniqueCounts || []);
          const style = TIER_STYLES[tier];
          const pct = totalTicks > 0 ? ((count / totalTicks) * 100).toFixed(1) : "0.0";
          const isLast = digit === lastDigit;

          return (
            <div
              key={digit}
              className={`relative rounded-xl border p-2 text-center transition-all duration-500 group/digit ${style.bg} ${style.border} ${
                isLast ? "ring-2 ring-primary/40 scale-[1.08] z-10 bg-white" : "hover:bg-white/80"
              }`}
            >
              <div className={`text-sm font-black font-mono tracking-tighter transition-transform duration-300 group-hover/digit:scale-110 ${style.text}`}>{digit}</div>
              <div className={`text-[8px] font-mono font-black ${style.text} opacity-60 mt-0.5 tracking-tighter`}>{pct}%</div>
              {isLast && (
                <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary border-2 border-white shadow-md" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-1 px-1 opacity-60">
        {[
          { tier: "green", label: "Least" },
          { tier: "red", label: "Most" },
        ].map(({ tier, label }) => (
          <div key={tier} className="flex items-center gap-1.5">
            <div className={`h-1.5 w-1.5 rounded-full ${TIER_STYLES[tier].text.replace("text-", "bg-")} shadow-[0_0_4px_currentColor]`} />
            <span className="text-[8px] text-muted-foreground font-black uppercase tracking-widest">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}