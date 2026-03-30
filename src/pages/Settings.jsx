import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities as appStorage } from "@/lib/storage";
import { localAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Key, Bell, Save, Loader2, CheckCircle2, LogOut, LogIn, Bot, TrendingUp, Activity, DollarSign, ChevronRight, FlaskConical, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useDerivAccount } from "@/hooks/useDerivAccount";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import RecentTradesTable from "../components/dashboard/RecentTradesTable";

const accentMap = {
  up:      { icon: "bg-success/10 border-success/20",  text: "text-success",     iconColor: "text-success" },
  down:    { icon: "bg-primary/10 border-primary/20",  text: "text-primary",     iconColor: "text-primary" },
  neutral: { icon: "bg-accent/10 border-accent/20",    text: "text-accent",      iconColor: "text-accent" },
  info:    { icon: "bg-slate-100 border-slate-200",    text: "text-slate-900",   iconColor: "text-slate-500" },
};

function StatCard({ title, value, icon: Icon, trend, trendUp, accent = "neutral", delay = 0 }) {
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
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 shadow-md ${s.icon}`}>
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
        <p className="text-2xl font-black font-mono text-foreground tracking-tighter">{value}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const { isAuthenticated, logout, loginWithDeriv, user, accounts, activeAccount, switchAccount } = useAuth();
  const { balance: liveBalance, currency, isAuthorized } = useDerivAccount();
  const [settings, setSettings] = useState({
    demo_mode: true,
    sound_alerts: false,
    notify_wins: true,
    notify_losses: true,
  });
  const [saving, setSaving] = useState(false);

  const { data: bots = [] } = useQuery({
    queryKey: ["tradingBots"],
    queryFn: () => appStorage.TradingBot.list("-updated_date"),
  });
  const { data: allTrades = [] } = useQuery({
    queryKey: ["tradeHistory"],
    queryFn: () => appStorage.TradeHistory.list("-created_date"),
  });
  const trades = allTrades.slice(0, 30);

  const stats = {
    activeBots: bots.filter(b => b.status === "active").length,
    totalBots: bots.length,
    totalProfit: bots.reduce((s, b) => s + (b.total_profit || 0), 0),
    totalTrades: bots.reduce((s, b) => s + (b.total_trades || 0), 0),
    avgWinRate: bots.length > 0 ? bots.reduce((s, b) => s + (b.win_rate || 0), 0) / bots.length : 0,
  };

  const profitCurve = trades.slice().reverse().map((t, i) => {
    let cum = 0;
    trades.slice(0, i + 1).forEach(tr => cum += (tr.profit || 0));
    return { i, value: cum };
  });

  const isProfit = stats.totalProfit >= 0;
  const hasDemo = accounts.some(a => a.is_virtual === 1);
  const hasReal = accounts.some(a => a.is_virtual === 0);
  const isDemo = activeAccount?.is_virtual === 1;
  const displayBalance = isAuthorized ? liveBalance : (user?.balance ?? 0);

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localAuth.getAccount();
      if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    localAuth.saveAccount(settings);
    toast.success("Settings saved");
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">My Account</p>
        <h1 className="text-2xl font-black text-foreground">Settings</h1>
      </motion.div>

      {/* Account Info Section */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Deriv Account</p>
            <p className="text-[11px] text-muted-foreground">Your connected Deriv trading account</p>
          </div>
        </div>

        {isAuthenticated ? (
          <>
            <div className="rounded-xl bg-gradient-to-br from-success/8 to-primary/5 border border-success/20 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                    isDemo ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}>
                    {isDemo ? <FlaskConical className="h-6 w-6 text-emerald-600" /> : <TrendingDown className="h-6 w-6 text-amber-600" />}
                  </div>
                  <div>
                    <p className="text-xs font-black text-success uppercase tracking-widest">Connected Account</p>
                    <p className="text-lg font-black text-foreground">{activeAccount?.loginid || user?.loginid}</p>
                    <p className="text-[10px] text-muted-foreground">{user?.name || 'Trader'}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={logout} className="text-[10px] text-primary font-black uppercase tracking-widest hover:bg-primary/5">
                  <LogOut className="h-3.5 w-3.5 mr-1.5" /> Disconnect
                </Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-success/10">
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Live Balance</p>
                  <p className="text-xl font-black font-mono">{currency} {displayBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Account Type</p>
                  <p className="text-xl font-black">{isDemo ? 'Demo' : 'Real'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground uppercase font-bold">Currency</p>
                  <p className="text-xl font-black">{currency}</p>
                </div>
              </div>
            </div>

            {/* Account Switcher */}
            {(hasDemo || hasReal) && accounts.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Switch Account</p>
                <div className="flex gap-2 flex-wrap">
                  {accounts.map((acc) => {
                    const isActive = acc.loginid === activeAccount?.loginid;
                    const accIsDemo = acc.is_virtual === 1;
                    return (
                      <button
                        key={acc.loginid}
                        onClick={() => switchAccount(acc.loginid)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
                          isActive 
                            ? 'bg-primary/5 border-primary/20 text-primary' 
                            : 'bg-secondary/50 border-border hover:border-primary/20'
                        }`}
                      >
                        {accIsDemo ? <FlaskConical className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        <span className="text-xs font-black">{acc.loginid}</span>
                        {isActive && <CheckCircle2 className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect your account using OAuth 2.0 to trade live and earn commissions. This is a secure, official Deriv login.
            </p>
            <Button onClick={loginWithDeriv} className="bg-primary text-white hover:bg-primary/90 w-full h-12 rounded-xl font-black uppercase tracking-widest text-xs">
              <LogIn className="h-4 w-4 mr-2" />
              Secure Login with Deriv
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total P&L" value={`${isProfit ? "+" : ""}$${stats.totalProfit.toFixed(2)}`}
          icon={DollarSign} accent={isProfit ? "up" : "down"} trendUp={isProfit} trend={0} delay={0} />
        <StatCard title="Active Bots" value={`${stats.activeBots} / ${stats.totalBots}`} icon={Bot} accent="info" trend={0} trendUp={false} delay={0.05} />
        <StatCard title="Total Trades" value={String(stats.totalTrades)} icon={Activity} accent="neutral" trend={0} trendUp={false} delay={0.1} />
        <StatCard title="Win Rate" value={`${stats.avgWinRate.toFixed(1)}%`} icon={TrendingUp}
          accent={stats.avgWinRate >= 50 ? "up" : "down"} trendUp={stats.avgWinRate >= 50} trend={0} delay={0.15} />
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
                      <stop offset="0%" stopColor="hsl(346, 84%, 49%)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(346, 84%, 49%)" stopOpacity={0} />
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

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Bell className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Alerts</p>
            <p className="text-[11px] text-muted-foreground">Trade outcome notifications</p>
          </div>
        </div>
        {[
          { key: "notify_wins", label: "Win Alerts", desc: "Notify on profitable trades" },
          { key: "notify_losses", label: "Loss Alerts", desc: "Notify on losing trades" },
          { key: "sound_alerts", label: "Sound Effects", desc: "Audio feedback on outcomes" },
          { key: "demo_mode", label: "Demo Account Mode", desc: "Use virtual funds for simulation" },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
            <div>
              <p className="text-sm font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{desc}</p>
            </div>
            <Switch checked={!!settings[key]} onCheckedChange={(v) => setSettings({ ...settings, [key]: v })} />
          </div>
        ))}
      </motion.div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-primary text-white hover:bg-primary/90">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save Settings
      </Button>
    </div>
  );
}