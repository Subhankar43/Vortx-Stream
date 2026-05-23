import React, { useState, useEffect } from 'react';
import { WORKER_URL } from '../utils/tmdb';

export default function NoticeBanner() {
  const [text, setText] = useState('');

  useEffect(() => {
    fetch(`${WORKER_URL}/homepage-notice`)
      .then(r => r.json())
      .then(d => { if (d.notice) setText(d.notice); })
      .catch(() => {});
  }, []);

  if (!text) return null;

  return (
    <div style={{
      background: 'linear-gradient(90deg,#061a14,#0a1e1a)',
      borderBottom: '1px solid rgba(0,200,232,0.2)',
      padding: '7px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      fontSize: 12,
      width: '100%',
    }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00c8e8', flexShrink: 0, display: 'inline-block' }} />
      <span style={{ color: '#a0e8f0', textAlign: 'center' }}>
        📢 <strong style={{ color: '#00c8e8' }}>Announcement:</strong> {text}
      </span>
    </div>
  );
}