import { useState, useEffect } from "react";
import { localAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, Bell, Shield, Save, Loader2, CheckCircle2, ExternalLink, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function Settings() {
  const [settings, setSettings] = useState({
    api_token: "",
    demo_mode: true,
    sound_alerts: false,
    notify_wins: true,
    notify_losses: true,
  });
  const [saving, setSaving] = useState(false);
  const [connected, setConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localAuth.getAccount();
      if (savedSettings) setSettings(prev => ({ ...prev, ...savedSettings }));
      const savedToken = localStorage.getItem("deriv_token");
      if (savedToken) setSettings(prev => ({ ...prev, api_token: savedToken }));
    };
    loadSettings();
  }, []);

  const testConnection = () => {
    if (!settings.api_token) return;
    setTesting(true);
    const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=100634");
    ws.onopen = () => ws.send(JSON.stringify({ authorize: settings.api_token }));
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.msg_type === "authorize" && !msg.error) {
        setConnected(true);
        setAccountInfo({ loginid: msg.authorize.loginid, currency: msg.authorize.currency, balance: msg.authorize.balance });
        localStorage.setItem("deriv_token", settings.api_token);
        toast.success("Connected to Deriv successfully");
      } else if (msg.error) {
        setConnected(false);
        setAccountInfo(null);
        toast.error("Invalid token: " + msg.error.message);
      }
      setTesting(false);
      ws.close();
    };
    ws.onerror = () => { setTesting(false); toast.error("Connection failed"); ws.close(); };
  };

  const disconnect = () => {
    localStorage.removeItem("deriv_token");
    setConnected(false);
    setAccountInfo(null);
    setSettings(prev => ({ ...prev, api_token: "" }));
    toast.success("Disconnected");
  };

  const handleSave = async () => {
    setSaving(true);
    localAuth.saveAccount(settings);
    toast.success("Settings saved");
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Configuration</p>
        <h1 className="text-2xl font-black text-foreground">Settings</h1>
      </motion.div>

      {/* API Connection */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Deriv API Connection</p>
            <p className="text-[11px] text-muted-foreground">Required only for live trading — not needed to browse</p>
          </div>
        </div>

        {accountInfo ? (
          <div className="rounded-xl bg-success/8 border border-success/20 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <div>
                <p className="text-xs font-bold text-success">Connected — {accountInfo.loginid}</p>
                <p className="text-[10px] text-muted-foreground">Balance: {accountInfo.balance} {accountInfo.currency}</p>
              </div>
            </div>
            <button onClick={disconnect} className="text-[10px] text-primary font-semibold flex items-center gap-1 hover:underline">
              <LogOut className="h-3 w-3" /> Disconnect
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-[11px] text-muted-foreground">API Token</Label>
              <Input
                type="password"
                value={settings.api_token}
                onChange={(e) => setSettings({ ...settings, api_token: e.target.value })}
                placeholder="Paste your Deriv API token here"
                className="bg-secondary border-border mt-1 font-mono text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                Get your token at
                <a href="https://app.deriv.com/account/api-token" target="_blank" rel="noreferrer"
                  className="text-primary hover:underline flex items-center gap-0.5">
                  app.deriv.com/account/api-token <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </p>
            </div>
            <Button onClick={testConnection} disabled={!settings.api_token || testing}
              className="bg-primary text-white hover:bg-primary/90 w-full">
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
              {testing ? "Connecting..." : "Connect to Deriv"}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50">
          <div>
            <p className="text-sm font-semibold text-foreground">Demo Account Mode</p>
            <p className="text-[11px] text-muted-foreground">Use virtual funds for simulation</p>
          </div>
          <Switch checked={settings.demo_mode} onCheckedChange={(v) => setSettings({ ...settings, demo_mode: v })} />
        </div>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
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