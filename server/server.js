require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./config/db");
const User = require("./models/User");
const Child = require("./models/Child");
const Activity = require("./models/Activity");
const Question = require("./models/Question");
const { verifyToken, makeToken } = require("./middleware/auth");

// Connect to MongoDB
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // Increased body limit for base64 photo uploads

// ── Helpers ───────────────────────────────────────────────────────────────────
const safeUser = (u) => {
  const obj = u.toObject ? u.toObject() : u;
  const { password, ...rest } = obj;
  return rest;
};

// Compute level from assessment score (out of 24 max)
const computeLevel = (answers) => {
  const total = answers.reduce((sum, a) => sum + a, 0);
  if (total <= 10) return 1; // Beginner
  if (total <= 18) return 2; // Intermediate
  return 3; // Advanced
};

// Auto-assign top 3 tasks for a level
const autoAssignTasks = async (level) => {
  const acts = await Activity.find({ level }).limit(3);
  return acts.map((a) => a._id);
};

// Generate 6-character random link code
const generateLinkCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) =>
  res.json({ status: "ok", message: "🚀 Autism Assistant API running with MongoDB" })
);

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { role, name, email, password, phone, specialization } = req.body;

    if (!role || !name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Role, name, email, and password are required." });
    }

    if (!["parent", "therapist"].includes(role)) {
      return res.status(400).json({
        error: "Invalid role. Children cannot register directly with credentials.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const newUser = new User({
      role,
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      specialization: specialization || (role === "therapist" ? "General" : ""),
    });

    await newUser.save();
    const token = makeToken(newUser._id, newUser.role);
    res.status(201).json({ token, user: safeUser(newUser) });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ error: "Server error during registration." });
  }
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = makeToken(user._id, user.role);
    res.json({ token, user: safeUser(user) });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Server error during login." });
  }
});

// GET /api/auth/me (token check)
app.get("/api/auth/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found." });
    res.json({ user: safeUser(user) });
  } catch (error) {
    res.status(500).json({ error: "Server error." });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// CHILDREN MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/children/create  (Parent or Therapist creates child profile)
app.post("/api/children/create", async (req, res) => {
  try {
    const { parentId, therapistId, name, age, gender, profilePhoto, supportLevel } = req.body;

    if (!name || !age) {
      return res.status(400).json({ error: "Child's name and age are required." });
    }

    const newChild = new Child({
      name,
      age: parseInt(age),
      gender: gender || "male",
      profilePhoto: profilePhoto || null,
      supportLevel: supportLevel || null,
      parentId: parentId || null,
      therapistId: therapistId || null,
    });

    // If created by therapist without parentId, generate link code
    if (!parentId && therapistId) {
      newChild.linkCode = generateLinkCode();
    }

    await newChild.save();

    // Link child ID to Parent doc if parentId exists
    if (parentId) {
      await User.findByIdAndUpdate(parentId, { $addToSet: { children: newChild._id } });
    }

    // Link child ID to Therapist doc if therapistId exists
    if (therapistId) {
      await User.findByIdAndUpdate(therapistId, { $addToSet: { assignedChildren: newChild._id } });
    }

    res.status(201).json({ success: true, child: newChild });
  } catch (error) {
    console.error("Create Child Error:", error);
    res.status(500).json({ error: "Failed to create child profile." });
  }
});

// GET /api/children/:userId  (Fetch all children linked to parent or therapist)
app.get("/api/children/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ error: "User not found." });

    let childQuery = {};
    if (user.role === "parent") {
      childQuery = { parentId: user._id };
    } else if (user.role === "therapist") {
      childQuery = { therapistId: user._id };
    }

    const children = await Child.find(childQuery);
    const allActivities = await Activity.find();

    const populatedChildren = children.map((c) => {
      const cObj = c.toObject();
      return {
        ...cObj,
        assignedActivities: (c.assignedTasks || [])
          .map((tid) => allActivities.find((a) => String(a._id) === String(tid)))
          .filter(Boolean),
        completedActivities: (c.completedTasks || [])
          .map((tid) => allActivities.find((a) => String(a._id) === String(tid)))
          .filter(Boolean),
      };
    });

    res.json(populatedChildren);
  } catch (error) {
    console.error("Get Children Error:", error);
    res.status(500).json({ error: "Failed to fetch children." });
  }
});

// DELETE /api/children/:childId (Delete child profile)
app.delete("/api/children/:childId", async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    if (child.parentId) {
      await User.findByIdAndUpdate(child.parentId, { $pull: { children: child._id } });
    }
    if (child.therapistId) {
      await User.findByIdAndUpdate(child.therapistId, { $pull: { assignedChildren: child._id } });
    }

    await Child.findByIdAndDelete(req.params.childId);
    res.json({ success: true, message: "Child profile removed." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete child." });
  }
});

// POST /api/children/generate-link-code (Therapist generates 6-digit link code)
app.post("/api/children/generate-link-code", async (req, res) => {
  try {
    const { childId } = req.body;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    const linkCode = generateLinkCode();
    child.linkCode = linkCode;
    await child.save();

    res.json({ success: true, linkCode });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate link code." });
  }
});

