const express = require("express");
const router = express.Router();
const {
  getQuestions,
  submitAssessment,
} = require("../controllers/assessmentController");

router.get("/questions", getQuestions);
router.post("/submit", submitAssessment);

module.exports = router;
