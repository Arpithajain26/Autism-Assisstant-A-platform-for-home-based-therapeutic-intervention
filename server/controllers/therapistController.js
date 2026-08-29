const Child = require("../models/Child");
const Session = require("../models/Session");
const ActivityLog = require("../models/ActivityLog");
const Activity = require("../models/Activity");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const {
  getWeekNumber,
  calculateStreakAndMonthlyActivity,
  calculateProgressStatus,
  calculateDomainScores,
  calculateEmotionData,
} = require("../utils/progressHelpers");

// ═════════════════════════════════════════════════════════════════════════════
// CONTROLLER HANDLERS
// ═════════════════════════════════════════════════════════════════════════════

// 1. GET /api/therapist/children
exports.getTherapistChildren = async (req, res) => {
  try {
    const therapistId = req.user?._id || req.query.therapistId;

    let query = {};
    if (therapistId) {
      query = { $or: [{ therapistId: therapistId }, { therapistId: null }] };
    }

    const children = await Child.find(query).sort({ updatedAt: -1 }).lean();

    const results = await Promise.all(
      children.map(async (child) => {
        const progress = await calculateProgressStatus(child._id);
        const emotion = await calculateEmotionData(child._id);
        const streakData = await calculateStreakAndMonthlyActivity(child._id);

        const lastSession = await Session.findOne({ child: child._id })
          .sort({ completedAt: -1 })
          .lean();

        const lastLog = await ActivityLog.findOne({ child: child._id })
          .sort({ completedAt: -1 })
          .lean();

        const lastDate = lastSession?.completedAt || lastLog?.completedAt || child.updatedAt;

        // Convert score to 1-5 star rating
        const avgScore = progress.latestAvg || (progress.hasData ? 75 : 0);
        const starRating = avgScore > 0 ? Math.max(1, Math.min(5, Math.round(avgScore / 20))) : 0;

        return {
          ...child,
          level: child.level || 1,
          progressStatus: progress.status,
          weeklyAvgScore: avgScore,
          hasProgressData: progress.hasData,
          starRating,
          dominantEmotion: emotion.dominant,
          lastSessionDate: lastDate,
          weeksRegressing: progress.weeksRegressing,
          weeksStable: progress.weeksStable,
          diff: progress.diff,
          streak: streakData.currentStreak,
          longestStreak: streakData.longestStreak,
          totalActiveDays: streakData.totalActiveDays,
          monthCalendar: streakData.monthCalendar,
        };
      })
    );

    res.json(results);
  } catch (error) {
    console.error("getTherapistChildren error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch therapist children" });
  }
};

