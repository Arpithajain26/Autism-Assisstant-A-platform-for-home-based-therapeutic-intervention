export const getActivities = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/activities');
    return await response.json();
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
};

export const getRecommendations = async (focusArea) => {
  try {
    const url = focusArea 
      ? `http://localhost:5000/api/activities/recommendations?focusArea=${focusArea}`
      : `http://localhost:5000/api/activities/recommendations`;
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return { recommended_activities: [] };
  }
};
