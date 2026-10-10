const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Child",
      required: true,
    },
    activity: {
      type: String,
      ref: "Activity",
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    performanceScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    engagement: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
