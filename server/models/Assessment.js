const mongoose = require("mongoose");

const assessmentSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    scores: [{ type: Number, required: true }],
    totalScore: { type: Number, required: true },
    level: { type: Number, required: true },
    confidence: { type: Number, default: 0 },
    completedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Assessment", assessmentSchema);
