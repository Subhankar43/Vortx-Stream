// ── VortxStream — app.js ──

// ── Config ──
const WORKER_URL = 'https://vortxstream-auth.russiandekho.workers.dev';
const TMDB_KEY  = '90398b72e79f3183a7d6d436bef5c93f';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG       = 'https://image.tmdb.org/t/p/';
const VIDKING   = 'https://www.vidking.net/embed';
const VIDSRC    = 'https://vidsrc-embed.ru/embed';

// ── State ──
let currentUser    = null;
let currentDetail  = null;
let currentSource  = 'vidking';
let heroItems      = [];
let heroIndex      = 0;
let heroTimer      = null;
let moviesPage     = 1;
let seriesPage     = 1;
let currentMovieFilter  = { sort: 'popular', genre: '' };
let currentSeriesFilter = { sort: 'popular', genre: '' };
let currentSeason  = 1;
let currentEpisode = 1;
let allEpisodes    = [];

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  loadUser();
  setupNav();
  setupSearch();
  setupAuth();
  setupFilters();
  setupSectionTabs();
  setupGenreTabs();
  showPage('home');
  loadHomePage();
  setupPlayerMessages();
  setupSourceBtns();
});

// ── TMDB fetch ──
async function tmdb(path, params = {}) {
  const url = new URL(TMDB_BASE + path);
  url.searchParams.set('api_key', TMDB_KEY);
  url.searchParams.set('language', 'en-US');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const res = await fetch(url);
    return res.json();
  } catch (e) {
    console.error('TMDB fetch error:', e);
    return {};
  }
}

// ── Page Navigation ──
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById(name + 'Page');
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === name);
  });
  window.scrollTo(0, 0);
}

function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('http')) return;
      e.preventDefault();
      const page = link.dataset.page;
      showPage(page);
      if (page === 'movies' && !document.getElementById('moviesGrid').children.length) loadMoviesPage();
      if (page === 'series' && !document.getElementById('seriesGrid').children.length) loadSeriesPage();
    });
  });
// ── Hamburger menu ──
const hamburger   = document.getElementById('hamburgerBtn');
const mobileMenu  = document.getElementById('mobileMenu');

hamburger?.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});

// Close mobile menu when clicking outside
document.addEventListener('click', e => {
  if (!hamburger?.contains(e.target) && !mobileMenu?.contains(e.target)) {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
  }
});

// Mobile nav links
document.querySelectorAll('.mobile-link[data-page]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const page = link.dataset.page;
    showPage(page);
    // Sync active state with mobile links
    document.querySelectorAll('.mobile-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    if (page === 'movies' && !document.getElementById('moviesGrid').children.length) loadMoviesPage();
    if (page === 'series' && !document.getElementById('seriesGrid').children.length) loadSeriesPage();
  });
});

// Mobile auth buttons
document.getElementById('mobileLoginBtn')?.addEventListener('click', () => {
  openModal('loginModal');
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
});
document.getElementById('mobileSignupBtn')?.addEventListener('click', () => {
  openModal('signupModal');
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
});

// Mobile watchlist / progress / logout
document.getElementById('mobileWatchlistBtn')?.addEventListener('click', () => {
  openWatchlist();
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
});
document.getElementById('mobileProgressBtn')?.addEventListener('click', () => {
  showPage('home');
  loadContinueWatching();
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
});
document.getElementById('mobileLogoutBtn')?.addEventListener('click', () => {
  logout();
  hamburger?.classList.remove('open');
  mobileMenu?.classList.remove('open');
});


  const pw = document.getElementById('profileWrap');
  document.getElementById('profileAvatar')?.addEventListener('click', () => pw.classList.toggle('open'));
  document.addEventListener('click', e => { if (pw && !pw.contains(e.target)) pw.classList.remove('open'); });

  document.getElementById('detailBack')?.addEventListener('click', () => {
    clearInterval(heroTimer);
    showPage('home');
    startHeroTimer();
  });

  document.getElementById('watchlistBtn')?.addEventListener('click', () => {
    openWatchlist();
    document.getElementById('profileWrap').classList.remove('open');
  });

  document.getElementById('progressBtn')?.addEventListener('click', () => {
    showPage('home');
    document.getElementById('profileWrap').classList.remove('open');
    loadContinueWatching();
  });

  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

// ── Search ──
let searchDebounce;

