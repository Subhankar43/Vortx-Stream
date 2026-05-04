import React, { useState, useEffect } from 'react';
import { tmdb, IMG, SERVERS, GENRE_MAP } from '../utils/tmdb';
import Card from '../components/Card';
import CardRow from '../components/CardRow';
import { useAuth } from '../hooks/useAuth';

export default function DetailPage({ item, type, onBack, onOpen }) {
  const { user, isInWatchlist, toggleWatchlist, saveProgress, getProgress } = useAuth();

  const [detail,    setDetail]    = useState(null);
  const [cast,      setCast]      = useState([]);
  const [similar,   setSimilar]   = useState([]);
  const [seasons,   setSeasons]   = useState([]);
  const [episodes,  setEpisodes]  = useState([]);
  const [selSeason, setSelSeason] = useState(1);
  const [selEp,     setSelEp]     = useState(1);
  const [epSearch,  setEpSearch]  = useState('');
  const [server,    setServer]    = useState('videasy');
  const [playing,   setPlaying]   = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [inWl,      setInWl]      = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!item) return;
    setLoading(true);
    setPlaying(false);
    setIframeUrl('');
    setEpSearch('');
    window.scrollTo(0, 0);
    loadDetail();
  }, [item?.id, type]);

  useEffect(() => {
    if (detail && type === 'tv') loadEpisodes(selSeason);
  }, [selSeason, detail]);

  async function loadDetail() {
    const [det, credits, sim] = await Promise.all([
      tmdb(`/${type}/${item.id}`),
      tmdb(`/${type}/${item.id}/credits`),
      tmdb(`/${type}/${item.id}/similar`),
    ]);
    setDetail(det);
    setCast((credits.cast || []).filter(c => c.profile_path).slice(0, 20));
    setSimilar((sim.results || []).filter(r => r.poster_path).slice(0, 20));
    if (type === 'tv' && det.seasons) {
      const realSeasons = det.seasons.filter(s => s.season_number > 0);
      setSeasons(realSeasons);
      setSelSeason(realSeasons[0]?.season_number || 1);
    }
    setInWl(isInWatchlist(item.id, type));
    setLoading(false);
  }

  async function loadEpisodes(seasonNum) {
    const data = await tmdb(`/tv/${item.id}/season/${seasonNum}`);
    setEpisodes(data.episodes || []);
  }

  function getEmbedUrl(srv, s, e) {
    const serverObj = SERVERS.find(sv => sv.id === srv);
    if (!serverObj) return '';
    if (type === 'movie') return serverObj.movie(item.id);
    return serverObj.tv(item.id, s, e);
  }

  function playNow() {
    const url = getEmbedUrl(server, selSeason, selEp);
    setIframeUrl(url);
    setPlaying(true);
    if (user) saveProgress(item.id, type, 5, type === 'tv' ? selSeason : null, type === 'tv' ? selEp : null);
    setTimeout(() => document.getElementById('playerWrap')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  function playEpisode(season, episode) {
    setSelSeason(season);
    setSelEp(episode);
    const url = getEmbedUrl(server, season, episode);
    setIframeUrl(url);
    setPlaying(true);
    if (user) saveProgress(item.id, type, 5, season, episode);
  }

  function handleServerChange(srv) {
    setServer(srv);
    if (playing) {
      const url = getEmbedUrl(srv, selSeason, selEp);
      setIframeUrl(url);
    }
  }

  function handleWl() {
    const added = toggleWatchlist(detail || item, type);
    setInWl(added);
  }

  if (!item) return null;

  const title    = detail?.title || detail?.name || item.title || item.name || '';
  const backdrop = detail?.backdrop_path || item.backdrop_path;
  const poster   = detail?.poster_path || item.poster_path;
  const year     = (detail?.release_date || detail?.first_air_date || item.release_date || item.first_air_date || '').slice(0, 4);
  const rating   = detail?.vote_average?.toFixed(1) || '';
  const overview = detail?.overview || item.overview || '';
  const genres   = (detail?.genres || []).map(g => g.name);
  const runtime  = detail?.runtime ? `${detail.runtime}m` : detail?.episode_run_time?.[0] ? `${detail.episode_run_time[0]}m/ep` : '';
  const seasonCount = detail?.number_of_seasons;

  const filteredEps = episodes.filter(ep =>
    !epSearch || ep.name?.toLowerCase().includes(epSearch.toLowerCase())
  );

  return (
    <div className="page">
      {/* Hero */}
      <div className="detail-hero">
        <button className="detail-back" onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        {backdrop && <div className="detail-hero-bg" style={{ backgroundImage: `url(${IMG}original${backdrop})` }} />}
        <div className="detail-hero-overlay" />
        <div className="detail-hero-content">
          <h1 className="detail-title">{title}</h1>
          <div className="detail-meta">
            {rating && <span className="detail-rating">★ {rating}</span>}
            {year && <><span className="meta-dot"/><span className="detail-year">{year}</span></>}
            {runtime && <><span className="meta-dot"/><span className="detail-runtime">{runtime}</span></>}
            {seasonCount && <><span className="meta-dot"/><span className="detail-seasons">{seasonCount} Season{seasonCount > 1 ? 's' : ''}</span></>}
          </div>
          {genres.length > 0 && (
            <div className="detail-genres">
              {genres.map(g => <span key={g} className="detail-genre-tag">{g}</span>)}
            </div>
          )}
          {overview && <p className="detail-overview">{overview}</p>}
          <div className="detail-btns">
            <button className="d-btn d-btn-play" onClick={playNow}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              {type === 'tv' ? `Play S${selSeason} E${selEp}` : 'Watch Now'}
            </button>
            <button className={`d-btn d-btn-wl ${inWl ? 'added' : ''}`} onClick={handleWl}>
              {inWl ? '✓ In Watchlist' : '+ Watchlist'}
            </button>
          </div>
        </div>
      </div>

      <div className="detail-content-wrap">

        {/* Player */}
        <div className="detail-player-section" id="playerWrap">
          <div className="player-label">Now Playing</div>

          {/* Server Dropdown */}
          <div className="server-select-wrap">
            <span className="server-label">Server:</span>
            <select
              className="server-select"
              value={server}
              onChange={e => handleServerChange(e.target.value)}
            >
              {SERVERS.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
            <span className="server-status">● Live</span>
          </div>

          {/* TV episode bar */}
          {type === 'tv' && seasons.length > 0 && (
            <div className="ep-bar">
              <select className="ep-select" value={selSeason} onChange={e => { setSelSeason(Number(e.target.value)); setSelEp(1); }}>
                {seasons.map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
              </select>
              <select className="ep-select" value={selEp} onChange={e => setSelEp(Number(e.target.value))}>
                {Array.from({ length: seasons.find(s => s.season_number === selSeason)?.episode_count || 24 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Episode {i + 1}</option>
                ))}
              </select>
              <button className="ep-play-btn" onClick={playNow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Play Episode
              </button>
            </div>
          )}

          {playing && iframeUrl ? (
            <div className="player-frame-wrap">
              <iframe
                src={iframeUrl}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media"
                scrolling="no"
                title="player"
              />
            </div>
          ) : (
            <div
              style={{
                width: '100%', aspectRatio: '16/9', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg3)', border: '1px solid var(--border2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 16, cursor: 'pointer',
              }}
              onClick={playNow}
            >
              {poster && (
                <img src={`${IMG}w300${poster}`} alt={title} style={{ width: 120, borderRadius: 8, opacity: 0.5 }} />
              )}
              <div style={{ fontSize: 14, color: 'var(--text3)' }}>Click to play</div>
            </div>
          )}
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title"><span className="title-bar" />Actors</h3>
            <div className="cast-grid">
              {cast.map(c => (
                <div key={c.id} className="cast-card">
                  <img className="cast-img" src={`${IMG}w185${c.profile_path}`} alt={c.name} loading="lazy" />
                  <div className="cast-name">{c.name}</div>
                  <div className="cast-char">{c.character}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Episodes */}
        {type === 'tv' && seasons.length > 0 && (
          <div className="detail-section">
            <div className="ep-header">
              <h3 className="detail-section-title"><span className="title-bar" />Episodes</h3>
              <div className="ep-controls">
                <select className="ep-select" value={selSeason} onChange={e => { setSelSeason(Number(e.target.value)); setEpSearch(''); }}>
                  {seasons.map(s => <option key={s.season_number} value={s.season_number}>Season {s.season_number}</option>)}
                </select>
                <div className="ep-search-wrap">
                  <svg className="ep-search-ico" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <input className="ep-search-input" placeholder="Search episode..." value={epSearch} onChange={e => setEpSearch(e.target.value)} />
                </div>
              </div>
            </div>
            <div className="ep-list">
              {filteredEps.map(ep => (
                <div
                  key={ep.id}
                  className={`ep-item ${playing && selSeason === ep.season_number && selEp === ep.episode_number ? 'active' : ''}`}
                  onClick={() => playEpisode(ep.season_number, ep.episode_number)}
                >
                  {ep.still_path && (
                    <div className="ep-thumb">
                      <img src={`${IMG}w300${ep.still_path}`} alt={ep.name} loading="lazy" />
                    </div>
                  )}
                  <span className="ep-num">E{ep.episode_number}</span>
                  <div className="ep-info">
                    <div className="ep-name">{ep.name}</div>
                    {ep.overview && <div className="ep-desc">{ep.overview}</div>}
                  </div>
                  {ep.runtime && <span className="ep-runtime">{ep.runtime}m</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="detail-section">
            <h3 className="detail-section-title"><span className="title-bar" />Similar</h3>
            <CardRow items={similar} type={type} loading={false} onOpen={onOpen} />
          </div>
        )}

      </div>
    </div>
  );
}
