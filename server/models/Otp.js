const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 300, // MongoDB automatically deletes this document after 5 minutes (300 seconds)
    },
  },
  { timestamps: false }
);

module.exports = mongoose.model("Otp", otpSchema);
