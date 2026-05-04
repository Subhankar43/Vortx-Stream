import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { WORKER_URL, IMG } from '../utils/tmdb';
import Card from './Card';

function Modal({ id, active, onClose, children }) {
  return (
    <div className={`modal-overlay ${active ? 'active' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal auth-modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <div className="auth-avatar-wrap">
          <img src="https://i.ibb.co/qFg65htB/img-2.png" alt="VortxStream" className="auth-avatar-img" />
        </div>
        <div className="auth-logo">Made with ❤️ by <a href="https://www.instagram.com/vortx_43" target="_blank" rel="noreferrer">Subhankar</a></div>
        {children}
      </div>
    </div>
  );
}

export function LoginModal({ active, onClose, onSwitch }) {
  const { login } = useAuth();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email || !password) { setError('Please fill all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${WORKER_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); }
      else { login(data.user); onClose(); setEmail(''); setPassword(''); }
    } catch { setError('Network error. Try again.'); }
    setLoading(false);
  }

  return (
    <Modal active={active} onClose={onClose}>
      <h2 className="auth-title">Welcome back</h2>
      <p className="auth-sub">Sign in to continue watching</p>
      <div className="auth-form">
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-error">{error}</div>
        <button className="auth-submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="btn-loader" /> : <span>Sign In</span>}
        </button>
      </div>
      <p className="auth-switch">Don't have an account? <button onClick={onSwitch}>Sign up</button></p>
    </Modal>
  );
}

export function SignupModal({ active, onClose, onSwitch }) {
  const { login } = useAuth();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit() {
    if (!name || !email || !password) { setError('Please fill all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${WORKER_URL}/signup`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Signup failed'); }
      else { login(data.user); onClose(); setName(''); setEmail(''); setPassword(''); }
    } catch { setError('Network error. Try again.'); }
    setLoading(false);
  }

  return (
    <Modal active={active} onClose={onClose}>
      <h2 className="auth-title">Create account</h2>
      <p className="auth-sub">Start watching for free</p>
      <div className="auth-form">
        <div className="form-group">
          <label>Full Name</label>
          <input type="text" className="form-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" className="form-input" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input type="password" className="form-input" placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
        </div>
        <div className="form-error">{error}</div>
        <button className="auth-submit-btn" onClick={handleSubmit} disabled={loading}>
          {loading ? <span className="btn-loader" /> : <span>Create Account</span>}
        </button>
      </div>
      <p className="auth-switch">Already have an account? <button onClick={onSwitch}>Sign in</button></p>
    </Modal>
  );
}

export function WatchlistModal({ active, onClose, onOpen }) {
  const { getWatchlist } = useAuth();
  const list = getWatchlist();

  return (
    <div className={`modal-overlay ${active ? 'active' : ''}`} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal wide-modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 className="modal-title-h">My Watchlist</h2>
        {list.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎬</div><p>Your watchlist is empty</p></div>
        ) : (
          <div className="browse-grid">
            {list.map(item => {
              const synth = { id: item.id, title: item.title, name: item.title, poster_path: item.poster_path, vote_average: item.vote_average, release_date: item.release_date };
              return <Card key={item.id} item={synth} type={item.type} onOpen={(i, t) => { onOpen(i, t); onClose(); }} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}
