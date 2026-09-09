const Message = require("../models/Message");
const Child = require("../models/Child");
const mongoose = require("mongoose");

async function resolveChild(id) {
  if (mongoose.Types.ObjectId.isValid(id)) return Child.findById(id);
  return Child.findOne({ childId: id });
}

// POST /api/messages/send
exports.sendMessage = async (req, res) => {
  try {
    const { childId, senderId, senderRole, message } = req.body;
    if (!childId || !message || !message.trim()) {
      return res.status(400).json({ error: "childId and message are required." });
    }

    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    const newMsg = await Message.create({
      child: child._id,
      sender: senderId || req.user?._id || child.parentId || child.therapistId,
      senderRole: senderRole || "parent",
      message: message.trim(),
      isRead: false,
    });

    res.status(201).json({ success: true, message: newMsg });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Failed to send message." });
  }
};

// GET /api/messages/:childId
exports.getMessages = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    const messages = await Message.find({ child: child._id })
      .populate("sender", "name role email profilePhoto specialization")
      .sort({ createdAt: 1 })
      .lean();

    res.json(messages);
  } catch (err) {
    console.error("getMessages error:", err);
    res.status(500).json({ error: "Failed to load messages." });
  }
};
