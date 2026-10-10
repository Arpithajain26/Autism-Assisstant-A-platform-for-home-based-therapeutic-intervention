const axios = require("axios");
const fs = require("fs");
const path = require("path");

// Clinical System Prompt for Autism Behavioral Specialist
const SYSTEM_PROMPT = `You are an empathetic, evidence-based AI Autism Clinical Assistant and pediatric behavioral specialist on the AutismAssist platform.
You support parents, caregivers, and licensed therapists with practical, compassionate strategies for children diagnosed with Autism Spectrum Disorder (ASD).

Core areas of expertise:
- Managing sensory overload, meltdowns, and emotional dysregulation with step-by-step de-escalation strategies.
- Understanding and accommodating stimming (self-stimulatory behavior) safely and productively.
- Encouraging expressive speech, functional communication, AAC devices, PECS, and joint attention.
- Applied Behavior Analysis (ABA) positive reinforcement, visual schedules, and daily routines.
- Sensory-friendly feeding/eating, bedtime sleep hygiene, and routine transitions.
- Recommending AutismAssist therapeutic games (e.g., Bubble Popping, Emotion Flashcards, Sound Matching, Calm Breathing).

Tone and formatting guidelines:
- Be warm, affirming, validating, and compassionate.
- Use clear bullet points, bold key steps, and calming emojis.
- Provide actionable, practical home-friendly steps.
- Maintain safety: note that guidance is therapeutic support and not emergency medical treatment.`;

