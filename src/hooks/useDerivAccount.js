import { useState, useEffect, useRef } from 'react';
import { APP_CONFIG } from '../lib/config';

export function useDerivAccount() {
  const [account, setAccount] = useState({
    balance: 0,
    currency: 'USD',
    isAuthorized: false,
    loginid: '',
  });
  const wsRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('deriv_token');
    if (!token) return;

    const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ authorize: token }));
    };

    ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);

      if (data.error) {
        console.error('Account Error:', data.error.message);
        return;
      }

      if (data.msg_type === 'authorize') {
        setAccount(prev => ({
          ...prev,
          isAuthorized: true,
          balance: data.authorize.balance,
          currency: data.authorize.currency,
          loginid: data.authorize.loginid,
        }));

        // Subscribe to balance updates
        ws.send(JSON.stringify({ balance: 1, subscribe: 1 }));
      }

      if (data.msg_type === 'balance') {
        setAccount(prev => ({
          ...prev,
          balance: data.balance.balance,
          currency: data.balance.currency,
        }));
      }
    };

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return account;
}
