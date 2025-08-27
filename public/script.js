const FIXTURE_ID = '19433443';
const API_URL = `/api/fixtures/${FIXTURE_ID}?include=participants;scores;events;periods;league`;

function pickTeam(fx, side) {
  return fx.participants?.find(p => p?.meta?.location === side);
}

function currentScoreFor(fx, teamId) {
  const s = fx.scores?.find(sc => sc.description === 'CURRENT' && sc.participant_id === teamId);
  return s?.score?.goals ?? 0;
}

function render(fx) {
  const home = pickTeam(fx, 'home') || fx.participants?.[0];
  const away = pickTeam(fx, 'away') || fx.participants?.[1];

  // Noms + logos
  document.getElementById('homeName').textContent = home?.name ?? 'Home';
  document.getElementById('awayName').textContent = away?.name ?? 'Away';
  document.getElementById('homeLogo').src = home?.image_path ?? '';
  document.getElementById('awayLogo').src = away?.image_path ?? '';

  // Scores courants (description === "CURRENT")
  document.getElementById('homeScore').textContent = currentScoreFor(fx, home?.id);
  document.getElementById('awayScore').textContent = currentScoreFor(fx, away?.id);

  // Horloge / période
  const ticking = fx.periods?.find(p => p.ticking) || null;
  const last = ticking || fx.periods?.[fx.periods.length - 1];
  const phase = last?.description || '';
  const mm = last?.minutes ?? 0;
  const ss = String(last?.seconds ?? 0).padStart(2, '0');
  document.getElementById('clock').textContent = phase ? `${phase} ${mm}:${ss}` : '';
}

async function loadOnce() {
  const res = await fetch(API_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const fx = json.data || json; // compat
  render(fx);
}

async function start() {
  try { await loadOnce(); } catch (e) { console.error(e); }
  // Rafraîchit toutes les 10 s (ajuste si besoin)
  setInterval(() => loadOnce().catch(console.error), 10000);
}
start();