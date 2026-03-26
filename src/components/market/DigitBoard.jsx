import { getDigitColorTier } from "../../hooks/useDerivTicks";

const TIER_STYLES = {
  green:   { bg: "bg-success/20",     text: "text-success",     border: "border-success/30",     label: "Least" },
  yellow:  { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/25",     label: "2nd Least" },
  orange:  { bg: "bg-orange-500/15",  text: "text-orange-400",  border: "border-orange-500/25",  label: "2nd Most" },
  red:     { bg: "bg-destructive/20", text: "text-destructive", border: "border-destructive/30", label: "Most" },
  default: { bg: "bg-secondary/40",   text: "text-muted-foreground", border: "border-border/20", label: "" },
};

export default function DigitBoard({ digitCounts, uniqueCounts, lastDigit, totalTicks }) {
  if (!digitCounts || totalTicks === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">Digit Frequency</p>
        <p className="text-[10px] text-muted-foreground/50 font-mono">{totalTicks} ticks</p>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {digitCounts.map((count, digit) => {
          const tier = getDigitColorTier(count, uniqueCounts || []);
          const style = TIER_STYLES[tier];
          const pct = totalTicks > 0 ? ((count / totalTicks) * 100).toFixed(1) : "0.0";
          const isLast = digit === lastDigit;

          return (
            <div
              key={digit}
              className={`relative rounded-lg border p-1.5 text-center transition-all duration-300 ${style.bg} ${style.border} ${
                isLast ? "ring-1 ring-primary/60 scale-105" : ""
              }`}
            >
              <div className={`text-sm font-black font-mono ${style.text}`}>{digit}</div>
              <div className={`text-[9px] font-mono font-semibold ${style.text} opacity-80`}>{pct}%</div>
              {isLast && (
                <div className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border border-background" />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
        {[
          { tier: "green", label: "Least" },
          { tier: "yellow", label: "2nd Least" },
          { tier: "orange", label: "2nd Most" },
          { tier: "red", label: "Most Freq" },
        ].map(({ tier, label }) => (
          <div key={tier} className="flex items-center gap-1">
            <div className={`h-1.5 w-1.5 rounded-full ${TIER_STYLES[tier].bg.replace("/20","/80").replace("/15","/80")}`} />
            <span className="text-[9px] text-muted-foreground/60 font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}