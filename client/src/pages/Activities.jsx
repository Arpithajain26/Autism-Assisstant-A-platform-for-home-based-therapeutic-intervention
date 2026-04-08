import React, { useEffect, useState } from 'react';
import { getActivities, getRecommendations } from '../services/api';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [focusArea, setFocusArea] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const data = await getActivities();
      setActivities(data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleSuggest = async () => {
    setLoading(true);
    const data = await getRecommendations(focusArea);
    if (data && data.recommended_activities) {
        setActivities(data.recommended_activities);
    }
    setLoading(false);
  }

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '12px' }}>Explore Therapy Activities</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', maxWidth: '700px', margin: '0 auto' }}>
          Browse our curated library of home-based activities or use our AI to get personalized suggestions.
        </p>
      </header>
      
      <div className="glass-panel" style={{ 
        padding: '30px', 
        marginBottom: '40px', 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: '16px', 
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ flex: '1', minWidth: '300px' }}>
          <input 
            className="input-glass"
            type="text" 
            placeholder="Focus area (e.g. Speech, Motor Skills, Social interaction)" 
            value={focusArea}
            onChange={(e) => setFocusArea(e.target.value)}
          />
        </div>
        <button 
          className="btn-primary" 
          onClick={handleSuggest}
          disabled={loading}
          style={{ padding: '12px 30px' }}
        >
          {loading ? 'Thinking...' : 'Get AI Suggestions'}
        </button>
      </div>

      <div>
        <h2 style={{ marginBottom: '24px', fontWeight: '700' }}>Available Activities</h2>
        
        {activities.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {activities.map(act => (
              <div key={act._id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <span className={`badge badge-${act.difficulty.toLowerCase()}`}>{act.difficulty}</span>
                  <span className="badge badge-category">{act.category}</span>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '12px' }}>{act.title}</h3>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '24px', flex: 1 }}>{act.description}</p>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn-primary" style={{ flex: 1, padding: '10px' }}>View Guide</button>
                  <button style={{ 
                    padding: '10px', 
                    borderRadius: '8px', 
                    border: '1px solid #d1d5db', 
                    background: 'white', 
                    cursor: 'pointer' 
                  }}>
                    ❤️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            {loading ? (
              <p style={{ color: 'var(--text-light)' }}>Fetching the best activities for you...</p>
            ) : (
              <div>
                <p style={{ color: 'var(--text-light)', marginBottom: '16px' }}>No activities found for this criteria.</p>
                <button className="btn-primary" onClick={() => window.location.reload()}>Reset Filter</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Activities;
