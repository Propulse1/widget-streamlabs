// /api/fixtures/team-last.js
// Renvoie le DERNIER match terminé pour une équipe (teamId)
// Ex.: /api/fixtures/team-last?teamId=83

export default async function handler(req, res) {
  try {
    const { teamId } = req.query;
    if (!teamId || isNaN(Number(teamId))) {
      res.status(400).json({ message: "Paramètre 'teamId' requis (nombre)", example: "/api/fixtures/team-last?teamId=83" });
      return;
    }

    const token = process.env.SPORTMONKS_TOKEN;
    if (!token) {
      res.status(500).json({ message: "SPORTMONKS_TOKEN manquant dans les variables d'environnement Vercel" });
      return;
    }

    // On récupère le dernier match TERMINÉ (state_id = 5) pour l'équipe
    // Tri descendant sur la date de début et on limite à 1 résultat
    const params = new URLSearchParams({
      api_token: token,
      include: [
        "participants",
        "scores",
        "periods",
        "league",
        "round",
        "venue"
      ].join(","),
      // filtres: équipe + terminé
      filters: `teams:${teamId};state_id:5`,
      // tri décroissant par date
      sort: "-starting_at",
      per_page: "1"
    });

    const url = `https://soccer.sportmonks.com/api/v3/football/fixtures?${params.toString()}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    const json = await r.json();

    const fixture = json?.data?.[0];
    if (!fixture) {
      res.status(404).json({ message: "Aucun match terminé trouvé pour cette équipe", teamId });
      return;
    }

    // Cache côté Vercel (CDN) 60s pour éviter de sur-solliciter l'API
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    res.status(200).json({ fixture });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Erreur serveur", error: String(e) });
  }
}