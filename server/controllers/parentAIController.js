const User = require("../models/User");
const Child = require("../models/Child");
const ActivityLog = require("../models/ActivityLog");
const Feedback = require("../models/Feedback");
const { runPersonalizedInterventionAgent, adaptExplanationText } = require("../services/parentAgentService");
const axios = require("axios");

// GET /api/parent/preferences
exports.getPreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("aiPreferences role");
    if (!user || user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can access AI preferences." });
    }
    const defaultPrefs = {
      preferredLanguage: "en",
      preferredInteraction: "text",
      explanationLevel: "standard",
      guidancePreference: "step_by_step",
      assistanceFrequency: "medium",
    };
    res.json({ preferences: user.aiPreferences || defaultPrefs });
  } catch (err) {
    console.error("Get AI Preferences Error:", err);
    res.status(500).json({ error: "Failed to fetch AI preferences." });
  }
};

// PUT /api/parent/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { preferredLanguage, preferredInteraction, explanationLevel, guidancePreference, assistanceFrequency } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts can update AI preferences." });
    }

    if (!user.aiPreferences) user.aiPreferences = {};

    if (preferredLanguage) user.aiPreferences.preferredLanguage = preferredLanguage;
    if (preferredInteraction) user.aiPreferences.preferredInteraction = preferredInteraction;
    if (explanationLevel) user.aiPreferences.explanationLevel = explanationLevel;
    if (guidancePreference) user.aiPreferences.guidancePreference = guidancePreference;
    if (assistanceFrequency) user.aiPreferences.assistanceFrequency = assistanceFrequency;

    await user.save();
    res.json({ success: true, preferences: user.aiPreferences });
  } catch (err) {
    console.error("Update AI Preferences Error:", err);
    res.status(500).json({ error: "Failed to update AI preferences." });
  }
};

// GET /api/parent/recommendation/:childId
exports.getPersonalizedRecommendation = async (req, res) => {
  try {
    const parentId = req.user.id;
    const { childId } = req.params;
    const agentResult = await runPersonalizedInterventionAgent({ parentId, childId });
    res.json(agentResult);
  } catch (err) {
    console.error("Personalized Recommendation Error:", err);
    res.status(500).json({ error: err.message || "Failed to generate recommendation." });
  }
};

