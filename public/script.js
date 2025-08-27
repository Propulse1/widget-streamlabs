// ===============================
// CONFIG (modifiable)
// ===============================

// Endpoint côté Vercel (celui qu'on a créé)
const API_BASE = "/api/fixtures/team-today";

// Valeurs par défaut si rien n'est passé dans l'URL du widget
// (Barça = teamId 83 ; tu peux mettre un autre club ici)
const DEFAULT_TEAM_ID = 83; // FC Barcelona
const DEFAULT_POLL_MS = 15000; // rafraîchit toutes les 15s

// ===============================
// UTIL: lecture de query params (?teamId=XXX&date=YYYY-MM-DD&pollMs=10000)
// ===============================
function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function buildApiUrl() {
  const teamId = getQueryParam("teamId") ?? DEFAULT_TEAM_ID;
  const date = getQueryParam("date");        // optionnel: "2025-08-23"
  const u = new URL(API_BASE, window.location.origin);
  if (teamId) u.searchParams.set("teamId", teamId);
  if (date)   u.searchParams.set("date", date);
  return u.toString();
}

function getPollInterval() {
  const q = getQueryParam("pollMs");
  const n = Number(q);
  return Number.isFinite(n) && n >= 3000 ? n : DEFAULT_POLL_MS;
}

// ===============================
// MINI-FONCTIONS UTILES (scores, équipes, horloge)
// ===============================
function pickTeam(fx, side) {
  // côté prioritaire: meta.location === 'home' | 'away'
  const viaMeta = fx.participants?.find(p => p?.meta?.location === side);
  if (viaMeta) return viaMeta;
  // sinon, ordre 0 = home / 1 = away (fallback)
  return side === "home" ? fx.participants?.[0] : fx.participants?.[1];
}

function currentScoreFor(fx, teamId) {
  // description "CURRENT" chez Sportmonks => score courant
  const s = fx.scores?.find(sc => sc.description === "CURRENT" && sc.participant_id === teamId);
  return s?.score?.goals ?? 0;
}

function computePeriodText(fx) {
  // essaie de déduire un libellé simple
  // s'il y a des periods, on prend la dernière
  const last = fx.periods?.[fx.periods.length - 1];
  if (!last) return "—";

  const desc = (last.description || "").toUpperCase();
  // exemples fréquents: "1st-half", "2nd-half", "HT", "FT"
  if (desc.includes("1ST")) return "1re mi-temps";
  if (desc.includes("2ND")) return "2e mi-temps";
  if (desc.includes("HT"))  return "Mi-temps";
  if (desc.includes("FT"))  return "Fin du match";
  return last.description ?? "—";
}

function computeClockText(fx) {
  // si Sportmonks fournit minutes/seconds sur la période en cours
  const ticking = fx.periods?.find(p => p.ticking) ?? fx.periods?.[fx.periods?.length - 1];
  if (!ticking) return "";
  const base = Number(ticking.counts_from ?? 0); // 0 = 1re, 45 = 2e
  const mm = Number(ticking.minutes ?? 0);
  const ss = Number(ticking.seconds ?? 0);
  const total = base + mm;
  const pad = (n) => String(n).padStart(2, "0");
  return `${total}' ${pad(ss)}"`;
}

// ===============================
// RENDER (écrit dans le DOM)
// ===============================
function renderFixture(fx) {
  const home = pickTeam(fx, "home") || fx.participants?.[0];
  const away = pickTeam(fx, "away") || fx.participants?.[1];

  // Noms + logos
  setText("homeName", home?.name ?? "Home");
  setText("awayName", away?.name ?? "Away");
  setImg("homeLogo", home?.image_path);
  setImg("awayLogo", away?.image_path);

  // Scores courants
  const homeScore = currentScoreFor(fx, home?.id);
  const awayScore = currentScoreFor(fx, away?.id);
  setText("homeScore", homeScore);
  setText("awayScore", awayScore);

  // Période + Horloge
  setText("period", computePeriodText(fx));
  setText("clock", computeClockText(fx));

  // Titre de l’onglet utile quand tu utilises un navigateur source
  document.title = `${home?.short_code ?? home?.name ?? "Home"} ${homeScore} - ${awayScore} ${away?.short_code ?? away?.name ?? "Away"}`;
}

function renderNoMatch(message) {
  // Remplit des valeurs neutres si pas de match
  setText("homeName", "—");
  setText("awayName", "—");
  setImg("homeLogo", "");
  setImg("awayLogo", "");
  setText("homeScore", "—");
  setText("awayScore", "—");
  setText("period", "");
  setText("clock", "");
  setText("status", message ?? "Aucun match aujourd'hui");
  document.title = "Aucun match aujourd'hui";
}

// helpers DOM
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "";
}
function setImg(id, url) {
  const el = document.getElementById(id);
  if (!el) return;
  if (url) {
    el.src = url;
    el.style.visibility = "visible";
  } else {
    el.removeAttribute("src");
    el.style.visibility = "hidden";
  }
}

// ===============================
// FETCH + POLLING
// ===============================
async function fetchJSON(url, { timeoutMs = 8000 } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function loadAndRenderOnce() {
  try {
    const url = buildApiUrl();
    const data = await fetchJSON(url);

    // Ton endpoint renvoie soit {fixture:{...}} soit {message:"Pas de match ..."}
    if (data?.fixture) {
      setText("status", ""); // efface un éventuel message
      renderFixture(data.fixture);
    } else if (data?.message) {
      renderNoMatch(data.message);
    } else {
      renderNoMatch("Données indisponibles");
    }
  } catch (err) {
    console.error(err);
    renderNoMatch("Erreur de chargement");
  }
}

function startPolling() {
  const delay = getPollInterval();
  // premier affichage rapide
  loadAndRenderOnce();
  // puis rafraîchissement périodique
  setInterval(loadAndRenderOnce, delay);
}

// Démarrage
document.addEventListener("DOMContentLoaded", startPolling);