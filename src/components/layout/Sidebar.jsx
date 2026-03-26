import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Bot, History, LineChart, Settings, Activity, Blocks } from "lucide-react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard, desc: "Overview & P&L" },
  { path: "/bots", label: "My Bots", icon: Bot, desc: "Manage strategies" },
  { path: "/builder", label: "Bot Builder", icon: Blocks, desc: "Visual bot editor" },
  { path: "/market", label: "Market Scanner", icon: LineChart, desc: "Digit & tick signals" },
  { path: "/history", label: "Trade History", icon: History, desc: "Execution log" },
  { path: "/settings", label: "Settings", icon: Settings, desc: "API & preferences" },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-black/[0.05] fixed top-16 bottom-0 left-0 z-30 bg-white/95 backdrop-blur-xl overflow-y-auto scrollbar-none shadow-sm">
      <nav className="flex-1 p-4 space-y-1.5 pt-6">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground/60 font-black px-4 mb-6">Trading Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 relative ${
                isActive
                  ? "bg-primary/5 text-primary shadow-[inset_0_0_0_1px_rgba(227,12,55,0.1)]"
                  : "text-slate-500 hover:text-primary hover:bg-primary/[0.02]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[0_0_10px_rgba(227,12,55,0.3)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                isActive ? "bg-primary text-white shadow-md rotate-3" : "bg-slate-100 border border-slate-200 group-hover:border-primary/20"
              }`}>
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[2.5px]" : "stroke-[2px]"}`} />
              </div>
              <div className="min-w-0">
                <p className={`font-black tracking-tight leading-none text-[14px] ${isActive ? "text-primary" : "text-slate-600"}`}>{item.label}</p>
                <p className="text-[10px] mt-1.5 text-slate-400 font-bold truncate tracking-tight uppercase opacity-80">{item.desc}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-6">
        <div className="rounded-[1.5rem] border border-primary/10 bg-primary/[0.03] p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Activity className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-wider text-primary/80">System Health</span>
          </div>
          <div className="space-y-3 text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-tight">Markets</span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/20 font-black text-[9px] uppercase tracking-widest">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Online
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 font-bold uppercase tracking-tight">Platform</span>
              <span className="text-primary font-black tracking-[0.15em] text-[10px] uppercase">Deriv API</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}