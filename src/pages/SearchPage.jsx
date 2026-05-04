import React, { useState, useEffect } from 'react';
import { tmdb } from '../utils/tmdb';
import Card, { SkeletonCard } from '../components/Card';

export default function SearchPage({ query, onOpen }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    tmdb('/search/multi', { query, include_adult: false }).then(data => {
      const filtered = (data.results || []).filter(r =>
        (r.media_type === 'movie' || r.media_type === 'tv') && r.poster_path
      );
      setResults(filtered);
      setLoading(false);
    });
  }, [query]);

  return (
    <div className="page search-page">
      <div className="search-label">Results for <span>"{query}"</span></div>
      {loading ? (
        <div className="browse-grid">
          {Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} wide />)}
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state"><div className="empty-icon">🔍</div><p>No results found</p></div>
      ) : (
        <div className="browse-grid">
          {results.map(item => (
            <Card key={item.id} item={item} type={item.media_type} onOpen={onOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
