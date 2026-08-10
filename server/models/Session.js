const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  child: { type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  score: { type: Number, min: 1, max: 5, required: true },
  emotion: { type: String },
  confidence: { type: Number },
  duration: { type: mongoose.Schema.Types.Mixed },
  week: { type: Number },
  completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
