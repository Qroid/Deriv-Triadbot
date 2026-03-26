import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { entities as appStorage } from "@/lib/storage";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const assets = [
  "Volatility 10 Index", "Volatility 25 Index", "Volatility 50 Index",
  "Volatility 75 Index", "Volatility 100 Index", "Boom 1000 Index",
  "Boom 500 Index", "Crash 1000 Index", "Crash 500 Index",
  "Step Index", "Range Break 100 Index", "Range Break 200 Index"
];

const strategies = [
  "Martingale", "D'Alembert", "Oscar's Grind", "Fibonacci",
  "Fixed Stake", "Percentage Stake", "Reverse Martingale"
];

const contractTypes = ["Rise/Fall", "Even/Odd", "Matches/Differs", "Over/Under", "Higher/Lower"];

const predictionsByContract = {
  "Rise/Fall": ["Rise", "Fall"],
  "Even/Odd": ["Even", "Odd"],
  "Matches/Differs": ["Matches", "Differs"],
  "Over/Under": ["Over", "Under"],
  "Higher/Lower": ["Higher", "Lower"],
};

const defaultForm = {
  name: "",
  asset: "Volatility 10 Index",
  strategy: "Martingale",
  contract_type: "Rise/Fall",
  prediction: "Rise",
  initial_stake: 0.35,
  take_profit: 10,
  stop_loss: 5,
  max_trades: 100,
  duration: 5,
  multiplier: 2,
};

export default function BotFormDialog({ open, onOpenChange, editBot }) {
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (editBot) {
      setForm({
        name: editBot.name || "",
        asset: editBot.asset || "Volatility 10 Index",
        strategy: editBot.strategy || "Martingale",
        contract_type: editBot.contract_type || "Rise/Fall",
        prediction: editBot.prediction || "Rise",
        initial_stake: editBot.initial_stake || 0.35,
        take_profit: editBot.take_profit || 10,
        stop_loss: editBot.stop_loss || 5,
        max_trades: editBot.max_trades || 100,
        duration: editBot.duration || 5,
        multiplier: editBot.multiplier || 2,
      });
    } else {
      setForm(defaultForm);
    }
  }, [editBot, open]);

  const handleSave = async () => {
    setSaving(true);
    if (editBot) {
      await appStorage.TradingBot.update(editBot.id, form);
    } else {
      await appStorage.TradingBot.create({ ...form, status: "stopped", total_profit: 0, total_trades: 0, win_rate: 0 });
    }
    queryClient.invalidateQueries({ queryKey: ["tradingBots"] });
    setSaving(false);
    onOpenChange(false);
  };

  const predictions = predictionsByContract[form.contract_type] || ["Rise", "Fall"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {editBot ? "Edit Bot" : "Create Trading Bot"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label className="text-muted-foreground text-xs">Bot Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="My Trading Bot"
              className="bg-secondary border-border mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Asset</Label>
              <Select value={form.asset} onValueChange={(v) => setForm({ ...form, asset: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {assets.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Strategy</Label>
              <Select value={form.strategy} onValueChange={(v) => setForm({ ...form, strategy: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {strategies.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Contract Type</Label>
              <Select value={form.contract_type} onValueChange={(v) => setForm({ ...form, contract_type: v, prediction: predictionsByContract[v]?.[0] || "Rise" })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {contractTypes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Prediction</Label>
              <Select value={form.prediction} onValueChange={(v) => setForm({ ...form, prediction: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {predictions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Stake ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.35"
                value={form.initial_stake}
                onChange={(e) => setForm({ ...form, initial_stake: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Take Profit ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.take_profit}
                onChange={(e) => setForm({ ...form, take_profit: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Stop Loss ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.stop_loss}
                onChange={(e) => setForm({ ...form, stop_loss: parseFloat(e.target.value) || 0 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs">Max Trades</Label>
              <Input
                type="number"
                value={form.max_trades}
                onChange={(e) => setForm({ ...form, max_trades: parseInt(e.target.value) || 100 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Duration (ticks)</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 5 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Multiplier</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                value={form.multiplier}
                onChange={(e) => setForm({ ...form, multiplier: parseFloat(e.target.value) || 2 })}
                className="bg-secondary border-border mt-1 font-mono"
              />
            </div>
          </div>

          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
            onClick={handleSave}
            disabled={saving || !form.name}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editBot ? "Update Bot" : "Create Bot"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}