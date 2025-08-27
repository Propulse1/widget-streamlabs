// /api/fixtures/:id  → détail d'un fixture (Sportmonks proxy)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const { id } = req.query;
  const token = process.env.SPORTMONKS_TOKEN;
  const include =
    req.query.include ||
    'participants;scores;events;periods;league;round;venue';

  if (!token) return res.status(500).json({ error: 'Missing SPORTMONKS_TOKEN' });
  if (!id)    return res.status(400).json({ error: 'Missing fixture id' });

  const url = `https://api.sportmonks.com/v3/football/fixtures/${encodeURIComponent(id)}?api_token=${encodeURIComponent(token)}&include=${encodeURIComponent(include)}`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const status = r.status;
    const data = await r.json(); // Sportmonks renvoie JSON même en erreur
    return res.status(status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error', detail: e.message });
  }
}
