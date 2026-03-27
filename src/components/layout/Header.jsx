import { Link } from "react-router-dom";
import { User, LogIn } from "lucide-react";
import { useDerivAccount } from "../../hooks/useDerivAccount";
import { useAuth } from "../../lib/AuthContext";
import { Button } from "../ui/button";

export default function Header() {
  const { balance, currency, isAuthorized } = useDerivAccount();
  const { isAuthenticated, loginWithDeriv } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full bg-primary border-b border-white/10 shadow-lg">
      <div className="flex items-center h-16 px-4 lg:px-6 gap-4">
        {/* Deriv-style logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="h-10 w-12 rounded-2xl bg-white flex items-center justify-center shadow-md transition-transform duration-500 group-hover:rotate-[360deg]">
            <span className="text-primary font-black text-xl leading-none tracking-tighter">TD</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[16px] font-black text-white tracking-tight leading-none">Triadbot</h1>
            <p className="text-[8px] uppercase tracking-[0.3em] text-white/70 font-black mt-1">Deriv Assistant</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {isAuthenticated ? (
            <>
              {/* Account Balance */}
              <div className="hidden md:flex flex-col items-end mr-2">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Balance</p>
                <p className="text-sm font-black text-white font-mono leading-none">
                  {isAuthorized ? `${currency} ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                </p>
              </div>

              <div className={`hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-1.5 border text-[9px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${
                isAuthorized ? "bg-white/10 border-white/20 text-white shadow-sm" : "bg-black/5 border-black/5 text-white/20"
              }`}>
                <div className={`h-1.5 w-1.5 rounded-full ${isAuthorized ? "bg-success animate-pulse" : "bg-white/10"}`} />
                {isAuthorized ? "Live Market" : "Connecting..."}
              </div>
              <Link to="/settings" className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                <User className="h-5 w-5 text-white" />
              </Link>
            </>
          ) : (
            <Button 
              onClick={loginWithDeriv}
              className="bg-white text-primary hover:bg-white/90 font-black uppercase text-[10px] tracking-widest rounded-xl px-6 h-10 shadow-lg"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login with Deriv
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}