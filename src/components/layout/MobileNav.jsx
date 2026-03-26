import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Bot, History, LineChart, Settings, Blocks } from "lucide-react";

const navItems = [
  { path: "/", label: "Home", icon: LayoutDashboard },
  { path: "/bots", label: "Bots", icon: Bot },
  { path: "/builder", label: "Builder", icon: Blocks },
  { path: "/market", label: "Scanner", icon: LineChart },
  { path: "/history", label: "History", icon: History },
  { path: "/settings", label: "Settings", icon: Settings },
];

export default function MobileNav() {
  const location = useLocation();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-primary border-t border-white/10 shadow-[0_-4px_20px_rgba(0,0,0,0.15)]">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 transition-all duration-300 ${
                isActive ? "scale-110" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div className={`p-1.5 rounded-2xl transition-all duration-300 ${isActive ? "bg-white text-primary shadow-md" : "text-white"}`}>
                <item.icon className={`h-5 w-5 ${isActive ? "stroke-[3px]" : "stroke-[2px]"}`} />
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest text-white transition-opacity ${isActive ? "opacity-100" : "opacity-60"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}