function setupSearch() {
  const input = document.getElementById('searchInput');
  const clear = document.getElementById('searchClear');

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clear.style.display = q ? 'block' : 'none';
    clearTimeout(searchDebounce);
    if (!q) { showPage('home'); return; }
    searchDebounce = setTimeout(() => doSearch(q), 380);
  });

  clear.addEventListener('click', () => {
    input.value = '';
    clear.style.display = 'none';
    showPage('home');
  });
}

async function doSearch(q) {
  showPage('search');
  document.getElementById('searchQueryLabel').textContent = `"${q}"`;
  const grid = document.getElementById('searchGrid');
  grid.innerHTML = skeletons(10);
  document.getElementById('searchEmpty').style.display = 'none';

  const data = await tmdb('/search/multi', { query: q, include_adult: false });
  const results = (data.results || []).filter(r =>
    (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path
  );
  grid.innerHTML = '';
  if (!results.length) { document.getElementById('searchEmpty').style.display = 'block'; return; }
  results.forEach(item => grid.appendChild(buildCard(item, item.media_type)));
}

// ── Home ──
async function loadHomePage() {
  loadHero();
  loadTop10();
  loadRowData('trendTrack', '/trending/movie/day', 'movie');
  loadRowData('topTrack', '/movie/top_rated', 'movie');
  loadGenreRow(28, 'movie');
  if (currentUser) loadContinueWatching();
}

// ── Hero ──
async function loadHero() {
  const data = await tmdb('/trending/all/day');
  heroItems = (data.results || []).filter(r => r.backdrop_path).slice(0, 8);
  if (!heroItems.length) return;
  renderHeroItem(0);
  renderHeroDots();
  startHeroTimer();
}

function renderHeroItem(index) {
  heroIndex = index;
  const item = heroItems[index];
  if (!item) return;

  const type   = item.media_type || 'movie';
  const title  = item.title || item.name || '';
  const year   = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating = item.vote_average?.toFixed(1) || '?';
  const genres = (item.genre_ids || []).slice(0, 2).map(id => GENRE_MAP[id] || '').filter(Boolean);

  document.getElementById('heroBg').style.backgroundImage = `url(${IMG}w1280${item.backdrop_path})`;

  document.getElementById('heroContent').innerHTML = `
    <div class="hero-type-badge">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      ${type === 'tv' ? 'Series' : 'Movie'}
    </div>
    <h1 class="hero-title">${title}</h1>
    <div class="hero-meta">
      <span class="hero-star">★</span>
      <span>${rating}</span>
      <span class="hero-sep"></span>
      <span>${year}</span>
      ${genres.map(g => `<span class="hero-sep"></span><span class="hero-genre-tag">${g}</span>`).join('')}
    </div>
    <p class="hero-overview">${item.overview || ''}</p>
    <div class="hero-actions">
      <button class="hero-play-btn" onclick="openDetail(${item.id},'${type}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Play
      </button>
      <button class="hero-info-btn" onclick="openDetail(${item.id},'${type}')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        See More
      </button>
    </div>
  `;

  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === index));
}

function renderHeroDots() {
  document.getElementById('heroDots').innerHTML = heroItems.map((_, i) =>
    `<div class="hero-dot ${i === 0 ? 'active' : ''}" onclick="renderHeroItem(${i})"></div>`
  ).join('');
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => renderHeroItem((heroIndex + 1) % heroItems.length), 6000);
}

// ── Top 10 ──
async function loadTop10() {
  const track = document.getElementById('top10Track');
  track.innerHTML = '';
  const data = await tmdb('/trending/all/day');
  const items = (data.results || []).filter(r => r.poster_path).slice(0, 10);
  items.forEach((item, i) => {
    const type  = item.media_type || 'movie';
    const title = item.title || item.name || '';
    const el = document.createElement('div');
    el.className = 'top10-item';
    el.innerHTML = `
      <div class="top10-num">${i + 1}</div>
      <img class="top10-poster" src="${IMG}w342${item.poster_path}" alt="${title}" loading="lazy">
    `;
    el.addEventListener('click', () => openDetail(item.id, type));
    track.appendChild(el);
  });
}

// ── Row data loader ──
async function loadRowData(trackId, path, type, params = {}) {
  const track = document.getElementById(trackId);
  if (!track) return;
  track.innerHTML = skeletons(8, true);
  const data = await tmdb(path, params);
  track.innerHTML = '';
  (data.results || []).slice(0, 15).forEach(item => track.appendChild(buildCard(item, type)));
}

