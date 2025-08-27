// api/fixtures.js

export default async function handler(req, res) {
  try {
    // Ton token Sportmonks est stocké dans Vercel → Environment Variables
    const token = process.env.SPORTMONKS_TOKEN;

    // Exemple d’appel à l’API Sportmonks
    const response = await fetch(
      `https://api.sportmonks.com/v3/football/fixtures?api_token=${token}`
    );

    if (!response.ok) {
      throw new Error(`Sportmonks API error: ${response.status}`);
    }

    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    console.error(error);

    // Si l’API Sportmonks plante → fallback vers ton JSON statique
    const fallback = await import("../public/data/fixtures.json");
    res.status(200).json(fallback.default || fallback);
  }
}