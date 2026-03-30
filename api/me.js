const ALLOWED_ORIGINS = [
  'https://triadbot.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

export default function handler(req, res) { 
  const origin = req.headers['origin'];
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end(); 
  if (req.method !== 'GET') return res.status(405).end(); 

  const cookieHeader = req.headers.cookie || ''; 
  const cookies = Object.fromEntries( 
    cookieHeader.split(';') 
      .map(c => c.trim())
      .filter(Boolean) 
      .map(c => { 
        const idx = c.indexOf('='); 
        return [c.slice(0, idx).trim(), c.slice(idx + 1).trim()]; 
      }) 
  ); 

  const token = cookies['deriv_token']; 
  if (!token) return res.status(401).json({ authenticated: false }); 
  return res.status(200).json({ authenticated: true }); 
}
