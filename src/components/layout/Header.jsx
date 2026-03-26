import { Link } from "react-router-dom";
import { Bell, ChevronUp, ChevronDown, Wifi, WifiOff, User } from "lucide-react";
import { useDerivTicks } from "../../hooks/useDerivTicks";

const TICKER_ASSETS = [
  "Volatility 10 Index", "Volatility 25 Index", "Volatility 75 Index",
  "Boom 1000 Index", "Crash 1000 Index", "Step Index",
];
const SHORT_NAMES = {
  "Volatility 10 Index": "V10", "Volatility 25 Index": "V25",
  "Volatility 75 Index": "V75", "Boom 1000 Index": "BOOM1000",
  "Crash 1000 Index": "CRASH1000", "Step Index": "STEP",
};

function TickerItem({ asset, data }) {
  const isUp = (data?.changePct ?? 0) >= 0;
  return (
    <div className="flex items-center gap-2 px-4 whitespace-nowrap">
      <span className="text-[10px] font-bold text-muted-foreground/70 tracking-wider">{SHORT_NAMES[asset]}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground">
        {data?.price?.toFixed(data?.decimals ?? 2) ?? "—"}
      </span>
      <span className={`flex items-center text-[10px] font-mono font-bold ${isUp ? "text-success" : "text-primary"}`}>
        {isUp ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
        {Math.abs(data?.changePct ?? 0).toFixed(2)}%
      </span>
    </div>
  );
}

export default function Header() {
  const marketData = useDerivTicks(TICKER_ASSETS);
  const isLive = Object.values(marketData).some(d => d?.isLive);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-2xl border-b border-black/[0.05]">
      <div className="flex items-center h-14 px-4 lg:px-6 gap-4">
        {/* Deriv-style logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 lg:w-56 group">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110">
            <span className="text-white font-black text-lg leading-none">D</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-[15px] font-black text-foreground tracking-tight leading-none">DerivBot</h1>
            <p className="text-[8px] uppercase tracking-[0.3em] text-primary font-black mt-1">Professional</p>
          </div>
        </Link>

        {/* Live ticker */}
        <div className="flex-1 overflow-hidden relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          <div className="flex h-14 items-center overflow-x-auto scrollbar-none gap-2">
            {TICKER_ASSETS.map(a => <TickerItem key={a} asset={a} data={marketData[a]} />)}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          <div className={`hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-1.5 border text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${
            isLive ? "bg-success/10 border-success/30 text-success shadow-sm" : "bg-black/5 border-black/5 text-muted-foreground/60"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-slate-300"}`} />
            {isLive ? "Live Market" : "Simulation"}
          </div>
          <Link to="/settings" className="h-9 w-9 rounded-xl bg-black/[0.03] border border-black/[0.05] flex items-center justify-center hover:bg-black/[0.06] transition-all duration-300">
            <User className="h-4 w-4 text-muted-foreground/80" />
          </Link>
        </div>
      </div>
    </header>
  );
}