import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { APP_CONFIG } from '../lib/config';

async function getBestToken(isVirtual) {
  try {
    const res = await fetch('/api/get-ws-token');
    if (res.ok) {
      const data = await res.json();
      if (data?.token) return data.token;
    }
  } catch {}

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
  const isVirtualRef = useRef(true);
  const isConnectedRef = useRef(false);

  const connect = useCallback(async () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    const token = await getBestToken(isVirtualRef.current);

    if (!token) {
      setIsAuthorized(false);
      isConnectedRef.current = false;
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
        isConnectedRef.current = false;
        return;
      }

      if (data.msg_type === 'authorize') {
        setIsAuthorized(true);
        isConnectedRef.current = true;
        setError(null);
        const liveBalance = data.authorize.balance;
        const liveCurrency = data.authorize.currency;
        setBalance(liveBalance);
        setCurrency(liveCurrency);
        updateBalance(liveBalance, liveCurrency);
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
      isConnectedRef.current = false;
      if (socketRef.current?.readyState === WebSocket.OPEN) return;
      setIsAuthorized(false);
      if (isAuthenticated) {
        reconnectTimer.current = setTimeout(() => connect(), 5000);
      }
    };

    ws.onerror = (err) => {
      console.error('[useDerivAccount] ws error:', err);
      setError('Connection failed');
    };
  }, [logout, updateBalance, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user?.is_virtual !== undefined) {
      isVirtualRef.current = user.is_virtual !== 0;
    }
  }, [user?.is_virtual, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      setIsAuthorized(false);
      isConnectedRef.current = false;
      setBalance(0);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [isAuthenticated, connect]);

  useEffect(() => {
    if (isAuthenticated && user?.loginid && !isConnectedRef.current) {
      connect();
    }
  }, [user?.loginid]);

  return {
    balance,
    currency,
    isAuthorized,
    error,
    account_id: user?.id,
  };
};
