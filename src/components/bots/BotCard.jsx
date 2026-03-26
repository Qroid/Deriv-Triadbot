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

const CONTRACT_INFO = {
  "Rise/Fall":      "Predict if next tick is higher or lower than entry",
  "Even/Odd":       "Predict if last digit will be even or odd",
  "Matches/Differs":"Predict if last digit matches or differs from barrier",
  "Over/Under":     "Predict if last digit will be over or under barrier",
  "Higher/Lower":   "Predict if exit price is higher or lower than entry",
};

export default function BotCard({ bot, onEdit, index = 0 }) {
  const queryClient = useQueryClient();

  const handleStatus = async (newStatus) => {
    await appStorage.TradingBot.update(bot.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ["tradingBots"] });
  };

  const isActive = bot.status === "active";
  const isPaused = bot.status === "paused";
  const stratInfo = STRATEGY_INFO[bot.strategy] || {};
  const contractInfo = CONTRACT_INFO[bot.contract_type] || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`rounded-2xl border bg-card overflow-hidden transition-all duration-200 ${
        isActive ? "border-success/30" : "border-border/60"
      }`}
    >
      {/* Status bar */}
      <div className={`h-0.5 w-full ${
        isActive ? "bg-success" : isPaused ? "bg-warning" : "bg-border"
      }`} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`h-2 w-2 rounded-full shrink-0 ${
                isActive ? "bg-success animate-pulse-dot" : isPaused ? "bg-warning" : "bg-muted-foreground/30"
              }`} />
              <h3 className="font-bold text-foreground text-sm">{bot.name}</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">{bot.asset}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(bot)}>
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Strategy info — vivid */}
        <div className="rounded-xl bg-secondary/50 border border-border/40 p-3 space-y-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-0.5">Strategy</p>
              <p className="text-sm font-bold text-foreground">{bot.strategy}</p>
            </div>
            {stratInfo.tag && (
              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
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
          {stratInfo.desc && <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{stratInfo.desc}</p>}

          <div className="pt-1 border-t border-border/30">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-bold mb-0.5">Contract</p>
            <p className="text-xs font-semibold text-foreground">{bot.contract_type}
              {bot.prediction && <span className="text-muted-foreground font-normal"> · {bot.prediction}</span>}
            </p>
            {contractInfo && <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">{contractInfo}</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-medium">Stake</p>
            <p className="text-sm font-black font-mono text-foreground">${bot.initial_stake?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-medium">P&L</p>
            <p className={`text-sm font-black font-mono ${(bot.total_profit || 0) >= 0 ? "text-success" : "text-primary"}`}>
              {(bot.total_profit || 0) >= 0 ? "+" : ""}${(bot.total_profit || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-medium">Win%</p>
            <p className="text-sm font-black font-mono text-foreground">{(bot.win_rate || 0).toFixed(0)}%</p>
          </div>
        </div>

        {/* TP/SL/Trades */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-success" />TP ${bot.take_profit}</span>
          <span className="flex items-center gap-1"><TrendingDown className="h-3 w-3 text-primary" />SL ${bot.stop_loss}</span>
          <span className="flex items-center gap-1"><Hash className="h-3 w-3 text-accent" />{bot.total_trades || 0}/{bot.max_trades}</span>
        </div>

        {/* Controls */}
        <div className="flex gap-2 pt-1">
          {!isActive && (
            <Button size="sm" className="flex-1 bg-success/10 text-success hover:bg-success/20 border-0 text-xs"
              onClick={() => handleStatus("active")}>
              <Play className="h-3 w-3 mr-1" /> Start
            </Button>
          )}
          {isActive && (
            <Button size="sm" variant="outline" className="flex-1 border-warning/30 text-warning hover:bg-warning/10 text-xs"
              onClick={() => handleStatus("paused")}>
              <Pause className="h-3 w-3 mr-1" /> Pause
            </Button>
          )}
          {(isActive || isPaused) && (
            <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 text-xs"
              onClick={() => handleStatus("stopped")}>
              <Square className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}