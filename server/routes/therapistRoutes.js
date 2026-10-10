const express = require("express");
const router = express.Router();
const {
  getTherapistChildren,
  getChildProgressDetail,
  sendFeedback,
  getFeedbackByChild,
  updateChildLevel,
  getTherapistAlerts,
  acknowledgeAlert,
  getAllTherapists,
  generateParentVideo,
  getParentVideoStatus,
} = require("../controllers/therapistController");

// List all therapist profiles
router.get("/all", getAllTherapists);

// Therapist child and progress endpoints
router.get("/children", getTherapistChildren);
router.get("/children/:childId/progress", getChildProgressDetail);
router.post("/children/:childId/parent-video", generateParentVideo);
router.get("/parent-video/:videoId", getParentVideoStatus);

// Feedback endpoints
router.post("/feedback", sendFeedback);
router.get("/feedback/:childId", getFeedbackByChild);

// Alerts endpoints
// GET /api/therapist/alerts/unread?therapistId=xxx&since=ISO_TIMESTAMP
// Returns only NEW alerts created after 'since' timestamp — used by real-time 30s polling
router.get("/alerts/unread", async (req, res) => {
  try {
    const { therapistId, since } = req.query;
    const sinceDate = since
      ? new Date(since)
      : new Date(Date.now() - 5 * 60 * 1000); // default: last 5 min

    const User = require("../models/User");
    const Child = require("../models/Child");
    const ExamResult = require("../models/ExamResult");

    const therapist = therapistId ? await User.findById(therapistId) : null;
    const ageQuery = therapist
      ? { age: { $gte: therapist.targetAgeMin || 2, $lte: therapist.targetAgeMax || 5 } }
      : {};
    const children = await Child.find(ageQuery).lean();
    const childIds = children.map((c) => c._id);

    // Find new exam results since the 'since' timestamp
    const newExams = await ExamResult.find({
      child: { $in: childIds },
      createdAt: { $gt: sinceDate },
    })
      .populate("child", "name age level")
      .lean();

    const alerts = newExams.map((exam) => ({
      id: exam._id,
      type: exam.passedExam ? "exam_passed" : "exam_failed",
      childName: exam.child?.name || "Child",
      score: exam.score,
      message: exam.passedExam
        ? `🎉 ${exam.child?.name} PASSED the Mastery Exam with ${exam.score}% — Ready for level upgrade!`
        : `⚠️ ${exam.child?.name} scored ${exam.score}% on Mastery Exam — Needs your attention`,
      createdAt: exam.createdAt,
      childId: exam.child?._id,
    }));

    res.json({ alerts, count: alerts.length, checkedAt: new Date().toISOString() });
  } catch (err) {
    console.error("Unread alerts error:", err);
    res.status(500).json({ error: "Failed to fetch unread alerts", alerts: [] });
  }
});

router.get("/alerts", getTherapistAlerts);
router.post("/acknowledge-alert", acknowledgeAlert);

// Level update endpoint
router.put("/children/:childId/level", updateChildLevel);

module.exports = router;
