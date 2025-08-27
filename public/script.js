// URL publique Vercel vers ton JSON
const API_URL = 'https://widget-streamlabs.vercel.app/data/fixtures.json';

// Rafraîchissement (ms)
const REFRESH_MS = 15000;

// Raccourcis DOM (assure-toi que ces IDs existent dans ton index.html)
const $ = (sel) => document.querySelector(sel);
const ui = {
  league:    $('#league'),
  homeName:  $('#homeName'),
  awayName:  $('#awayName'),
  homeScore: $('#homeScore'),
  awayScore: $('#awayScore'),
  clock:     $('#clock'),
  status:    $('#status'),
};

async function fetchFixtures() {
  const res = await fetch(API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function pickCurrentOrNext(fixtures) {
  if (!Array.isArray(fixtures) || fixtures.length === 0) return null;

  // 1) Priorité au match qui "tique" (période en cours)
  const live = fixtures.find(f =>
    Array.isArray(f.periods) && f.periods.some(p => p.ticking === true)
  );
  if (live) return live;

  // 2) Sinon, on prend le plus proche dans le futur
  const now = Date.now() / 1000;
  const upcoming = fixtures
    .filter(f => Number(f.starting_at_timestamp) >= now)
    .sort((a,b) => a.starting_at_timestamp - b.starting_at_timestamp)[0];

  // 3) Sinon, dernier fini (fallback)
  return upcoming || fixtures.sort((a,b) => b.starting_at_timestamp - a.starting_at_timestamp)[0];
}

function getTeams(fixture) {
  // Participants avec meta.location "home" / "away"
  const home = fixture.participants?.find(p => p.meta?.location === 'home') || fixture.participants?.[0];
  const away = fixture.participants?.find(p => p.meta?.location === 'away') || fixture.participants?.[1];
  return { home, away };
}

function getCurrentScore(fixture, homeId, awayId) {
  // Dans Sportmonks, description "CURRENT" a le score courant
  const currHome = fixture.scores?.find(s => s.description === 'CURRENT' && s.participant_id === homeId);
  const currAway = fixture.scores?.find(s => s.description === 'CURRENT' && s.participant_id === awayId);

  // Fallback: 1ST_HALF / 2ND_HALF si CURRENT introuvable
  const h = (currHome?.score?.goals ?? fixture.scores?.find(s => s.participant_id === homeId)?.score?.goals ?? 0);
  const a = (currAway?.score?.goals ?? fixture.scores?.find(s => s.participant_id === awayId)?.score?.goals ?? 0);

  return { h: Number(h) || 0, a: Number(a) || 0 };
}

function getClock(fixture) {
  // Lecture simple depuis periods[0] (minutes + seconds)
  const p = fixture.periods?.find(pp => pp.ticking) || fixture.periods?.[0];
  if (!p) return '';

  const m = Number(p.minutes) || 0;
  const s = Number(p.seconds) || 0;
  const pad = (n) => String(n).padStart(2, '0');
  return `${m}:${pad(s)}`;
}

function getStateLabel(fixture) {
  // state_id varie selon l’API ; on affiche simple
  const live = fixture.periods?.some(p => p.ticking === true);
  if (live) return 'EN DIRECT';
  // sinon heure de début locale
  const dt = new Date(fixture.starting_at_timestamp * 1000);
  const time = dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `Débute à ${time}`;
}

function renderFixture(fixture) {
  if (!fixture) {
    ui.league.textContent    = '—';
    ui.homeName.textContent  = '—';
    ui.awayName.textContent  = '—';
    ui.homeScore.textContent = '0';
    ui.awayScore.textContent = '0';
    ui.clock.textContent     = '';
    ui.status.textContent    = 'Aucun match trouvé';
    return;
  }

  const { home, away } = getTeams(fixture);
  const { h, a } = getCurrentScore(fixture, home?.id, away?.id);

  ui.league.textContent    = fixture.league?.name || '';
  ui.homeName.textContent  = home?.name || 'Home';
  ui.awayName.textContent  = away?.name || 'Away';
  ui.homeScore.textContent = String(h);
  ui.awayScore.textContent = String(a);
  ui.clock.textContent     = getClock(fixture);
  ui.status.textContent    = getStateLabel(fixture);
}

async function update() {
  try {
    const data = await fetchFixtures();
    const fixture = pickCurrentOrNext(data);
    renderFixture(fixture);
  } catch (err) {
    // n’affiche pas l’erreur en overlay, mais log dans la console
    console.error('Erreur de récupération JSON:', err);
    ui.status.textContent = 'Connexion… (retry)';
  }
}

// Lancement + polling
update();
setInterval(update, REFRESH_MS);