// ── Genre Row ──
async function loadGenreRow(genreId, type) {
  const track = document.getElementById('genreTrack');
  if (!track) return;
  track.innerHTML = skeletons(8, true);
  const path = type === 'tv' ? '/discover/tv' : '/discover/movie';
  const data = await tmdb(path, { with_genres: genreId, sort_by: 'popularity.desc' });
  track.innerHTML = '';
  (data.results || []).slice(0, 15).forEach(item => track.appendChild(buildCard(item, type)));
}

// ── Section tabs ──
function setupSectionTabs() {
  document.querySelectorAll('.stab').forEach(btn => {
    btn.addEventListener('click', function() {
      const trackId = this.dataset.track;
      const type    = this.dataset.type;
      const group   = this.closest('.section-tabs');
      group.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      if (trackId === 'trendTrack') {
        loadRowData(trackId, type === 'tv' ? '/trending/tv/day' : '/trending/movie/day', type);
      } else if (trackId === 'topTrack') {
        loadRowData(trackId, type === 'tv' ? '/tv/top_rated' : '/movie/top_rated', type);
      }
    });
  });
}

// ── Genre tabs ──
function setupGenreTabs() {
  document.querySelectorAll('.gtab').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.gtab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      loadGenreRow(this.dataset.genre, 'movie');
    });
  });
}

// ── Browse pages ──
async function loadMoviesPage(reset = false) {
  if (reset) { moviesPage = 1; document.getElementById('moviesGrid').innerHTML = ''; }
  const sort  = currentMovieFilter.sort;
  const genre = currentMovieFilter.genre;
  const path  = genre ? '/discover/movie' : `/movie/${sort}`;
  const params = { page: moviesPage };
  if (genre) { params.with_genres = genre; params.sort_by = 'popularity.desc'; }
  const data = await tmdb(path, params);
  const grid = document.getElementById('moviesGrid');
  (data.results || []).forEach(item => grid.appendChild(buildCard(item, 'movie')));
  moviesPage++;
}

async function loadSeriesPage(reset = false) {
  if (reset) { seriesPage = 1; document.getElementById('seriesGrid').innerHTML = ''; }
  const sort  = currentSeriesFilter.sort;
  const genre = currentSeriesFilter.genre;
  const path  = genre ? '/discover/tv' : `/tv/${sort}`;
  const params = { page: seriesPage };
  if (genre) { params.with_genres = genre; params.sort_by = 'popularity.desc'; }
  const data = await tmdb(path, params);
  const grid = document.getElementById('seriesGrid');
  (data.results || []).forEach(item => grid.appendChild(buildCard(item, 'tv')));
  seriesPage++;
}

function setupFilters() {
  document.getElementById('movieSort')?.addEventListener('change', function() {
    currentMovieFilter.sort = this.value; loadMoviesPage(true);
  });
  document.getElementById('movieGenre')?.addEventListener('change', function() {
    currentMovieFilter.genre = this.value; loadMoviesPage(true);
  });
  document.getElementById('seriesSort')?.addEventListener('change', function() {
    currentSeriesFilter.sort = this.value; loadSeriesPage(true);
  });
  document.getElementById('seriesGenre')?.addEventListener('change', function() {
    currentSeriesFilter.genre = this.value; loadSeriesPage(true);
  });
  document.getElementById('moviesLoadMore')?.addEventListener('click', () => loadMoviesPage());
  document.getElementById('seriesLoadMore')?.addEventListener('click', () => loadSeriesPage());
}

