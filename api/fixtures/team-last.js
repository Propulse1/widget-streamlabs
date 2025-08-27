import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const { teamId = 83, seasonId = 25659 } = req.query;

    const url = `https://api.sportmonks.com/v3/football/fixtures?api_token=${process.env.SPORTMONKS_API_TOKEN}&include=participants;scores&periods&filter=teams:${teamId};season_id:${seasonId}&per_page=1&sort=-starting_at`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return res.status(404).json({
        message: "Aucun match trouvé pour cette équipe",
        teamId,
      });
    }

    const match = data.data[0];

    return res.status(200).json({
      id: match.id,
      name: match.name,
      date: match.starting_at,
      home: match.participants?.find(p => p.meta.location === "home")?.name,
      away: match.participants?.find(p => p.meta.location === "away")?.name,
      scores: match.scores || [],
      status: match.state_id,
    });

  } catch (error) {
    console.error("Erreur API:", error);
    return res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
}