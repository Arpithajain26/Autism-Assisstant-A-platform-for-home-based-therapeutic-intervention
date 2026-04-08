import React, { useEffect, useState } from 'react';
import { getActivities, getRecommendations } from '../services/api';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [focusArea, setFocusArea] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      const data = await getActivities();
      setActivities(data);
    };
    fetchAll();
  }, []);

  const handleSuggest = async () => {
    const data = await getRecommendations(focusArea);
    if (data && data.recommended_activities) {
        setActivities(data.recommended_activities);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Therapy Activities</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="Enter focus area (e.g. Communication)" 
          value={focusArea}
          onChange={(e) => setFocusArea(e.target.value)}
          style={{ padding: '8px', marginRight: '10px' }}
        />
        <button onClick={handleSuggest} style={{ padding: '8px 15px', cursor: 'pointer' }}>
          Get AI Suggestions
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {activities.length > 0 ? activities.map(act => (
          <div key={act._id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
            <h3>{act.title}</h3>
            <p style={{ color: '#555' }}>Difficulty: {act.difficulty}</p>
            <p>{act.description}</p>
          </div>
        )) : (
          <p>No activities found.</p>
        )}
      </div>
    </div>
  );
};

export default Activities;
