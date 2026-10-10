const mongoose = require("mongoose");

const ExamResultSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true },
    level: { type: Number, required: true },
    ageGroup: { type: Number, required: true },
    score: { type: Number, required: true }, // percentage or total score
    totalStars: { type: Number, default: 0, min: 0, max: 15 }, // 5 games x 3 stars max
    result: {
      type: String,
      enum: [
        "PASSED",
        "PARTIAL",
        "NEEDS_WORK",
        "MASTERY_ACHIEVED",
        "NEAR_MASTERY",
        "PROGRESSING",
        "NEEDS_PRACTICE"
      ],
      required: true
    },
    correct: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    timeTaken: { type: Number, default: 0 }, // seconds
    challengeMode: { type: Boolean, default: true },
    gameResults: [
      {
        gameNumber: { type: Number }, // 1 to 5
        gameId: { type: String }, // e.g. "emotion_boss", "pattern_master", etc.
        gameName: { type: String },
        skillTested: { type: String }, // emotion match, pattern completion, social scenarios, memory match, cognitive flexibility
        stars: { type: Number, default: 0, min: 0, max: 3 },
        roundsTotal: { type: Number, default: 0 },
        roundsWon: { type: Number, default: 0 },
        dominantEmotion: { type: String, default: "Happy" },
        calmDownTriggered: { type: Boolean, default: false },
        timeTaken: { type: Number, default: 0 }
      }
    ],
    domains: {
      communication: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      social: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      emotion: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      cognitive: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
      sensory: { correct: { type: Number, default: 0 }, total: { type: Number, default: 0 } },
    },
    emotionData: {
      happy: { type: Number, default: 0 },
      neutral: { type: Number, default: 0 },
      sad: { type: Number, default: 0 },
      angry: { type: Number, default: 0 },
      fearful: { type: Number, default: 0 },
    },
    recommendation: { type: String, default: "" },
    therapistNotified: { type: Boolean, default: false },
    levelUpgradeRecommended: { type: Boolean, default: false },
    answers: [
      {
        questionId: String,
        questionType: String,
        domain: String,
        childAnswer: mongoose.Schema.Types.Mixed,
        correctAnswer: mongoose.Schema.Types.Mixed,
        isCorrect: Boolean,
        timeTaken: Number,
        emotionDuringAnswer: String,
      },
    ],
    examDate: { type: Date, default: Date.now },
    nextExamDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ExamResult", ExamResultSchema);
