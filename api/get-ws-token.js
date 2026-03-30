export default function handler(req, res) { 
  res.setHeader('Access-Control-Allow-Origin', 'https://triadbot.vercel.app'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); 
  if (req.method === 'OPTIONS') return res.status(200).end(); 
  if (req.method !== 'GET') return res.status(405).end(); 
  
  const cookies = Object.fromEntries( 
    (req.headers.cookie || '').split(';')
      .map(c => c.trim())
      .filter(Boolean) 
      .map(c => { 
        const i = c.indexOf('='); 
        return [c.slice(0,i).trim(), c.slice(i+1).trim()]; 
      }) 
  ); 
  
  const token = cookies['deriv_token']; 
  if (!token) return res.status(401).json({ error: 'Not authenticated' }); 
  return res.status(200).json({ token }); 
}