// ── Card builder ──
function buildCard(item, type) {
  const title    = item.title || item.name || 'Unknown';
  const year     = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating   = item.vote_average ? item.vote_average.toFixed(1) : '?';
  const poster   = item.poster_path
    ? `${IMG}w342${item.poster_path}`
    : `https://placehold.co/342x513/13131e/8b5cf6?text=${encodeURIComponent(title)}`;
  const inWL     = isInWatchlist(item.id, type);
  const progress = getProgress(item.id, type);

  const el = document.createElement('div');
  el.className = 'card';
  el.innerHTML = `
    <div class="card-poster-wrap">
      <img class="card-poster" src="${poster}" alt="${title}" loading="lazy">
      <div class="card-hover-overlay">
        <div class="card-play-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </div>
      </div>
      <div class="card-badges">
        <span class="badge-type">${type === 'tv' ? 'TV SHOW' : 'MOVIE'}</span>
        <span class="badge-rating">★ ${rating}</span>
      </div>
      <button class="watchlist-add-btn ${inWL ? 'added' : ''}" title="Watchlist">${inWL ? '✓' : '+'}</button>
      ${progress > 0 ? `<div class="card-progress"><div class="card-progress-bar" style="width:${progress}%"></div></div>` : ''}
    </div>
    <div class="card-info">
      <div class="card-title">${title}</div>
      <div class="card-year">${year || '—'}</div>
    </div>
  `;

  el.addEventListener('click', e => {
    if (e.target.closest('.watchlist-add-btn')) return;
    openDetail(item.id, type);
  });

  el.querySelector('.watchlist-add-btn')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleWatchlist(item, type, e.currentTarget);
  });

  return el;
}

