const express = require("express");
const router = express.Router();
const { getProgressTrend, logActivityCompletion, getWeeklyTrend, getLeaderboard } = require("../controllers/progressController");
const { verifyToken } = require("../middleware/auth");

// GET /api/progress/leaderboard
router.get("/leaderboard", getLeaderboard);

// POST /api/progress/log
// Body: { childId, activityId, performanceScore, engagement, notes }
router.post("/log", logActivityCompletion);

// POST /api/progress/trend
// Body: { childId, avg_performance_score, prior_week_avg_score, session_count, avg_engagement, level }
router.post("/trend", verifyToken, getProgressTrend);

// GET /api/progress/weekly-trend/:childId
router.get('/weekly-trend/:childId', getWeeklyTrend);

module.exports = router;
