// Kept for compatibility but digit/tick analysis is now in AssetAnalysisCard directly
export default function IndicatorGauge({ label, value, min = 0, max = 100, format }) {
  if (value === null || value === undefined) {
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">{label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">—</span>
        </div>
        <div className="h-1.5 rounded-full bg-secondary/50" />
      </div>
    );
  }
  const pct = Math.min(Math.max((value - min) / (max - min), 0), 1) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/70">{label}</span>
        <span className="text-[11px] font-mono font-bold text-foreground">{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <div className="h-1.5 rounded-full bg-secondary/80 overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}