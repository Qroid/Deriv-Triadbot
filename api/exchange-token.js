export default async function handler(req, res) {
  // Step 1 — Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://triadbot.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Step 2 — Method check
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Step 3 — Origin check
  const origin = req.headers['origin'];
  if (origin !== 'https://triadbot.vercel.app') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Step 4 — Destructure and validate inputs
  const { code, codeVerifier, redirectUri, token } = req.body;

  // Handle direct token set (Legacy/Hybrid path)
  if (token && typeof token === 'string' && token.length > 0) {
    res.setHeader('Set-Cookie',
      `deriv_token=${token}; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );
    return res.status(200).json({ success: true });
  }

  // Standard Code Flow
  if (
    !code || typeof code !== 'string' || code.length > 512 ||
    !codeVerifier || typeof codeVerifier !== 'string' || codeVerifier.length < 43 || codeVerifier.length > 256 ||
    redirectUri !== 'https://triadbot.vercel.app/callback'
  ) {
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    // Step 5 — Exchange code for token
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
      console.error('[exchange-token] Deriv error:', tokenData);
      return res.status(400).json({ error: 'Authentication failed' });
    }

    const { access_token } = tokenData;

    // Step 6 — Fetch account info
    let account = null;
    try {
      const accountRes = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      
      console.log('[exchange-token] account response status:', accountRes.status);
      const accountsData = await accountRes.json();
      console.log('[exchange-token] account data:', JSON.stringify(accountsData));

      if (accountRes.ok && Array.isArray(accountsData) && accountsData.length > 0) {
        const acc = accountsData[0];
        account = { 
          loginid: acc.loginid ?? acc.id ?? acc.account_id, 
          fullname: acc.name ?? acc.full_name ?? acc.fullname ?? 'Trader', 
          currency: acc.currency ?? 'USD', 
          balance: acc.balance ?? acc.available_balance ?? 0, 
        };
      }
    } catch (err) {
      console.error('[exchange-token] Account fetch failed:', err);
    }

    // Step 7 — Set cookie (REMOVED HttpOnly to allow frontend hooks to authorized WebSockets)
    res.setHeader('Set-Cookie',
      `deriv_token=${access_token}; Secure; SameSite=Strict; Path=/; Max-Age=3600`
    );

    // Step 8 — Return safe response only
    return res.status(200).json({
      success: true,
      account: account ? { loginid, fullname, currency, balance } : null
    });
  } catch (error) {
    console.error('[exchange-token] Internal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
