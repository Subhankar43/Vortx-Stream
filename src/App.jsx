import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import MoviesPage from './pages/MoviesPage';
import SeriesPage from './pages/SeriesPage';
import SearchPage from './pages/SearchPage';
import DetailPage from './pages/DetailPage';
import { LoginModal, SignupModal, WatchlistModal } from './components/AuthModals';

function AppInner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loginOpen, setLoginOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [detailItem, setDetailItem] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vx-detail'))?.item || null; } catch { return null; }
  });

  const [detailType, setDetailType] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('vx-detail'))?.type || null; } catch { return null; }
  });

  const [prevPath, setPrevPath] = useState('/');

  function openDetail(item, type) {
    setPrevPath(window.location.pathname);
    setDetailItem(item);
    setDetailType(type);
    setSearchQuery('');
    sessionStorage.setItem('vx-detail', JSON.stringify({ item, type }));
    window.scrollTo(0, 0);
  }

  function closeDetail() {
    setDetailItem(null);
    setDetailType(null);
    sessionStorage.removeItem('vx-detail');
    navigate(prevPath || '/');
  }

  function handleNavClick() {
    setDetailItem(null);
    setDetailType(null);
    sessionStorage.removeItem('vx-detail');
  }

  function handleSearch(q) {
    setSearchQuery(q);
    if (q && detailItem) {
      setDetailItem(null);
      sessionStorage.removeItem('vx-detail');
    }
  }

  // 🔥 LOGIN REQUIRED SCREEN
  if (!user) {
    return (
      <>
        <LoginModal
          active={loginOpen}
          onClose={() => setLoginOpen(false)}   // ✅ FIXED
          onSwitch={() => {
            setLoginOpen(false);
            setSignupOpen(true);
          }}
        />

        <SignupModal
          active={signupOpen}
          onClose={() => setSignupOpen(false)}  // ✅ FIXED
          onSwitch={() => {
            setSignupOpen(false);
            setLoginOpen(true);
          }}
        />
<div style={{
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #0f172a, #020617)'
}}>

  <div style={{
    width: '100%',
    maxWidth: 440,
    padding: '40px 30px',
    borderRadius: 20,
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 0 60px rgba(0,0,0,0.6)',
    textAlign: 'center'
  }}>

    {/* Logo */}
    <div style={{
      fontFamily: 'Bebas Neue',
      fontSize: 44,
      marginBottom: 8,
      background: 'linear-gradient(135deg, #7fffb0, #00c4ff)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    }}>
      VORTXSTREAM
    </div>

    {/* Tagline */}
    <p style={{
      color: '#aaa',
      fontSize: 14,
      marginBottom: 20
    }}>
      Unlimited Movies • Series • Streaming
    </p>

    {/* 🔔 ANNOUNCEMENT BOX */}
    <div style={{
      background: 'rgba(0,0,0,0.4)',
      borderRadius: 12,
      padding: 15,
      marginBottom: 25,
      textAlign: 'left'
    }}>
      <div style={{ fontSize: 13, color: '#00c4ff', marginBottom: 8 }}>
        🔔 Announcements
      </div>

      <ul style={{
        paddingLeft: 18,
        fontSize: 13,
        color: '#ccc',
        lineHeight: 1.6
      }}>
        <li>Use Brave Browser 🦁 to avoid ads</li>
        <li>Watchlist feature available</li>
        <li>Track your progress</li>
        <li>Streaming speed improved</li>
        <li>Multiple server added to improve the performance</li>
       <li>All the data taken from third party websites</li>
      </ul>
    </div>

    {/* Buttons */}
    <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
      <button
        className="nav-btn btn-outline"
        style={{ flex: 1 }}
        onClick={() => setLoginOpen(true)}
      >
        Sign In
      </button>

      <button
        className="nav-btn btn-primary"
        style={{ flex: 1 }}
        onClick={() => setSignupOpen(true)}
      >
        Sign Up
      </button>
    </div>

    {/* ❤️ CREDIT LINE */}
    <div style={{
      fontSize: 15,
      color: 'white'
    }}>
    <b>Made with ❤️ by <span style={{ color: '#00c4ff' }}> <a href="https://www.instagram.com/vortx_43" target='_blank'> Subhankar</a></span></b> 
    </div>
  </div>
</div>
      </>
    );
  }

  // 🔥 DETAIL PAGE
  if (detailItem) {
    return (
      <>
        <Navbar
          onSearch={handleSearch}
          onLoginOpen={() => setLoginOpen(true)}
          onSignupOpen={() => setSignupOpen(true)}
          onWatchlistOpen={() => setWatchlistOpen(true)}
          onNavClick={handleNavClick}
        />
        <DetailPage item={detailItem} type={detailType} onBack={closeDetail} onOpen={openDetail} />
      </>
    );
  }

  // 🔥 MAIN APP
  return (
    <>
      <Navbar
        onSearch={handleSearch}
        onLoginOpen={() => setLoginOpen(true)}
        onSignupOpen={() => setSignupOpen(true)}
        onWatchlistOpen={() => setWatchlistOpen(true)}
        onNavClick={handleNavClick}
      />

      {searchQuery ? (
        <SearchPage query={searchQuery} onOpen={openDetail} />
      ) : (
        <Routes>
          <Route path="/" element={<HomePage onOpen={openDetail} />} />
          <Route path="/movies" element={<MoviesPage onOpen={openDetail} />} />
          <Route path="/series" element={<SeriesPage onOpen={openDetail} />} />
          <Route path="*" element={<HomePage onOpen={openDetail} />} />
        </Routes>
      )}

      <WatchlistModal
        active={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        onOpen={openDetail}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}