// ── Detail page ──
async function openDetail(id, type) {
  clearInterval(heroTimer);
  showPage('detail');
  currentDetail  = { id, type };
  currentSeason  = 1;
  currentEpisode = 1;

  document.getElementById('detailHeroContent').innerHTML = `<div class="hero-loader"><span></span><span></span><span></span></div>`;
  document.getElementById('detailPlayerSection').style.display = 'none';
  document.getElementById('detailCast').style.display          = 'none';
  document.getElementById('detailEpisodes').style.display      = 'none';
  document.getElementById('detailSimilar').style.display       = 'none';
  document.getElementById('epBar').style.display               = 'none';
  document.getElementById('playerFrame').src                   = '';

  const [item, credits, similar] = await Promise.all([
    tmdb(`/${type}/${id}`, { append_to_response: 'credits' }),
    tmdb(`/${type}/${id}/credits`),
    tmdb(`/${type}/${id}/similar`),
  ]);

  const title   = item.title || item.name || 'Unknown';
  const year    = (item.release_date || item.first_air_date || '').slice(0, 4);
  const rating  = item.vote_average?.toFixed(1) || '?';
  const runtime = item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}m` : '';
  const seasons = item.number_of_seasons || 0;
  const backdrop= item.backdrop_path ? `${IMG}original${item.backdrop_path}` : '';
  const genres  = (item.genres || []).map(g => `<span class="detail-genre">${g.name}</span>`).join('');
  const inWL    = isInWatchlist(id, type);

  document.getElementById('detailHeroBg').style.backgroundImage = `url(${backdrop})`;

  document.getElementById('detailHeroContent').innerHTML = `
    <h1 class="detail-title">${title}</h1>
    <div class="detail-meta">
      <span style="color:#fbbf24">★</span>
      <span>${rating}</span>
      <span class="hero-sep"></span>
      <span>${year}</span>
      ${runtime ? `<span class="hero-sep"></span><span>${runtime}</span>` : ''}
      ${seasons ? `<span class="hero-sep"></span><span>${seasons} Season${seasons > 1 ? 's' : ''}</span>` : ''}
    </div>
    <div class="detail-genres">${genres}</div>
    <p class="detail-overview">${item.overview || 'No description available.'}</p>
    <div class="detail-actions">
      <button class="d-btn d-btn-play" onclick="playMedia()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        Play
      </button>
      <button class="d-btn d-btn-icon" onclick="toggleWatchlistById(${id},'${type}',this)" title="Watchlist">
        ${inWL
          ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
          : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>'
        }
      </button>
      <button class="d-btn d-btn-outline" onclick="document.getElementById('detailSimilar').scrollIntoView({behavior:'smooth'})">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Similar
      </button>
    </div>
  `;

  document.getElementById('detailPlayerSection').style.display = 'block';

  if (type === 'tv' && seasons > 0) {
    const epBar     = document.getElementById('epBar');
    const selSeason = document.getElementById('detailSeason');
    epBar.style.display = 'flex';
    selSeason.innerHTML = Array.from({ length: seasons }, (_, i) =>
      `<option value="${i + 1}">Season ${i + 1}</option>`
    ).join('');
    await loadEpisodeOptions(id, 1);
    selSeason.onchange = async function() {
      currentSeason = parseInt(this.value);
      await loadEpisodeOptions(id, currentSeason);
    };
    document.getElementById('epPlayBtn').onclick = () => {
      currentEpisode = parseInt(document.getElementById('detailEpisode').value);
      playMedia();
    };
    document.getElementById('detailEpisode').onchange = function() {
      currentEpisode = parseInt(this.value);
    };
  }

  playMedia();
  saveProgress(id, type, 5);

  // Cast
  const cast = (item.credits?.cast || credits.cast || []).slice(0, 12);
  if (cast.length) {
    document.getElementById('detailCast').style.display = 'block';
    const grid = document.getElementById('castGrid');
    grid.innerHTML = '';
    cast.forEach(actor => {
      const img = actor.profile_path ? `${IMG}w185${actor.profile_path}` : '';
      const el  = document.createElement('div');
      el.className = 'cast-card';
      el.innerHTML = `
        ${img
          ? `<img class="cast-avatar" src="${img}" alt="${actor.name}" loading="lazy">`
          : `<div class="cast-avatar" style="background:var(--bg3);display:flex;align-items:center;justify-content:center;font-size:20px;">👤</div>`
        }
        <div>
          <div class="cast-name">${actor.name}</div>
          <div class="cast-char">${actor.character || ''}</div>
        </div>
      `;
      grid.appendChild(el);
    });
  }

  // Episodes
  if (type === 'tv' && seasons > 0) {
    document.getElementById('detailEpisodes').style.display = 'block';
    const epSeasonSel = document.getElementById('epSeasonSelect');
    epSeasonSel.innerHTML = Array.from({ length: seasons }, (_, i) =>
      `<option value="${i + 1}">Season ${i + 1}</option>`
    ).join('');
    epSeasonSel.onchange = function() {
      currentSeason = parseInt(this.value);
      loadEpisodeList(id, currentSeason);
    };
    await loadEpisodeList(id, 1);
    document.getElementById('epSearchInput').oninput = function() {
      filterEpisodes(this.value.toLowerCase());
    };
  }

  // Similar
  const simItems = (similar.results || []).filter(r => r.poster_path).slice(0, 15);
  if (simItems.length) {
    document.getElementById('detailSimilar').style.display = 'block';
    const track = document.getElementById('similarTrack');
    track.innerHTML = '';
    simItems.forEach(s => track.appendChild(buildCard(s, type)));
  }
}

async function loadEpisodeOptions(showId, season) {
  const selEp = document.getElementById('detailEpisode');
  selEp.innerHTML = '<option>Loading...</option>';
  try {
    const data = await tmdb(`/tv/${showId}/season/${season}`);
    const eps  = data.episodes || [];
    selEp.innerHTML = eps.map(e =>
      `<option value="${e.episode_number}">Ep ${e.episode_number}: ${e.name}</option>`
    ).join('');
    currentEpisode = 1;
  } catch {
    selEp.innerHTML = '<option value="1">Episode 1</option>';
  }
}

async function loadEpisodeList(showId, season) {
  const list = document.getElementById('epList');
  list.innerHTML = `<div style="padding:20px;color:var(--ep-text2)">Loading episodes...</div>`;
  const data = await tmdb(`/tv/${showId}/season/${season}`);
  allEpisodes = data.episodes || [];
  renderEpisodeList(allEpisodes, showId);
}

function renderEpisodeList(episodes, showId) {
  const list = document.getElementById('epList');
  list.innerHTML = '';
  episodes.forEach(ep => {
    const thumb   = ep.still_path ? `${IMG}w300${ep.still_path}` : '';
    const runtime = ep.runtime ? `${ep.runtime} min` : '';
    const prog    = getEpisodeProgress(showId, currentSeason, ep.episode_number);
    const playing = currentEpisode === ep.episode_number;
    const el = document.createElement('div');
    el.className = `ep-item ${playing ? 'playing' : ''}`;
    el.innerHTML = `
      <div class="ep-num">${ep.episode_number}</div>
      ${thumb ? `<img class="ep-thumb" src="${thumb}" alt="Ep ${ep.episode_number}" loading="lazy">` : ''}
      <div class="ep-info">
        <div class="ep-name">${ep.name}</div>
        ${runtime ? `<div class="ep-runtime">${runtime}</div>` : ''}
        <div class="ep-desc">${ep.overview || ''}</div>
      </div>
      ${prog > 0 ? `<div class="ep-progress-bar" style="width:${prog}%"></div>` : ''}
    `;
    el.addEventListener('click', () => {
      currentSeason  = parseInt(document.getElementById('epSeasonSelect')?.value || 1);
      currentEpisode = ep.episode_number;
      document.getElementById('detailSeason').value  = currentSeason;
      document.getElementById('detailEpisode').value = currentEpisode;
      playMedia();
      document.getElementById('detailPlayerSection').scrollIntoView({ behavior: 'smooth' });
      document.querySelectorAll('.ep-item').forEach(e => e.classList.remove('playing'));
      el.classList.add('playing');
    });
    list.appendChild(el);
  });
}

function filterEpisodes(q) {
  const filtered = q
    ? allEpisodes.filter(e =>
        e.name.toLowerCase().includes(q) ||
        (e.overview || '').toLowerCase().includes(q) ||
        String(e.episode_number).includes(q)
      )
    : allEpisodes;
  renderEpisodeList(filtered, currentDetail?.id);
}

// ── Player ──
function playMedia() {
  if (!currentDetail) return;
  const { id, type } = currentDetail;
  const frame = document.getElementById('playerFrame');
  let url;
  if (currentSource === 'vidking') {
    url = type === 'movie'
      ? `${VIDKING}/movie/${id}?color=8b5cf6&autoPlay=true`
      : `${VIDKING}/tv/${id}/${currentSeason}/${currentEpisode}?color=8b5cf6&nextEpisode=true&episodeSelector=true`;
  } else {
    url = type === 'movie'
      ? `${VIDSRC}/movie?tmdb=${id}&autoplay=1`
      : `${VIDSRC}/tv?tmdb=${id}&season=${currentSeason}&episode=${currentEpisode}&autoplay=1&autonext=1`;
  }
  frame.src = url;
  saveProgress(id, type, 10, currentSeason, currentEpisode);
}

function setupSourceBtns() {
  document.querySelectorAll('.psrc-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.psrc-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentSource = this.dataset.src;
      if (currentDetail) playMedia();
    });
  });
}

// ── Row scroll ──
function scrollRow(trackId, dir) {
  const track = document.getElementById(trackId);
  if (track) track.scrollBy({ left: dir * 600, behavior: 'smooth' });
}

// ── Player messages ──
function setupPlayerMessages() {
  window.addEventListener('message', function(event) {
    try {
      const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
      if (data && currentDetail && data.currentTime && data.duration > 0) {
        const pct = Math.round((data.currentTime / data.duration) * 100);
        saveProgress(currentDetail.id, currentDetail.type, pct, currentSeason, currentEpisode);
      }
    } catch {}
  });
}

// ── Auth setup ──
function setupAuth() {
  document.getElementById('loginBtn')?.addEventListener('click', () => openModal('loginModal'));
  document.getElementById('signupBtn')?.addEventListener('click', () => openModal('signupModal'));
  document.getElementById('loginSubmit')?.addEventListener('click', handleLogin);
  document.getElementById('signupSubmit')?.addEventListener('click', handleSignup);

  ['loginEmail', 'loginPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });
  });
  ['signupName', 'signupEmail', 'signupPassword'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });
  });

  document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) closeModal(o.id); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape')
      document.querySelectorAll('.modal-overlay.active').forEach(o => closeModal(o.id));
  });
}

// ── LOGIN — Cloudflare KV ──
async function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  const err   = document.getElementById('loginError');
  err.textContent = '';

  if (!email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Invalid email.'; return; }

  const btn = document.getElementById('loginSubmit');
  setLoading(btn, true);

  try {
    const res  = await fetch(`${WORKER_URL}/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password: pass }),
    });
    const data = await res.json();

    if (data.status) {
      setLoggedIn(data.user);
      closeModal('loginModal');
      // Load watchlist + progress from KV after login
      await syncFromKV(data.user.email);
    } else {
      err.textContent = data.msg || 'Login failed.';
    }
  } catch {
    err.textContent = 'Connection error. Please try again.';
  }

  setLoading(btn, false);
}

