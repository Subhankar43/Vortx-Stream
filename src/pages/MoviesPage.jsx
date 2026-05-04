import React, { useState, useEffect, useRef } from 'react';
import { tmdb } from '../utils/tmdb';
import Card, { SkeletonCard } from '../components/Card';

const SORT_OPTIONS = [
  { value: 'popular',       label: 'Most Popular' },
  { value: 'top_rated',     label: 'Top Rated' },
  { value: 'now_playing',   label: 'Now Playing' },
  { value: 'upcoming',      label: 'Upcoming' },
];

const GENRE_OPTIONS = [
  { value: '', label: 'All Genres' },
  { value: '28', label: 'Action' }, { value: '35', label: 'Comedy' },
  { value: '27', label: 'Horror' }, { value: '10749', label: 'Romance' },
  { value: '878', label: 'Sci-Fi' }, { value: '18', label: 'Drama' },
  { value: '16', label: 'Animation' }, { value: '80', label: 'Crime' },
  { value: '53', label: 'Thriller' }, { value: '14', label: 'Fantasy' },
];

export default function MoviesPage({ onOpen }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [sort,    setSort]    = useState('popular');
  const [genre,   setGenre]   = useState('');
  const [more,    setMore]    = useState(true);

  useEffect(() => { setItems([]); setPage(1); setMore(true); load(1, sort, genre, true); }, [sort, genre]);

  async function load(p, s, g, reset = false) {
    setLoading(true);
    let path, params = { page: p };
    if (g) {
      path = '/discover/movie';
      params.with_genres = g;
      params.sort_by = s === 'popular' ? 'popularity.desc' : s === 'top_rated' ? 'vote_average.desc' : 'popularity.desc';
      if (s === 'top_rated') params['vote_count.gte'] = 100;
    } else {
      path = `/movie/${s}`;
    }
    const data = await tmdb(path, params);
    const results = (data.results || []).filter(r => r.poster_path);
    setItems(prev => reset ? results : [...prev, ...results]);
    setMore(p < (data.total_pages || 1));
    setLoading(false);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next, sort, genre);
  }

  return (
    <div className="page">
      <div className="browse-header">
        <h1 className="browse-title">Movies</h1>
        <div className="browse-filters">
          <select className="filter-select" value={sort} onChange={e => setSort(e.target.value)}>
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className="filter-select" value={genre} onChange={e => setGenre(e.target.value)}>
            {GENRE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>
      <div className="browse-grid">
        {items.map(item => <Card key={item.id} item={item} type="movie" onOpen={onOpen} />)}
        {loading && Array.from({ length: 12 }, (_, i) => <SkeletonCard key={i} wide />)}
      </div>
      {!loading && more && (
        <div className="load-more-wrap">
          <button className="load-more-btn" onClick={loadMore}>Load More</button>
        </div>
      )}
      <footer className="footer">
        Made with <span style={{ color: '#e05252' }}>❤️</span> by{' '}
        <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer">Subhankar</a>
        &nbsp;© 2026
      </footer>
    </div>
  );
}