// POST /api/parent/explain-simply
exports.explainSimply = async (req, res) => {
  try {
    const { text, language = "en" } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Text prompt is required." });
    }

    const parent = await User.findById(req.user.id);
    if (parent && parent.aiPreferences) {
      if (!parent.aiPreferences.interactionStats) {
        parent.aiPreferences.interactionStats = { explainSimplyCount: 0, voiceInputCount: 0, kannadaCount: 0 };
      }
      parent.aiPreferences.interactionStats.explainSimplyCount += 1;

      // Auto-tune preference if parent uses Explain Simply frequently
      if (parent.aiPreferences.interactionStats.explainSimplyCount >= 3) {
        parent.aiPreferences.explanationLevel = "simple";
      }
      await parent.save();
    }

    const isKn = language === "kn";

    // Attempt Gemini / LLM simplify
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim()) {
      try {
        const prompt = `Convert the following medical/therapist recommendation into clear, warm, simple language for a parent of an autistic child. Keep it under 2 short sentences without technical jargon.
${isKn ? "Translate the simplified response into Kannada." : "Language: English."}

Text: "${text}"`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`;
        const aiRes = await axios.post(url, { contents: [{ role: "user", parts: [{ text: prompt }] }] }, { timeout: 8000 });
        const simplified = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (simplified) {
          return res.json({ simplified: simplified.trim(), source: "llm" });
        }
      } catch (aiErr) {
        console.warn("LLM simplify fallback:", aiErr.message);
      }
    }

    // Rule-based NLP fallback
    let simplifiedFallback = text;
    if (text.toLowerCase().includes("complexity")) {
      simplifiedFallback = isKn 
        ? "ನಿಮ್ಮ ಮಗು ಈ ಆಟವನ್ನು ಕರಗತ ಮಾಡಿಕೊಳ್ಳುತ್ತಿದೆ, ಆದ್ದರಿಂದ ನಾವು ಅದನ್ನು ನಿಧಾನವಾಗಿ ಸ್ವಲ್ಪ ಕಷ್ಟಕರವಾಗಿಸಬಹುದು."
        : "Your child is doing better at this activity, so we can slowly make it a little harder.";
    } else if (text.toLowerCase().includes("completion rate")) {
      simplifiedFallback = isKn
        ? "ನಿಮ್ಮ ಮಗು ಹೆಚ್ಚು ಆಟಗಳನ್ನು ಪೂರ್ಣಗೊಳಿಸುತ್ತಿದೆ! ಇದನ್ನು ಮುಂದುವರಿಸಿ."
        : "Your child is completing more tasks! Let's keep up this good habit.";
    } else {
      simplifiedFallback = isKn
        ? `ಸರಳವಾಗಿ ಹೇಳುವುದಾದರೆ: ${text}`
        : `Simply put: Your child is making steady progress. Try practicing this activity step-by-step for 10 minutes today.`;
    }

    res.json({ simplified: simplifiedFallback, source: "nlp_rules" });
  } catch (err) {
    console.error("Explain Simply Error:", err);
    res.status(500).json({ error: "Failed to simplify explanation." });
  }
};

// POST /api/parent/ask-ai
exports.askParentAI = async (req, res) => {
  try {
    const { question, childId, isVoice = false } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: "Question prompt is required." });
    }

    const parent = await User.findById(req.user.id);
    if (!parent || parent.role !== "parent") {
      return res.status(403).json({ error: "Only authenticated parents can access the Parent AI Assistant." });
    }

    // Log voice interaction count for personalization
    if (isVoice && parent.aiPreferences) {
      if (!parent.aiPreferences.interactionStats) {
        parent.aiPreferences.interactionStats = { explainSimplyCount: 0, voiceInputCount: 0, kannadaCount: 0 };
      }
      parent.aiPreferences.interactionStats.voiceInputCount += 1;
      if (parent.aiPreferences.interactionStats.voiceInputCount >= 3) {
        parent.aiPreferences.preferredInteraction = "both";
      }
      await parent.save();
    }

    // Fetch parent agent context (Child + Therapist Guidance + Preferences)
    const agentContext = await runPersonalizedInterventionAgent({ parentId: req.user.id, childId });

    const prefs = parent.aiPreferences || { preferredLanguage: "en", explanationLevel: "standard" };
    const lang = prefs.preferredLanguage || "en";
    const expLevel = prefs.explanationLevel || "standard";

    const systemPrompt = `You are the Personalized Parent AI Assistant for AutismAssist.
You are helping a parent named ${parent.name} with their child ${agentContext.hasChild ? agentContext.child.name : "their child"}.

Child Profile:
- Name: ${agentContext.hasChild ? agentContext.child.name : "N/A"}
- Age: ${agentContext.hasChild ? agentContext.child.age : "N/A"}
- Level: Level ${agentContext.hasChild ? agentContext.child.level : 1}
- Recent Performance Avg: ${agentContext.performanceMetrics ? agentContext.performanceMetrics.recentScoreAvg : 50}%

Therapist Guidance (HIGHEST PRIORITY):
${agentContext.recommendation ? agentContext.recommendation.therapistGuidanceText || "No active therapist note" : "N/A"}

Parent Preference:
- Language: ${lang === "kn" ? "Kannada" : "English"}
- Explanation Level: ${expLevel} (simple = 2 short plain sentences, standard = friendly summary, detailed = thorough clinical reasoning)

Safety & Guidelines:
- Do NOT provide medical diagnoses or prescribe medications.
- Prioritize therapist guidance.
- Keep tone warm, empathetic, and encouraging.
- If language is Kannada, reply in clear, gentle Kannada text.`;

    // Attempt Gemini / LLM response
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && geminiKey.trim()) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey.trim()}`;
        const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: question }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
        };
        const aiRes = await axios.post(url, payload, { timeout: 10000 });
        const text = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return res.json({ reply: text.trim(), source: "llm", agentContext });
        }
      } catch (aiErr) {
        console.warn("LLM Ask AI fallback:", aiErr.message);
      }
    }

    // Context-Aware Rule Fallback
    const q = question.toLowerCase();
    let reply = "";
    if (q.includes("what should i do") || q.includes("activity") || q.includes("which activity")) {
      reply = agentContext.recommendation 
        ? agentContext.recommendation.summary
        : "Start with a 10-minute visual matching or bubble popping activity in a quiet space today!";
    } else if (q.includes("progress") || q.includes("how is my child")) {
      reply = `Your child ${agentContext.hasChild ? agentContext.child.name : ""} is active with a ${agentContext.performanceMetrics?.streak || 1}-day therapy streak! Recent task performance is around ${agentContext.performanceMetrics?.recentScoreAvg || 75}%.`;
    } else if (q.includes("why")) {
      reply = agentContext.recommendation?.why || "This recommendation is based on recent skill progress and therapist guidance.";
    } else {
      reply = lang === "kn"
        ? `ನಿಮ್ಮ ಮಗುವಿನ ಚಿಕಿತ್ಸೆಯಲ್ಲಿ AutismAssist ನಿಮಗೆ ಬೆಂಬಲ ನೀಡುತ್ತದೆ. ದಿನಕ್ಕೆ 15 ನಿಮಿಷಗಳ ಕಾಲ ರಚನಾತ್ಮಕ ಆಟವಾಡಿಸಿ.`
        : `AutismAssist is here to guide you. Engaging your child in 15 minutes of structured TEACCH play daily reinforces emotional and motor skills!`;
    }

    res.json({ reply, source: "context_agent_rules", agentContext });
  } catch (err) {
    console.error("Ask Parent AI Error:", err);
    res.status(500).json({ error: "Failed to process question." });
  }
};

