const Activity = require('../models/Activity');

// @desc    Get all activities
// @route   GET /api/activities
exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Create a new activity
// @route   POST /api/activities
exports.createActivity = async (req, res) => {
  try {
    const { title, description, category, difficulty } = req.body;
    
    // Create new activity
    const newActivity = new Activity({
      title,
      description,
      category,
      difficulty
    });

    await newActivity.save();
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create activity', error: error.message });
  }
};

// @desc    Simple AI Recommendation Logic
// @route   GET /api/activities/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    // Basic Rule-Based AI Logic
    // For a working prototype, we can take a query param 'focusArea' 
    // and match it with activity categories to suggest related activities.
    const { focusArea } = req.query; // e.g. "Communication", "Motor Skills"
    
    let recommendations = [];
    
    if (focusArea) {
      // Suggest activities in the requested focus area (case-insensitive regex match)
      recommendations = await Activity.find({ category: new RegExp(focusArea, 'i') }).limit(3);
    } 
    
    // Fallback: If not enough activities or no focus area provided, suggest general activities
    if (recommendations.length === 0) {
      recommendations = await Activity.find().limit(3);
    }

    res.status(200).json({
      message: "Here are the recommended activities based on your child's needs.",
      recommended_activities: recommendations
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recommendations', error: error.message });
  }
};