// 2. GET /api/therapist/children/:childId/progress
exports.getChildProgressDetail = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ error: "Child not found" });

    const progress = await calculateProgressStatus(childId);
    const domainScores = await calculateDomainScores(childId);
    const emotionData = await calculateEmotionData(childId);
    const streakData = await calculateStreakAndMonthlyActivity(childId);

    // Fetch recent sessions
    const sessions = await Session.find({ child: childId })
      .populate("activity")
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    const logs = await ActivityLog.find({ child: childId })
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    const recentSessions = [
      ...sessions.map((s) => ({
        _id: s._id,
        date: s.completedAt || s.createdAt,
        activityName: s.activity?.title || "Therapeutic Activity",
        score: s.score <= 5 ? s.score : Math.round(s.score / 20),
        performanceScore: s.score <= 5 ? s.score * 20 : s.score,
        emotion: s.emotion || "Happy",
        duration: s.duration ? `${s.duration} min` : "15 min",
      })),
      ...logs.map((l) => ({
        _id: l._id,
        date: l.completedAt || l.createdAt,
        activityName: String(l.activity) || "ABA Structured Task",
        score: Math.max(1, Math.min(5, Math.round(l.performanceScore / 20))),
        performanceScore: l.performanceScore,
        emotion: l.engagement === "High" ? "Happy" : l.engagement === "Low" ? "Frustrated" : "Neutral",
        duration: "15 min",
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    // Generate clinical recommendation dynamically
    let clinicalRecommendation = "No therapy sessions recorded yet. Start activities to begin tracking progress.";
    if (progress.hasData) {
      if (progress.status === "Improving") {
        clinicalRecommendation = "Child is demonstrating strong mastery and joint attention. Consider advancing task complexity.";
      } else if (progress.status === "Regressing") {
        clinicalRecommendation = "Performance dip detected. Recommend introducing visual timer supports and sensory breaks.";
      } else {
        clinicalRecommendation = "Steady performance maintained within baseline. Continue current TEACCH schedule pacing.";
      }
    }

    res.json({
      child,
      progressStatus: progress.status,
      aiPrediction: progress.status,
      hasProgressData: progress.hasData,
      weeklyScoreTrend: progress.weekAverages,
      domainScores,
      emotionDistribution: emotionData.distribution,
      dominantEmotion: emotionData.dominant,
      hasEmotionData: emotionData.hasData,
      streak: streakData.currentStreak,
      longestStreak: streakData.longestStreak,
      totalActiveDays: streakData.totalActiveDays,
      monthCalendar: streakData.monthCalendar,
      recentSessions,
      clinicalRecommendation,
    });
  } catch (error) {
    console.error("getChildProgressDetail error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch progress details" });
  }
};

// 3. POST /api/therapist/feedback
exports.sendFeedback = async (req, res) => {
  try {
    const { childId, therapistId, message, type, recommendations } = req.body;

    if (!childId || !message) {
      return res.status(400).json({ error: "childId and message are required." });
    }

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const feedback = await Feedback.create({
      child: childId,
      therapist: therapistId || req.user?._id || child.therapistId,
      parent: child.parentId,
      message: message.trim(),
      type: type || "general",
      recommendations: recommendations || {},
      isRead: false,
    });

    res.status(201).json({ success: true, feedback, message: "Feedback sent to parent successfully!" });
  } catch (error) {
    console.error("sendFeedback error:", error);
    res.status(500).json({ error: error.message || "Failed to send feedback" });
  }
};

// 4. GET /api/therapist/feedback/:childId
exports.getFeedbackByChild = async (req, res) => {
  try {
    const { childId } = req.params;
    const feedbacks = await Feedback.find({ child: childId })
      .populate("therapist", "name specialization email")
      .sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    console.error("getFeedbackByChild error:", error);
    res.status(500).json({ error: error.message || "Failed to load feedback" });
  }
};

// 5. PUT /api/children/:childId/level
exports.updateChildLevel = async (req, res) => {
  try {
    const { childId } = req.params;
    const { newLevel, reason, therapistId } = req.body;

    const levelNum = parseInt(newLevel);
    if (![1, 2, 3].includes(levelNum)) {
      return res.status(400).json({ error: "newLevel must be 1, 2, or 3" });
    }

    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const previousLevel = child.level || 1;
    child.level = levelNum;
    child.supportLevel = `Level ${levelNum} - ${levelNum === 1 ? "Emerging" : levelNum === 2 ? "Developing" : "Advancing"}`;
    await child.save();

    // Log feedback message to parent about level change
    await Feedback.create({
      child: childId,
      therapist: therapistId || req.user?._id || child.therapistId,
      parent: child.parentId,
      type: "level_change",
      message: `🎯 Support level adjusted from Level ${previousLevel} to Level ${levelNum}. Reason: ${reason || "Clinical evaluation by therapist."}`,
      isRead: false,
    });

    res.json({
      success: true,
      message: `Child level successfully updated to Level ${levelNum}`,
      child,
    });
  } catch (error) {
    console.error("updateChildLevel error:", error);
    res.status(500).json({ error: error.message || "Failed to update level" });
  }
};

// 6. GET /api/therapist/alerts
exports.getTherapistAlerts = async (req, res) => {
  try {
    const therapistId = req.user?._id || req.query.therapistId;
    let query = {};
    if (therapistId) {
      query = { $or: [{ therapistId: therapistId }, { therapistId: null }] };
    }

    const children = await Child.find(query).lean();
    const alerts = [];

    for (const child of children) {
      const progress = await calculateProgressStatus(child._id);

      // Alert 1: Regressing for 2+ weeks (Red Urgent)
      if (progress.hasData && (progress.status === "Regressing" || progress.weeksRegressing >= 2)) {
        alerts.push({
          id: `alert_reg_${child._id}`,
          type: "urgent",
          severity: "red",
          childId: child._id,
          childName: child.name,
          title: `🔴 URGENT: ${child.name} has been regressing for 2 weeks.`,
          description: "Immediate clinical review of therapy tasks and sensory regulation recommended.",
          actionText: "Review Now",
          createdAt: new Date(),
        });
      }
      // Alert 2: Stable for 3+ weeks (Yellow Warning)
      else if (progress.hasData && progress.status === "Stable" && progress.weeksStable >= 3) {
        alerts.push({
          id: `alert_stable_${child._id}`,
          type: "warning",
          severity: "yellow",
          childId: child._id,
          childName: child.name,
          title: `⚠️ ${child.name} has been stable for 3 weeks.`,
          description: "Performance is plateauing. Consider introducing higher difficulty activity variations.",
          actionText: "Review",
          createdAt: new Date(),
        });
      }
    }

    res.json(alerts);
  } catch (error) {
    console.error("getTherapistAlerts error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch alerts" });
  }
};

// 7. POST /api/therapist/acknowledge-alert
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { alertId, childId, action } = req.body;
    res.json({ success: true, message: "Alert acknowledged successfully", alertId });
  } catch (error) {
    res.status(500).json({ error: error.message || "Failed to acknowledge alert" });
  }
};

// 8. GET /api/therapist/all (List all 6 therapists with profiles and stats)
exports.getAllTherapists = async (req, res) => {
  try {
    const therapists = await User.find({ role: "therapist" })
      .select("-password")
      .populate("assignedChildren", "name age level gender childId")
      .lean();

    res.json(therapists);
  } catch (error) {
    console.error("getAllTherapists error:", error);
    res.status(500).json({ error: error.message || "Failed to fetch therapists" });
  }
};
