export default function handler(req, res) { 
  res.setHeader('Access-Control-Allow-Origin', 'https://triadbot.vercel.app'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS'); 
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); 
  if (req.method === 'OPTIONS') return res.status(200).end(); 
  if (req.method !== 'POST') return res.status(405).end(); 

  res.setHeader('Set-Cookie', 
    'deriv_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0' 
  ); 
  return res.status(200).json({ success: true }); 
}