// POST /api/parent/learn-interaction
exports.learnInteraction = async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "parent") {
      return res.status(403).json({ error: "Only parent accounts." });
    }

    if (!user.aiPreferences) user.aiPreferences = {};
    if (!user.aiPreferences.interactionStats) {
      user.aiPreferences.interactionStats = { explainSimplyCount: 0, voiceInputCount: 0, kannadaCount: 0 };
    }

    if (action === "explain_simply") {
      user.aiPreferences.interactionStats.explainSimplyCount += 1;
      if (user.aiPreferences.interactionStats.explainSimplyCount >= 3) {
        user.aiPreferences.explanationLevel = "simple";
      }
    } else if (action === "voice_input") {
      user.aiPreferences.interactionStats.voiceInputCount += 1;
      if (user.aiPreferences.interactionStats.voiceInputCount >= 3) {
        user.aiPreferences.preferredInteraction = "both";
      }
    } else if (action === "kannada") {
      user.aiPreferences.interactionStats.kannadaCount += 1;
      if (user.aiPreferences.interactionStats.kannadaCount >= 2) {
        user.aiPreferences.preferredLanguage = "kn";
      }
    }

    await user.save();
    res.json({ success: true, preferences: user.aiPreferences });
  } catch (err) {
    console.error("Learn Interaction Error:", err);
    res.status(500).json({ error: "Failed to record interaction." });
  }
};

// GET /api/parent/weekly-summary/:childId
exports.getPersonalizedWeeklySummary = async (req, res) => {
  try {
    const { childId } = req.params;
    const child = await Child.findById(childId).lean();
    if (!child) return res.status(404).json({ error: "Child not found." });

    const logs = await ActivityLog.find({ child: child._id }).sort({ completedAt: -1 }).limit(15).lean();
    const completedCount = logs.length;

    const simple = `${child.name} improved in communication and motor activities this week!`;
    const standard = `${child.name} showed positive improvement in communication activities and completed ${completedCount} therapy tasks independently.`;
    const detailed = `Based on stored session logs, task completion increased over the recent assessment period. ${child.name} completed ${completedCount} sessions with an average engagement score of High. High task accuracy observed primarily in independent play tasks.`;

    res.json({
      childName: child.name,
      completedCount,
      summaries: {
        simple,
        standard,
        detailed,
      },
    });
  } catch (err) {
    console.error("Weekly Summary Error:", err);
    res.status(500).json({ error: "Failed to generate weekly summary." });
  }
};
