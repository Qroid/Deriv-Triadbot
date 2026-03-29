import { useState, useEffect } from "react";
import { localAuth } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Key, Bell, Shield, Save, Loader2, CheckCircle2, ExternalLink, LogOut, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";

export default function Settings() {
  const { isAuthenticated, logout, loginWithDeriv, user } = useAuth();
  const [settings, setSettings] = useState({
    demo_mode: true,
    sound_alerts: false,
    notify_wins: true,
    notify_losses: true,
  });
  const [saving, setSaving] = useState(false);

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
    <div className="p-4 md:p-6 space-y-5 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">Configuration</p>
        <h1 className="text-2xl font-black text-foreground">Settings</h1>
      </motion.div>

      {/* Account Connection */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Key className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-bold text-sm text-foreground">Deriv Account</p>
            <p className="text-[11px] text-muted-foreground">Manage your connection to the Deriv platform</p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="rounded-xl bg-success/8 border border-success/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <div>
                  <p className="text-xs font-black text-success uppercase tracking-widest">Linked Account</p>
                  <p className="text-lg font-black text-foreground">{user?.id || user?.loginid}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={logout} className="text-[10px] text-primary font-black uppercase tracking-widest hover:bg-primary/5">
                <LogOut className="h-3.5 w-3.5 mr-1.5" /> Disconnect
              </Button>
            </div>
            <div className="pt-2 border-t border-success/10 flex gap-6">
               <div>
                 <p className="text-[9px] text-muted-foreground uppercase font-bold">Balance</p>
                 <p className="text-sm font-black">{user?.currency || 'USD'} {user?.balance !== undefined && user?.balance !== null ? user.balance : '-'}</p>
               </div>
               <div>
                 <p className="text-[9px] text-muted-foreground uppercase font-bold">Account Name</p>
                 <p className="text-sm font-black">{user?.name || 'Trader'}</p>
               </div>
            </div>
          </div>
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