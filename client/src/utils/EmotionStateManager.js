/**
 * EmotionStateManager.js
 * Manages the emotion state machine and intervention logic for the
 * Autism Assistant's Emotion-Responsive Happiness Games System.
 *
 * States: POSITIVE → NEUTRAL → NEGATIVE_MILD → NEGATIVE_MODERATE → NEGATIVE_SEVERE
 */

// ─── Emotion Classification ───────────────────────────────────────────────────

export const NEGATIVE_EMOTIONS = ["sad", "angry", "frustrated", "fear", "fearful", "anxious", "disgust", "disgusted"];
export const POSITIVE_EMOTIONS = ["happy", "engaged", "surprise", "surprised", "curious"];
export const NEUTRAL_EMOTIONS  = ["neutral", "calm", "focused"];

/** @returns {"positive"|"neutral"|"negative"} */
export function classifyEmotion(emotion) {
  const e = (emotion || "").toLowerCase();
  if (POSITIVE_EMOTIONS.some(p => e.includes(p))) return "positive";
  if (NEGATIVE_EMOTIONS.some(n => e.includes(n))) return "negative";
  return "neutral";
}

// ─── State Machine ────────────────────────────────────────────────────────────

export const EMOTION_STATES = {
  POSITIVE:           "POSITIVE",
  NEUTRAL:            "NEUTRAL",
  NEGATIVE_MILD:      "NEGATIVE_MILD",
  NEGATIVE_MODERATE:  "NEGATIVE_MODERATE",
  NEGATIVE_SEVERE:    "NEGATIVE_SEVERE",
};

/**
 * Computes next state based on current state + current emotion classification.
 * @param {string} currentState - one of EMOTION_STATES
 * @param {string} emotionClass - "positive" | "neutral" | "negative"
 * @param {number} negativeSeconds - how long negative emotion has been detected
 * @param {number} interventionCount - how many happiness-game interventions already done
 * @param {number[]} recentScores - last 3 game scores
 * @returns {string} next state
 */
export function computeNextState(currentState, emotionClass, negativeSeconds, interventionCount, recentScores = []) {
  // Score-based trigger: score < 2 for 3 consecutive rounds
  const scoreDrop = recentScores.length >= 3 && recentScores.slice(-3).every(s => s < 2);

  if (emotionClass === "positive") return EMOTION_STATES.POSITIVE;

  if (emotionClass === "neutral") {
    if (currentState === EMOTION_STATES.POSITIVE) return EMOTION_STATES.NEUTRAL;
    if (currentState === EMOTION_STATES.NEGATIVE_MODERATE) return EMOTION_STATES.NEUTRAL;
    return currentState;
  }

  // negative emotion path
  if (scoreDrop) return EMOTION_STATES.NEGATIVE_MODERATE;
  if (negativeSeconds >= 30) {
    if (interventionCount >= 2) return EMOTION_STATES.NEGATIVE_SEVERE;
    return EMOTION_STATES.NEGATIVE_MODERATE;
  }
  if (negativeSeconds >= 10) return EMOTION_STATES.NEGATIVE_MILD;
  return currentState === EMOTION_STATES.POSITIVE ? EMOTION_STATES.NEUTRAL : currentState;
}

// ─── Intervention Logic ───────────────────────────────────────────────────────

/**
 * Maps emotion → preferred happiness game IDs (ordered by effectiveness).
 * Game IDs 1–8 correspond to HappinessGames.jsx HAPPINESS_GAMES array indices.
 */
export const EMOTION_GAME_MAP = {
  angry:      [6, 3, 2],  // Drum Beat → Movement → Easy Win
  frustrated: [2, 3, 5],  // Easy Win → Movement → Drawing
  sad:        [8, 4, 2],  // Virtual Pet → Silly Animals → Easy Win
  fear:       [7, 1, 8],  // Floating Stars → Bubble Garden → Virtual Pet
  fearful:    [7, 1, 8],
  anxious:    [7, 1, 8],
  disgust:    [2, 1, 4],
  disgusted:  [2, 1, 4],
};

/**
 * Returns the best happiness game ID to launch given the current emotion
 * and which games have already been tried this session.
 */
export function selectHappinessGame(emotion, triedGames = [], childPreferences = {}) {
  const e = (emotion || "").toLowerCase();
  const defaultOrder = EMOTION_GAME_MAP[e] || [1, 2, 6];

  // If child has personalised preferences (from session emotion report), honour them
  const preferred = childPreferences[e];
  const ordered = preferred ? [...new Set([...preferred, ...defaultOrder])] : defaultOrder;

  // Return first untried game
  for (const gameId of ordered) {
    if (!triedGames.includes(gameId)) return gameId;
  }
  // Fallback: any untried
  for (let i = 1; i <= 8; i++) {
    if (!triedGames.includes(i)) return i;
  }
  return 1; // last resort
}

// ─── Session Emotion Logger ───────────────────────────────────────────────────

