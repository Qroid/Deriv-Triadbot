const isDev = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

export const APP_CONFIG = {
  APP_ID: "32PgOi26JPTXu7dxCbWOI",
  MARKUP_PERCENTAGE: 3,
  OAUTH_URL: "https://auth.deriv.com/oauth2/auth",
  REDIRECT_URL: isDev 
    ? "http://localhost:5173/callback" 
    : "https://triadbot.vercel.app/callback",
  WS_URL: "wss://ws.derivws.com/websockets/v3",
  IS_DEV: isDev,
};
