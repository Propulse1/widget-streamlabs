// api/fixtures.js

import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  // Autoriser ton overlay Streamlabs à appeler l’API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  // Lire le fichier JSON local
  const filePath = path.join(process.cwd(), 'public', 'data', 'fixtures.json');
  const jsonData = fs.readFileSync(filePath, 'utf-8');
  const fixtures = JSON.parse(jsonData);

  // Renvoyer le JSON
  res.status(200).json(fixtures);
}