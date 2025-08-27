cat > api/fixtures/team-last.js <<'EOF'
export default async function handler(req, res) {
  try {
    const { teamId, seasonId, leagueId } = req.query;
    if (!teamId) {
      return res.status(400).json({ message: 'Paramètre teamId requis' });
    }

    // Filtres Sportmonks: match terminé + équipe
    const filters = [`teams:${teamId}`, 'state_id:5'];
    if (seasonId) filters.push(`season_id:${seasonId}`);
    if (leagueId)  filters.push(`league_id:${leagueId}`);

    const url = `https://soccer.sportmonks.com/api/v3/football/fixtures`;
    const params = new URLSearchParams({
      include: 'participants;scores;events;periods;league;round;venue',
      per_page: '1',
      sort: '-starting_at',
      api_token: process.env.SPORTMONKS_TOKEN,
    });

    // Ajout des filtres correctement (Sportmonks veut filter[...])
    filters.forEach((f, i) => {
      params.append(`filters[${i}]`, f);
    });

    const r = await fetch(`${url}?${params.toString()}`);
    const data = await r.json();

    const list = Array.isArray(data?.data) ? data.data : [];
    if (list.length > 0) {
      return res.status(200).json({ fixture: list[0] });
    }

    return res.status(404).json({
      message: 'Aucun match terminé trouvé pour cette équipe',
      teamId,
      seasonId: seasonId || null,
      leagueId: leagueId || null,
    });
  } catch (e) {
    return res.status(500).json({ message: 'Erreur serveur', error: String(e) });
  }
}
EOF