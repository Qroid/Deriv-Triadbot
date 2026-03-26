import { motion } from "framer-motion";

export default function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, glowClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-xl border border-border bg-card p-5 ${glowClass || ""}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-mono font-semibold px-2 py-1 rounded-md ${
            trendUp ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          }`}>
            {trendUp ? "+" : ""}{trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold text-foreground font-mono tracking-tight">{value}</h3>
      <p className="text-xs text-muted-foreground mt-1 font-medium">{title}</p>
      {subtitle && <p className="text-[11px] text-muted-foreground/70 mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}