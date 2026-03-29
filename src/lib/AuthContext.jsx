import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { APP_CONFIG } from './config';

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoadingAuth: true,
  isLoadingPublicSettings: false,
  accounts: [],
  activeAccount: null,
  logout: () => {},
  loginWithDeriv: () => {},
  switchAccount: () => {},
  handleOAuthCallback: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);

  const logout = useCallback(() => { 
    fetch('/api/logout', { method: 'POST' }) 
      .finally(() => { 
        ['deriv_display_account','deriv_accounts','active_loginid', 
         'deriv_token','deriv_user'].forEach(k => localStorage.removeItem(k)); 
        setIsAuthenticated(false); 
        setUser(null); 
        setAccounts([]); 
        setActiveAccount(null); 
        window.location.href = '/'; 
      }); 
  }, []); 

  const handleOAuthCallback = useCallback(async (code, codeVerifier) => { 
    try { 
      const res = await fetch('/api/exchange-token', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          code, 
          codeVerifier, 
          redirectUri: 'https://triadbot.vercel.app/callback', 
        }), 
      }); 
      const data = await res.json(); 
      if (!res.ok) throw new Error(data.error || 'Exchange failed'); 
      if (data.account) { 
        localStorage.setItem('deriv_display_account', JSON.stringify(data.account)); 
      } 
      window.location.href = '/'; 
    } catch (err) { 
      console.error('[auth] callback processing failed'); 
      window.location.href = '/?error=exchange_failed'; 
    } 
  }, []); 

  const loginWithDeriv = async () => {
    // 1. Generate code_verifier (PKCE)
    const array = crypto.getRandomValues(new Uint8Array(64));
    const codeVerifier = Array.from(array)
      .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
      .join('');

    // 2. Derive code_challenge
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 3. Generate state for CSRF protection
    const state = crypto.getRandomValues(new Uint8Array(16))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

    // 4. Store in sessionStorage (survives the redirect)
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    // 5. Build New OAuth 2.0 URL
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: APP_CONFIG.APP_ID,
      redirect_uri: APP_CONFIG.REDIRECT_URL,
      scope: 'trade account_manage',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const url = `${APP_CONFIG.OAUTH_URL}?${params.toString()}`;
    window.location.href = url;
  };

  const switchAccount = useCallback((loginid) => {
    const account = accounts.find(acc => acc.loginid === loginid);
    if (account) {
      setActiveAccount(account);
      localStorage.setItem('active_loginid', loginid);
      // In a real app, you might want to refresh the page or trigger a re-authorization
    }
  }, [accounts]);

  useEffect(() => { 
    fetch('/api/me') 
      .then(r => r.json()) 
      .then(data => { 
        if (data.authenticated) { 
          const saved = localStorage.getItem('deriv_display_account'); 
          const account = saved ? JSON.parse(saved) : null; 
          setIsAuthenticated(true); 
          if (account) { 
            setUser({ 
              name: account.fullname || 'Trader', 
              id: account.loginid, 
              currency: account.currency, 
              balance: account.balance, 
            }); 
            setActiveAccount(account); 
            setAccounts([account]); 
          } 
        } 
      }) 
      .catch(() => {}) 
      .finally(() => setIsLoadingAuth(false)); 
  }, []); 

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings: false, // Placeholder for future app settings
      accounts,
      activeAccount,
      logout,
      loginWithDeriv,
      switchAccount,
      handleOAuthCallback,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
