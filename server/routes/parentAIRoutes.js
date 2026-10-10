const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const {
  getPreferences,
  updatePreferences,
  getPersonalizedRecommendation,
  explainSimply,
  askParentAI,
  learnInteraction,
  getPersonalizedWeeklySummary,
} = require("../controllers/parentAIController");

router.get("/preferences", verifyToken, getPreferences);
router.put("/preferences", verifyToken, updatePreferences);
router.get("/recommendation/:childId", verifyToken, getPersonalizedRecommendation);
router.post("/explain-simply", verifyToken, explainSimply);
router.post("/ask-ai", verifyToken, askParentAI);
router.post("/learn-interaction", verifyToken, learnInteraction);
router.get("/weekly-summary/:childId", verifyToken, getPersonalizedWeeklySummary);

module.exports = router;
