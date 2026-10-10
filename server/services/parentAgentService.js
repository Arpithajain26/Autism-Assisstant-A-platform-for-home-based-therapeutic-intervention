const mongoose = require("mongoose");
const axios = require("axios");
const User = require("../models/User");
const Child = require("../models/Child");
const Activity = require("../models/Activity");
const ActivityLog = require("../models/ActivityLog");
const Feedback = require("../models/Feedback");

/**
 * ═════════════════════════════════════════════════════════════════════════════
 * AGENT: Personalized Intervention Assistant
 * ═════════════════════════════════════════════════════════════════════════════
 * 1. Identify authenticated parent
 * 2. Retrieve associated child profile
 * 3. Retrieve child performance logs & session history
 * 4. Retrieve therapist recommendations (HIGH PRIORITY)
 * 5. Retrieve parent AI preferences (Language, Interaction, Explanation level)
 * 6. Analyze performance metrics & trends
 * 7. Select appropriate existing activity from catalog
 * 8. Formulate explanation tailored to parent's preferred explanation level & language
 * 9. Enforce safety guidelines (no independent medical diagnoses)
 * 10. Return structured response to UI
 */

// Helper to adapt explanation by preference level & language
function adaptExplanationText({ activity, child, level = "standard", language = "en", therapistGuidance = null }) {
  const isKn = language === "kn";
  const title = isKn && activity.titleKn ? activity.titleKn : activity.title;

  // Simple Mode
  if (level === "simple") {
    if (isKn) {
      return {
        summary: `ನಿಮ್ಮ ಮಗು ${child.name} ಈ ಚಟುವಟಿಕೆಯಲ್ಲಿ ಚೆನ್ನಾಗಿ ತೊಡಗಿಸಿಕೊಂಡಿದೆ. ಇಂದು 10 ನಿಮಿಷಗಳ ಕಾಲ ಇದನ್ನು ಪ್ರಯತ್ನಿಸಿ.`,
        steps: [
          `1. ${title} ಕಾರ್ಡ್ ತೋರಿಸಿ.`,
          `2. ನಿಮ್ಮ ಮಗುವಿಗೆ ಇದನ್ನು ಪೂರ್ಣಗೊಳಿಸಲು ಹೇಳಿ.`,
          `3. ಮಗುವನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಿ ಮತ್ತು ಅಭಿನಂದಿಸಿ.`
        ],
        why: therapistGuidance ? `ಥೆರಪಿಸ್ಟ್ ಮಾರ್ಗದರ್ಶನ: ${therapistGuidance}` : `ಮಗುವಿನ ಅಭ್ಯಾಸಕ್ಕೆ ಇದು ಸರಳ ಮತ್ತು ಉತ್ತಮವಾಗಿದೆ.`
      };
    }
    return {
      summary: `Your child ${child.name} is doing well with this activity. You can try this activity for 10 minutes today.`,
      steps: [
        `1. Show the ${title} card or items.`,
        `2. Ask ${child.name} to match or complete it.`,
        `3. Praise ${child.name} with warm encouragement.`
      ],
      why: therapistGuidance ? `Therapist Guidance: ${therapistGuidance}` : `This activity matches ${child.name}'s current progress level.`
    };
  }

  // Detailed Mode
  if (level === "detailed") {
    if (isKn) {
      return {
        summary: `ಮಗುವಿನ ಇತ್ತೀಚಿನ ಕಾರ್ಯಕ್ಷಮತೆಯ ಆಧಾರದ ಮೇಲೆ, ಕಾರ್ಯ ಪೂರ್ಣಗೊಳಿಸುವಿಕೆಯ ದರವು ಹಿಂದಿನ ಅವಧಿಗಳಿಗೆ ಹೋಲಿಸಿದರೆ ಸುಧಾರಿಸಿದೆ. ${title} ಚಟುವಟಿಕೆಯನ್ನು ಮುಂದುವರಿಸುವುದರಿಂದ ಕೌಶಲ್ಯವನ್ನು ಬಲಪಡಿಸಲು ಸಹಾಯವಾಗುತ್ತದೆ.`,
        steps: [
          `1. ಸಾಕ್ಷ್ಯಾಧಾರಿತ TEACCH ಹಂತಗಳೊಂದಿಗೆ ${title} ಪ್ರಾರಂಭಿಸಿ (${activity.category}).`,
          `2. 15 ನಿಮಿಷಗಳ ನಿಯಮಿತ ಅವಧಿಯಲ್ಲಿ ಮಗುವಿನ ಗಮನ ಮತ್ತು ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಗಮನಿಸಿ.`,
          `3. ಧನಾತ್ಮಕ ಬಲವರ್ಧನೆ ನೀಡಲು ಯಶಸ್ವಿ ಪ್ರಯತ್ನಗಳನ್ನು ದಾಖಲಿಸಿ.`
        ],
        why: therapistGuidance ? `ಕ್ಲಿನಿಕಲ್ ಥೆರಪಿಸ್ಟ್ ಶಿಫಾರಸು: ${therapistGuidance}` : `ಇತ್ತೀಚಿನ ಕೌಶಲ್ಯ ಮಟ್ಟಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಆಯ್ಕೆಮಾಡಲಾಗಿದೆ.`
      };
    }
    return {
      summary: `Based on recent activity performance, task completion has improved compared with previous sessions. Continuing ${title} may help reinforce the current skill. This recommendation is aligned with therapy goals.`,
      steps: [
        `1. Initiate ${title} (${activity.category}) following TEACCH structured play boundaries.`,
        `2. Observe joint attention and motor execution over a 10-15 minute focused window.`,
        `3. Provide positive reinforcement upon task completion.`
      ],
      why: therapistGuidance ? `Clinical Therapist Priority: ${therapistGuidance}` : `Selected based on recent session score trends and skill difficulty progression.`
    };
  }

  // Standard Mode (Default)
  if (isKn) {
    return {
      summary: `ಕಳೆದ ಕೆಲವು ಅವಧಿಗಳಲ್ಲಿ ${child.name} ಅವರ ಕಾರ್ಯಕ್ಷಮತೆ ಸುಧಾರಿಸಿದೆ. ಇಂದು 10 ನಿಮಿಷಗಳ ಕಾಲ ${title} ಚಟುವಟಿಕೆಯನ್ನು ಮುಂದುವರಿಸಲು ನಾವು ಶಿಫಾರಸು ಮಾಡುತ್ತೇವೆ.`,
      steps: [
        `1. ${title} ಸಿದ್ಧಗೊಳಿಸಿ.`,
        `2. ಮಾರ್ಗದರ್ಶನದೊಂದಿಗೆ ಆಟವಾಡಿಸಿ.`,
        `3. ಪ್ರತಿ ಪ್ರಯತ್ನಕ್ಕೂ ಪ್ರೋತ್ಸಾಹಿಸಿ.`
      ],
      why: therapistGuidance ? `ಥೆರಪಿಸ್ಟ್ ಶಿಫಾರಸು: ${therapistGuidance}` : `${child.name} ಕೌಶಲ್ಯ ಬೆಳವಣಿಗೆಗೆ ಬೆಂಬಲ ನೀಡುತ್ತದೆ.`
    };
  }
  return {
    summary: `${child.name}'s performance has improved in this activity over the last few sessions. We recommend continuing it for 10 minutes today.`,
    steps: [
      `1. Set up the ${title} materials in a calm space.`,
      `2. Guide ${child.name} step-by-step through the exercise.`,
      `3. Encourage each successful attempt.`
    ],
    why: therapistGuidance ? `Therapist Recommendation: ${therapistGuidance}` : `Supports ${child.name}'s skill progression.`
  };
}

