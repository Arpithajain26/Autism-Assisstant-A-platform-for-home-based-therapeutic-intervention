const express = require('express');
const router = express.Router();
const { 
  getActivities, 
  createActivity, 
  getRecommendations 
} = require('../controllers/activityController');

// @route   GET /api/activities/recommendations
// Placed before /:id (if any) to prevent it from being treated as an id
router.get('/recommendations', getRecommendations);

// @route   GET /api/activities
router.get('/', getActivities);

// @route   POST /api/activities
router.post('/', createActivity);

module.exports = router;
