const axios = require("axios");
const Assessment = require("../models/Assessment");
const Activity = require("../models/Activity");
const Child = require("../models/Child");

// @desc    Get assessment questions
// @route   GET /api/assessment/questions
exports.getQuestions = async (req, res) => {
  try {
    const questions = [
      {
        id: "q1",
        question: "Does your child respond when you call their name?",
        options: [
          "Always responds immediately",
          "Sometimes responds after calling 2-3 times",
          "Rarely responds even after multiple calls",
          "Never responds to their name",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q2",
        question: "Does your child make eye contact when talking to you?",
        options: [
          "Makes frequent and natural eye contact",
          "Makes occasional eye contact",
          "Rarely makes eye contact",
          "Never makes eye contact",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q3",
        question:
          "Does your child point to things they want or find interesting?",
        options: [
          "Yes points clearly to show and request things",
          "Sometimes points but not consistently",
          "Rarely points — mostly pulls parent by hand",
          "Never points to anything",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q4",
        question: "Does your child smile back when you smile at them?",
        options: [
          "Always smiles back immediately",
          "Sometimes smiles back",
          "Rarely smiles back",
          "Never smiles back or shows no facial response",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q5",
        question: "How does your child communicate their basic needs?",
        options: [
          "Uses full sentences to express needs clearly",
          "Uses single words or short phrases",
          "Uses gestures, pointing, or crying only",
          "Cannot communicate needs at all",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q6",
        question: "Does your child engage in pretend or imaginative play?",
        options: [
          "Yes plays pretend regularly and creatively",
          "Occasionally shows pretend play",
          "Rarely shows any imaginative play",
          "No pretend play at all",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q7",
        question: "Does your child follow simple one-step instructions?",
        options: [
          "Follows instructions immediately and correctly",
          "Follows after repeating the instruction 2-3 times",
          "Rarely follows instructions",
          "Does not follow any instructions",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q8",
        question:
          "Does your child show repetitive body movements like hand flapping, rocking, or spinning?",
        options: [
          "No repetitive movements observed",
          "Mild and occasional repetitive movements",
          "Frequent repetitive movements daily",
          "Constant repetitive movements throughout the day",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q9",
        question:
          "Does your child get very upset when daily routines or plans are changed?",
        options: [
          "Adjusts to changes easily without distress",
          "Mild distress but settles quickly",
          "Significant distress and takes long to calm down",
          "Extreme distress with any change in routine",
        ],
        scores: [0, 1, 2, 3],
      },
      {
        id: "q10",
        question:
          "How does your child react to loud sounds, bright lights, or certain textures?",
        options: [
          "Normal reaction — not bothered by them",
          "Slightly sensitive but manageable",
          "Very sensitive — avoids or cries frequently",
          "Extreme distress — covers ears, eyes, or has meltdowns",
        ],
        scores: [0, 1, 2, 3],
      },
    ];

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit assessment and get level from ML model
// @route   POST /api/assessment/submit
exports.submitAssessment = async (req, res) => {
  try {
    const { childId, scores } = req.body;

    if (!Array.isArray(scores) || scores.length !== 10) {
      return res.status(400).json({
        message: "Please provide all 10 question scores",
      });
    }

    let level = 1;
    let confidence = 100;
    let level_info = {};

    try {
      const mlResponse = await axios.post(
        "http://localhost:5001/predict-level",
        { scores },
        { timeout: 5000 },
      );
      level = mlResponse.data.level;
      confidence = mlResponse.data.confidence;
      level_info = mlResponse.data.level_info || {};
    } catch (mlError) {
      console.log("ML API not available, using rule-based scoring");
      const total = scores.reduce((a, b) => a + b, 0);
      if (total <= 10) level = 1;
      else if (total <= 20) level = 2;
      else level = 3;

      const levelMap = {
        1: {
          label: "Level 1 — Emerging",
          emoji: "🌱",
          bg: "#dcfce7",
          color: "#166534",
          desc: "Foundation activities focusing on sensory, motor, and basic communication skills.",
        },
        2: {
          label: "Level 2 — Developing",
          emoji: "🌿",
          bg: "#fef9c3",
          color: "#854d0e",
          desc: "Intermediate activities building social interaction, emotional skills, and daily life tasks.",
        },
        3: {
          label: "Level 3 — Advancing",
          emoji: "🌳",
          bg: "#fee2e2",
          color: "#991b1b",
          desc: "Advanced activities for complex social scenarios, emotional regulation, and independence.",
        },
      };
      level_info = levelMap[level];
    }

    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({ message: "Child profile not found." });
    }

    await Child.findByIdAndUpdate(childId, { level, assessmentDone: true });

    const activities = await Activity.find({
      $or: [
        { level: level },
        { levels: { $in: [level] } },
        { difficulty: level },
      ],
    }).limit(5);

    const assessment = await Assessment.create({
      child: childId,
      scores,
      totalScore: scores.reduce((a, b) => a + b, 0),
      level,
      confidence,
      completedAt: new Date(),
    });

    return res.status(200).json({
      level,
      confidence,
      level_info,
      totalScore: scores.reduce((a, b) => a + b, 0),
      assignedTasks: activities,
      assessmentId: assessment._id,
      message: `Child classified as Level ${level} with ${confidence}% confidence`,
    });
  } catch (error) {
    console.error("Assessment error:", error);
    res.status(500).json({ message: error.message });
  }
};
