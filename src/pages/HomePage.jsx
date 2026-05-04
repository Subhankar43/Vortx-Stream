import React, { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import CardRow from '../components/CardRow';
import Card, { SkeletonCard } from '../components/Card';
import { tmdb, IMG } from '../utils/tmdb';
import { useAuth } from '../hooks/useAuth';
import NoticeBanner from '../components/NoticeBanner';


const GENRES = [
  { id: 28, label: 'Action' }, { id: 35, label: 'Comedy' }, { id: 27, label: 'Horror' },
  { id: 10749, label: 'Romance' }, { id: 878, label: 'Sci-Fi' }, { id: 18, label: 'Drama' },
  { id: 16, label: 'Animation' },
];

export default function HomePage({ onOpen }) {
  const { user, getProgressData } = useAuth();

  const [trendItems, setTrendItems]  = useState([]);
  const [trendType,  setTrendType]   = useState('movie');
  const [trendLoad,  setTrendLoad]   = useState(true);

  const [topItems,   setTopItems]    = useState([]);
  const [topType,    setTopType]     = useState('movie');
  const [topLoad,    setTopLoad]     = useState(true);

  const [top10,      setTop10]       = useState([]);
  const [top10Load,  setTop10Load]   = useState(true);

  const [genre,      setGenre]       = useState(28);
  const [genreItems, setGenreItems]  = useState([]);
  const [genreLoad,  setGenreLoad]   = useState(true);

  const [continueItems, setContinueItems] = useState([]);

  useEffect(() => { loadTop10(); loadTrending('movie'); loadTopRated('movie'); loadGenre(28); }, []);
  useEffect(() => { if (user) loadContinue(); }, [user]);
  useEffect(() => { loadTrending(trendType); }, [trendType]);
  useEffect(() => { loadTopRated(topType); }, [topType]);
  useEffect(() => { loadGenre(genre); }, [genre]);

  async function loadTop10() {
    setTop10Load(true);
    const data = await tmdb('/trending/all/day');
    setTop10((data.results || []).filter(r => r.poster_path).slice(0, 10));
    setTop10Load(false);
  }

  async function loadTrending(type) {
    setTrendLoad(true);
    const path = type === 'movie' ? '/trending/movie/day' : '/trending/tv/day';
    const data = await tmdb(path);
    setTrendItems((data.results || []).filter(r => r.poster_path));
    setTrendLoad(false);
  }

  async function loadTopRated(type) {
    setTopLoad(true);
    const path = type === 'movie' ? '/movie/top_rated' : '/tv/top_rated';
    const data = await tmdb(path);
    setTopItems((data.results || []).filter(r => r.poster_path));
    setTopLoad(false);
  }

  async function loadGenre(genreId) {
    setGenreLoad(true);
    const data = await tmdb('/discover/movie', { with_genres: genreId, sort_by: 'popularity.desc' });
    setGenreItems((data.results || []).filter(r => r.poster_path));
    setGenreLoad(false);
  }

  async function loadContinue() {
    const prog = getProgressData();
    const items = Object.values(prog)
      .filter(p => p.pct > 2 && p.pct < 95)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10);
    if (!items.length) { setContinueItems([]); return; }
    const enriched = await Promise.all(
      items.map(async p => {
        try { const d = await tmdb(`/${p.type}/${p.id}`); return { ...d, _p: p }; } catch { return null; }
      })
    );
    setContinueItems(enriched.filter(Boolean));
  }

  return (
    <div className="page">
     <NoticeBanner />
      <Hero onOpen={onOpen} />
      {/* TOP 10 */}
      <section className="section">
        <div className="section-head">
          <div className="top10-title">
            <span className="top10-big">TOP 10</span>
            <div className="top10-sub"><span>CONTENT</span><span>TODAY</span></div>
          </div>
        </div>
        <div className="card-row">
          <button className="row-arrow left" onClick={() => document.getElementById('top10Track').scrollBy({ left: -600, behavior: 'smooth' })}>&#8249;</button>
          <div className="row-track" id="top10Track">
            {top10Load
              ? Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)
              : top10.map((item, i) => (
                  <div key={item.id} className="top10-item" onClick={() => onOpen(item, item.media_type === 'tv' ? 'tv' : 'movie')}>
                    <span className="top10-num">{i + 1}</span>
                    <img
                      className="top10-poster"
                      src={`${IMG}w300${item.poster_path}`}
                      alt={item.title || item.name}
                      loading="lazy"
                    />
                  </div>
                ))
            }
          </div>
          <button className="row-arrow right" onClick={() => document.getElementById('top10Track').scrollBy({ left: 600, behavior: 'smooth' })}>&#8250;</button>
        </div>
      </section>

      {/* Continue Watching */}
      {user && continueItems.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title"><span className="title-bar" />Continue Watching</h2>
          </div>
          <CardRow items={continueItems} type="mixed" loading={false} onOpen={(item, _) => onOpen(item, item._p?.type || 'movie')} />
        </section>
      )}

      {/* Trending */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title"><span className="title-bar" />Trending Today</h2>
          <div className="section-tabs">
            {['movie','tv'].map(t => (
              <button key={t} className={`stab ${trendType === t ? 'active' : ''}`} onClick={() => setTrendType(t)}>
                {t === 'movie' ? 'Movies' : 'Series'}
              </button>
            ))}
          </div>
        </div>
        <CardRow items={trendItems} type={trendType} loading={trendLoad} onOpen={onOpen} />
      </section>

      {/* Top Rated */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title"><span className="title-bar" />Top Rated</h2>
          <div className="section-tabs">
            {['movie','tv'].map(t => (
              <button key={t} className={`stab ${topType === t ? 'active' : ''}`} onClick={() => setTopType(t)}>
                {t === 'movie' ? 'Movies' : 'Series'}
              </button>
            ))}
          </div>
        </div>
        <CardRow items={topItems} type={topType} loading={topLoad} onOpen={onOpen} />
      </section>

      {/* Genres */}
      <section className="section">
        <div className="section-head">
          <h2 className="section-title"><span className="title-bar" />Genres</h2>
          <div className="genre-tabs">
            {GENRES.map(g => (
              <button key={g.id} className={`gtab ${genre === g.id ? 'active' : ''}`} onClick={() => setGenre(g.id)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <CardRow items={genreItems} type="movie" loading={genreLoad} onOpen={onOpen} />
      </section>

      <footer className="footer">
        Made with <span style={{ color: '#e05252' }}>❤️</span> by{' '}
        <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer">Subhankar</a>
        &nbsp;© 2026
      </footer>
    </div>
  );
}
