const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    level: { type: Number, required: true }, // 1, 2, 3
    difficulty: { type: String, required: true },
    duration: { type: String, required: true },
    description: { type: String, required: true },
    steps: [{ type: String }],
    goalSkills: [{ type: String }],
    focusAreas: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Activity", activitySchema);