// Domain-Specific Clinical Autism Knowledge Base (Instant Fallback)
const KNOWLEDGE_BASE = [
  {
    keywords: ["meltdown", "tantrum", "screaming", "angry", "crying", "aggressive", "hit"],
    topic: "Sensory Overload & Meltdown De-escalation",
    response: `🧘 **Managing Sensory Meltdowns & Dysregulation:**

1. **Reduce Sensory Input Immediately:** Dim bright lights, turn down background noises, and move to a quiet "calm-down corner".
2. **Deep Pressure Touch:** Offer a weighted blanket, tight hug (proprioceptive input), or firm joint compression if the child finds it soothing.
3. **Minimize Verbal Demands:** Use simple visual cues (like a "Calm" picture card) instead of asking questions, as verbal processing drops during meltdowns.
4. **Breath & Sensory Regulation:** Try the *5-finger breathing* or blowing bubbles to encourage deep diaphragmatic breathing.
5. **Post-Meltdown Reconnection:** Offer water and allow a quiet rest period without immediately discussing the incident.`
  },
  {
    keywords: ["stimming", "flapping", "rocking", "spinning", "hand flap", "repetitive"],
    topic: "Understanding Stimming & Self-Regulation",
    response: `🌿 **Understanding Stimming (Self-Stimulatory Behavior):**

Stimming (like hand-flapping, rocking, or pacing) is a natural way autistic children regulate their nervous system when excited, overwhelmed, or focused.

* **When to support it:** If the stimming is harmless and helps the child feel calm, do not force them to stop.
* **If it is harmful (head-banging/biting):** Gently redirect to a safe sensory substitute (chewable necklace, squishy stress ball, or mini-trampoline).
* **Sensory Diets:** Incorporate scheduled heavy-work activities (carrying items, jumping, crawling through tunnels) throughout the day to meet sensory needs.`
  },
  {
    keywords: ["speech", "talking", "non-verbal", "words", "language", "communicate", "talk"],
    topic: "Speech & Communication Strategies",
    response: `💬 **Encouraging Expressive & Functional Communication:**

1. **Use AAC & Visual Choice Boards:** Use picture cards (PECS) or digital icons so the child can request favorites (e.g., "Water", "More", "Stop").
2. **The "Wait & Prompt" Rule:** Give at least 5–10 seconds of processing time before repeating a question.
3. **Model & Expand:** If the child says "Ball", affirm and expand: "Yes, big blue ball!"
4. **Follow Their Motivation:** Build communication around the child's special interests rather than generic flashcards.
5. **Interactive Games:** Try the *Emotion Charades* and *Story Builder* games in the app to practice reciprocal gestures.`
  },
  {
    keywords: ["eating", "food", "picky", "texture", "chew", "refuse food"],
    topic: "Sensory Feeding & Picky Eating",
    response: `🍎 **Supporting Sensory-Sensitive Eating:**

1. **Deconstruct Foods:** Serve foods separated on divided plates without mixing textures (e.g., plain pasta separate from sauce).
2. **Food Chaining:** Gradually bridge from an accepted food to a new one with similar color/crunch (e.g., french fries → baked potato wedges → sweet potato fries).
3. **No-Pressure Food Play:** Let the child touch, smell, or explore new foods with cookie cutters without the pressure to swallow.
4. **Oral Motor Warmups:** Blowing bubbles or drinking thick smoothies through a straw before meals can organize oral sensory pathways.`
  },
  {
    keywords: ["sleep", "bedtime", "night", "awake", "routine"],
    topic: "Sleep & Evening Routines",
    response: `🌙 **Bedtime & Sleep Strategies for Neurodivergent Kids:**

1. **Visual Bedtime Schedule:** Display a 4-step picture sequence (Bath → Pajamas → Story → Lights Out) at eye level.
2. **Sensory Calming 1 Hour Prior:** Eliminate blue light screens 60 minutes before bed; replace with weighted blankets or gentle white noise.
3. **Consistent Sensory Environment:** Keep bedroom temperature cool, use blackout curtains, and maintain a predictable bedtime scent or nightlight.`
  },
  {
    keywords: ["corner", "sensory room", "calm space", "quiet space", "sensory corner", "calming corner", "safe space"],
    topic: "Creating a Calming Sensory Corner at Home",
    response: `🏠 **How to Create a Calming Sensory Corner at Home:**

A sensory corner gives a child a safe, predictable zone to decompress before sensory overload leads to a meltdown.

1. **Pick the Right Spot:** Choose a quiet, low-traffic area (a corner of the bedroom or under a loft bed) away from TV noise and kitchen aromas.
2. **Cozy Boundaries & Soft Lighting:** 
   * Use a pop-up tent, canopy, or soft play tent to create a safe boundary.
   * Replace harsh ceiling lights with dimmable fairy lights, fiber optic lamps, or a gentle star projector.
3. **Proprioceptive & Deep Pressure Items:**
   * Bean bag chair, floor crash pad, or body sock.
   * Weighted lap pad or weighted blanket (10% of body weight + 1 lb).
4. **Calming Tactile Tools:**
   * Fidget basket: pop-its, squishy balls, sensory liquid motion timers, and soft textured fabrics (minky/sherpa).
5. **Auditory Comfort:**
   * Noise-cancelling headphones or a white noise / nature sounds player.
6. **Visual Emotion Guide:**
   * Post simple feeling cards or a "How do I feel right now?" visual dial so the child can point to their needs.`
  },
  {
    keywords: ["game", "activity", "recommend", "suggest", "play", "bored"],
    topic: "Therapy Game Recommendations",
    response: `🧩 **Recommended Therapy Games in the App:**

* **Level 1 (Ages 2–5):** Try *Bubble Popping OT* (fine motor) and *Sorting Shapes* (visual-spatial).
* **Level 2 (Ages 4–8):** Try *Emotion Flashcards* (social reciprocity) and *Story Sequencing* (routine building).
* **Level 3 (Ages 6–14):** Try *Thought Bubble Detective* (perspective taking) and *Calm Music Room* (sensory regulation).`
  },
  {
    keywords: ["transition", "routine", "change", "switching", "schedule"],
    topic: "Managing Transitions & Changes in Routine",
    response: `⏰ **Supporting Smooth Daily Transitions:**

1. **Visual Countdowns:** Use visual sand timers or the app's visual clock so time is visible, not abstract.
2. **"First-Then" Boards:** Clearly show sequence: *"First put shoes on, Then park playground."*
3. **5-Minute & 2-Minute Warnings:** Give calm auditory reminders paired with a visual cue before switching tasks.
4. **Transition Objects:** Let the child carry a favorite comfort item when moving from home to the car or school.`
  },
  {
    keywords: ["eye contact", "look at me", "gaze", "social"],
    topic: "Social Engagement & Eye Contact",
    response: `👀 **Nurturing Natural Social Connection & Eye Contact:**

1. **Never Force Eye Contact:** Forced gaze can cause sensory distress and hinder auditory comprehension for autistic individuals.
2. **Bring Items to Eye Level:** Hold toys or objects of interest near your face naturally while speaking.
3. **Engage in Side-by-Side Play:** Play with building blocks or playdough alongside them—connection happens through shared activity.
4. **Acknowledge Non-Verbal Listening:** Notice when the child tilts their ear towards you; they are actively processing your voice even without direct eye contact.`
  }
];

