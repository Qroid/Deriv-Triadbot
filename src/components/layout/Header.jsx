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
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-white/10 shadow-lg">
      <div className="flex items-center h-16 px-4 lg:px-6 gap-4">
        {/* Deriv-style logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-md transition-transform duration-500 group-hover:rotate-[360deg]">
            <span className="text-primary font-black text-xl leading-none">D</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-black text-white tracking-tight leading-none">Triadbot</h1>
            <p className="text-[8px] uppercase tracking-[0.3em] text-white/70 font-black mt-1">Deriv Assistant</p>
          </div>
        </Link>

        {/* Live ticker */}
        <div className="flex-1 overflow-hidden relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none" />
          <div className="flex h-16 items-center overflow-x-auto scrollbar-none gap-2">
            {TICKER_ASSETS.map(a => <TickerItem key={a} asset={a} data={marketData[a]} />)}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Account Balance */}
          <div className="hidden md:flex flex-col items-end mr-2">
            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Balance</p>
            <p className="text-sm font-black text-white font-mono leading-none">$10,245.50</p>
          </div>

          <div className={`hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-1.5 border text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${
            isLive ? "bg-white/10 border-white/20 text-white shadow-sm" : "bg-black/5 border-black/5 text-white/40"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-success animate-pulse" : "bg-white/20"}`} />
            {isLive ? "Live Market" : "Simulation"}
          </div>
          <Link to="/settings" className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
            <User className="h-5 w-5 text-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}