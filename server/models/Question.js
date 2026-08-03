const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  scores: [{ type: Number, required: true }]
});

module.exports = mongoose.model('Question', questionSchema);