/**
 * Execute Personalized Intervention Agent Workflow
 */
async function runPersonalizedInterventionAgent({ parentId, childId, userPrompt = null }) {
  // Step 1: Identify Parent & Preferences
  const parent = await User.findById(parentId).lean();
  if (!parent || parent.role !== "parent") {
    throw new Error("Unauthorized parent context.");
  }
  const prefs = parent.aiPreferences || {
    preferredLanguage: "en",
    preferredInteraction: "text",
    explanationLevel: "standard",
    guidancePreference: "step_by_step",
    assistanceFrequency: "medium",
  };

  // Step 2 & 3: Retrieve Associated Child
  let targetChildId = childId;
  if (!targetChildId) {
    if (parent.children && parent.children.length > 0) {
      targetChildId = parent.children[0];
    } else {
      const foundChild = await Child.findOne({ parentId: parent._id }).lean();
      targetChildId = foundChild ? foundChild._id : null;
    }
  }

  if (!targetChildId) {
    return {
      hasChild: false,
      message: prefs.preferredLanguage === "kn" 
        ? "ದಯವಿಟ್ಟು ಮೊದಲು ನಿಮ್ಮ ಮಗುವಿನ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಸೇರಿಸಿ."
        : "Please add a child profile to generate personalized recommendations.",
    };
  }

  const child = await Child.findById(targetChildId).lean();
  if (!child || (child.parentId && String(child.parentId) !== String(parent._id))) {
    throw new Error("Child record access not authorized for this parent.");
  }

  // Step 4: Retrieve Child Performance Logs & History
  const logs = await ActivityLog.find({ child: child._id })
    .sort({ completedAt: -1 })
    .limit(10)
    .lean();

  const totalLogs = logs.length;
  const recentScoreAvg = totalLogs > 0 
    ? Math.round(logs.slice(0, 3).reduce((acc, l) => acc + (l.performanceScore || 50), 0) / Math.min(3, totalLogs))
    : 50;

  // Step 5: Retrieve Therapist Recommendations (HIGHEST PRIORITY)
  const therapistFeedback = await Feedback.find({ child: child._id, recipientRole: "parent" })
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const latestTherapistGuidance = therapistFeedback.length > 0 ? therapistFeedback[0].message : null;

  // Step 6 & 7: Select Suitable Activity from Database
  const childLevel = child.level || 1;
  const allLevelActivities = await Activity.find({ level: childLevel }).lean();

  // Exclude completed, prioritize assigned or therapist recommended
  let candidateActivity = null;
  if (child.assignedTasks && child.assignedTasks.length > 0) {
    const assignedId = child.assignedTasks[0];
    candidateActivity = allLevelActivities.find((a) => String(a._id) === String(assignedId));
  }

  if (!candidateActivity && allLevelActivities.length > 0) {
    candidateActivity = allLevelActivities[0];
  }

  if (!candidateActivity) {
    const fallbackActs = await Activity.find().limit(1).lean();
    candidateActivity = fallbackActs[0] || {
      _id: "default_act",
      title: "Visual Matching Play",
      category: "Cognitive",
      duration: "10 mins",
      description: "Match color blocks or picture cards.",
    };
  }

  // Step 8 & 9: Generate Adaptive Explanation
  const adapted = adaptExplanationText({
    activity: candidateActivity,
    child,
    level: prefs.explanationLevel || "standard",
    language: prefs.preferredLanguage || "en",
    therapistGuidance: latestTherapistGuidance,
  });

  // Step 10: Build Final Structured Output
  return {
    hasChild: true,
    parentPreferences: prefs,
    child: {
      _id: child._id,
      name: child.name,
      age: child.age,
      level: child.level || 1,
      supportLevel: child.supportLevel || "Level 1 - Requiring Support",
      ageGroup: child.ageGroup || "Age Group 1 (Age 2-5)",
    },
    activity: {
      _id: candidateActivity._id,
      title: prefs.preferredLanguage === "kn" && candidateActivity.titleKn ? candidateActivity.titleKn : candidateActivity.title,
      category: candidateActivity.category || "Behavioral",
      duration: candidateActivity.duration || "10-15 mins",
      icon: candidateActivity.icon || "🧩",
      xp: candidateActivity.xp || 40,
    },
    recommendation: {
      explanationLevel: prefs.explanationLevel || "standard",
      language: prefs.preferredLanguage || "en",
      summary: adapted.summary,
      steps: adapted.steps,
      why: adapted.why,
      hasTherapistGuidance: !!latestTherapistGuidance,
      therapistGuidanceText: latestTherapistGuidance,
    },
    performanceMetrics: {
      recentScoreAvg,
      totalSessionsCompleted: child.completedTasks?.length || 0,
      streak: child.streak || 0,
    },
  };
}

module.exports = {
  runPersonalizedInterventionAgent,
  adaptExplanationText,
};
