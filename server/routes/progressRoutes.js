const express = require("express");
const router = express.Router();
const { getProgressTrend } = require("../controllers/progressController");
const { verifyToken } = require("../middleware/auth");

// POST /api/progress/trend
// Body: { childId, avg_performance_score, prior_week_avg_score, session_count, avg_engagement, level }
router.post("/trend", verifyToken, getProgressTrend);

module.exports = router;
