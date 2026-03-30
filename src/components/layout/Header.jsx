import { Link } from "react-router-dom";
import { User, LogIn, ChevronDown, FlaskConical, TrendingUp } from "lucide-react";
import { useDerivAccount } from "../../hooks/useDerivAccount";
import { useAuth } from "../../lib/AuthContext";
import { Button } from "../ui/button";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { balance, currency, isAuthorized } = useDerivAccount();
  const { isAuthenticated, loginWithDeriv, accounts, activeAccount, switchAccount } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const menuRef = useRef(null);

  const hasDemo = accounts.some(a => a.is_virtual === 1);
  const hasReal = accounts.some(a => a.is_virtual === 0);
  const isDemo = activeAccount?.is_virtual === 1;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAccountMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-primary border-b border-white/10 shadow-lg h-16">
      <div className="flex items-center h-full px-4 lg:px-6 gap-4">

        {/* Logo */}
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
              {/* Live Balance */}
              <div className="flex flex-col items-end mr-1">
                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none mb-1">Balance</p>
                <p className="text-sm font-black text-white font-mono leading-none">
                  {isAuthorized
                    ? `${currency} ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : "—"}
                </p>
              </div>

              {/* Real / Demo Account Switcher */}
              {(hasDemo || hasReal) && accounts.length > 0 && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowAccountMenu(prev => !prev)}
                    className={`flex items-center gap-2 rounded-xl px-3 py-1.5 border text-[9px] font-black uppercase tracking-[0.15em] shadow-sm transition-all duration-300 ${
                      isDemo
                        ? 'border-emerald-400/40 bg-emerald-500/20 text-emerald-300'
                        : 'border-amber-400/40 bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {isDemo ? (
                      <FlaskConical className="h-3 w-3" />
                    ) : (
                      <TrendingUp className="h-3 w-3" />
                    )}
                    <span className="hidden sm:inline">{isDemo ? 'Demo' : 'Real'}</span>
                    {activeAccount?.loginid && (
                      <span className="hidden md:inline text-white/60 font-mono">
                        · {activeAccount.loginid}
                      </span>
                    )}
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showAccountMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Account Dropdown */}
                  {showAccountMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white border border-black/10 shadow-xl z-[100] overflow-hidden">
                      <div className="p-3 border-b border-black/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Switch Account</p>
                      </div>
                      <div className="p-2 space-y-1">
                        {accounts.map((acc) => {
                          const isActive = acc.loginid === activeAccount?.loginid;
                          const accIsDemo = acc.is_virtual === 1;
                          return (
                            <button
                              key={acc.loginid}
                              onClick={() => { switchAccount(acc.loginid); setShowAccountMenu(false); }}
                              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left ${
                                isActive ? 'bg-primary/5 border border-primary/20' : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                                accIsDemo ? 'bg-emerald-100' : 'bg-amber-100'
                              }`}>
                                {accIsDemo
                                  ? <FlaskConical className="h-4 w-4 text-emerald-600" />
                                  : <TrendingUp className="h-4 w-4 text-amber-600" />
                                }
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-slate-800 tracking-tight truncate">
                                  {acc.loginid}
                                </p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  {accIsDemo ? '🟢 Demo' : '🟠 Real'} · {acc.currency || 'USD'}
                                </p>
                              </div>
                              {isActive && (
                                <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Live Market indicator */}
              {isAuthorized && (
                <div className="hidden sm:flex items-center gap-2 rounded-xl px-3.5 py-1.5 border border-white/20 bg-white/10 text-white text-[9px] font-black uppercase tracking-[0.15em] shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </div>
              )}

              {/* Profile link */}
              <Link
                to="/settings"
                className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all duration-300"
              >
                <User className="h-5 w-5 text-white" />
              </Link>
            </>
          ) : (
            <Button
              onClick={loginWithDeriv}
              className="bg-white text-primary hover:bg-white/90 font-black uppercase text-[9px] sm:text-[10px] tracking-widest rounded-xl px-3 sm:px-6 h-10 shadow-lg"
            >
              <LogIn className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Login with Deriv</span>
              <span className="xs:hidden">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}