function matchLocalKnowledge(query) {
  const q = query.toLowerCase();
  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some(k => q.includes(k))) {
      return item.response;
    }
  }
  return null;
}

// ── Google Gemini Provider ───────────────────────────────────────────────────
async function callGemini(apiKey, message, history = []) {
  const contents = [];
  
  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) {
      const role = item.role === "assistant" || item.sender === "bot" ? "model" : "user";
      const text = item.text || item.content || "";
      if (text.trim()) {
        contents.push({ role, parts: [{ text: text.trim() }] });
      }
    }
  }

  // Ensure current query is appended
  contents.push({ role: "user", parts: [{ text: message }] });

  // Models to try in order of preference (verified working)
  const models = [
    "gemini-2.5-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
  ];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload = {
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 800
        }
      };

      const res = await axios.post(url, payload, { timeout: 12000 });
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return { reply: text, model: `Google ${model}`, source: "gemini" };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Gemini ${model} request error:`, err.response?.data?.error?.message || err.message);
    }
  }

  throw lastError || new Error("Gemini API returned no response.");
}

// ── Groq Cloud Provider (Llama 3.3 70B) ───────────────────────────────────────
async function callGroq(apiKey, message, history = []) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) {
      const role = item.role === "assistant" || item.sender === "bot" ? "assistant" : "user";
      const text = item.text || item.content || "";
      if (text.trim()) {
        messages.push({ role, content: text.trim() });
      }
    }
  }

  messages.push({ role: "user", content: message });

  const url = "https://api.groq.com/openai/v1/chat/completions";
  const res = await axios.post(
    url,
    {
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 800
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 12000
    }
  );

  const reply = res.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from Groq.");
  return { reply, model: "Groq Llama 3.3 70B", source: "groq" };
}

// ── OpenAI Provider (GPT-4o-mini) ─────────────────────────────────────────────
async function callOpenAI(apiKey, message, history = []) {
  const messages = [{ role: "system", content: SYSTEM_PROMPT }];

  if (Array.isArray(history)) {
    for (const item of history.slice(-8)) {
      const role = item.role === "assistant" || item.sender === "bot" ? "assistant" : "user";
      const text = item.text || item.content || "";
      if (text.trim()) {
        messages.push({ role, content: text.trim() });
      }
    }
  }

  messages.push({ role: "user", content: message });

  const url = "https://api.openai.com/v1/chat/completions";
  const res = await axios.post(
    url,
    {
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 800
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      timeout: 12000
    }
  );

  const reply = res.data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty response from OpenAI.");
  return { reply, model: "OpenAI GPT-4o-mini", source: "openai" };
}

// ── Main Chat Handler ─────────────────────────────────────────────────────────
exports.handleChat = async (req, res) => {
  try {
    const { message, history = [], userApiKey, provider } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message prompt is required." });
    }

    const query = message.trim();

    // Determine API key and preferred provider
    const geminiKey = userApiKey && provider === "gemini" ? userApiKey : process.env.GEMINI_API_KEY;
    const groqKey = userApiKey && provider === "groq" ? userApiKey : process.env.GROQ_API_KEY;
    const openaiKey = userApiKey && provider === "openai" ? userApiKey : process.env.OPENAI_API_KEY;

    // 1. Check Google Gemini
    if (geminiKey && geminiKey.trim()) {
      try {
        const result = await callGemini(geminiKey.trim(), query, history);
        return res.json(result);
      } catch (err) {
        console.warn("Real AI (Gemini) error:", err.message);
      }
    }

    // 2. Check Groq
    if (groqKey && groqKey.trim()) {
      try {
        const result = await callGroq(groqKey.trim(), query, history);
        return res.json(result);
      } catch (err) {
        console.warn("Real AI (Groq) error:", err.message);
      }
    }

    // 3. Check OpenAI
    if (openaiKey && openaiKey.trim()) {
      try {
        const result = await callOpenAI(openaiKey.trim(), query, history);
        return res.json(result);
      } catch (err) {
        console.warn("Real AI (OpenAI) error:", err.message);
      }
    }

    // 4. Clinical Knowledge Base Intent Matcher
    const localMatch = matchLocalKnowledge(query);
    if (localMatch) {
      return res.json({
        reply: localMatch,
        source: "clinical_knowledge_base",
        model: "Clinical Autism KB",
        needsApiKey: false
      });
    }

    // 5. Intelligent Fallback & Key Setup Guidance
    const guidanceResponse = `🌟 **Autism Therapy Guidance:**

