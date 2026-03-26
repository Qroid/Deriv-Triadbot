import { motion } from "framer-motion";
import { Play, Pause, Square, Settings, TrendingUp, TrendingDown, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { entities as appStorage } from "@/lib/storage";
import { useQueryClient } from "@tanstack/react-query";

// Strategy descriptions for vivid context
const STRATEGY_INFO = {
  "Martingale":         { desc: "Double stake after each loss", tag: "High Risk" },
  "Fibonacci":          { desc: "Follow Fibonacci sequence on losses", tag: "Moderate Risk" },
  "D'Alembert":         { desc: "Increase by 1 unit after loss, decrease by 1 on win", tag: "Low Risk" },
  "Oscar's Grind":      { desc: "Increase stake after win, reset on loss", tag: "Conservative" },
  "Fixed Stake":        { desc: "Same stake every trade", tag: "Safe" },
  "Percentage Stake":   { desc: "Stake as % of current balance", tag: "Adaptive" },
  "Reverse Martingale": { desc: "Double stake after each win", tag: "Aggressive" },
};

export default function BotCard({ bot, onEdit, index = 0 }) {
  const queryClient = useQueryClient();

  /** @param {string} newStatus */
  const handleStatus = async (newStatus) => {
    await appStorage.TradingBot.update(bot.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["tradingBots"] });
  };

  const isActive = bot.status === "active";
  const isPaused = bot.status === "paused";
  const stratInfo = STRATEGY_INFO[bot.strategy] || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-2xl border backdrop-blur-xl transition-all duration-500 group shadow-sm hover:shadow-md ${
        isActive ? "border-success/40 bg-success/[0.02]" : "border-black/[0.08] bg-white/60 hover:border-black/[0.12]"
      }`}
    >
      {/* Status bar */}
      <div className={`h-[2px] w-full transition-all duration-500 ${
        isActive ? "bg-success" : 
        isPaused ? "bg-warning" : 
        "bg-black/[0.05]"
      }`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className={`h-2.5 w-2.5 rounded-full ${
                  isActive ? "bg-success shadow-[0_0_8px_hsl(142,71%,45%)]" : 
                  isPaused ? "bg-warning" : "bg-slate-300"
                }`} />
                {isActive && <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-success animate-ping opacity-75" />}
              </div>
              <h3 className="font-bold text-foreground/90 text-sm tracking-tight">{bot.name}</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{bot.asset}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-black/[0.03] border border-black/[0.05] text-slate-400 hover:text-foreground transition-all duration-300" onClick={() => onEdit(bot)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Strategy info — vivid */}
        <div className="rounded-xl bg-black/[0.02] border border-black/[0.05] p-4 space-y-3 transition-colors duration-300 group-hover:border-black/[0.08]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Strategy</p>
              <p className="text-sm font-black text-foreground tracking-tight">{bot.strategy}</p>
            </div>
            {stratInfo.tag && (
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${
                stratInfo.tag === "High Risk" || stratInfo.tag === "Aggressive"
                  ? "bg-primary/10 text-primary border-primary/20"
                  : stratInfo.tag === "Safe" || stratInfo.tag === "Conservative"
                  ? "bg-success/10 text-success border-success/20"
                  : "bg-accent/10 text-accent border-accent/20"
              }`}>
                {stratInfo.tag}
              </span>
            )}
          </div>
          
          <div className="pt-3 border-t border-black/[0.03]">
            <p className="text-[9px] uppercase tracking-[0.2em] text-slate-400 font-black mb-1">Contract</p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-slate-600">{bot.contract_type}</p>
              {bot.prediction && (
                <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.5 rounded bg-white border border-black/[0.05] shadow-sm">
                  {bot.prediction}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black">Stake</p>
            <p className="text-sm font-black font-mono text-foreground tracking-tighter">${bot.initial_stake?.toFixed(2)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black">P&L</p>
            <p className={`text-sm font-black font-mono tracking-tighter ${(bot.total_profit || 0) >= 0 ? "text-success" : "text-primary"}`}>
              {(bot.total_profit || 0) >= 0 ? "+" : ""}${(bot.total_profit || 0).toFixed(2)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black">Win Rate</p>
            <p className="text-sm font-black font-mono text-foreground tracking-tighter">{(bot.win_rate || 0).toFixed(0)}%</p>
          </div>
        </div>

        {/* TP/SL/Trades */}
        <div className="flex items-center gap-3 py-2 px-3 rounded-lg bg-black/[0.02] border border-black/[0.03]">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-success" />
            <span className="text-[10px] font-mono font-bold text-success">${bot.take_profit}</span>
          </div>
          <div className="h-3 w-[1px] bg-black/[0.05]" />
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-mono font-bold text-primary">${bot.stop_loss}</span>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <Hash className="h-3 w-3 text-slate-400" />
            <span className="text-[10px] font-mono font-bold text-slate-500">{bot.total_trades || 0}/{bot.max_trades}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-1">
          {!isActive && (
            <Button size="sm" className="flex-1 bg-success/10 text-success hover:bg-success/20 border-0 text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300"
              onClick={() => handleStatus("active")}>
              <Play className="h-3 w-3 mr-1.5 fill-current" /> Start Bot
            </Button>
          )}
          {isActive && (
            <Button size="sm" variant="outline" className="flex-1 border-warning/20 bg-warning/[0.02] text-warning hover:bg-warning/10 text-[10px] font-black uppercase tracking-[0.15em]"
              onClick={() => handleStatus("paused")}>
              <Pause className="h-3 w-3 mr-1.5 fill-current" /> Pause
            </Button>
          )}
          {(isActive || isPaused) && (
            <Button size="sm" variant="outline" className="border-primary/20 bg-primary/[0.02] text-primary hover:bg-primary/10 text-[10px] font-black uppercase tracking-[0.15em]"
              onClick={() => handleStatus("stopped")}>
              <Square className="h-3 w-3 fill-current" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}