const Child = require("../models/Child");
const Session = require("../models/Session");
const ActivityLog = require("../models/ActivityLog");
const Activity = require("../models/Activity");
const Feedback = require("../models/Feedback");
const User = require("../models/User");
const mongoose = require("mongoose");
const {
  getWeekNumber,
  calculateStreakAndMonthlyActivity,
  calculateProgressStatus,
  calculateDomainScores,
  calculateEmotionData,
} = require("../utils/progressHelpers");

/**
 * Resolves a childId that may be either:
 *  - A valid MongoDB ObjectId string (24-char hex)  → findById
 *  - A custom string childId (e.g. "child_1788342883269") → find by childId field
 * Returns the Child document or null.
 */
async function resolveChild(id) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return Child.findById(id);
  }
  return Child.findOne({ childId: id });
}

// ═════════════════════════════════════════════════════════════════════════════
// CONTROLLER HANDLERS
// ═════════════════════════════════════════════════════════════════════════════

// 1. GET /api/therapist/children
exports.getTherapistChildren = async (req, res) => {
  try {
    const therapistId = req.query.therapistId || req.user?._id;

    let query = {};
    if (therapistId) {
      if (mongoose.Types.ObjectId.isValid(therapistId)) {
        const therapist = await User.findById(therapistId);
        if (therapist) {
          const minAge = therapist.targetAgeMin || 2;
          const maxAge = therapist.targetAgeMax || 5;
          query = {
            $or: [
              { therapistId: therapist._id },
              { therapistId: String(therapist._id) },
              {
                $and: [
                  {
                    $or: [
                      { therapistId: null },
                      { therapistId: { $exists: false } },
                    ],
                  },
                  { age: { $gte: minAge, $lte: maxAge } },
                ],
              },
            ],
          };
        } else {
          query = {
            $or: [{ therapistId: therapistId }, { therapistId: null }],
          };
        }
      } else {
        query = { $or: [{ therapistId: therapistId }, { therapistId: null }] };
      }
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

        const lastDate =
          lastSession?.completedAt || lastLog?.completedAt || child.updatedAt;

        // Convert score to 1-5 star rating
        const avgScore = progress.latestAvg || (progress.hasData ? 75 : 0);
        const starRating =
          avgScore > 0
            ? Math.max(1, Math.min(5, Math.round(avgScore / 20)))
            : 0;

        // Compute 4-week score trend formatted to 5-star scale (e.g., 3.2 → 2.8 → 1.9 → 1.5)
        const weeklyScores = (progress.weekAverages || []).map((wa) => {
          if (!wa.hasData || wa.score === null) return null;
          return Math.round((wa.score / 20) * 10) / 10;
        });

        // Compute sessions done this week out of 7
        const currentWeekSessionCount =
          progress.weekAverages?.[3]?.sessionsCount ||
          (progress.hasData ? Math.min(7, streakData.currentStreak || 3) : 0);

        // Compute priority group classification
        let priorityGroup = "Priority 2 (Stable)";
        if (progress.status === "Regressing" || progress.weeksRegressing >= 2) {
          priorityGroup = "Priority 1 (Regressing)";
        } else if (progress.status === "Improving") {
          priorityGroup = "Priority 3 (Improving)";
        } else {
          priorityGroup = "Priority 2 (Stable)";
        }

        const { getAgeGroupString } = require("../seed/seedTherapists");
        const ageGroup = child.ageGroup || getAgeGroupString(child.age);

        return {
          ...child,
          ageGroup,
          level: child.level || 1,
          progressStatus: progress.status,
          weeklyAvgScore: avgScore,
          hasProgressData: progress.hasData,
          starRating,
          weeklyScores,
          sessionsDoneThisWeek: currentWeekSessionCount,
          priorityGroup,
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
      }),
    );

    res.json(results);
  } catch (error) {
    console.error("getTherapistChildren error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch therapist children" });
  }
};

