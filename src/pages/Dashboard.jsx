import { useQuery } from "@tanstack/react-query";
import { entities as appStorage } from "@/lib/storage";
import { Bot, TrendingUp, Activity, DollarSign, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RecentTradesTable from "../components/dashboard/RecentTradesTable";

function StatCard({ title, value, icon: Icon, trend, trendUp, accent = "neutral", delay = 0 }) {
  const accentMap = {
    up:      { icon: "bg-success/10 border-success/20",  text: "text-success",     iconColor: "text-success" },
    down:    { icon: "bg-primary/10 border-primary/20",  text: "text-primary",     iconColor: "text-primary" },
    neutral: { icon: "bg-accent/10 border-accent/20",    text: "text-accent",      iconColor: "text-accent" },
    info:    { icon: "bg-slate-100 border-slate-200",    text: "text-slate-900",   iconColor: "text-slate-500" },
  };
  const s = accentMap[accent] || accentMap.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.23, 1, 0.32, 1] }}
      className="rounded-2xl border border-black/[0.05] bg-white/80 backdrop-blur-xl p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
    >
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full blur-3xl opacity-[0.08] transition-opacity group-hover:opacity-[0.12] ${
        accent === "up" ? "bg-success" : accent === "down" ? "bg-primary" : "bg-accent"
      }`} />
      
      <div className="flex items-start justify-between mb-5">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-sm ${s.icon}`}>
          <Icon className={`h-5 w-5 ${s.iconColor}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-[10px] font-mono font-black px-2.5 py-1 rounded-lg border ${
            trendUp ? "text-success bg-success/10 border-success/20" : "text-primary bg-primary/10 border-primary/20"
          }`}>
            {trendUp ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black font-mono text-foreground tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: bots = [] } = useQuery({
    queryKey: ["tradingBots"],
    queryFn: () => appStorage.TradingBot.list("-updated_date"),
  });
  const { data: trades = [] } = useQuery({
    queryKey: ["tradeHistory"],
    queryFn: () => appStorage.TradeHistory.list("-created_date", 30),
  });

  const stats = useMemo(() => {
    const activeBots = bots.filter(b => b.status === "active").length;
    const totalProfit = bots.reduce((s, b) => s + (b.total_profit || 0), 0);
    const totalTrades = bots.reduce((s, b) => s + (b.total_trades || 0), 0);
    const avgWinRate = bots.length > 0 ? bots.reduce((s, b) => s + (b.win_rate || 0), 0) / bots.length : 0;
    return { activeBots, totalProfit, totalTrades, avgWinRate };
  }, [bots]);

  const profitCurve = useMemo(() => {
    let cum = 0;
    return trades.slice().reverse().map((t, i) => {
      cum += (t.profit || 0);
      return { i, value: cum };
    });
  }, [trades]);

  const isProfit = stats.totalProfit >= 0;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Overview</p>
          <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
          Deriv Synthetic Markets
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total P&L" value={`${isProfit ? "+" : ""}$${stats.totalProfit.toFixed(2)}`}
          icon={DollarSign} accent={isProfit ? "up" : "down"} trendUp={isProfit} delay={0} />
        <StatCard title="Active Bots" value={`${stats.activeBots} / ${bots.length}`} icon={Bot} accent="info" delay={0.05} />
        <StatCard title="Total Trades" value={stats.totalTrades} icon={Activity} accent="neutral" delay={0.1} />
        <StatCard title="Win Rate" value={`${stats.avgWinRate.toFixed(1)}%`} icon={TrendingUp}
          accent={stats.avgWinRate >= 50 ? "up" : "down"} trendUp={stats.avgWinRate >= 50} delay={0.15} />
      </div>

      {/* Chart + Active Bots */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs font-bold text-foreground mb-0.5">Equity Curve</p>
          <p className="text-[10px] text-muted-foreground mb-4">Cumulative P&L across all closed trades</p>
          <div className="h-48">
            {profitCurve.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={profitCurve} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(357,95%,62%)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="hsl(357,95%,62%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="i" hide />
                  <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                  <Tooltip
                    contentStyle={{ background: "hsl(220,16%,11%)", border: "1px solid hsl(220,16%,18%)", borderRadius: "10px", fontSize: "12px" }}
                    formatter={(v) => [`$${parseFloat(v).toFixed(2)}`, "P&L"]}
                    labelFormatter={() => ""}
                  />
                  <Area type="monotone" dataKey="value" stroke="hsl(357,95%,62%)" strokeWidth={2} fill="url(#pGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                <Activity className="h-8 w-8 opacity-20" />
                <p className="text-xs">No trade history yet</p>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-foreground">Active Bots</p>
            <Link to="/bots" className="text-[10px] text-primary flex items-center gap-0.5 font-semibold hover:underline">
              All bots <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2 flex-1">
            {bots.filter(b => b.status === "active").length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 gap-2">
                <Bot className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground text-center">No active bots.<br />Start one from My Bots.</p>
                <Link to="/bots" className="text-xs text-primary font-semibold hover:underline">Go to Bots →</Link>
              </div>
            ) : (
              bots.filter(b => b.status === "active").map(bot => (
                <div key={bot.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/40">
                  <span className="h-2 w-2 rounded-full bg-success animate-pulse-dot shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate">{bot.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{bot.strategy} · {bot.asset}</p>
                  </div>
                  <div className={`text-[12px] font-mono font-black ${(bot.total_profit || 0) >= 0 ? "text-success" : "text-primary"}`}>
                    {(bot.total_profit || 0) >= 0 ? "+" : ""}${Math.abs(bot.total_profit || 0).toFixed(2)}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Trades */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-foreground">Recent Trades</p>
          <Link to="/history" className="text-[10px] text-primary font-semibold hover:underline flex items-center gap-0.5">
            Full history <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <RecentTradesTable trades={trades} />
      </motion.div>
    </div>
  );
}