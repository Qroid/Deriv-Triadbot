export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { code, codeVerifier, redirectUri } = req.body;

  if (!code || !codeVerifier || !redirectUri) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.DERIV_CLIENT_ID || '32PgOi26JPTXu7dxCbWOI',
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
  });

  try {
    const response = await fetch('https://auth.deriv.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Deriv Token Error:', data);
      return res.status(response.status).json({ error: data.error || 'Token exchange failed' });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ error: 'Internal server error during token exchange' });
  }
}
