// api/fixtures/team-today.js
function addDays(isoDate, days) {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

export default async function handler(req, res) {
  try {
    const { teamId, date, endDate } = req.query;

    if (!teamId || !/^\d+$/.test(teamId)) {
      return res.status(400).json({ message: "Paramètre teamId requis (entier)." });
    }

    // Par défaut: aujourd'hui en UTC
    const start = (date && /^\d{4}-\d{2}-\d{2}$/.test(date))
      ? date
      : new Date().toISOString().slice(0, 10);

    // Fin = endDate fournie ou +1 jour, pour couvrir UTC vs local
    const end = (endDate && /^\d{4}-\d{2}-\d{2}$/.test(endDate))
      ? endDate
      : addDays(start, 1);

    const TOKEN = process.env.SPORTMONKS_TOKEN;
    if (!TOKEN) return res.status(500).json({ message: "SPORTMONKS_TOKEN manquant" });

    const base = "https://api.sportmonks.com/v3/football";
    // On interroge l'intervalle [start, end]
    const url =
      `${base}/fixtures/between/${start}/${end}` +
      `?include=scores;participants;league;round;venue;events;periods` +
      `&filters=participants:${teamId}` +
      `&api_token=${encodeURIComponent(TOKEN)}`;

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const json = await r.json();
    const list = Array.isArray(json.data) ? json.data : [];

    const fx = list[0];
    if (!fx) {
      return res.status(200).json({
        message: "Pas de match pour cette équipe dans la plage demandée",
        start,
        end
      });
    }

    return res.status(200).json({ fixture: fx, start, end });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Erreur serveur", error: String(e) });
  }
}