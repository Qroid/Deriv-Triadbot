const ALLOWED_ORIGINS = [
  'https://triadbot.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export default function handler(req, res) { 
  const origin = req.headers['origin'];
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end(); 
  if (req.method !== 'POST') return res.status(405).end(); 

  const isSecure = origin?.startsWith('https://');
  res.setHeader('Set-Cookie', 
    `deriv_token=; ${isSecure ? 'HttpOnly; Secure;' : ''} SameSite=Strict; Path=/; Max-Age=0`
  ); 
  return res.status(200).json({ success: true }); 
}
