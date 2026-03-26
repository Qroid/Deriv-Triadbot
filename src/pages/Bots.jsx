import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { entities as appStorage } from "@/lib/storage";
import { Plus, Bot, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BotCard from "../components/bots/BotCard";
import BotFormDialog from "../components/bots/BotFormDialog";
import { motion } from "framer-motion";

export default function Bots() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBot, setEditBot] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: bots = [] } = useQuery({
    queryKey: ["tradingBots"],
    queryFn: () => appStorage.TradingBot.list("-updated_date"),
  });

  const filteredBots = bots.filter(bot => {
    const matchesSearch = bot.name?.toLowerCase().includes(search.toLowerCase()) ||
      bot.asset?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || bot.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const counts = {
    all: bots.length,
    active: bots.filter(b => b.status === "active").length,
    paused: bots.filter(b => b.status === "paused").length,
    stopped: bots.filter(b => b.status === "stopped").length,
  };

  return (
    <div className="p-4 md:p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Synthetic Indices</p>
          <h1 className="text-2xl font-black text-foreground">My Bots</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Automated strategies on Deriv synthetic markets</p>
        </div>
        <Button onClick={() => { setEditBot(null); setDialogOpen(true); }}
          className="bg-primary text-white hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1.5" /> New Bot
        </Button>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search bots..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border" />
        </div>
        <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 border border-border/40">
          {["all", "active", "paused", "stopped"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === s ? "bg-primary/10 text-primary border border-primary/15" : "text-muted-foreground hover:text-foreground"
              }`}>
              {s} ({counts[s]})
            </button>
          ))}
        </div>
      </div>

      {filteredBots.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Bot className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-bold text-foreground">No bots found</p>
          <p className="text-sm text-muted-foreground">
            {search ? "Try a different search" : "Create your first Deriv synthetic market bot"}
          </p>
          {!search && (
            <Button onClick={() => { setEditBot(null); setDialogOpen(true); }}
              className="bg-primary text-white hover:bg-primary/90 mt-1">
              <Plus className="h-4 w-4 mr-1.5" /> Create Bot
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredBots.map((bot, i) => (
            <BotCard key={bot.id} bot={bot} onEdit={b => { setEditBot(b); setDialogOpen(true); }} index={i} />
          ))}
        </div>
      )}

      <BotFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editBot={editBot} />
    </div>
  );
}