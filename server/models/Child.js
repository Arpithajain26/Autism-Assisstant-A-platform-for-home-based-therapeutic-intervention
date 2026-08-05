const mongoose = require("mongoose");
const { getNextChildId } = require("./Counter");

const childSchema = new mongoose.Schema(
  {
    childId: { type: String, unique: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female", "other"], default: "male" },
    profilePhoto: { type: String, default: null }, // base64 or URL
    supportLevel: { type: String, default: null }, // Level 1 / Level 2 / Level 3
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    therapistId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    level: { type: Number, default: null }, // assessment level (1, 2, 3)
    assessmentDone: { type: Boolean, default: false },
    assignedTasks: [{ type: String }],
    completedTasks: [{ type: String }],
    linkCode: { type: String, default: null },
  },
  { timestamps: true }
);

childSchema.pre("save", async function (next) {
  if (!this.childId) {
    try {
      this.childId = await getNextChildId();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model("Child", childSchema);
