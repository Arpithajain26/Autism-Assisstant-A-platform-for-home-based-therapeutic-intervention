const axios = require("axios");

// Domain-Specific Clinical Autism Knowledge Base
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

// Helper: match query against knowledge base
function matchLocalKnowledge(query) {
  const q = query.toLowerCase();
  for (const item of KNOWLEDGE_BASE) {
    if (item.keywords.some(k => q.includes(k))) {
      return item.response;
    }
  }
  return null;
}

exports.handleChat = async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message prompt is required." });
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is configured, query Gemini model
    if (geminiKey) {
      try {
        const systemPrompt = "You are an empathetic, clinical AI Autism Therapy Assistant and behavioral specialist for parents and therapists. Provide structured, evidence-based, warm, and practical advice on autism spectrum support, ABA, speech therapy, sensory integration, and positive parenting. Keep formatting clear with bullet points and emojis.";
        
        const contents = [
          { role: "user", parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }] }
        ];

        const geminiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          { contents },
          { timeout: 8000 }
        );

        const reply = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.json({ reply, source: "gemini" });
        }
      } catch (geminiErr) {
        console.warn("Gemini API call failed, falling back to clinical knowledge base:", geminiErr.message);
      }
    }

    // 2. Clinical Knowledge Base Intent Matcher
    const localMatch = matchLocalKnowledge(message);
    if (localMatch) {
      return res.json({ reply: localMatch, source: "knowledge_base" });
    }

    // 3. Fallback General Response
    const defaultResponse = `🌟 **Autism Support Guidance:**

Thank you for your question! Every autistic child has a unique sensory and developmental profile.

* **For Meltdowns & Emotions:** Reduce sensory overload, use deep pressure, and provide a quiet space.
* **For Learning & Games:** Use structured visual timers and follow the child's natural special interests.
* **For Communication:** Practice joint attention using the interactive therapy games in the *Games* section.

Feel free to ask about *sensory diets, speech strategies, bedtime routines, picky eating, or recommended games!*`;

    return res.json({ reply: defaultResponse, source: "fallback" });
  } catch (error) {
    console.error("Chatbot handler error:", error);
    res.status(500).json({ error: "Failed to generate AI response." });
  }
};
