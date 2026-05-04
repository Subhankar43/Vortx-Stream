import React from 'react';

export default function NoticeBanner() {
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
        📢 <strong style={{ color: '#00c8e8' }}>Announcement:</strong> Use Brave Browser 🦁 to avoid ads.
      </span>
    </div>
  );
}