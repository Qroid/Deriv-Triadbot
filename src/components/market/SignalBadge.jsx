export default function SignalBadge({ signal }) {
  if (!signal) return null;
  const styles = {
    "SPIKE UP":    "bg-success/20 text-success border-success/40 shadow-[0_0_12px_hsl(145,55%,45%,0.3)]",
    "SPIKE DOWN":  "bg-primary/20 text-primary border-primary/40 shadow-[0_0_12px_hsl(357,95%,62%,0.3)]",
    "OVER SIGNAL": "bg-success/15 text-success border-success/25",
    "UNDER SIGNAL":"bg-primary/15 text-primary border-primary/25",
    "NEUTRAL":     "bg-white/5 text-muted-foreground/40 border-white/5",
    "COLLECTING":  "bg-white/5 text-muted-foreground/20 border-white/5",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${styles[signal.type] || styles["NEUTRAL"]}`}>
      {signal.type}
      {signal.confidence > 0 && (
        <span className="ml-1.5 opacity-60 border-l border-current pl-1.5 font-mono">
          {signal.confidence}%
        </span>
      )}
    </span>
  );
}