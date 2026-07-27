import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';
import TherapistDashboard from './pages/TherapistDashboard';
import Activities from './pages/Activities';

// ── Simple SPA router ─────────────────────────────────────────────────────────
function navigate(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function getStoredUser() {
  try {
    const user = localStorage.getItem('auth_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const onNavChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onNavChange);
    return () => window.removeEventListener('popstate', onNavChange);
  }, []);

  // Sync user state on login/logout
  const handleLogin = (userData) => {
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
    navigate('/');
  };

  // Protected route logic
  useEffect(() => {
    if (!user && path !== '/') {
      navigate('/');
    }
  }, [path, user]);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    navigate(href);
  };

  let Component;
  if (!user) {
    Component = <AuthPage onLogin={handleLogin} />;
  } else {
    switch (path) {
      case '/dashboard':
        if (user.role === 'parent') Component = <ParentDashboard user={user} />;
        else if (user.role === 'therapist') Component = <TherapistDashboard user={user} />;
        else Component = <ChildDashboard user={user} />;
        break;
      case '/activities':
        Component = <Activities user={user} />;
        break;
      case '/':
        // If logged in and on root, go to dashboard
        Component = user.role === 'parent' ? <ParentDashboard user={user} /> :
                    user.role === 'therapist' ? <TherapistDashboard user={user} /> :
                    <ChildDashboard user={user} />;
        break;
      default:
        Component = <div style={{textAlign:'center', padding:'100px'}}><h2>404 - Page Not Found</h2><button onClick={()=>navigate('/dashboard')} className="btn btn-primary">Go to Dashboard</button></div>;
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ── Navigation ── */}
      <nav className="glass" style={{
        margin: '16px auto',
        padding: '12px 28px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        width: 'max-content',
        maxWidth: 'calc(100vw - 40px)',
        position: 'sticky',
        top: '16px',
        zIndex: 100,
      }}>
        {/* Brand */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, user ? '/dashboard' : '/')}
          style={{ textDecoration: 'none', fontWeight: '800', fontSize: '1.2rem', color: 'var(--primary)', display:'flex', alignItems:'center', gap:'8px' }}
        >
          🧩 <span style={{letterSpacing:'-0.5px'}}>AutismAssist</span>
        </a>

        {user && (
          <>
            <div style={{width:'1px', height:'20px', background:'var(--border)'}} />
            
            <a
              href="/dashboard"
              onClick={(e) => handleNavClick(e, '/dashboard')}
              style={{
                textDecoration: 'none',
                color: path === '/dashboard' || path === '/' ? 'var(--primary)' : 'var(--text)',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              Dashboard
            </a>
            
            <a
              href="/activities"
              onClick={(e) => handleNavClick(e, '/activities')}
              style={{
                textDecoration: 'none',
                color: path === '/activities' ? 'var(--primary)' : 'var(--text)',
                fontWeight: '600',
                fontSize: '0.95rem'
              }}
            >
              Library
            </a>

            <div style={{width:'1px', height:'20px', background:'var(--border)'}} />

            <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
              <span className={`badge badge-${user.role}`} style={{fontSize:'0.7rem'}}>{user.role}</span>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--red)',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px'
                }}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </nav>

      {/* ── Page Content ── */}
      <main style={{ flex: 1, padding: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {Component}
      </main>

      {/* ── Footer ── */}
      <footer style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        © 2026 Autism Assistant Pro · Empowering every journey. 🌟
      </footer>
    </div>
  );
}

export default App;
