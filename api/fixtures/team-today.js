// api/fixtures/team-today.js
export default async function handler(req, res) {
  try {
    const { teamId, date } = req.query;

    if (!teamId || !/^\d+$/.test(teamId)) {
      return res.status(400).json({ message: "Paramètre teamId requis (entier)." });
    }

    // date optionnelle : YYYY-MM-DD. Par défaut : aujourd’hui en UTC.
    const d = date || new Date().toISOString().slice(0, 10);

    const TOKEN = process.env.SPORTMONKS_TOKEN;
    if (!TOKEN) {
      return res.status(500).json({ message: "SPORTMONKS_TOKEN manquant" });
    }

    const base = "https://api.sportmonks.com/v3/football";
    // IMPORTANT : on filtre par participants:TEAM_ID
    const url =
      `${base}/fixtures/date/${d}` +
      `?include=scores;participants;league;round;venue;events;periods` +
      `&filters=participants:${teamId}` +
      `&api_token=${encodeURIComponent(TOKEN)}`;

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const json = await r.json();

    // json.data peut être un tableau (matches ce jour) ou vide
    const list = Array.isArray(json.data) ? json.data : [];
    // On prend le premier match trouvé ce jour (ou choisis-en un autre critère si tu veux)
    const fx = list[0];

    if (!fx) {
      return res.status(200).json({ message: "Pas de match pour cette équipe à cette date", date: d });
    }

    return res.status(200).json({ fixture: fx, date: d });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erreur serveur", error: String(e) });
  }
}