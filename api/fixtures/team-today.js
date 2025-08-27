// api/fixtures/team-today.js
export default async function handler(req, res) {
  try {
    const token = process.env.SPORTMONKS_TOKEN;
    if (!token) {
      return res.status(500).json({ message: "SPORTMONKS_TOKEN manquant dans Vercel > Settings > Environment Variables" });
    }

    // Params
    const teamId = (req.query.teamId ?? "83").trim(); // 83 = FC Barcelona
    const dateParam = (req.query.date ?? "").trim();  // format YYYY-MM-DD (optionnel)

    // Validations simples
    if (!/^\d+$/.test(teamId)) {
      return res.status(400).json({ message: "Paramètre teamId invalide (entier attendu)" });
    }
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ message: "Paramètre date invalide (attendu YYYY-MM-DD)" });
    }

    // Fenêtre de recherche = la journée (UTC) de 'date' ou d'aujourd'hui
    const now = dateParam ? new Date(`${dateParam}T00:00:00Z`) : new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, "0");
    const d = String(now.getUTCDate()).padStart(2, "0");

    const from = `${y}-${m}-${d} 00:00:00`;
    const to   = `${y}-${m}-${d} 23:59:59`;

    // Sportmonks v3 — on cherche les fixtures du jour pour cette équipe
    // NB: selon les plans Sportmonks, le filtre peut être 'team_ids' ou 'teams'.
    // On tente d'abord team_ids puis on fallback.
    const base = "https://api.sportmonks.com/v3/football";
    const commonQuery =
      "include=participants;league;round;venue;scores;events;periods&tz=UTC";

    const urlsToTry = [
      `${base}/fixtures/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}?${commonQuery}&team_ids=${teamId}&api_token=${token}`,
      `${base}/fixtures/between/${encodeURIComponent(from)}/${encodeURIComponent(to)}?${commonQuery}&teams=${teamId}&api_token=${token}`,
      // fallback alternatif: par date + équipe (si l’endpoint est dispo sur ton plan)
      `${base}/fixtures/date/${y}-${m}-${d}?${commonQuery}&team_ids=${teamId}&api_token=${token}`,
    ];

    let data = null;
    let lastStatus = 0;

    for (const url of urlsToTry) {
      const r = await fetch(url);
      lastStatus = r.status;
      if (r.ok) {
        const j = await r.json();
        // Sportmonks renvoie souvent {data: [...] }
        const payload = Array.isArray(j) ? j : j?.data;
        if (Array.isArray(payload) && payload.length > 0) {
          data = payload;
          break;
        }
      }
    }

    if (!data) {
      return res.status(200).json({
        message: `Pas de match pour l'équipe ${teamId} à la date ${y}-${m}-${d}`,
        lastStatus
      });
    }

    // S’il y a plusieurs fixtures dans la journée, on renvoie le premier à venir,
    // sinon le premier.
    const nowTs = Date.now() / 1000;
    const sorted = [...data].sort((a, b) => (a.starting_at_timestamp ?? 0) - (b.starting_at_timestamp ?? 0));
    const upcoming = sorted.find(fx => (fx.starting_at_timestamp ?? 0) >= nowTs) || sorted[0];

    return res.status(200).json({ fixture: upcoming });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Erreur serveur", error: String(err) });
  }
}