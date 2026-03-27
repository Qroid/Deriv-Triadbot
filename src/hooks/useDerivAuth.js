/**
 * useDerivAuth — Deriv API token manager
 * Token is stored in localStorage. No forced login — only needed for live trading.
 */
import { useState, useCallback } from "react";
import { APP_CONFIG } from "../lib/config";

const TOKEN_KEY = "deriv_token";

export function useDerivAuth() {
  const [token, setTokenState] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [isConnected, setIsConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState(null);

  const saveToken = useCallback((t) => {
    setTokenState(t);
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }, []);

  const connect = useCallback((t) => {
    saveToken(t);
    setIsConnected(false);
    setAccountInfo(null);

    const ws = new WebSocket(`${APP_CONFIG.WS_URL}?app_id=${APP_CONFIG.APP_ID}`);
    ws.onopen = () => ws.send(JSON.stringify({ authorize: t }));
    ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.msg_type === "authorize" && !msg.error) {
        setIsConnected(true);
        setAccountInfo({
          loginid: msg.authorize.loginid,
          fullname: msg.authorize.fullname,
          currency: msg.authorize.currency,
          balance: msg.authorize.balance,
        });
      }
      if (msg.error) {
        setIsConnected(false);
        setAccountInfo(null);
      }
      ws.close();
    };
  }, [saveToken]);

  const disconnect = useCallback(() => {
    saveToken("");
    setIsConnected(false);
    setAccountInfo(null);
  }, [saveToken]);

  return { token, isConnected, accountInfo, connect, disconnect, hasToken: !!token };
}