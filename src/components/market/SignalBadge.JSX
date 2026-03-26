export default function SignalBadge({ signal }) {
  if (!signal) return null;
  const styles = {
    "STRONG BUY":  "bg-success/15 text-success border-success/25",
    "BUY":         "bg-success/10 text-success border-success/15",
    "STRONG SELL": "bg-primary/15 text-primary border-primary/25",
    "SELL":        "bg-primary/10 text-primary border-primary/15",
    "NEUTRAL":     "bg-secondary text-muted-foreground border-border/40",
    "COLLECTING":  "bg-secondary text-muted-foreground/50 border-border/30",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${styles[signal.type] || styles["NEUTRAL"]}`}>
      {signal.type}
    </span>
  );
}