// 2. GET /api/therapist/children/:childId/progress
exports.getChildProgressDetail = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const oid = child._id; // always a valid ObjectId

    const progress = await calculateProgressStatus(oid);
    const domainScores = await calculateDomainScores(oid);
    const emotionData = await calculateEmotionData(oid);
    const streakData = await calculateStreakAndMonthlyActivity(oid);

    // Fetch recent sessions
    const sessions = await Session.find({ child: oid })
      .populate("activity")
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    const logs = await ActivityLog.find({ child: oid })
      .sort({ completedAt: -1 })
      .limit(20)
      .lean();

    // Resolve activity IDs stored on the child into the real activity records.
    // The profile therefore always reflects the child's current assignments,
    // rather than a fixed set of dashboard activities.
    const activityIds = [
      ...new Set([
        ...(child.assignedTasks || []),
        ...(child.completedTasks || []),
      ]),
    ];
    const activities = activityIds.length
      ? await Activity.find({ _id: { $in: activityIds } })
          .select("title category tier duration icon color")
          .lean()
      : [];
    const activitiesById = new Map(
      activities.map((activity) => [String(activity._id), activity]),
    );
    const profileActivity = (id) => {
      const activity = activitiesById.get(String(id));
      return activity
        ? {
            _id: activity._id,
            title: activity.title,
            category: activity.category,
            tier: activity.tier,
            duration: activity.duration,
            icon: activity.icon,
            color: activity.color,
          }
        : { _id: id, title: "Therapy activity", category: "Therapy" };
    };
    const assignedActivities = (child.assignedTasks || []).map(profileActivity);
    const completedActivities = (child.completedTasks || []).map(
      profileActivity,
    );

    const badges = [
      {
        id: "first-step",
        emoji: "🌟",
        title: "First Step",
        description: "Completed a therapy activity",
        earned: completedActivities.length >= 1,
      },
      {
        id: "three-day-streak",
        emoji: "🔥",
        title: "On Fire",
        description: "3 consecutive activity days",
        earned: streakData.currentStreak >= 3,
      },
      {
        id: "week-warrior",
        emoji: "🏆",
        title: "Week Warrior",
        description: "7 consecutive activity days",
        earned: streakData.currentStreak >= 7,
      },
      {
        id: "activity-explorer",
        emoji: "🧩",
        title: "Activity Explorer",
        description: "Completed 5 activities",
        earned: completedActivities.length >= 5,
      },
    ];

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
        emotion:
          l.engagement === "High"
            ? "Happy"
            : l.engagement === "Low"
              ? "Frustrated"
              : "Neutral",
        duration: "15 min",
      })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15);

    // Generate clinical recommendation dynamically
    let clinicalRecommendation =
      "No therapy sessions recorded yet. Start activities to begin tracking progress.";
    if (progress.hasData) {
      if (progress.status === "Improving") {
        clinicalRecommendation =
          "Child is demonstrating strong mastery and joint attention. Consider advancing task complexity.";
      } else if (progress.status === "Regressing") {
        clinicalRecommendation =
          "Performance dip detected. Recommend introducing visual timer supports and sensory breaks.";
      } else {
        clinicalRecommendation =
          "Steady performance maintained within baseline. Continue current TEACCH schedule pacing.";
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
      assignedActivities,
      completedActivities,
      badges,
      certificates: completedActivities.map((activity) => ({
        id: `certificate-${activity._id}`,
        activityTitle: activity.title,
        issuedOn: child.updatedAt || child.createdAt,
      })),
      recentSessions,
      clinicalRecommendation,
    });
  } catch (error) {
    console.error("getChildProgressDetail error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch progress details" });
  }
};

function buildParentVideoScript({
  child,
  progress,
  streak,
  completedCount,
  assignedCount,
}) {
  const name = child.name || "your child";
  const statusText = progress.hasData
    ? progress.status === "Improving"
      ? "is showing encouraging progress"
      : progress.status === "Regressing"
        ? "has had a few sessions that need extra support"
        : "is maintaining a steady therapy routine"
    : "is just beginning to build a therapy record";
  const activityText = completedCount
    ? `They have completed ${completedCount} ${completedCount === 1 ? "activity" : "activities"} so far${assignedCount ? ` and have ${assignedCount} ${assignedCount === 1 ? "activity" : "activities"} ready next` : ""}.`
    : "Their first activities are ready whenever your family is comfortable starting.";

  return `Hello. Here is a short update for ${name}'s family. ${name} ${statusText}. ${activityText} ${streak > 0 ? `They currently have a ${streak}-day therapy streak.` : "Every small practice session helps build consistency."} Please celebrate effort, keep sessions calm and short, and follow your therapist's guidance. This update supports your care team and is not a medical diagnosis.`;
}

