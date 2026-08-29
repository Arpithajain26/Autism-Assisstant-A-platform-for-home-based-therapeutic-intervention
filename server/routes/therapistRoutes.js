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
} = require("../controllers/therapistController");

// Therapist child and progress endpoints
router.get("/children", getTherapistChildren);
router.get("/children/:childId/progress", getChildProgressDetail);

// Feedback endpoints
router.post("/feedback", sendFeedback);
router.get("/feedback/:childId", getFeedbackByChild);

// Alerts endpoints
router.get("/alerts", getTherapistAlerts);
router.post("/acknowledge-alert", acknowledgeAlert);

// Level update endpoint
router.put("/children/:childId/level", updateChildLevel);

module.exports = router;
