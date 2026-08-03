const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["parent", "child", "therapist"],
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    age: { type: Number },
    level: { type: Number, default: null }, // 1, 2, or 3
    assessmentDone: { type: Boolean, default: false },
    assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Activity" }],
    completedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Activity" }],
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    children: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    specialization: { type: String },
    assignedChildren: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
