export default async function handler(req, res) {
  const teamId = 83; // FC Barcelona
  const today = new Date().toISOString().split("T")[0]; // format YYYY-MM-DD

  try {
    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures/date/${today}?api_token=${process.env.SPORTMONKS_TOKEN}&include=participants;scores;league`
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Erreur API Sportmonks" });
    }

    const data = await response.json();

    // Filtrer pour ne garder que les matchs du Barça
    const barcaMatches = data.data.filter(fixture =>
      fixture.participants.some(team => team.id === teamId)
    );

    if (barcaMatches.length === 0) {
      return res.status(404).json({ message: "Pas de match du Barça aujourd'hui" });
    }

    return res.status(200).json(barcaMatches);
  } catch (error) {
    return res.status(500).json({ error: "Erreur serveur", details: error.message });
  }
}