// POST /api/therapist/children/:childId/parent-video
// Creates a consented, parent-friendly D-ID avatar-video request from live child data.
exports.generateParentVideo = async (req, res) => {
  try {
    const child = await resolveChild(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found" });
    if (req.body?.parentConsent !== true) {
      return res.status(400).json({
        error: "Parent consent is required before generating a video summary.",
      });
    }

    const [progress, streakData] = await Promise.all([
      calculateProgressStatus(child._id),
      calculateStreakAndMonthlyActivity(child._id),
    ]);
    const script = buildParentVideoScript({
      child,
      progress,
      streak: streakData.currentStreak,
      completedCount: (child.completedTasks || []).length,
      assignedCount: (child.assignedTasks || []).length,
    });

    const apiKey = process.env.D_ID_API_KEY;
    const sourceUrl = process.env.D_ID_SOURCE_URL;
    const voiceId =
      (process.env.D_ID_VOICE_ID || "en-US-JennyNeural")
        .split("MONGODB_URI=")[0]
        .trim() || "en-US-JennyNeural";
    if (!apiKey || !sourceUrl) {
      return res.json({
        configured: false,
        message:
          "Video generation is not configured. Add D_ID_API_KEY and D_ID_SOURCE_URL to the server environment.",
        script,
      });
    }

    const dIdResponse = await fetch("https://api.d-id.com/talks", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source_url: sourceUrl,
        script: {
          type: "text",
          input: script,
          provider: { type: "microsoft", voice_id: voiceId },
        },
        name: `Parent update - ${child.name}`,
      }),
    });
    const result = await dIdResponse.json();
    if (!dIdResponse.ok) {
      return res.status(502).json({
        error:
          result?.description ||
          result?.message ||
          result?.error ||
          "Video provider rejected the request.",
        script,
      });
    }

    res.status(202).json({
      configured: true,
      script,
      videoId: result?.id,
      status: result?.status || "created",
    });
  } catch (error) {
    console.error("generateParentVideo error:", error);
    res
      .status(500)
      .json({ error: "Unable to create the parent video summary." });
  }
};

// GET /api/therapist/parent-video/:videoId
exports.getParentVideoStatus = async (req, res) => {
  try {
    if (!process.env.D_ID_API_KEY)
      return res
        .status(503)
        .json({ error: "Video generation is not configured." });
    const providerResponse = await fetch(
      `https://api.d-id.com/talks/${encodeURIComponent(req.params.videoId)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(process.env.D_ID_API_KEY).toString("base64")}`,
        },
      },
    );
    const result = await providerResponse.json();
    if (!providerResponse.ok)
      return res.status(502).json({
        error:
          result?.description ||
          result?.message ||
          "Unable to retrieve video status.",
      });
    res.json({
      status: result.status,
      videoUrl: result.result_url,
      thumbnailUrl: result.thumbnail_url,
    });
  } catch (error) {
    console.error("getParentVideoStatus error:", error);
    res.status(500).json({ error: "Unable to retrieve video status." });
  }
};

// 3. POST /api/therapist/feedback
exports.sendFeedback = async (req, res) => {
  try {
    const { childId, therapistId, message, type, recommendations } = req.body;

    if (!childId || !message) {
      return res
        .status(400)
        .json({ error: "childId and message are required." });
    }

    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const feedback = await Feedback.create({
      child: child._id,
      therapist: therapistId || req.user?._id || child.therapistId,
      parent: child.parentId,
      message: message.trim(),
      type: type || "general",
      recommendations: recommendations || {},
      isRead: false,
    });

    res.status(201).json({
      success: true,
      feedback,
      message: "Feedback sent to parent successfully!",
    });
  } catch (error) {
    console.error("sendFeedback error:", error);
    res.status(500).json({ error: error.message || "Failed to send feedback" });
  }
};

