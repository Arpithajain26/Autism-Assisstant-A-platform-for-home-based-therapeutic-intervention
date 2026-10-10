const Message = require("../models/Message");
const Child = require("../models/Child");
const User = require("../models/User");
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

    let resolvedSender = senderId || req.user?._id;
    if (!resolvedSender || !mongoose.Types.ObjectId.isValid(resolvedSender)) {
      if (senderRole === "therapist" && child.therapistId && mongoose.Types.ObjectId.isValid(child.therapistId)) {
        resolvedSender = child.therapistId;
      } else if (child.parentId && mongoose.Types.ObjectId.isValid(child.parentId)) {
        resolvedSender = child.parentId;
      } else {
        const fallback = await User.findOne({ role: senderRole || "parent" });
        resolvedSender = fallback?._id;
      }
    }

    const newMsg = await Message.create({
      child: child._id,
      sender: resolvedSender,
      senderRole: senderRole || "parent",
      message: message.trim(),
      isRead: false,
    });

    const populated = await Message.findById(newMsg._id)
      .populate("sender", "name role email profilePhoto specialization")
      .lean();

    res.status(201).json({ success: true, message: populated || newMsg });
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: "Failed to send message: " + err.message });
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

// PATCH /api/messages/:messageId/read
exports.markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const msg = await Message.findByIdAndUpdate(messageId, { isRead: true, readAt: new Date() }, { new: true });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark message as read." });
  }
};

// PATCH /api/messages/child/:childId/read-all
exports.markAllRead = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await resolveChild(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });
    const { role } = req.body;
    const query = { child: child._id };
    if (role) {
      query.senderRole = role === "therapist" ? "parent" : "therapist";
    }
    await Message.updateMany(query, { isRead: true, readAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read." });
  }
};
