import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { APP_CONFIG } from '../lib/config';

/**
 * Retrieves the best available Deriv token:
 * 1. From /api/get-ws-token (Vercel production — reads HttpOnly cookie)
 * 2. Falls back to localStorage directly (local dev / legacy path)
 */
async function getBestToken(isVirtual) {
  try {
    const res = await fetch('/api/get-ws-token');
    if (res.ok) {
      const data = await res.json();
      if (data?.token) return data.token;
    }
  } catch {}

  // Fallback: read directly from localStorage (works in local dev)
  const key = isVirtual ? 'deriv_demo_token' : 'deriv_real_token';
  const specificToken = localStorage.getItem(key);
  if (specificToken) return specificToken;

  return localStorage.getItem('deriv_token') || null;
}

export const useDerivAccount = () => {
  const { user, isAuthenticated, logout, updateBalance } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(async () => {
    // Clear any existing connection
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const isVirtual = user?.is_virtual !== 0; // default to demo
    const token = await getBestToken(isVirtual);

    if (!token) {
      setIsAuthorized(false);
      return;
    }

    const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.error) {
        if (data.error.code === 'InvalidToken') {
          console.warn('[useDerivAccount] Token invalid, logging out');
          logout();
        }
        setError(data.error.message);
        setIsAuthorized(false);
        return;
      }

      if (data.msg_type === 'authorize') {
        setIsAuthorized(true);
        setError(null);
        const liveBalance = data.authorize.balance;
        const liveCurrency = data.authorize.currency;
        setBalance(liveBalance);
        setCurrency(liveCurrency);
        // Push live balance back into AuthContext so ALL pages see it
        updateBalance(liveBalance, liveCurrency);
        // Subscribe to real-time balance updates
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
      }

      if (data.msg_type === 'balance') {
        const liveBalance = data.balance.balance;
        const liveCurrency = data.balance.currency;
        setBalance(liveBalance);
        setCurrency(liveCurrency);
        updateBalance(liveBalance, liveCurrency);
      }
    };

    ws.onclose = () => {
      setIsAuthorized(false);
      // Auto-reconnect after 5s if still authenticated
      if (isAuthenticated) {
        reconnectTimer.current = setTimeout(() => connect(), 5000);
      }
    };

    ws.onerror = (err) => {
      console.error('[useDerivAccount] ws error:', err);
      setError('Connection failed');
    };
  }, [logout, updateBalance, isAuthenticated, user?.is_virtual]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setIsAuthorized(false);
      setBalance(0);
    }

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [isAuthenticated, connect]);

  // Re-connect when user switches between demo/real accounts
  useEffect(() => {
    if (isAuthenticated && user?.loginid) {
      connect();
    }
  }, [user?.loginid]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    balance,
    currency,
    isAuthorized,
    error,
    account_id: user?.id,
  };
};