Every autistic child has a unique sensory and neurological profile. Here are standard evidence-based strategies:

* 🧘 **Sensory De-escalation:** Create a quiet space with dim lighting, use deep-pressure hugs, and avoid asking questions during distress.
* 💬 **Communication Support:** Offer visual choice boards (PECS) and allow 5–10 seconds of processing time before repeating.
* 🧩 **Structured Engagement:** Use visual timers and break games into small, predictable steps.

💡 *Tip: To connect to **Real AI (Google Gemini / Groq / OpenAI)** for dynamic answers to ANY question, click the ⚙️ settings icon in the top header and enter your free API key!*`;

    return res.json({
      reply: guidanceResponse,
      source: "fallback_guide",
      model: "Clinical Assistant",
      needsApiKey: true
    });
  } catch (error) {
    console.error("Chatbot handler error:", error);
    res.status(500).json({ error: "Failed to generate AI response." });
  }
};

// ── Check Real AI Status ──────────────────────────────────────────────────────
exports.getChatStatus = (req, res) => {
  const hasGemini = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  const hasGroq = !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim());
  const hasOpenAI = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim());

  let activeProvider = "none";
  let activeModel = "Clinical Knowledge Base";
  if (hasGemini) {
    activeProvider = "gemini";
    activeModel = "Google Gemini 1.5 Flash";
  } else if (hasGroq) {
    activeProvider = "groq";
    activeModel = "Groq Llama 3.3 70B";
  } else if (hasOpenAI) {
    activeProvider = "openai";
    activeModel = "OpenAI GPT-4o-mini";
  }

  res.json({
    configured: hasGemini || hasGroq || hasOpenAI,
    activeProvider,
    activeModel,
    availableProviders: {
      gemini: hasGemini,
      groq: hasGroq,
      openai: hasOpenAI
    }
  });
};

// ── Save API Key (Updates process.env & server/.env) ───────────────────────────
exports.saveApiKey = (req, res) => {
  try {
    const { provider = "gemini", apiKey } = req.body;
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: "API key is required" });
    }

    const cleanKey = apiKey.trim();
    let envVar = "GEMINI_API_KEY";
    if (provider === "groq") envVar = "GROQ_API_KEY";
    if (provider === "openai") envVar = "OPENAI_API_KEY";

    process.env[envVar] = cleanKey;

    // Persist into server/.env
    const envPath = path.join(__dirname, "..", ".env");
    let content = "";
    if (fs.existsSync(envPath)) {
      content = fs.readFileSync(envPath, "utf-8");
    }

    const regex = new RegExp(`^${envVar}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${envVar}=${cleanKey}`);
    } else {
      content = (content.trim() ? content.trim() + "\n" : "") + `${envVar}=${cleanKey}\n`;
    }

    fs.writeFileSync(envPath, content, "utf-8");

    res.json({
      success: true,
      message: `${provider.toUpperCase()} API key saved successfully! Real AI is now active.`,
      activeProvider: provider,
      envVar
    });
  } catch (err) {
    console.error("Failed to save API key:", err);
    res.status(500).json({ error: "Failed to save API key." });
  }
};
