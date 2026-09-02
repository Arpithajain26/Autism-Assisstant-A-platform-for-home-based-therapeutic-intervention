const mongoose = require("mongoose");
const User = require("../models/User");
const Child = require("../models/Child");
const Activity = require("../models/Activity");
const Question = require("../models/Question");
const { CURATED_ACTIVITIES } = require("../data/curatedActivities");

const connectDB = async () => {
  // If already connected, skip
  if (mongoose.connection.readyState === 1) {
    console.log("🍃 MongoDB already connected.");
    return;
  }

  const uri = process.env.MONGODB_URI;

  // Try Atlas first
  if (uri) {
    try {
      console.log("🍃 Connecting to MongoDB Atlas...");
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 45000,
      });
      console.log(`🍃 MongoDB Atlas Connected: ${mongoose.connection.host}`);
      await seedDB();
      return;
    } catch (error) {
      console.warn(`⚠️ Atlas connection failed: ${error.message}`);
    }
  }

  // Try local MongoDB
  try {
    const localUri = "mongodb://127.0.0.1:27017/autism_assistant";
    console.log("🍃 Connecting to local MongoDB...");
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`🍃 Local MongoDB Connected: ${mongoose.connection.host}`);
    await seedDB();
    return;
  } catch (error) {
    console.warn(`⚠️ Local MongoDB connection failed: ${error.message}`);
  }

  // In-memory MongoDB fallback (dev only)
  try {
    console.log("🍃 Starting In-Memory MongoDB fallback...");
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`🍃 In-Memory MongoDB Connected at ${mongoUri}`);
    console.warn(
      "⚠️  WARNING: Using in-memory DB. Data will NOT persist after restart."
    );
    await seedDB();
  } catch (err) {
    console.error("❌ All MongoDB connection attempts failed:", err.message);
    process.exit(1);
  }
};

// ── Handle unexpected disconnects ─────────────────────────────────────────────
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️ MongoDB disconnected.");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// ── Seed Data Questions ───────────────────────────────────────────────────────
const initialQuestions = [
  {
    id: 1,
    question: "Can your child make eye contact when spoken to?",
    options: [
      "Rarely or never",
      "Sometimes (needs prompting)",
      "Usually yes",
      "Yes, consistently",
    ],
    scores: [1, 2, 3, 4],
  },
  {
    id: 2,
    question: "How does your child communicate their needs?",
    options: [
      "Points or uses gestures only",
      "Uses 1-2 word phrases",
      "Uses short sentences (3-5 words)",
      "Uses full sentences clearly",
    ],
    scores: [1, 2, 3, 4],
  },
  {
    id: 3,
    question: "How does your child respond to their name?",
    options: [
      "Does not respond",
      "Responds some of the time",
      "Usually responds",
      "Always responds immediately",
    ],
    scores: [1, 2, 3, 4],
  },
  {
    id: 4,
    question: "Can your child dress themselves (buttons, zippers)?",
    options: [
      "Needs full assistance",
      "Can do simple items with help",
      "Can do most with minimal help",
      "Fully independent",
    ],
    scores: [1, 2, 3, 4],
  },
  {
    id: 5,
    question: "How does your child interact with other children?",
    options: [
      "Avoids interaction",
      "Observes but rarely joins",
      "Joins with adult support",
      "Initiates and plays cooperatively",
    ],
    scores: [1, 2, 3, 4],
  },
  {
    id: 6,
    question:
      'Can your child follow a 2-step instruction (e.g., "get your bag and put on shoes")?',
    options: [
      "Cannot follow instructions",
      "Follows 1 step only",
      "Follows 2 steps with reminders",
      "Follows 2-step instructions easily",
    ],
    scores: [1, 2, 3, 4],
  },
];

const seedDB = async () => {
  try {
    // 1. Sync all 45 Curated Activities into MongoDB
    for (const act of CURATED_ACTIVITIES) {
      await Activity.updateOne(
        { _id: act._id },
        {
          $set: {
            title: act.title,
            titleKn: act.titleKn || "",
            ageGroup: act.ageGroup || "2-5",
            level: act.level,
            tier: act.tier || "Beginner",
            category: act.category,
            categoryKn: act.categoryKn || "",
            therapyPrinciple: act.therapyPrinciple || "",
            icon: act.icon || "🧩",
            color: act.color || "#6366f1",
            bg: act.bg || "#eef2ff",
            difficulty: act.tier || "Beginner",
            duration: act.duration,
            durationKn: act.durationKn || "",
            xp: act.xp || 50,
            stars: act.stars || 3,
            materials: act.materials || "",
            materialsKn: act.materialsKn || "",
            description: act.description,
            descriptionKn: act.descriptionKn || "",
            steps: (act.instructions || []).map((ins) => (typeof ins === "string" ? ins : ins.en || ins.kn)),
            instructions: act.instructions || [],
            goalSkills: [act.category, act.therapyPrinciple].filter(Boolean),
            focusAreas: [act.category, act.tier].filter(Boolean),
          },
        },
        { upsert: true }
      );
    }

    // Delete legacy mock activities (a1, a2, b1, etc.) not in CURATED_ACTIVITIES
    const curatedIds = CURATED_ACTIVITIES.map((a) => a._id);
    await Activity.deleteMany({ _id: { $nin: curatedIds } });
    console.log(`✅ Seeded ${CURATED_ACTIVITIES.length} Curated Therapy Activities into MongoDB (replaces all legacy activities)`);

    // 2. Seed Assessment Questions
    const qCount = await Question.countDocuments();
    if (qCount === 0) {
      await Question.insertMany(initialQuestions);
      console.log("✅ Seeded assessment questions into MongoDB");
    }

    // 3. Update any children whose assigned/completed tasks contain old IDs (a1, b1, etc.)
    const childrenToUpdate = await Child.find({});
    for (const ch of childrenToUpdate) {
      let changed = false;
      const validAssigned = (ch.assignedTasks || []).filter((id) => curatedIds.includes(id));
      const validCompleted = (ch.completedTasks || []).filter((id) => curatedIds.includes(id));

      // If empty after removing legacy IDs, assign curated activities matching their level
      if (validAssigned.length === 0) {
        const matchingCurated = CURATED_ACTIVITIES.filter((a) => a.level === (ch.level || 1)).slice(0, 3);
        ch.assignedTasks = matchingCurated.map((a) => a._id);
        changed = true;
      } else if (validAssigned.length !== (ch.assignedTasks || []).length) {
        ch.assignedTasks = validAssigned;
        changed = true;
      }

      if (validCompleted.length !== (ch.completedTasks || []).length) {
        ch.completedTasks = validCompleted;
        changed = true;
      }

      if (changed) {
        await ch.save();
      }
    }
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

module.exports = { connectDB, seedDB };
