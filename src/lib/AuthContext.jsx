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
    setIsAuthenticated(false);
    setUser(null);
    setAccounts([]);
    setActiveAccount(null);
    window.location.href = '/';
  }, []);

  const loginWithDeriv = () => {
    const url = `${APP_CONFIG.OAUTH_URL}?app_id=${APP_CONFIG.APP_ID}&l=en&brand=deriv`;
    console.log('Redirecting to Deriv OAuth:', url);
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
