// /api/fixtures  → liste filtrable (Sportmonks proxy)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  const token = process.env.SPORTMONKS_TOKEN;
  if (!token) return res.status(500).json({ error: 'Missing SPORTMONKS_TOKEN' });

  // Filtres possibles via l'URL :
  // /api/fixtures?date=2025-08-17&league_id=301&team_id=591&per_page=20&page=1
  const {
    date,
    league_id,
    team_id,
    season_id,
    per_page = '20',
    page = '1',
    include = 'participants;scores;events;periods;league;round'
  } = req.query;

  const params = new URLSearchParams();
  params.set('api_token', token);
  params.set('include', include);
  params.set('per_page', String(per_page));
  params.set('page', String(page));

  // Les filtres Sportmonks peuvent être passés via "filters"
  // On concatène proprement si plusieurs
  const filters = [];
  if (date)      filters.push(`date:${date}`);
  if (league_id) filters.push(`league_id:${league_id}`);
  if (team_id)   filters.push(`team_id:${team_id}`);
  if (season_id) filters.push(`season_id:${season_id}`);
  if (filters.length) params.set('filters', filters.join(','));

  const url = `https://api.sportmonks.com/v3/football/fixtures?${params.toString()}`;

  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    const status = r.status;
    const data = await r.json();
    return res.status(status).json(data);
  } catch (e) {
    return res.status(502).json({ error: 'Upstream error', detail: e.message });
  }
}