// ── SIGNUP — Cloudflare KV ──
async function handleSignup() {
  const name  = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pass  = document.getElementById('signupPassword').value;
  const err   = document.getElementById('signupError');
  err.textContent = '';

  if (!name || !email || !pass) { err.textContent = 'Please fill in all fields.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Invalid email.'; return; }
  if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }

  const btn = document.getElementById('signupSubmit');
  setLoading(btn, true);

  try {
    const res  = await fetch(`${WORKER_URL}/signup`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name, email, password: pass }),
    });
    const data = await res.json();

    if (data.status) {
      setLoggedIn(data.user);
      closeModal('signupModal');
    } else {
      err.textContent = data.msg || 'Signup failed.';
    }
  } catch {
    err.textContent = 'Connection error. Please try again.';
  }

  setLoading(btn, false);
}

// ── Sync watchlist + progress from KV after login ──
async function syncFromKV(email) {
  try {
    // Fetch watchlist from KV
    const wlRes  = await fetch(`${WORKER_URL}/watchlist/get`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const wlData = await wlRes.json();
    if (wlData.status) {
      localStorage.setItem(`vx-watchlist-${email}`, JSON.stringify(wlData.watchlist || []));
    }

    // Fetch progress from KV
    const prRes  = await fetch(`${WORKER_URL}/progress/get`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    });
    const prData = await prRes.json();
    if (prData.status) {
      localStorage.setItem(`vx-progress-${email}`, JSON.stringify(prData.progress || {}));
    }
  } catch (e) {
    console.warn('KV sync failed, using local data:', e);
  }
}

