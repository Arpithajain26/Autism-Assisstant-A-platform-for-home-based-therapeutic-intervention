const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const MessageSchema = new Schema({
  child: { type: Types.ObjectId, ref: 'Child', required: true },
  sender: { type: Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['parent', 'therapist'], required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);
