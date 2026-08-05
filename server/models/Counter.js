const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 1000 },
});

const Counter = mongoose.model("Counter", counterSchema);

const getNextChildId = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "childId" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return `CHD-${counter.seq}`;
};

module.exports = { Counter, getNextChildId };
