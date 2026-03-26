import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Bot, History, LineChart, Settings, Activity } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & P&L" },
  { path: "/bots", label: "My Bots", icon: Bot, desc: "Manage strategies" },
  { path: "/market", label: "Market Scanner", icon: LineChart, desc: "Digit & tick signals" },
  { path: "/history", label: "Trade History", icon: History, desc: "Execution log" },
  { path: "/settings", label: "Settings", icon: Settings, desc: "API & preferences" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-black/[0.05] fixed top-14 bottom-0 left-0 z-30 bg-white/80 backdrop-blur-xl overflow-y-auto scrollbar-none">
      <nav className="flex-1 p-4 space-y-1.5 pt-6">
        <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground/40 font-black px-4 mb-4">Trading Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 relative ${
                isActive
                  ? "bg-black/[0.03] text-foreground border border-black/[0.05] shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-black/[0.02]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-sm"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive ? "bg-primary text-white shadow-md" : "bg-black/[0.03] border border-black/[0.05] group-hover:border-black/[0.1]"
              }`}>
                <item.icon className={`h-4.5 w-4.5`} />
              </div>
              <div className="min-w-0">
                <p className={`font-black tracking-tight leading-none text-[13px] ${isActive ? "text-foreground" : "text-muted-foreground/70"}`}>{item.label}</p>
                <p className="text-[10px] mt-1 text-muted-foreground/40 font-medium truncate tracking-tight">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-6">
        <div className="rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-wider text-foreground/80">System Health</span>
          </div>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground/50 font-medium">Markets</span>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 font-black text-[9px] uppercase tracking-wider">
                <span className="h-1 w-1 rounded-full bg-success animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground/50 font-medium">Platform</span>
              <span className="text-accent font-black tracking-widest text-[10px] uppercase">Deriv</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}