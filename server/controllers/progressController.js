const axios = require("axios");
const Session = require("../models/Session");
const Child = require("../models/Child");

// @desc    Predict or calculate child weekly progress trend
// @route   POST /api/progress/trend
exports.getProgressTrend = async (req, res) => {
  try {
    const { childId, avg_performance_score, prior_week_avg_score, session_count, avg_engagement, level } = req.body;

    let childLevel = level || 1;
    let avgScore = typeof avg_performance_score === 'number' ? avg_performance_score : 50.0;
    let priorAvg = typeof prior_week_avg_score === 'number' ? prior_week_avg_score : 50.0;
    let sessCount = typeof session_count === 'number' ? session_count : 3;
    let avgEng = typeof avg_engagement === 'number' ? avg_engagement : 2.0;

    // If childId is provided, attempt to fetch recent sessions from MongoDB to calculate real metrics
    if (childId) {
      try {
        const child = await Child.findById(childId);
        if (child && child.level) childLevel = child.level;

        const sessions = await Session.find({ child: childId }).sort({ createdAt: -1 }).limit(10);
        if (sessions && sessions.length > 0) {
          sessCount = sessions.length;
          // Calculate score based on rating (1-5 mapped to 20-100 scale)
          const scores = sessions.map(s => (s.score ? s.score * 20 : 50));
          avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

          // Split into current week vs prior week if enough sessions exist
          if (sessions.length >= 4) {
            const half = Math.floor(sessions.length / 2);
            const recent = sessions.slice(0, half).map(s => s.score * 20);
            const previous = sessions.slice(half).map(s => s.score * 20);
            avgScore = recent.reduce((a, b) => a + b, 0) / recent.length;
            priorAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
          }
        }
      } catch (dbErr) {
        console.warn("DB session fetch fallback to body params", dbErr.message);
      }
    }

    const scoreDelta = Number((avgScore - priorAvg).toFixed(2));

    const payload = {
      avg_performance_score: Number(avgScore.toFixed(2)),
      score_delta: scoreDelta,
      session_count: sessCount,
      avg_engagement: avgEng,
      level: childLevel
    };

    // 1. Try calling the Flask ML model endpoint
    try {
      const mlRes = await axios.post("http://localhost:5001/predict-trend", payload, { timeout: 3000 });
      return res.status(200).json({
        success: true,
        trend: mlRes.data.trend,
        confidence: mlRes.data.confidence,
        score_delta: mlRes.data.score_delta,
        avg_performance_score: mlRes.data.avg_performance_score,
        trend_info: mlRes.data.trend_info,
        isFallback: false
      });
    } catch (mlErr) {
      console.log("⚠️ Flask Trend ML API unreachable, using rule-based fallback logic.");

      // 2. Fallback to rule-based weekly average comparison (-5 to +5 band)
      let trend = "Stable";
      if (scoreDelta > 5.0) {
        trend = "Improving";
      } else if (scoreDelta < -5.0) {
        trend = "Regressing";
      }

      const trend_info = {
        Improving: {
          label: 'Improving 📈',
          desc: 'Child is showing positive progress and score growth across therapy sessions.',
          color: '#166534',
          bg: '#dcfce7',
          emoji: '📈'
        },
        Stable: {
          label: 'Stable ➖',
          desc: 'Child performance is steady and maintaining expected baseline levels.',
          color: '#854d0e',
          bg: '#fef9c3',
          emoji: '➖'
        },
        Regressing: {
          label: 'Needs Focus 📉',
          desc: 'Recent performance scores have dipped. Review session difficulty and focus areas.',
          color: '#991b1b',
          bg: '#fee2e2',
          emoji: '📉'
        }
      };

      return res.status(200).json({
        success: true,
        trend,
        confidence: 85.0,
        score_delta: scoreDelta,
        avg_performance_score: Number(avgScore.toFixed(2)),
        trend_info: trend_info[trend],
        isFallback: true
      });
    }
  } catch (error) {
    console.error("Progress trend error:", error);
    res.status(500).json({ message: error.message });
  }
};
