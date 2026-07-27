import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get stored user name
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('auth_user')); } catch { return null; }
  })();
  const userName = user?.name ? user.name.split(' ')[0] : 'Parent';

  useEffect(() => {
    const fetchRecs = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getRecommendations();
        setRecommendations(data.recommended_activities || []);
      } catch {
        setError('Could not load recommendations. Is the server running?');
      } finally {
        setLoading(false);
      }
    };
    fetchRecs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/';
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>
            Hello, {userName}! 👋
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-light)' }}>
            Here is your child's progress summary and tailored activities.
          </p>
        </div>
        <button
          id="logout-btn"
          onClick={handleLogout}
          style={{
            padding: '8px 20px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: 'white',
            cursor: 'pointer',
            fontWeight: '600',
            color: 'var(--text-light)',
            fontSize: '0.9rem',
          }}
        >
          Log Out
        </button>
      </header>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ borderLeft: '5px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Weekly Progress</h3>
          <div style={{ fontSize: '2.8rem', fontWeight: '700', color: 'var(--primary-color)', lineHeight: 1 }}>85%</div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginTop: '8px' }}>Activity completion rate — up 5% from last week 📈</p>
        </div>
        <div className="glass-card" style={{ borderLeft: '5px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sessions This Week</h3>
          <div style={{ fontSize: '2.8rem', fontWeight: '700', color: 'var(--accent-color)', lineHeight: 1 }}>6</div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.88rem', marginTop: '8px' }}>Completed out of 7 planned sessions 🎯</p>
        </div>
        <div className="glass-card" style={{ borderLeft: '5px solid #10b981' }}>
          <h3 style={{ marginBottom: '12px', color: 'var(--text-light)', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus Areas</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
            <span className="badge badge-category" style={{ margin: 0 }}>Communication</span>
            <span className="badge badge-category" style={{ margin: 0, background: '#ffedd5', color: '#9a3412' }}>Motor Skills</span>
            <span className="badge badge-category" style={{ margin: 0, background: '#dcfce7', color: '#166534' }}>Social</span>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: '700', fontSize: '1.4rem' }}>✨ AI Recommended Activities</h2>
          <a id="view-all-link" href="/activities" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>
            View All →
          </a>
        </div>

        {loading ? (
          <div className="glass-panel" style={{ padding: '50px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⏳</div>
            <p style={{ color: 'var(--text-light)' }}>Fetching personalized recommendations...</p>
          </div>
        ) : error ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
            <p style={{ color: '#991b1b' }}>{error}</p>
            <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : recommendations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {recommendations.map((activity) => {
              const diff = (activity.difficulty || 'beginner').toLowerCase();
              return (
                <div key={activity._id} className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className={`badge badge-${diff}`}>{activity.difficulty}</span>
                    <span className="badge badge-category">{activity.category}</span>
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px' }}>{activity.title}</h4>
                  <p style={{ color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '20px', fontSize: '0.95rem' }}>
                    {activity.description}
                  </p>
                  <button
                    id={`start-activity-${activity._id}`}
                    className="btn-primary"
                    style={{ width: '100%', padding: '10px' }}
                    onClick={() => window.location.href = '/activities'}
                  >
                    Start Activity
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>No recommendations available right now.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
