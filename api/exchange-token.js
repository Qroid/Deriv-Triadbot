export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://triadbot.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Origin guard
  const origin = req.headers['origin'];
  if (origin !== 'https://triadbot.vercel.app') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { code, codeVerifier, redirectUri, token } = req.body;

  // ── Legacy / Hybrid path: token supplied directly in the URL ──────────────
  if (token && typeof token === 'string' && token.length > 0) {
    res.setHeader('Set-Cookie',
      `deriv_token=${token}; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );
    // For the legacy path, resolve account info via WebSocket immediately
    const accountInfo = await resolveAccountViaWS(token);
    return res.status(200).json({ success: true, ...accountInfo });
  }

  // ── Standard OAuth2 Code Flow ─────────────────────────────────────────────
  if (
    !code || typeof code !== 'string' || code.length > 512 ||
    !codeVerifier || typeof codeVerifier !== 'string' ||
    codeVerifier.length < 43 || codeVerifier.length > 256 ||
    redirectUri !== 'https://triadbot.vercel.app/callback'
  ) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    // Exchange authorization code for access token
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.DERIV_CLIENT_ID || '32PgOi26JPTXu7dxCbWOI',
      code,
      code_verifier: codeVerifier,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('[exchange-token] Deriv token exchange error:', tokenData);
      return res.status(400).json({ error: 'Authentication failed' });
    }

    const { access_token } = tokenData;

    // Resolve full account info via WebSocket authorize (the correct Deriv method)
    const accountInfo = await resolveAccountViaWS(access_token);

    // Set HttpOnly-style cookie with the token
    res.setHeader('Set-Cookie',
      `deriv_token=${access_token}; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    return res.status(200).json({ success: true, ...accountInfo });

  } catch (error) {
    console.error('[exchange-token] Internal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Resolves account info and all sub-accounts via Deriv WebSocket authorize.
 * Returns { account, accounts } — account is the primary, accounts is the full list.
 */
async function resolveAccountViaWS(accessToken) {
  try {
    const WebSocket = (await import('ws')).default;
    return await new Promise((resolve) => {
      const appId = process.env.DERIV_CLIENT_ID || '32PgOi26JPTXu7dxCbWOI';
      const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
      const timer = setTimeout(() => {
        ws.close();
        resolve({ account: null, accounts: [] });
      }, 8000);

      ws.on('open', () => {
        ws.send(JSON.stringify({ authorize: accessToken }));
      });

      ws.on('message', (raw) => {
        clearTimeout(timer);
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.msg_type === 'authorize' && !msg.error) {
            const auth = msg.authorize;

            const account = {
              loginid: auth.loginid,
              fullname: auth.fullname || 'Trader',
              currency: auth.currency,
              balance: auth.balance,
              is_virtual: auth.is_virtual ? 1 : 0,
            };

            // account_list contains all sub-accounts (demo VRTC + real CR/MLT)
            const accounts = Array.isArray(auth.account_list)
              ? auth.account_list.map(a => ({
                  loginid: a.loginid,
                  currency: a.currency || auth.currency,
                  is_virtual: a.is_virtual ? 1 : 0,
                  token: accessToken,
                  fullname: auth.fullname || 'Trader',
                  balance: a.loginid === auth.loginid ? auth.balance : 0,
                }))
              : [account];

            ws.close();
            resolve({ account, accounts });
            return;
          }
        } catch {}
        ws.close();
        resolve({ account: null, accounts: [] });
      });

      ws.on('error', () => {
        clearTimeout(timer);
        resolve({ account: null, accounts: [] });
      });
    });
  } catch {
    return { account: null, accounts: [] };
  }
}
