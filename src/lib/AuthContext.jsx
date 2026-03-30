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
  updateBalance: () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    fetch('/api/logout', { method: 'POST' })
      .finally(() => {
        [
          'deriv_display_account', 'deriv_accounts', 'active_loginid',
          'deriv_token', 'deriv_user', 'deriv_real_token', 'deriv_demo_token'
        ].forEach(k => localStorage.removeItem(k));
        document.cookie = 'deriv_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
        setIsAuthenticated(false);
        setUser(null);
        setAccounts([]);
        setActiveAccount(null);
        window.location.href = '/';
      });
  }, []);

  // ── OAuth2 Callback Handler ─────────────────────────────────────────────────
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
      if (data.accounts) {
        localStorage.setItem('deriv_accounts', JSON.stringify(data.accounts));
      }
      window.location.href = '/';
    } catch (err) {
      console.error('[auth] callback processing failed');
      window.location.href = '/?error=exchange_failed';
    }
  }, []);

  // ── Login with Deriv ────────────────────────────────────────────────────────
  const loginWithDeriv = async () => {
    const array = crypto.getRandomValues(new Uint8Array(64));
    const codeVerifier = Array.from(array)
      .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
      .join('');

    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const state = crypto.getRandomValues(new Uint8Array(16))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: APP_CONFIG.APP_ID,
      redirect_uri: APP_CONFIG.REDIRECT_URL,
      scope: 'trade account_manage',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    window.location.href = `${APP_CONFIG.OAUTH_URL}?${params.toString()}`;
  };

  // ── Switch Account (Demo ↔ Real) ────────────────────────────────────────────
  const switchAccount = useCallback((loginid) => {
    const account = accounts.find(acc => acc.loginid === loginid);
    if (!account) return;

    setActiveAccount(account);
    localStorage.setItem('active_loginid', loginid);
    localStorage.setItem('deriv_display_account', JSON.stringify(account));

    // Update user state immediately with the switched account
    setUser(prev => ({
      ...prev,
      id: account.loginid,
      loginid: account.loginid,
      currency: account.currency,
      balance: account.balance ?? 0,
      is_virtual: account.is_virtual,
    }));

    // Update the token cookie to match the selected account's token
    const tokenKey = account.is_virtual ? 'deriv_demo_token' : 'deriv_real_token';
    const accountToken = localStorage.getItem(tokenKey);
    if (accountToken) {
      // Re-set cookie via API call (secure)
      fetch('/api/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: accountToken }),
      }).catch(() => {});
    }
  }, [accounts]);

  // ── Update Live Balance from WebSocket ──────────────────────────────────────
  const updateBalance = useCallback((balance, currency) => {
    setUser(prev => {
      if (!prev) return prev;
      // Also persist to localStorage so it survives refresh
      const saved = localStorage.getItem('deriv_display_account');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          localStorage.setItem('deriv_display_account', JSON.stringify({
            ...parsed,
            balance,
            currency,
          }));
        } catch {}
      }
      return { ...prev, balance, currency };
    });
  }, []);

  // ── Initial Auth Check ──────────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        if (data.authenticated) {
          // Load the display account (active)
          const savedAccount = localStorage.getItem('deriv_display_account');
          const account = savedAccount ? JSON.parse(savedAccount) : null;

          // Load ALL accounts (demo + real)
          const savedAllAccounts = localStorage.getItem('deriv_accounts');
          const allAccounts = savedAllAccounts ? JSON.parse(savedAllAccounts) : (account ? [account] : []);

          setIsAuthenticated(true);
          setAccounts(allAccounts);

          if (account) {
            setActiveAccount(account);
            setUser({
              name: account.fullname || account.name || 'Trader',
              id: account.loginid || account.id,
              loginid: account.loginid || account.id,
              currency: account.currency || 'USD',
              balance: account.balance ?? 0,
              is_virtual: account.is_virtual ?? 1,
            });
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
      isLoadingPublicSettings: false,
      accounts,
      activeAccount,
      logout,
      loginWithDeriv,
      switchAccount,
      handleOAuthCallback,
      updateBalance,
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
