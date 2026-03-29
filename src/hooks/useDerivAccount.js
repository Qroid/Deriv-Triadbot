import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../lib/AuthContext';
import { APP_CONFIG } from '../lib/config';

import { getDerivToken } from '../utils/auth';

export const useDerivAccount = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('USD');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    // Read token from unified auth utility (localStorage or Cookie)
    const token = getDerivToken();
    if (!token) {
      setIsAuthorized(false);
      return;
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(APP_CONFIG.WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.error) {
        if (data.error.code === 'InvalidToken') {
          logout();
        }
        setError(data.error.message);
        return;
      }

      if (data.msg_type === 'authorize') {
        setIsAuthorized(true);
        setBalance(data.authorize.balance);
        setCurrency(data.authorize.currency);
        
        // Subscribe to balance updates
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
      }

      if (data.msg_type === 'balance') {
        setBalance(data.balance.balance);
        setCurrency(data.balance.currency);
      }
    };

    ws.onclose = () => {
      setIsAuthorized(false);
    };

    ws.onerror = (err) => {
      console.error('[deriv-account] ws error:', err);
      setError('Connection failed');
    };
  }, [logout]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsAuthorized(false);
      setBalance(0);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, connect]);

  return {
    balance,
    currency,
    isAuthorized,
    error,
    account_id: user?.id,
  };
};