// 4. GET /api/therapist/feedback/:childId
exports.getFeedbackByChild = async (req, res) => {
  try {
    const { childId } = req.params;

    // Resolve custom string childId → real ObjectId
    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const feedbacks = await Feedback.find({ child: child._id })
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

    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found" });

    const previousLevel = child.level || 1;
    child.level = levelNum;
    child.supportLevel = `Level ${levelNum} - ${levelNum === 1 ? "Emerging" : levelNum === 2 ? "Developing" : "Advancing"}`;

    // Auto-rematch therapist matching child's new level & age group
    try {
      const { findBestTherapistForChild } = require("../seed/seedTherapists");
      const therapists = await User.find({ role: "therapist" });
      if (therapists.length > 0) {
        const matched = findBestTherapistForChild(
          child.age,
          levelNum,
          therapists,
        );
        if (matched && String(matched._id) !== String(child.therapistId)) {
          if (child.therapistId) {
            await User.findByIdAndUpdate(child.therapistId, {
              $pull: { assignedChildren: child._id },
            });
          }
          child.therapistId = matched._id;
          await User.findByIdAndUpdate(matched._id, {
            $addToSet: { assignedChildren: child._id },
          });
        }
      }
    } catch (rematchErr) {
      console.warn("Therapist level rematch notice:", rematchErr.message);
    }

    await child.save();

    // Log feedback message to parent about level change
    await Feedback.create({
      child: child._id,
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
    const therapistId = req.query.therapistId || req.user?._id;
    let query = {};
    if (therapistId) {
      if (mongoose.Types.ObjectId.isValid(therapistId)) {
        const therapist = await User.findById(therapistId);
        if (therapist) {
          const minAge = therapist.targetAgeMin || 2;
          const maxAge = therapist.targetAgeMax || 5;
          query = {
            $or: [
              { therapistId: therapist._id },
              { therapistId: String(therapist._id) },
              {
                $and: [
                  {
                    $or: [
                      { therapistId: null },
                      { therapistId: { $exists: false } },
                    ],
                  },
                  { age: { $gte: minAge, $lte: maxAge } },
                ],
              },
            ],
          };
        } else {
          query = {
            $or: [{ therapistId: therapistId }, { therapistId: null }],
          };
        }
      } else {
        query = { $or: [{ therapistId: therapistId }, { therapistId: null }] };
      }
    }

    const children = await Child.find(query).lean();
    const alerts = [];

    for (const child of children) {
      const progress = await calculateProgressStatus(child._id);

      // Alert 1: Regressing for 2+ weeks (Red Urgent)
      if (
        progress.hasData &&
        (progress.status === "Regressing" || progress.weeksRegressing >= 2)
      ) {
        alerts.push({
          id: `alert_reg_${child._id}`,
          type: "urgent",
          severity: "red",
          childId: child._id,
          childName: child.name,
          title: `🔴 URGENT: ${child.name} has been regressing for 2 weeks.`,
          description:
            "Immediate clinical review of therapy tasks and sensory regulation recommended.",
          actionText: "Review Now",
          createdAt: new Date(),
        });
      }
      // Alert 2: Stable for 3+ weeks (Yellow Warning)
      else if (
        progress.hasData &&
        progress.status === "Stable" &&
        progress.weeksStable >= 3
      ) {
        alerts.push({
          id: `alert_stable_${child._id}`,
          type: "warning",
          severity: "yellow",
          childId: child._id,
          childName: child.name,
          title: `⚠️ ${child.name} has been stable for 3 weeks.`,
          description:
            "Performance is plateauing. Consider introducing higher difficulty activity variations.",
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
    res.json({
      success: true,
      message: "Alert acknowledged successfully",
      alertId,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: error.message || "Failed to acknowledge alert" });
  }
};

// 8. GET /api/therapist/all (List all therapist profiles and stats)
exports.getAllTherapists = async (req, res) => {
  try {
    const therapists = await User.find({ role: "therapist" })
      .select("-password")
      .populate("assignedChildren", "name age level gender childId")
      .lean();

    res.json(therapists);
  } catch (error) {
    console.error("getAllTherapists error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to fetch therapists" });
  }
};
