import { Link, useLocation } from "react-router-dom";
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
    <aside className="hidden lg:flex flex-col w-64 border-r border-border/60 fixed top-14 bottom-0 left-0 z-30 bg-sidebar overflow-y-auto">
      <nav className="flex-1 p-3 space-y-0.5 pt-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/40 font-bold px-3 mb-3">Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                isActive
                  ? "bg-primary/10 text-primary border border-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? "bg-primary/15" : "bg-secondary group-hover:bg-secondary/80"
              }`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold leading-none text-[13px]">{item.label}</p>
                <p className="text-[10px] mt-0.5 text-muted-foreground/60">{item.desc}</p>
              </div>
              {isActive && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 pb-4">
        <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground">System</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Markets</span>
              <span className="flex items-center gap-1 text-success font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot inline-block" />
                Open
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Platform</span>
              <span className="text-accent font-semibold">Deriv</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}