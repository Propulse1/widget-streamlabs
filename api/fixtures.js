// /api/fixtures.js (Vercel Serverless Function)
export default async function handler(req, res) {
  try {
    // Lis le token depuis Vercel (Settings > Environment Variables)
    const token = process.env.SPORTMONKS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'SPORTMONKS_TOKEN manquant' });
    }

    // Construit l’URL Sportmonks (ex : fixtures du jour + includes utiles)
    const params = new URLSearchParams({
      api_token: token,
      include: 'participants;events',   // adapte selon tes besoins
      // Exemple de filtres possibles :
      // 'filters': 'league_id:301' 
    });

    const url = `https://api.sportmonks.com/v3/football/fixtures?${params.toString()}`;

    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'Upstream error', detail: text });
    }

    const data = await r.json();
    // Optionnel : CORS si tu appelles depuis un overlay navigateur
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Optionnel : cache léger
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}