(async () => {
  const url = './data/fixtures.json'; // Ton JSON sera lu ici
  const el = document.getElementById('board');

  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const fixtures = await res.json();

    const toCard = (fx) => {
      const home = fx.participants.find(p => p.meta?.location === 'home');
      const away = fx.participants.find(p => p.meta?.location === 'away');
      const currentHome = fx.scores.find(s => s.description === 'CURRENT' && s.participant_id === home.id)?.score?.goals ?? 0;
      const currentAway = fx.scores.find(s => s.description === 'CURRENT' && s.participant_id === away.id)?.score?.goals ?? 0;
      const when = new Date(fx.starting_at.replace(' ', 'T') + 'Z'); // si date UTC

      return `
        <div class="card">
          <span class="badge">${fx.league?.short_code || 'Ligue'}</span>
          <div class="name">${home.name} vs ${away.name}</div>
          <div class="score">${currentHome} : ${currentAway}</div>
          <div class="small">${when.toLocaleString()}</div>
        </div>
      `;
    };

    el.innerHTML = fixtures.map(toCard).join('');
  } catch (e) {
    el.innerHTML = `<div class="card">Erreur chargement JSON : ${e.message}</div>`;
  }
})();
