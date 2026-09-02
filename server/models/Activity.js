const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    title: { type: String, required: true },
    titleKn: { type: String, default: "" },
    ageGroup: { type: String, default: "2-5" }, // "2-5", "5-8", "9-12"
    level: { type: Number, required: true }, // 1, 2, 3
    tier: { type: String, default: "Beginner" },
    category: { type: String, required: true },
    categoryKn: { type: String, default: "" },
    therapyPrinciple: { type: String, default: "" },
    icon: { type: String, default: "🧩" },
    color: { type: String, default: "#6366f1" },
    bg: { type: String, default: "#eef2ff" },
    difficulty: { type: String, default: "Beginner" },
    duration: { type: String, required: true },
    durationKn: { type: String, default: "" },
    xp: { type: Number, default: 50 },
    stars: { type: Number, default: 3 },
    materials: { type: String, default: "" },
    materialsKn: { type: String, default: "" },
    description: { type: String, required: true },
    descriptionKn: { type: String, default: "" },
    steps: [{ type: String }],
    instructions: [
      {
        en: { type: String },
        kn: { type: String },
      },
    ],
    goalSkills: [{ type: String }],
    focusAreas: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);
