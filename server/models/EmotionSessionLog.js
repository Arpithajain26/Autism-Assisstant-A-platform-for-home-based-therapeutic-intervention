const mongoose = require("mongoose");

const EmotionSessionLogSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true },
    sessionId: { type: String, required: true },
    activityId: { type: String },
    activityTitle: { type: String },
    durationMins: { type: Number, default: 0 },
    emotionPerMinute: [
      {
        minute: { type: Number },
        dominant: { type: String }
      }
    ],
    interventionCount: { type: Number, default: 0 },
    happinessGamesTriggered: [{ type: Number }], // array of game IDs (1-8)
    interventions: [
      {
        trigger: String,
        gameId: Number,
        durationSecs: Number,
        resolved: Boolean,
        time: Date
      }
    ],
    endEmotionState: { type: String, default: "Neutral" },
    activitiesCausingNegative: [{ type: String }],
    bestHappinessGames: [{ type: Number }], // games that resolved negative emotion
    recoveryTimeSeconds: { type: Number, default: 0 },
    scoreHistory: [
      {
        score: Number,
        time: Date
      }
    ],
    recommendationFlags: {
      removeActivityFromPlan: { type: Boolean, default: false },
      flaggedToTherapist: { type: Boolean, default: false },
      preferredHappinessGameOrder: [{ type: Number }]
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmotionSessionLog", EmotionSessionLogSchema);
