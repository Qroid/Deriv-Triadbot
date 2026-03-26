import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { entities as appStorage } from "@/lib/storage";
import { History, Filter, TrendingUp, TrendingDown, Search, Download, Trash2, Clock, Hash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import moment from "moment";

export default function TradeHistory() {
  const [resultFilter, setResultFilter] = useState("all");

  const { data: trades = [] } = useQuery({
    queryKey: ["tradeHistory"],
    queryFn: () => appStorage.TradeHistory.list("-created_date", 100),
  });

  const filtered = useMemo(() =>
    resultFilter === "all" ? trades : trades.filter(t => t.result === resultFilter),
    [trades, resultFilter]);

  const stats = useMemo(() => {
    const wins = trades.filter(t => t.result === "win").length;
    const losses = trades.filter(t => t.result === "loss").length;
    const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
    const biggestWin = trades.reduce((m, t) => t.profit > m ? t.profit : m, 0);
    const biggestLoss = trades.reduce((m, t) => t.profit < m ? t.profit : m, 0);
    return { wins, losses, totalProfit, biggestWin, biggestLoss };
  }, [trades]);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Records</p>
        <h1 className="text-2xl font-black text-foreground">Trade History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All trades on Deriv synthetic indices</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total P&L", value: `${stats.totalProfit >= 0 ? "+" : ""}$${stats.totalProfit.toFixed(2)}`, color: stats.totalProfit >= 0 ? "text-success" : "text-primary" },
          { label: "Wins", value: stats.wins, color: "text-success" },
          { label: "Losses", value: stats.losses, color: "text-primary" },
          { label: "Best Trade", value: `+$${stats.biggestWin.toFixed(2)}`, color: "text-success" },
          { label: "Worst Trade", value: `$${stats.biggestLoss.toFixed(2)}`, color: "text-primary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">{label}</p>
            <p className={`text-xl font-black font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={resultFilter} onValueChange={setResultFilter}>
          <SelectTrigger className="w-36 bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">All Trades</SelectItem>
            <SelectItem value="win">Wins Only</SelectItem>
            <SelectItem value="loss">Losses Only</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} trades</span>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl border border-border/60 bg-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <History className="h-10 w-10 text-muted-foreground/20" />
            <p className="font-bold text-foreground">No trades yet</p>
            <p className="text-sm text-muted-foreground">Trades from active bots will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/30">
                  {["Time", "Bot", "Asset", "Contract", "Stake", "P&L", "Result"].map(h => (
                    <th key={h} className={`py-3 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-wider ${
                      ["Stake", "P&L"].includes(h) ? "text-right" : ["Result"].includes(h) ? "text-center" : "text-left"
                    } ${["Contract"].includes(h) ? "hidden lg:table-cell" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((trade, i) => (
                  <motion.tr key={trade.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                    className="border-b border-border/40 hover:bg-secondary/20 transition-colors">
                    <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">
                      {moment(trade.created_date).format("MMM D, HH:mm")}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground text-xs">{trade.bot_name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{trade.asset}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground hidden lg:table-cell">{trade.contract_type}</td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-foreground">${trade.stake?.toFixed(2)}</td>
                    <td className={`py-3 px-4 text-right font-mono font-bold text-xs ${trade.profit >= 0 ? "text-success" : "text-primary"}`}>
                      {trade.profit >= 0 ? "+" : ""}{trade.profit?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        trade.result === "win" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
                      }`}>{trade.result}</span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}