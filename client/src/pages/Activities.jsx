import React, { useEffect, useState } from 'react';
import { getActivities, getRecommendations, assignTask } from '../services/api';

const Activities = ({ user }) => {
  const [activities, setActivities] = useState([]);
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const [assigning, setAssigning] = useState('');

  const loadAll = async () => {
    setLoading(true);
    // If it's a child, only show their level. Otherwise show all.
    const level = user?.role === 'child' ? user.level : null;
    const data = await getActivities(level);
    setActivities(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, [user]);

  const handleSuggest = async () => {
    if (!focusArea.trim()) return;
    setLoading(true);
    setIsFiltered(true);
    const level = user?.role === 'child' ? user.level : null;
    const data = await getRecommendations(level, focusArea);
    if (data && Array.isArray(data.recommended_activities)) {
      setActivities(data.recommended_activities);
    }
    setLoading(false);
  };

  const handleReset = () => {
    setFocusArea('');
    setIsFiltered(false);
    loadAll();
  };

  return (
    <div className="fade-in">
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '12px', color: 'var(--primary)' }}>
          Therapy Library 📚
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto' }}>
          Explore our expert-curated activities for different development stages.
        </p>
      </header>

      {/* AI Search Panel */}
      <div className="glass" style={{
        padding: '28px',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <input
            className="input"
            type="text"
            placeholder="Search focus: Speech, Motor, Social..."
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSuggest}
          disabled={loading || !focusArea.trim()}
        >
          {loading && isFiltered ? '⏳ Thinking...' : '🤖 AI Suggest'}
        </button>
        {isFiltered && (
          <button className="btn btn-ghost" onClick={handleReset}>Reset</button>
        )}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: '700', fontSize: '1.4rem' }}>
            {isFiltered ? `🔍 Results for "${focusArea}"` : '📚 All Activities'}
            {user?.role === 'child' && ` (Level ${user.level})`}
          </h2>
        </div>

        {loading && !isFiltered ? (
          <div style={{ textAlign: 'center', padding: '60px' }}><span className="spinner" style={{ width: 36, height: 36 }} /></div>
        ) : activities.length > 0 ? (
          <div className="grid-3">
            {activities.map((act) => (
              <div key={act._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <span className={`badge badge-${act.level}`}>{act.difficulty}</span>
                  <span className="badge badge-category">{act.category}</span>
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '10px' }}>{act.title}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', marginBottom: '20px', flex: 1, fontSize: '0.9rem' }}>
                  {act.description}
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px' }}>⏱ {act.duration}</div>
                <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                  View Full Guide
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No activities found.</p>
            <button className="btn btn-primary" onClick={handleReset}>Clear Search</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