function setLoading(btn, loading) {
  btn.querySelector('.btn-text').style.display   = loading ? 'none'  : 'block';
  btn.querySelector('.btn-loader').style.display = loading ? 'block' : 'none';
  btn.disabled = loading;
}

function setLoggedIn(user) {
  currentUser = user;
  localStorage.setItem('vx-session', JSON.stringify(user));
  document.getElementById('loginBtn').style.display    = 'none';
  document.getElementById('signupBtn').style.display   = 'none';
  document.getElementById('profileWrap').style.display = 'flex';
  document.getElementById('profileAvatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profileName').textContent   = user.name;
  document.getElementById('profileEmail').textContent  = user.email;
  document.getElementById('continueSection').style.display = 'block';
  // Sync mobile menu
document.getElementById('mobileLoginBtn').style.display    = 'none';
document.getElementById('mobileSignupBtn').style.display   = 'none';
document.getElementById('mobileProfile').style.display     = 'block';
document.getElementById('mobileAvatar').textContent        = user.name.charAt(0).toUpperCase();
document.getElementById('mobileProfileName').textContent   = user.name;
document.getElementById('mobileProfileEmail').textContent  = user.email;
  loadContinueWatching();
}

function loadUser() {
  try {
    const s = localStorage.getItem('vx-session');
    if (s) {
      const user = JSON.parse(s);
      setLoggedIn(user);
      // Re-sync from KV on every page load so data stays fresh
      syncFromKV(user.email);
    }
  } catch {}
}

function logout() {
  currentUser = null;
  localStorage.removeItem('vx-session');
  document.getElementById('loginBtn').style.display    = 'flex';
  document.getElementById('signupBtn').style.display   = 'flex';
  document.getElementById('profileWrap').style.display = 'none';
  document.getElementById('continueSection').style.display = 'none';
  document.getElementById('profileWrap').classList.remove('open');
  // Sync mobile menu
document.getElementById('mobileLoginBtn').style.display  = 'flex';
document.getElementById('mobileSignupBtn').style.display = 'flex';
document.getElementById('mobileProfile').style.display   = 'none';
}

// ── Watchlist — reads local cache, writes to KV ──
function getWatchlist() {
  if (!currentUser) return [];
  try {
    return JSON.parse(localStorage.getItem(`vx-watchlist-${currentUser.email}`) || '[]');
  } catch { return []; }
}

async function saveWatchlist(list) {
  if (!currentUser) return;
  // Save to local cache immediately (instant UI)
  localStorage.setItem(`vx-watchlist-${currentUser.email}`, JSON.stringify(list));
  // Push to KV in background
  try {
    await fetch(`${WORKER_URL}/watchlist/save`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: currentUser.email, watchlist: list }),
    });
  } catch (e) {
    console.warn('Watchlist KV save failed:', e);
  }
}

function isInWatchlist(id, type) {
  return getWatchlist().some(i => i.id === id && i.type === type);
}

