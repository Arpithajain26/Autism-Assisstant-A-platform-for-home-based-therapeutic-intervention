import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const fetchRecs = async () => {
      const data = await getRecommendations();
      if (data && data.recommended_activities) {
        setRecommendations(data.recommended_activities);
      }
    };
    fetchRecs();
  }, []);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '8px' }}>Hello, Parent! 👋</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Here is your child's progress summary and tailored activities.</p>
      </header>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
        <div className="glass-card" style={{ borderLeft: '6px solid var(--primary-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Weekly Progress</h3>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--primary-color)' }}>85%</div>
          <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Activity completion rate up 5% from last week.</p>
        </div>
        <div className="glass-card" style={{ borderLeft: '6px solid var(--accent-color)' }}>
          <h3 style={{ marginBottom: '16px' }}>Focus Areas</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className="badge badge-category" style={{ margin: 0 }}>Communication</span>
            <span className="badge badge-category" style={{ margin: 0, background: '#ffedd5', color: '#9a3412' }}>Motor Skills</span>
          </div>
        </div>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontWeight: '700' }}>AI Recommended Activities</h2>
          <a href="/activities" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600', fontSize: '0.9rem' }}>View All →</a>
        </div>
        
        {recommendations.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {recommendations.map(activity => (
              <div key={activity._id} className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className={`badge badge-${activity.difficulty.toLowerCase()}`}>{activity.difficulty}</span>
                  <span className="badge badge-category">{activity.category}</span>
                </div>
                <h4 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '12px' }}>{activity.title}</h4>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.6', marginBottom: '20px' }}>{activity.description}</p>
                <button className="btn-primary" style={{ width: '100%', padding: '10px' }}>Start Activity</button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-light)' }}>Analyzing your child's data to find the best recommendations...</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
