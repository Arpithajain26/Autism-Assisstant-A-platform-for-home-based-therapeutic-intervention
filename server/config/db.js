const mongoose = require("mongoose");
const User = require("../models/User");
const Child = require("../models/Child");
const Activity = require("../models/Activity");
const Question = require("../models/Question");

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

// ── Seed Data ─────────────────────────────────────────────────────────────────
const initialActivities = [
  // LEVEL 1 (Beginner)
  {
    _id: "a1",
    title: "Mirror Play",
    level: 1,
    difficulty: "Beginner",
    category: "Communication",
    duration: "10 min",
    focusAreas: ["communication", "emotions", "self-awareness"],
    description:
      "Child makes facial expressions in front of a mirror while parent names each emotion. Builds emotional recognition and self-awareness.",
    steps: [
      "Set up a large mirror at child's eye level",
      "Parent demonstrates a happy face",
      "Child mirrors the expression",
      "Name the emotion out loud",
      "Repeat with 5 different emotions",
    ],
    goalSkills: ["Emotion recognition", "Imitation", "Eye contact"],
  },
  {
    _id: "a2",
    title: "Sorting Shapes",
    level: 1,
    difficulty: "Beginner",
    category: "Motor Skills",
    duration: "15 min",
    focusAreas: ["motor skills", "cognitive", "focus"],
    description:
      "Use colorful shape blocks. Child sorts by color and type, building fine motor skills, pattern recognition, and focus.",
    steps: [
      "Place 3 containers labeled with shapes",
      "Mix 12 colorful blocks on the table",
      "Child picks each block and places in correct bucket",
      "Count together after sorting",
      "Try again with time challenge",
    ],
    goalSkills: ["Fine motor control", "Pattern recognition", "Concentration"],
  },
  {
    _id: "a3",
    title: "Name That Sound",
    level: 1,
    difficulty: "Beginner",
    category: "Sensory",
    duration: "10 min",
    focusAreas: ["sensory", "speech", "cognitive"],
    description:
      "Play recordings of everyday sounds. Child identifies each sound, training auditory processing and vocabulary.",
    steps: [
      "Prepare 5 sound clips (bell, rain, dog, phone, clapping)",
      "Play each sound",
      "Child points to matching picture card",
      "Say the word together",
      "Try animal sounds next",
    ],
    goalSkills: ["Auditory processing", "Vocabulary", "Attention"],
  },
  {
    _id: "a4",
    title: "Bubble Popping",
    level: 1,
    difficulty: "Beginner",
    category: "Sensory",
    duration: "10 min",
    focusAreas: ["sensory", "motor skills", "focus"],
    description:
      "Blow bubbles and have child pop them with one finger. Develops eye-hand coordination and sensory exploration.",
    steps: [
      "Blow a stream of bubbles",
      "Ask child to pop ONE bubble at a time",
      "Count pops together",
      "Try popping with nose, elbow for fun",
      "Blow bubbles toward a target",
    ],
    goalSkills: ["Eye-hand coordination", "Tracking", "Turn-taking"],
  },
  {
    _id: "a5",
    title: "Playdough Sculpting",
    level: 1,
    difficulty: "Beginner",
    category: "Motor Skills",
    duration: "20 min",
    focusAreas: ["motor skills", "focus", "creative"],
    description:
      "Guide child to roll, pinch, and shape playdough. Strengthens hand muscles and encourages creativity.",
    steps: [
      "Prepare playdough in 3 colors",
      "Show how to roll a snake shape",
      "Make a ball and flatten it",
      "Create a simple face together",
      "Child makes their own free creation",
    ],
    goalSkills: ["Finger strength", "Bilateral coordination", "Creativity"],
  },
  // LEVEL 2 (Intermediate)
  {
    _id: "b1",
    title: "Emotion Flashcards",
    level: 2,
    difficulty: "Intermediate",
    category: "Social",
    duration: "15 min",
    focusAreas: ["social interaction", "communication", "emotional"],
    description:
      "Show illustrated emotion cards. Child names the emotion, describes when they feel it, and acts it out.",
    steps: [
      "Lay out 8 emotion cards",
      'Pick one card — ask "what emotion is this?"',
      'Ask "when do you feel this?"',
      "Child acts it out",
      "Role-play a scenario causing that emotion",
    ],
    goalSkills: ["Emotional vocabulary", "Self-expression", "Empathy"],
  },
  {
    _id: "b2",
    title: "Story Sequencing",
    level: 2,
    difficulty: "Intermediate",
    category: "Communication",
    duration: "20 min",
    focusAreas: ["speech", "communication", "cognitive"],
    description:
      "Present picture cards telling a simple story. Child arranges them in order and narrates what happens.",
    steps: [
      "Shuffle 5 picture cards from a story",
      "Let child arrange them in order",
      "Ask child to tell the story out loud",
      'Ask "what happens next?"',
      "Create an alternate ending",
    ],
    goalSkills: ["Narrative skills", "Language sequencing", "Memory"],
  },
  {
    _id: "b3",
    title: "Turn-Taking Board Game",
    level: 2,
    difficulty: "Intermediate",
    category: "Social",
    duration: "25 min",
    focusAreas: ["social interaction", "cognitive", "emotional"],
    description:
      "Play a simple board game. Teaches taking turns, following rules, and handling winning/losing gracefully.",
    steps: [
      "Set up Snakes & Ladders or similar",
      "Explain turn-taking rules",
      "Each player announces their roll",
      "Celebrate both winning and losing moments",
      'Debrief: "How did it feel when you...?"',
    ],
    goalSkills: ["Turn-taking", "Rule-following", "Emotional regulation"],
  },
  {
    _id: "b4",
    title: "Balloon Tapping",
    level: 2,
    difficulty: "Intermediate",
    category: "Motor Skills",
    duration: "15 min",
    focusAreas: ["motor skills", "coordination", "focus"],
    description:
      "Keep a balloon in the air by tapping it. Develops bilateral coordination, tracking, and turn-taking.",
    steps: [
      "Inflate a balloon",
      "Tap it gently to keep it airborne",
      "Count the taps without letting it fall",
      "Add a rule: only use left hand",
      "Play two-person cooperative version",
    ],
    goalSkills: ["Gross motor", "Bilateral coordination", "Cooperation"],
  },
  {
    _id: "b5",
    title: "Simple Cooking Together",
    level: 2,
    difficulty: "Intermediate",
    category: "Life Skills",
    duration: "30 min",
    focusAreas: ["life skills", "motor skills", "communication", "focus"],
    description:
      "Make a simple no-cook recipe (sandwich, fruit salad). Teaches sequencing, fine motor skills, and following instructions.",
    steps: [
      "Choose a 3-ingredient recipe",
      "Read recipe steps together",
      "Child performs each step with guidance",
      "Name ingredients and utensils",
      "Eat and celebrate together",
    ],
    goalSkills: ["Following instructions", "Sequencing", "Independence"],
  },
  // LEVEL 3 (Advanced)
  {
    _id: "c1",
    title: "Role Play Scenarios",
    level: 3,
    difficulty: "Advanced",
    category: "Social",
    duration: "30 min",
    focusAreas: ["social interaction", "communication", "confidence"],
    description:
      "Act out real-world scenarios (ordering food, greeting a friend). Reinforces social scripts for real interactions.",
    steps: [
      "Choose a scenario: at the store",
      "Set up props (fake items)",
      "Parent plays shopkeeper",
      "Child orders and pays",
      "Switch roles and debrief what went well",
    ],
    goalSkills: ["Social scripts", "Confidence", "Perspective-taking"],
  },
  {
    _id: "c2",
    title: "Obstacle Course",
    level: 3,
    difficulty: "Advanced",
    category: "Motor Skills",
    duration: "20 min",
    focusAreas: ["motor skills", "coordination", "confidence"],
    description:
      "Set up an indoor path with pillows, tunnels, step targets. Child navigates and develops gross motor skills.",
    steps: [
      "Design course with 5 stations",
      "Walk through once to demonstrate",
      "Child completes timed run",
      "Add verbal instructions mid-course",
      "Have child design next course",
    ],
    goalSkills: [
      "Body awareness",
      "Following complex instructions",
      "Confidence",
    ],
  },
  {
    _id: "c3",
    title: "Peer Play Date",
    level: 3,
    difficulty: "Advanced",
    category: "Social",
    duration: "45 min",
    focusAreas: ["social interaction", "emotional", "communication"],
    description:
      "Structured play with a peer. Practices sharing, conflict resolution, and maintaining conversation.",
    steps: [
      "Invite one familiar peer",
      "Set up structured activity (lego, art)",
      "Parent observes from distance",
      "Prompt conversation starters if needed",
      "Debrief feelings after",
    ],
    goalSkills: ["Peer interaction", "Sharing", "Conflict resolution"],
  },
  {
    _id: "c4",
    title: "Feelings Journal",
    level: 3,
    difficulty: "Advanced",
    category: "Emotional",
    duration: "15 min",
    focusAreas: ["emotional", "communication", "cognitive"],
    description:
      "Child draws or writes about their day and feelings. Builds introspection, self-regulation, and communication.",
    steps: [
      "Provide a dedicated journal",
      'Ask "What was the best part of today?"',
      "Draw or write 3 emotions felt today",
      "On a scale of 1-10, how was your day?",
      "Share one thing with parent",
    ],
    goalSkills: ["Self-reflection", "Emotional regulation", "Written expression"],
  },
  {
    _id: "c5",
    title: "Community Helper Interview",
    level: 3,
    difficulty: "Advanced",
    category: "Social",
    duration: "30 min",
    focusAreas: [
      "social interaction",
      "communication",
      "confidence",
      "cognitive",
    ],
    description:
      "Child prepares 5 questions, interviews a family member or friend. Builds conversation initiation and listening skills.",
    steps: [
      "Brainstorm 5 interview questions",
      "Practice asking questions aloud",
      "Conduct the interview (phone or in-person)",
      "Draw or write what was learned",
      "Share learnings at dinner",
    ],
    goalSkills: ["Initiation", "Active listening", "Question formation"],
  },
];

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
    const actCount = await Activity.countDocuments();
    if (actCount === 0) {
      await Activity.insertMany(initialActivities);
      console.log("✅ Seeded activities into MongoDB");
    }

    const qCount = await Question.countDocuments();
    if (qCount === 0) {
      await Question.insertMany(initialQuestions);
      console.log("✅ Seeded assessment questions into MongoDB");
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const parent = new User({
        name: "Alex Johnson",
        email: "parent@example.com",
        password: "password123",
        role: "parent",
        phone: "+1 555-0192",
      });
      await parent.save();

      const therapist = new User({
        name: "Dr. Sarah Patel",
        email: "therapist@example.com",
        password: "password123",
        role: "therapist",
        specialization: "ABA & Pediatric Speech Therapy",
      });
      await therapist.save();

      const child = new Child({
        name: "Timmy Johnson",
        age: 6,
        gender: "male",
        parentId: parent._id,
        therapistId: therapist._id,
        level: 2,
        assessmentDone: true,
        assignedTasks: ["b1", "b2", "b3"],
        completedTasks: ["a1", "a2"],
      });
      await child.save();

      parent.children.push(child._id);
      await parent.save();

      therapist.assignedChildren.push(child._id);
      await therapist.save();

      console.log("✅ Seeded demo Parent, Therapist, and Child");
      console.log("   parent@example.com / password123");
      console.log("   therapist@example.com / password123");
    }
  } catch (err) {
    console.error("❌ Seed error:", err.message);
  }
};

module.exports = { connectDB, seedDB };
