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
    <header className="sticky top-0 z-50 w-full bg-sidebar/95 backdrop-blur-xl border-b border-border/60">
      <div className="flex items-center h-14 px-4 lg:px-5 gap-3">
        {/* Deriv-style logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 lg:w-56">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_12px_hsl(357,95%,62%,0.3)]">
            <span className="text-white font-black text-sm leading-none">D</span>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-sm font-black text-foreground tracking-tight leading-none">DerivBot</h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-primary/80 font-bold mt-0.5">Synthetic Trader</p>
          </div>
          <span className="lg:hidden font-black text-foreground text-sm">DerivBot</span>
        </Link>

        {/* Live ticker */}
        <div className="flex-1 overflow-hidden relative hidden sm:block">
          <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-sidebar to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-sidebar to-transparent z-10 pointer-events-none" />
          <div className="flex h-14 items-center overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {TICKER_ASSETS.map(a => <TickerItem key={a} asset={a} data={marketData[a]} />)}
            {TICKER_ASSETS.map(a => <TickerItem key={`d-${a}`} asset={a} data={marketData[a]} />)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1.5 border text-[10px] font-bold uppercase tracking-wider ${
            isLive ? "bg-success/10 border-success/25 text-success" : "bg-secondary border-border/50 text-muted-foreground"
          }`}>
            {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isLive ? "Live" : "Simulation"}
          </div>
          <Link to="/settings" className="h-8 w-8 rounded-xl bg-secondary border border-border/50 flex items-center justify-center hover:bg-muted transition-colors">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
          </Link>
        </div>
      </div>
    </header>
  );
}