// POST /api/children/link-by-code (Parent links child profile using 6-digit code)
app.post("/api/children/link-by-code", async (req, res) => {
  try {
    const { parentId, code } = req.body;
    if (!parentId || !code) {
      return res.status(400).json({ error: "Parent ID and Link Code required." });
    }

    const child = await Child.findOne({ linkCode: code.toUpperCase().trim() });
    if (!child) {
      return res.status(404).json({ error: "Invalid Link Code. Please check and try again." });
    }

    child.parentId = parentId;
    child.linkCode = null; // Clear code once linked
    await child.save();

    await User.findByIdAndUpdate(parentId, { $addToSet: { children: child._id } });

    res.json({ success: true, message: `Successfully linked ${child.name}!`, child });
  } catch (error) {
    res.status(500).json({ error: "Failed to link child profile." });
  }
});

// GET /api/child/:childId/tasks  (Child therapy view)
app.get("/api/child/:childId/tasks", async (req, res) => {
  try {
    const child = await Child.findById(req.params.childId);
    if (!child) return res.status(404).json({ error: "Child profile not found." });

    const allActivities = await Activity.find();

    const assigned = (child.assignedTasks || [])
      .map((id) => allActivities.find((a) => String(a._id) === String(id)))
      .filter(Boolean);
    const completed = (child.completedTasks || [])
      .map((id) => allActivities.find((a) => String(a._id) === String(id)))
      .filter(Boolean);

    res.json({
      _id: child._id,
      childId: child.childId,
      name: child.name,
      age: child.age,
      level: child.level,
      assessmentDone: child.assessmentDone,
      assigned,
      completed,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch child tasks." });
  }
});

// POST /api/children/assign-task  { childId, activityId }
app.post("/api/children/assign-task", async (req, res) => {
  try {
    const { childId, activityId } = req.body;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    if (!child.assignedTasks.includes(activityId)) {
      child.assignedTasks.push(activityId);
      await child.save();
    }

    res.json({ success: true, assignedTasks: child.assignedTasks });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign task." });
  }
});

// POST /api/children/complete-task  { childId, activityId }
app.post("/api/children/complete-task", async (req, res) => {
  try {
    const { childId, activityId } = req.body;
    const child = await Child.findById(childId);
    if (!child) return res.status(404).json({ error: "Child not found." });

    child.assignedTasks = child.assignedTasks.filter((id) => id !== activityId);
    if (!child.completedTasks.includes(activityId)) {
      child.completedTasks.push(activityId);
    }
    await child.save();

    res.json({ success: true, completedTasks: child.completedTasks });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete task." });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ASSESSMENT
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/assessment/questions
app.get("/api/assessment/questions", async (_req, res) => {
  try {
    const questions = await Question.find().sort({ id: 1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assessment questions." });
  }
});

// POST /api/assessment/submit  { childId, answers: [score, score, ...] }
app.post("/api/assessment/submit", async (req, res) => {
  try {
    const { childId, answers } = req.body;
    if (!childId || !Array.isArray(answers)) {
      return res.status(400).json({ error: "childId and answers array required." });
    }

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ error: "Child profile not found." });
    }

    const level = computeLevel(answers);
    const assignedTasks = await autoAssignTasks(level);

    child.level = level;
    child.assessmentDone = true;
    child.assignedTasks = assignedTasks;
    await child.save();

    res.json({
      level,
      levelLabel: ["", "Beginner", "Intermediate", "Advanced"][level],
      assignedTasks: child.assignedTasks,
      message: `Level ${level} identified! Tasks have been assigned.`,
    });
  } catch (error) {
    console.error("Assessment Error:", error);
    res.status(500).json({ error: "Failed to submit assessment." });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ACTIVITIES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/activities?level=1
app.get("/api/activities", async (req, res) => {
  try {
    const { level } = req.query;
    const query = level ? { level: parseInt(level) } : {};
    const result = await Activity.find(query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activities." });
  }
});

// GET /api/activities/recommendations?level=2&focusArea=speech
app.get("/api/activities/recommendations", async (req, res) => {
  try {
    const { level, focusArea } = req.query;
    let query = {};
    if (level) query.level = parseInt(level);

    let result = await Activity.find(query);

    if (focusArea && focusArea.trim()) {
      const kw = focusArea.trim().toLowerCase();
      const filtered = result.filter(
        (a) =>
          a.focusAreas.some((f) => f.toLowerCase().includes(kw)) ||
          a.title.toLowerCase().includes(kw) ||
          a.category.toLowerCase().includes(kw) ||
          a.description.toLowerCase().includes(kw)
      );
      result = filtered.length > 0 ? filtered : result.slice(0, 3);
    } else {
      result = [...result].sort(() => Math.random() - 0.5).slice(0, 4);
    }

    res.json({ recommended_activities: result.slice(0, 6) });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch recommendations." });
  }
});

// GET /api/activities/:id
app.get("/api/activities/:id", async (req, res) => {
  try {
    const act = await Activity.findById(req.params.id);
    if (!act) return res.status(404).json({ error: "Activity not found." });
    res.json(act);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity." });
  }
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ error: `${req.method} ${req.url} not found` })
);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅  Server → http://localhost:${PORT}`);
    console.log(`   POST /api/auth/register | /api/auth/login`);
    console.log(`   POST /api/children/create | GET /api/children/:userId`);
    console.log(`   GET  /api/assessment/questions`);
  });
}

module.exports = app;
