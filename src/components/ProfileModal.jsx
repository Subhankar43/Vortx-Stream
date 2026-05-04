import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { WORKER_URL } from '../utils/tmdb';

const AVATARS = ['🎬','🎭','🍿','👾','🦁','🐉','🌊','⚡','🔥','🎮'];

export default function ProfileModal({ active, onClose }) {
  const { user, login } = useAuth();
  const [name, setName]     = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg]       = useState('');

  async function handleSave() {
    if (!name.trim()) { setMsg('Name cannot be empty'); return; }
    setLoading(true); setMsg('');
    try {
      const res = await fetch(`${WORKER_URL}/update-profile`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, name, avatar }),
      });
      const data = await res.json();
      if (data.status) {
        login({ ...user, name, avatar });
        setMsg('Profile updated!');
      } else { setMsg(data.msg || 'Error'); }
    } catch { setMsg('Network error'); }
    setLoading(false);
  }

  if (!active) return null;

  return (
    <div className="modal-overlay active" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="auth-title">Edit Profile</h2>
        <p className="auth-sub">Change your name or avatar</p>

        {/* Avatar picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 20 }}>
          {AVATARS.map(a => (
            <button key={a} onClick={() => setAvatar(a)} style={{
              width: 44, height: 44, borderRadius: '50%', fontSize: 22,
              background: avatar === a ? 'var(--surface2)' : 'var(--surface3)',
              border: avatar === a ? '2px solid var(--accent)' : '2px solid transparent',
              transition: 'all 0.2s', cursor: 'pointer',
            }}>{a}</button>
          ))}
        </div>

        <div className="auth-form">
          <div className="form-group">
            <label>Display Name</label>
            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-error" style={{ color: msg === 'Profile updated!' ? 'var(--accent)' : 'var(--accent-red)' }}>{msg}</div>
          <button className="auth-submit-btn" onClick={handleSave} disabled={loading}>
            {loading ? <span className="btn-loader" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}