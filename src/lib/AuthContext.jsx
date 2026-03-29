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
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [accounts, setAccounts] = useState([]);
  const [activeAccount, setActiveAccount] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem('deriv_accounts');
    localStorage.removeItem('active_loginid');
    localStorage.removeItem('deriv_token');
    setIsAuthenticated(false);
    setUser(null);
    setAccounts([]);
    setActiveAccount(null);
    window.location.href = '/';
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
      client_id: APP_CONFIG.APP_ID, // 32PgOi26JPTXu7dxCbWOI
      redirect_uri: APP_CONFIG.REDIRECT_URL,
      scope: 'trade account_manage',
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const url = `${APP_CONFIG.OAUTH_URL}?${params.toString()}`;
    console.log('Redirecting to New Deriv OAuth 2.0:', url);
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
    const savedAccounts = JSON.parse(localStorage.getItem('deriv_accounts') || '[]');
    const savedActiveLoginid = localStorage.getItem('active_loginid');

    if (savedAccounts.length > 0) {
      setAccounts(savedAccounts);
      const active = savedAccounts.find(acc => acc.loginid === savedActiveLoginid) || savedAccounts[0];
      setActiveAccount(active);
      setIsAuthenticated(true);
      setUser({
        name: active.fullname || 'Trader',
        id: active.loginid,
        currency: active.currency,
        balance: active.balance
      });
    }
    setIsLoadingAuth(false);
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
