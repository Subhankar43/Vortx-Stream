import React, { useRef } from 'react';
import Card, { SkeletonCard } from './Card';

export default function CardRow({ items, type, loading, onOpen }) {
  const trackRef = useRef(null);

  function scroll(dir) {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: dir * 600, behavior: 'smooth' });
    }
  }

  return (
    <div className="card-row">
      <button className="row-arrow left" onClick={() => scroll(-1)}>&#8249;</button>
      <div className="row-track" ref={trackRef}>
        {loading
          ? Array.from({ length: 10 }, (_, i) => <SkeletonCard key={i} />)
          : items.map(item => (
              <Card key={`${item.id}-${type}`} item={item} type={type} onOpen={onOpen} />
            ))
        }
      </div>
      <button className="row-arrow right" onClick={() => scroll(1)}>&#8250;</button>
    </div>
  );
}
