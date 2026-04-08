import React, { useEffect, useState } from 'react';
import { getRecommendations } from '../services/api';

const Dashboard = () => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    // Fetch default recommendations
    const fetchRecs = async () => {
      const data = await getRecommendations();
      if (data && data.recommended_activities) {
        setRecommendations(data.recommended_activities);
      }
    };
    fetchRecs();
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Welcome to your Dashboard</h2>
      <p>Track your child's progress and view daily tasks here.</p>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Today's Recommended Activities</h3>
        {recommendations.length > 0 ? (
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {recommendations.map(activity => (
              <li key={activity._id} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '15px', borderRadius: '5px' }}>
                <h4>{activity.title} <span style={{ fontSize: '12px', color: '#666' }}>({activity.category})</span></h4>
                <p>{activity.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading recommendations...</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