function toggleWatchlist(item, type, btn) {
  if (!currentUser) { openModal('loginModal'); return; }
  const list = getWatchlist();
  const idx  = list.findIndex(i => i.id === item.id && i.type === type);
  if (idx > -1) {
    list.splice(idx, 1);
    btn.textContent = '+';
    btn.classList.remove('added');
  } else {
    list.push({
      id: item.id, type,
      title: item.title || item.name,
      poster_path: item.poster_path,
      vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date,
    });
    btn.textContent = '✓';
    btn.classList.add('added');
  }
  saveWatchlist(list);
}

function toggleWatchlistById(id, type, btn) {
  if (!currentUser) { openModal('loginModal'); return; }
  const list = getWatchlist();
  const idx  = list.findIndex(i => i.id === id && i.type === type);
  if (idx > -1) { list.splice(idx, 1); btn.style.color = ''; }
  else { list.push({ id, type }); btn.style.color = 'var(--accent)'; }
  saveWatchlist(list);
}

function openWatchlist() {
  const grid  = document.getElementById('watchlistGrid');
  const empty = document.getElementById('watchlistEmpty');
  const list  = getWatchlist();
  grid.innerHTML = '';
  empty.style.display = 'none';
  if (!list.length) { empty.style.display = 'block'; }
  else {
    list.forEach(item => {
      const synth = {
        id: item.id, title: item.title, name: item.title,
        poster_path: item.poster_path, vote_average: item.vote_average,
        release_date: item.release_date,
      };
      grid.appendChild(buildCard(synth, item.type));
    });
  }
  openModal('watchlistModal');
}

// ── Progress — reads local cache, writes to KV ──
function getProgressData() {
  if (!currentUser) return {};
  try {
    return JSON.parse(localStorage.getItem(`vx-progress-${currentUser.email}`) || '{}');
  } catch { return {}; }
}

async function saveProgressData(data) {
  if (!currentUser) return;
  // Save to local cache immediately
  localStorage.setItem(`vx-progress-${currentUser.email}`, JSON.stringify(data));
  // Push to KV in background (throttled — only every 10s to avoid too many requests)
  const now = Date.now();
  if (!saveProgressData._last || now - saveProgressData._last > 10000) {
    saveProgressData._last = now;
    try {
      await fetch(`${WORKER_URL}/progress/save`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: currentUser.email, progress: data }),
      });
    } catch (e) {
      console.warn('Progress KV save failed:', e);
    }
  }
}

function saveProgress(id, type, pct, season = null, episode = null) {
  if (!currentUser) return;
  const prog = getProgressData();
  prog[`${type}-${id}`] = { id, type, pct: Math.min(pct, 100), season, episode, ts: Date.now() };
  saveProgressData(prog);
}

function getProgress(id, type) {
  if (!currentUser) return 0;
  return getProgressData()[`${type}-${id}`]?.pct || 0;
}

function getEpisodeProgress(showId, season, episode) {
  if (!currentUser) return 0;
  const p = getProgressData()[`tv-${showId}`];
  return (p && p.season === season && p.episode === episode) ? p.pct : 0;
}

async function loadContinueWatching() {
  if (!currentUser) return;
  const items = Object.values(getProgressData())
    .filter(p => p.pct > 2 && p.pct < 95)
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 10);

  const track = document.getElementById('continueTrack');
  if (!track) return;
  track.innerHTML = '';

  if (!items.length) { document.getElementById('continueSection').style.display = 'none'; return; }
  document.getElementById('continueSection').style.display = 'block';

  const enriched = await Promise.all(
    items.map(async p => {
      try { const d = await tmdb(`/${p.type}/${p.id}`); return { ...d, _p: p }; } catch { return null; }
    })
  );
  enriched.filter(Boolean).forEach(item => track.appendChild(buildCard(item, item._p.type)));
}

// ── Modal helpers ──
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function switchModal(from, to) { closeModal(from); setTimeout(() => openModal(to), 150); }

// ── Skeletons ──
function skeletons(count, inline = false) {
  return Array.from({ length: count }, () =>
    `<div class="skeleton-card" ${inline ? '' : 'style="width:100%"'}><div class="sk-poster"></div><div class="sk-line"></div><div class="sk-line short"></div></div>`
  ).join('');
}

// ── Genre map ──
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western',
  10759:'Action & Adventure', 10762:'Kids', 10763:'News', 10764:'Reality',
  10765:'Sci-Fi & Fantasy', 10766:'Soap', 10767:'Talk', 10768:'War & Politics',
};