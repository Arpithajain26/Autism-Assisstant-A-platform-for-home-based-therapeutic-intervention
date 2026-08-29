const axios = require("axios");
const Session = require("../models/Session");
const Child = require("../models/Child");
const ActivityLog = require("../models/ActivityLog");

// @desc    Log activity completion with score and engagement
// @route   POST /api/progress/log
exports.logActivityCompletion = async (req, res) => {
  try {
    const { childId, activityId, performanceScore, engagement, notes } = req.body;

    if (!childId || !activityId || performanceScore === undefined || performanceScore === null) {
      return res.status(400).json({ error: "childId, activityId, and performanceScore are required." });
    }

    const score = Number(performanceScore);
    if (isNaN(score) || score < 0 || score > 100) {
      return res.status(400).json({ error: "performanceScore must be a number between 0 and 100." });
    }

    const validEngagement = ["Low", "Medium", "High"].includes(engagement) ? engagement : "Medium";

    const log = await ActivityLog.create({
      child: childId,
      activity: String(activityId),
      performanceScore: score,
      engagement: validEngagement,
      notes: notes || "",
      completedAt: new Date(),
    });

    res.status(201).json({ success: true, log });
  } catch (error) {
    console.error("Error logging activity completion:", error);
    res.status(500).json({ error: error.message || "Failed to log activity completion." });
  }
};

// @desc    Predict child weekly progress trend via ML model
// @route   POST /api/progress/trend
exports.getProgressTrend = async (req, res) => {
  try {
    const { childId, avg_performance_score, score_delta, session_count, avg_engagement, level } = req.body;

    let payload = {
      avg_performance_score: Number(avg_performance_score) || 50,
      score_delta: Number(score_delta) || 0,
      session_count: Number(session_count) || 3,
      avg_engagement: Number(avg_engagement) || 2,
      level: Number(level) || 1
    };

    try {
      const mlRes = await axios.post("http://localhost:5001/predict-trend", payload, { timeout: 4000 });
      return res.json(mlRes.data);
    } catch (mlErr) {
      console.log("ML API predict-trend unavailable, using rule-based scoring");
      const delta = payload.score_delta;
      let trend = "Stable";
      if (delta > 5.0) trend = "Improving";
      else if (delta < -5.0) trend = "Regressing";

      const trendMap = {
        'Improving': {
          label: 'Improving 📈',
          desc: 'Child is showing strong positive weekly growth in therapy engagement and scores.',
          color: '#166534',
          bg: '#dcfce7',
          emoji: '📈'
        },
        'Stable': {
          label: 'Stable ➖',
          desc: 'Child is maintaining steady performance within expected baseline ranges.',
          color: '#854d0e',
          bg: '#fef9c3',
          emoji: '➖'
        },
        'Regressing': {
          label: 'Needs Focus 📉',
          desc: 'Recent decrease in weekly performance scores. Consider adjusting therapy intensity or focus area.',
          color: '#991b1b',
          bg: '#fee2e2',
          emoji: '📉'
        }
      };

      return res.json({
        trend,
        confidence: 85.0,
        score_delta: delta,
        avg_performance_score: payload.avg_performance_score,
        trend_info: trendMap[trend]
      });
    }
  } catch (error) {
    console.error("Progress trend error:", error);
    res.status(500).json({ error: error.message || "Failed to calculate progress trend" });
  }
};

// @desc    Get weekly trend for a child based on ActivityLog
// @route   GET /api/progress/weekly-trend/:childId
exports.getWeeklyTrend = async (req, res) => {
  try {
    const { childId } = req.params;
    if (!childId) {
      return res.status(400).json({ error: 'childId param required' });
    }
    const now = new Date();
    const startTwoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const startLastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch logs from the last two weeks
    const logs = await ActivityLog.find({
      child: childId,
      completedAt: { $gte: startTwoWeeksAgo },
    }).lean();

    const thisWeekLogs = logs.filter(l => new Date(l.completedAt) >= startLastWeek);
    const lastWeekLogs = logs.filter(l => new Date(l.completedAt) < startLastWeek);

    const avg = arr => arr.length ? arr.reduce((s, x) => s + x.performanceScore, 0) / arr.length : null;
    const thisWeekAvg = avg(thisWeekLogs);
    const lastWeekAvg = avg(lastWeekLogs);

    if (thisWeekAvg === null || lastWeekAvg === null) {
      return res.json({
        trend: 'Not enough data',
        thisWeekAvg: thisWeekAvg !== null ? Number(thisWeekAvg.toFixed(2)) : 0,
        lastWeekAvg: lastWeekAvg !== null ? Number(lastWeekAvg.toFixed(2)) : 0,
        delta: 0,
        sessionsThisWeek: thisWeekLogs.length
      });
    }

    const delta = thisWeekAvg - lastWeekAvg;
    let trend = 'Stable';
    if (delta >= 5.0) trend = 'Improving';
    else if (delta <= -5.0) trend = 'Regressing';

    return res.json({
      trend,
      thisWeekAvg: Number(thisWeekAvg.toFixed(2)),
      lastWeekAvg: Number(lastWeekAvg.toFixed(2)),
      delta: Number(delta.toFixed(2)),
      sessionsThisWeek: thisWeekLogs.length,
    });
  } catch (err) {
    console.error('Weekly trend error:', err);
    res.status(500).json({ error: err.message || 'Failed to compute weekly trend' });
  }
};
