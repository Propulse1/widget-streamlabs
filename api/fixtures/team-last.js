export default async function handler(req, res) {
  const { teamId } = req.query;
  const API_TOKEN = process.env.SPORTMONKS_API_TOKEN;

  if (!teamId) {
    return res.status(400).json({ message: "Paramètre teamId manquant" });
  }

  try {
    // Forcer Liga saison 2025/26 (25659)
    const url = `https://api.sportmonks.com/v3/football/fixtures?api_token=${API_TOKEN}&include=participants;scores&filter=teams:${teamId};season_id:25659;state_id:5&sort=-starting_at&per_page=1`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({ message: "Aucun match terminé trouvé pour cette équipe", teamId });
    }

    const fx = data.data[0];
    const home = fx.participants.find(p => p.meta.location === "home");
    const away = fx.participants.find(p => p.meta.location === "away");

    const score_home = fx.scores.find(sc => sc.description === "CURRENT" && sc.participant_id === home.id)?.score.goals ?? 0;
    const score_away = fx.scores.find(sc => sc.description === "CURRENT" && sc.participant_id === away.id)?.score.goals ?? 0;

    return res.status(200).json({
      match: fx.name,
      date: fx.starting_at,
      home: home.name,
      away: away.name,
      score_home,
      score_away,
    });
  } catch (error) {
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}