export class SessionEmotionLog {
  constructor(childId, sessionId) {
    this.childId = childId;
    this.sessionId = sessionId || `session_${Date.now()}`;
    this.startTime = new Date();
    this.emotionHistory = [];           // { time, emotion, confidence }
    this.interventions = [];            // { time, trigger, gameId, durationSecs, resolved }
    this.scoreHistory = [];             // { time, score }
  }

  recordEmotion(emotion, confidence = 0) {
    this.emotionHistory.push({ time: new Date(), emotion, confidence });
  }

  recordScore(score) {
    this.scoreHistory.push({ time: new Date(), score });
  }

  openIntervention(trigger, gameId) {
    const entry = { time: new Date(), trigger, gameId, startMs: Date.now(), durationSecs: 0, resolved: false };
    this.interventions.push(entry);
    return this.interventions.length - 1; // index
  }

  closeIntervention(idx, resolved) {
    if (this.interventions[idx]) {
      this.interventions[idx].durationSecs = Math.round((Date.now() - this.interventions[idx].startMs) / 1000);
      this.interventions[idx].resolved = resolved;
    }
  }

  /** Compute dominant emotion per minute for the report */
  getPerMinuteSummary() {
    const byMinute = {};
    this.emotionHistory.forEach(({ time, emotion }) => {
      const minute = Math.floor((time - this.startTime) / 60000);
      if (!byMinute[minute]) byMinute[minute] = [];
      byMinute[minute].push(emotion);
    });
    return Object.entries(byMinute).map(([min, emotions]) => ({
      minute: Number(min),
      dominant: emotions.reduce((a, b) => {
        const cnt = {};
        emotions.forEach(e => { cnt[e] = (cnt[e] || 0) + 1; });
        return Object.entries(cnt).sort((x, y) => y[1] - x[1])[0][0];
      }),
    }));
  }

  /** Summarise which game worked best for this child this session */
  getEffectiveGames() {
    return this.interventions
      .filter(i => i.resolved)
      .map(i => i.gameId);
  }

  /** Activities that triggered negative emotions */
  getNegativeActivityTriggers(activityMap = {}) {
    return this.interventions
      .filter(i => !i.resolved)
      .map(i => activityMap[i.trigger] || i.trigger);
  }

  /** Build the full report object to POST to /api/sessions/emotion-log */
  buildReport() {
    const endTime = new Date();
    const durationMins = Math.round((endTime - this.startTime) / 60000);
    return {
      childId: this.childId,
      sessionId: this.sessionId,
      startTime: this.startTime,
      endTime,
      durationMins,
      emotionPerMinute: this.getPerMinuteSummary(),
      interventionCount: this.interventions.length,
      interventions: this.interventions,
      effectiveGames: this.getEffectiveGames(),
      scoreHistory: this.scoreHistory,
      endEmotion: this.emotionHistory[this.emotionHistory.length - 1]?.emotion || "neutral",
    };
  }
}

// ─── Exam Emotion Tracker ─────────────────────────────────────────────────────

export class ExamEmotionTracker {
  constructor() {
    this.gameEmotions = {}; // gameIndex → [emotion]
    this.currentGameIdx = 0;
    this.negativeStartTime = null;
    this.calmdownTriggers = []; // { gameIdx, emotion, duration }
  }

  setGame(idx) { this.currentGameIdx = idx; }

  recordEmotion(emotion) {
    if (!this.gameEmotions[this.currentGameIdx]) this.gameEmotions[this.currentGameIdx] = [];
    this.gameEmotions[this.currentGameIdx].push(emotion);

    const isNeg = ["angry", "fear", "fearful", "anxious"].includes((emotion || "").toLowerCase());
    if (isNeg) {
      if (!this.negativeStartTime) this.negativeStartTime = Date.now();
    } else {
      this.negativeStartTime = null;
    }
  }

  shouldPauseForCalmdown() {
    if (!this.negativeStartTime) return false;
    return (Date.now() - this.negativeStartTime) >= 30000; // 30 seconds
  }

  logCalmdown(emotion) {
    const duration = this.negativeStartTime ? Math.round((Date.now() - this.negativeStartTime) / 1000) : 30;
    this.calmdownTriggers.push({ gameIdx: this.currentGameIdx, emotion, duration });
    this.negativeStartTime = null;
  }

  getDominantEmotionForGame(gameIdx) {
    const arr = this.gameEmotions[gameIdx] || [];
    if (!arr.length) return "neutral";
    const cnt = {};
    arr.forEach(e => { cnt[e] = (cnt[e] || 0) + 1; });
    return Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
  }

  buildEmotionData() {
    const data = { happy: 0, neutral: 0, sad: 0, angry: 0, fearful: 0 };
    Object.values(this.gameEmotions).flat().forEach(e => {
      const k = (e || "").toLowerCase();
      if (k in data) data[k]++;
      else if (k === "fear") data.fearful++;
      else if (k === "frustrated" || k === "disgust") data.angry++;
    });
    return data;
  }
}
