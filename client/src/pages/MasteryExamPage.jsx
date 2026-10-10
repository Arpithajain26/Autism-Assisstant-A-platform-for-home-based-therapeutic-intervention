import React, { useState, useEffect, useRef, useCallback } from "react";
import EmotionDetector from "../components/EmotionDetector";
import { speak, speakCelebration, stopSpeech } from "../utils/gameAudio";
import { submitChallengeExam } from "../services/api";
import { generateChallengeExamPDF } from "../utils/pdfExportHelper";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ─── Sound FX Helper ────────────────────────────────────────────────────────── */
const playTone = (freq = 440, type = "sine", duration = 0.25, vol = 0.2) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
};

const playFanfare = () => {
  [523, 659, 784, 1046].forEach((f, i) => {
    setTimeout(() => playTone(f, "sine", 0.35, 0.3), i * 140);
  });
};

const playHit = () => {
  playTone(150, "sawtooth", 0.2, 0.3);
};

/* ─── Confetti FX Component ─────────────────────────────────────────────────── */
function ConfettiOverlay({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"][i % 6],
    delay: `${Math.random() * 0.6}s`,
    size: `${10 + Math.random() * 12}px`,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 99999, overflow: "hidden" }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: "4px",
            animation: `confettiDrop 2.2s ease-in ${p.delay} infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiDrop {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT: MasteryExamPage (CHALLENGE MODE)
════════════════════════════════════════════════════════════════════════════ */
export default function MasteryExamPage() {
  // ── Child info & Adaptive Settings ──────────────────────────────────────────
  const child = (() => {
    try {
      return JSON.parse(localStorage.getItem("currentChild") || "{}");
    } catch {
      return {};
    }
  })();

  const childAge = Number(child?.age) || 6;
  const childLevel = Number(child?.level) || 2;
  const childName = child?.name || "Super Hero";

  // Age group: 1 (2-5), 2 (5-8), 3 (9-12)
  const ageGroup = childAge <= 5 ? 1 : childAge <= 8 ? 2 : 3;

  // Rounds count per game:
  // Age 2-5 (Level 3): 3 rounds
  // Age 5-8 (Level 2): 5 rounds
  // Age 9-12 (Level 1): 8 rounds (or max questions)
  const roundsPerGame = ageGroup === 1 ? 3 : ageGroup === 2 ? 5 : 8;

  // ── State Management ────────────────────────────────────────────────────────
  const [language, setLanguage] = useState("en"); // "en" | "kn"
  const [stage, setStage] = useState("intro"); // "intro" | "playing" | "intermission" | "calmdown" | "results"
  const [currentGameIdx, setCurrentGameIdx] = useState(0); // 0 to 4 (5 games)
  const [gameScores, setGameScores] = useState([
    { stars: 0, roundsWon: 0, totalRounds: roundsPerGame, timeTaken: 0, dominantEmotion: "Happy" },
    { stars: 0, roundsWon: 0, totalRounds: roundsPerGame, timeTaken: 0, dominantEmotion: "Focused" },
    { stars: 0, roundsWon: 0, totalRounds: roundsPerGame, timeTaken: 0, dominantEmotion: "Happy" },
    { stars: 0, roundsWon: 0, totalRounds: roundsPerGame, timeTaken: 0, dominantEmotion: "Focused" },
    { stars: 0, roundsWon: 0, totalRounds: roundsPerGame, timeTaken: 0, dominantEmotion: "Happy" },
  ]);

  // Current sub-game round state
  const [currentRound, setCurrentRound] = useState(0);
  const [roundTimer, setRoundTimer] = useState(30);
  const [heroScale, setHeroScale] = useState(1);
  const [bossScale, setBossScale] = useState(1);
  const [playerHearts, setPlayerHearts] = useState(3);
  const [cityBlocksSaved, setCityBlocksSaved] = useState(0);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [memoryCards, setMemoryCards] = useState([]);
  const [patternInput, setPatternInput] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Real-time Emotion AI State
  const [currentEmotion, setCurrentEmotion] = useState("Happy");
  const [negativeEmotionSecs, setNegativeEmotionSecs] = useState(0);
  const [calmDownTimer, setCalmDownTimer] = useState(60);
  const [calmDownCount, setCalmDownCount] = useState(0);
  const [emotionCounts, setEmotionCounts] = useState({ happy: 0, neutral: 0, sad: 0, angry: 0, fearful: 0 });

  const gameTimerRef = useRef(null);
  const negativeTimerRef = useRef(null);
  const calmDownIntervalRef = useRef(null);
  const containerRef = useRef(null);

  // ── Fullscreen toggle ───────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // ── Real-time Camera Emotion Tracking & Auto Calm-Down Trigger ──────────────
  const handleEmotionDetected = useCallback(
    (emo) => {
      const e = (emo || "happy").toLowerCase();
      setCurrentEmotion(emo);
      setEmotionCounts((prev) => {
        const copy = { ...prev };
        if (e.includes("happy")) copy.happy++;
        else if (e.includes("neutral") || e.includes("focused")) copy.neutral++;
        else if (e.includes("sad")) copy.sad++;
        else if (e.includes("angry") || e.includes("frustrated")) copy.angry++;
        else if (e.includes("fear") || e.includes("anxious")) copy.fearful++;
        return copy;
      });

      // If detected ANGRY or FEARFUL during any game
      const isNegative = ["angry", "frustrated", "fear", "fearful", "anxious"].some((n) => e.includes(n));
      if (isNegative && stage === "playing") {
        setNegativeEmotionSecs((prev) => {
          const nextVal = prev + 1;
          if (nextVal >= 30) {
            // Trigger 60s Calm Down mini game
            setStage("calmdown");
            setCalmDownTimer(60);
            setCalmDownCount((c) => c + 1);
            speak(
              language === "kn"
                ? "ಸ್ವಲ್ಪ ಶಾಂತವಾಗಿರೋಣ. ನಿಧಾನವಾಗಿ ಉಸಿರಾಡಿ."
                : "Let us pause and take a calm, gentle breather together.",
              language
            );
            return 0;
          }
          return nextVal;
        });
      } else if (!isNegative) {
        setNegativeEmotionSecs(0);
      }
    },
    [stage, language]
  );

  // Calm down 60s timer countdown
  useEffect(() => {
    if (stage === "calmdown") {
      calmDownIntervalRef.current = setInterval(() => {
        setCalmDownTimer((prev) => {
          if (prev <= 1) {
            clearInterval(calmDownIntervalRef.current);
            setStage("playing");
            speak(
              language === "kn"
                ? "ಅದ್ಭುತ! ನೀವು ಶಾಂತರಾಗಿದ್ದೀರಿ! ಆಟವನ್ನು ಮುಂದುವರಿಸೋಣ!"
                : "Great job calming down! Let's continue your superpower challenge!",
              language
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(calmDownIntervalRef.current);
    }
  }, [stage, language]);

  /* ──────────────────────────────────────────────────────────────────────────
     DATA FOR THE 5 GAMES (Age & Level Adaptive)
  ────────────────────────────────────────────────────────────────────────── */

  // GAME 1: EMOTION BOSS BATTLE
  const emotionBossEmotions = [
    { name: "Happy", emoji: "😊", labelKn: "ಸಂತೋಷ", options: ["Happy 😊", "Sad 😢", "Angry 😠"] },
    { name: "Sad", emoji: "😢", labelKn: "ದುಃಖ", options: ["Sad 😢", "Happy 😊", "Surprised 😲"] },
    { name: "Angry", emoji: "😠", labelKn: "ಕೋಪ", options: ["Angry 😠", "Calm 😌", "Scared 😨"] },
    { name: "Surprised", emoji: "😲", labelKn: "ಆಶ್ಚರ್ಯ", options: ["Surprised 😲", "Happy 😊", "Sleepy 😴"] },
    { name: "Proud", emoji: "😏", labelKn: "ಹೆಮ್ಮೆ", options: ["Proud 😏", "Sad 😢", "Confused 😕", "Excited 🤩"] },
    { name: "Curious", emoji: "🧐", labelKn: "ಕುತೂಹಲ", options: ["Curious 🧐", "Bored 🥱", "Angry 😠", "Shy 🙈"] },
    { name: "Frustrated", emoji: "😤", labelKn: "ಕಿರಿಕಿರಿ", options: ["Frustrated 😤", "Calm 😌", "Happy 😊", "Tired 🥱"] },
    { name: "Loving", emoji: "🥰", labelKn: "ಪ್ರೀತಿ", options: ["Loving 🥰", "Scared 😨", "Jealous 😒", "Sad 😢"] },
  ].slice(0, roundsPerGame);

  // Boss face visibility duration based on age
  const bossFaceVisibleTimeMs = ageGroup === 1 ? 5000 : ageGroup === 2 ? 3000 : 1500;
  const [bossFaceHidden, setBossFaceHidden] = useState(false);

  useEffect(() => {
    if (stage === "playing" && currentGameIdx === 0) {
      setBossFaceHidden(false);
      // Level 3 keeps face visible, Level 2 and Level 1 hide it after timer
      if (childLevel < 3) {
        const timer = setTimeout(() => setBossFaceHidden(true), bossFaceVisibleTimeMs);
        return () => clearTimeout(timer);
      }
    }
  }, [stage, currentGameIdx, currentRound, childLevel, bossFaceVisibleTimeMs]);

  // GAME 2: PATTERN MASTER
  const patternRounds = [
    // Round 1: Simple 4 item pattern
    {
      seq: ["🔴", "🔵", "🔴", "❓"],
      correct: "🔵",
      options: ["🔵", "🔴", "🟡"],
      title: "Round 1: Complete the pattern!",
      titleKn: "ಹಂತ 1: ವಿನ್ಯಾಸ ಪೂರ್ಣಗೊಳಿಸಿ!",
    },
    // Round 2: 2 missing pieces
    {
      seq: ["⭐", "🌙", "⭐", "🌙", "❓"],
      correct: "⭐",
      options: ["⭐", "🌙", "☀️"],
      title: "Round 2: What comes next in the cycle?",
      titleKn: "ಹಂತ 2: ಮುಂದಿನ ನಕ್ಷತ್ರ ಯಾವುದು?",
    },
    // Round 3: Reverse pattern - what came BEFORE?
    {
      seq: ["❓", "🦁", "🐯", "🦁", "🐯"],
      correct: "🐯",
      options: ["🐯", "🦁", "🐵"],
      title: "Round 3: REVERSE PATTERN — What came BEFORE?",
      titleKn: "ಹಂತ 3: ಹಿಮ್ಮುಖ ವಿನ್ಯಾಸ — ಮೊದಲು ಯಾವುದು ಇತ್ತು?",
    },
    // Round 4: Decoy answers that look correct
    {
      seq: ageGroup === 3 ? ["2", "4", "8", "16", "❓"] : ["🔺", "🟩", "🔺", "🟩", "❓"],
      correct: ageGroup === 3 ? "32" : "🔺",
      options: ageGroup === 3 ? ["32", "24 (trick!)", "18", "64"] : ["🔺", "🔻 (upside down)", "🟩"],
      title: "Round 4: Beware of DECOY tricks!",
      titleKn: "ಹಂತ 4: ಮೋಸದ ಆಯ್ಕೆಗಳಿಂದ ಎಚ್ಚರ!",
    },
    // Round 5: Two patterns simultaneously / sequence
    {
      seq: ageGroup === 3 ? ["😊➡️😐➡️😢", "❓"] : ["🍎", "🍌", "🍇", "🍎", "🍌", "❓"],
      correct: ageGroup === 3 ? "😭 (emotion sequence)" : "🍇",
      options: ageGroup === 3 ? ["😭 (emotion sequence)", "😊", "😡"] : ["🍇", "🍎", "🍉"],
      title: "Round 5: Dual Master Sequence!",
      titleKn: "ಹಂತ 5: ಜೋಡಿ ಮಾಸ್ಟರ್ ವಿನ್ಯಾಸ!",
    },
    // Extra rounds for age 9-12
    {
      seq: ["Friend talks 🗣️", "You listen 👂", "Friend talks 🗣️", "❓"],
      correct: "Your turn to speak 🗣️",
      options: ["Your turn to speak 🗣️", "Interrupt them 😤", "Walk away 🚶"],
      title: "Round 6: Social conversation turn sequence",
      titleKn: "ಹಂತ 6: ಸಂಭಾಷಣೆಯ ಸರದಿ ವಿನ್ಯಾಸ",
    },
    {
      seq: ["10", "20", "40", "80", "❓"],
      correct: "160",
      options: ["160", "100", "90", "120"],
      title: "Round 7: Number logic mastery",
      titleKn: "ಹಂತ 7: ಸಂಖ್ಯಾ ವಿನ್ಯಾಸ",
    },
    {
      seq: ["Sad 😢", "Take breath 🌬️", "Get hug 🤗", "❓"],
      correct: "Feel Happy 😊",
      options: ["Feel Happy 😊", "Stay angry 😠", "Cry louder 😭"],
      title: "Round 8: Emotional regulation journey",
      titleKn: "ಹಂತ 8: ಭಾವನಾತ್ಮಕ ನಿಯಂತ್ರಣ ಪಯಣ",
    },
  ].slice(0, roundsPerGame);

  // GAME 3: SOCIAL SUPERHERO
  const socialScenarios = [
    {
      prompt: "Someone is sitting all alone on the playground 🏫. What does Superhero do?",
      promptKn: "ಆಟದ ಮೈದಾನದಲ್ಲಿ ಒಬ್ಬನೇ ಕುಳಿತಿರುವ ಸ್ನೇಹಿತನನ್ನು ನೋಡಿದಾಗ ಸೂಪರ್‌ಹೀರೋ ಏನು ಮಾಡಬೇಕು?",
      options:
        ageGroup === 1
          ? [
              { text: "Invite them to join the game! 🤗", correct: true },
              { text: "Ignore them completely ❌", correct: false },
            ]
          : [
              { text: "Walk over and invite them to play with you! 🤗", correct: true },
              { text: "Point and laugh at them with others ❌", correct: false },
              { text: "Wait for the teacher to notice 😐", correct: false },
            ],
      successScene: "🌟 City Park Saved! The lonely friend is smiling and playing now!",
    },
    {
      prompt: "Your friend accidentally bumps into you and your tower falls 🧱. What does Superhero do?",
      promptKn: "ಸ್ನೇಹಿತ ಆಕಸ್ಮಿಕವಾಗಿ ನಿಮ್ಮ ಗೋಪುರ ಬೀಳಿಸಿದಾಗ ಸೂಪರ್‌ಹೀರೋ ಏನು ಮಾಡಬೇಕು?",
      options: [
        { text: "Say 'Accidents happen, let's build it together!' 🤝", correct: true },
        { text: "Push them back angrily 😠", correct: false },
        { text: "Scream and run away crying 😢", correct: false },
        ...(ageGroup === 3 ? [{ text: "Refuse to ever speak with them again ❌", correct: false }] : []),
      ],
      successScene: "🏢 City School Block Saved! Kindness restored peace!",
    },
    {
      prompt: "Your friend is sad about something that happened at home. What is the Superhero response?",
      promptKn: "ಸ್ನೇಹಿತ ಮನೆಯ ವಿಚಾರಕ್ಕೆ ಬೇಸರದಲ್ಲಿದ್ದಾನೆ. ಸೂಪರ್‌ಹೀರೋ ಅವರೊಂದಿಗೆ ಹೇಗೆ ನಡೆದುಕೊಳ್ಳಬೇಕು?",
      options: [
        { text: "Give them space and check in gently later ❤️", correct: true },
        { text: "Ask them loudly in front of everyone what happened 📢", correct: false },
        { text: "Make funny noises so they have to laugh 🤡", correct: false },
        ...(ageGroup === 3 ? [{ text: "Tell everyone their secrets 🤫", correct: false }] : []),
      ],
      successScene: "🏥 City Hospital District Saved! Empathy shield activated!",
    },
    {
      prompt: "You really want the toy someone else is playing with 🧸. What does Superhero do?",
      promptKn: "ಇನ್ನೊಬ್ಬರು ಆಡುವ ಆಟಿಕೆ ನಿಮಗೆ ಬೇಕಾದಾಗ ಏನು ಮಾಡಬೇಕು?",
      options: [
        { text: "Politely ask: 'Can I have a turn when you finish?' 🙏", correct: true },
        { text: "Grab it quickly when they look away 🦹", correct: false },
        { text: "Stomp feet and scream 😤", correct: false },
      ],
      successScene: "🚒 City Fire Station Block Saved! Sharing power unlocked!",
    },
    {
      prompt: "During group project, someone suggests an idea you didn't think of. What does Superhero do?",
      promptKn: "ಗುಂಪಿನ ಕೆಲಸದಲ್ಲಿ ಹೊಸ ಐಡಿಯಾ ಬಂದಾಗ ಸೂಪರ್‌ಹೀರೋ ಹೇಗೆ ಸ್ಪಂದಿಸಬೇಕು?",
      options: [
        { text: "Listen respectfully and combine ideas 🧠", correct: true },
        { text: "Say only my idea is good 🙅", correct: false },
        { text: "Quit the group angrily 🚪", correct: false },
      ],
      successScene: "🏙️ Downtown Metropolis Saved! Teamwork superhero victory!",
    },
  ].slice(0, roundsPerGame);

  // GAME 4: MEMORY CHAMPION
  const getCardSetForAge = useCallback(() => {
    let pairsCount = ageGroup === 1 ? 3 : ageGroup === 2 ? 6 : 10;
    const allEmojis = ["🦄", "🦁", "🚀", "🌈", "🍕", "🎮", "⚽", "🎸", "🏆", "💎", "⭐", "🎨"];
    const chosen = allEmojis.slice(0, pairsCount);
    const deck = [...chosen, ...chosen]
      .map((emoji, idx) => ({ id: idx, emoji, key: `${emoji}_${idx}` }))
      .sort(() => Math.random() - 0.5);
    return deck;
  }, [ageGroup]);

  // GAME 5: FINAL BOSS MIXED SKILLS
  // Boss character based on age:
  // Age 2-5: Friendly Dragon 🐉
  // Age 5-8: Space Villain 👾
  // Age 9-12: AI Robot 🤖
  const finalBossChar = ageGroup === 1 ? { name: "Sparky the Dragon", emoji: "🐉", color: "#10b981" } : ageGroup === 2 ? { name: "Nebula Lord", emoji: "👾", color: "#8b5cf6" } : { name: "Cortex AI Titan", emoji: "🤖", color: "#ef4444" };

  const finalBossRounds = [
    // Round 1: Emotion on boss face
    {
      type: "emotion",
      prompt: `Round 1: What emotion is ${finalBossChar.name} showing?`,
      promptKn: `ಹಂತ 1: ಬಾಸ್ ಯಾವ ಭಾವನೆ ತೋರಿಸುತ್ತಿದ್ದಾನೆ?`,
      bossEmotion: "Angry 😠",
      bossEmoji: "😠",
      options: ["Angry 😠", "Happy 😊", "Sleepy 😴"],
      correct: "Angry 😠",
    },
    // Round 2: Pattern on boss shield
    {
      type: "pattern",
      prompt: "Round 2: Crack the code on the Boss Shield!",
      promptKn: "ಹಂತ 2: ಬಾಸ್ ಗುರಾಣಿಯ ಕೋಡ್ ಒಡೆಯಿರಿ!",
      seq: ["⚡", "🔥", "⚡", "🔥", "❓"],
      options: ["⚡", "🔥", "💧"],
      correct: "⚡",
    },
    // Round 3: Social response to boss action
    {
      type: "social",
      prompt: "Round 3: The Boss challenges your kindness! What do you counter with?",
      promptKn: "ಹಂತ 3: ಬಾಸ್ ಸವಾಲಿಗೆ ನಿಮ್ಮ ಪ್ರೀತಿಯ ಉತ್ತರವೇನು?",
      options: [
        { text: "Kindness, calmness & super patience! 🛡️", correct: true },
        { text: "Screaming and throwing rocks 🪨", correct: false },
        { text: "Running away into the dark 🏃", correct: false },
      ],
      correct: "Kindness, calmness & super patience! 🛡️",
    },
    // Round 4: Sequence memory
    {
      type: "memory",
      prompt: "Round 4: Remember the Boss Power Combo: 🔴 ➡️ 🟡 ➡️ 🟢",
      promptKn: "ಹಂತ 4: ಬಾಸ್ ಶಕ್ತಿಯ ಅನುಕ್ರಮವನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ: 🔴 ➡️ 🟡 ➡️ 🟢",
      options: ["🔴 🟡 🟢", "🟢 🟡 🔴", "🟡 🔴 🟢"],
      correct: "🔴 🟡 🟢",
    },
    // Round 5: Rapid fire mixed challenge
    {
      type: "rapid",
      prompt: "Round 5: FINAL STRIKE! Which superpower heals all hearts?",
      promptKn: "ಹಂತ 5: ಅಂತಿಮ ಹೊಡೆತ! ಎಲ್ಲರ ಹೃದಯ ಗೆಲ್ಲುವ ಶಕ್ತಿ ಯಾವುದು?",
      options: ["Unconditional Love & Hard Work ❤️", "Anger 😤", "Giving up 🏳️"],
      correct: "Unconditional Love & Hard Work ❤️",
    },
  ].slice(0, roundsPerGame);

  // ── Round Countdown Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (stage === "playing") {
      // Age 2-5 has unlimited time, age 5-8 has 30s, age 9-12 has 15s (Game 2 decreases each round)
      let initialTime = ageGroup === 1 ? 999 : ageGroup === 2 ? 30 : 15;
      if (currentGameIdx === 1) {
        // Game 2 decreases each round: 30s -> 25s -> 20s -> 15s -> 10s
        initialTime = Math.max(10, 30 - currentRound * 5);
      }
      setRoundTimer(initialTime);

      if (ageGroup !== 1) {
        gameTimerRef.current = setInterval(() => {
          setRoundTimer((t) => {
            if (t <= 1) {
              clearInterval(gameTimerRef.current);
              handleRoundTimeout();
              return 0;
            }
            return t - 1;
          });
        }, 1000);
      }
      return () => clearInterval(gameTimerRef.current);
    }
  }, [stage, currentGameIdx, currentRound, ageGroup]);

  // Round timeout handler
  const handleRoundTimeout = () => {
    playHit();
    speak(language === "kn" ? "ಸಮಯ ಮುಗಿಯಿತು! ಮುಂದಿನ ಸವಾಲು!" : "Time's up! Let's try the next challenge!", language);
    advanceToNextRound(false);
  };

  // ── Card flipping logic for Game 4 ──────────────────────────────────────────
  useEffect(() => {
    if (currentGameIdx === 3 && stage === "playing") {
      const cards = getCardSetForAge();
      setMemoryCards(cards);
      setFlippedCards([]);
      setMatchedCards([]);
    }
  }, [currentGameIdx, stage, currentRound, getCardSetForAge]);

  const handleCardClick = (card) => {
    if (flippedCards.length === 2 || matchedCards.includes(card.key) || flippedCards.some((c) => c.key === card.key)) {
      return;
    }
    const nextFlipped = [...flippedCards, card];
    setFlippedCards(nextFlipped);
    playTone(400, "sine", 0.1);

    if (nextFlipped.length === 2) {
      if (nextFlipped[0].emoji === nextFlipped[1].emoji) {
        // Match!
        playTone(600, "sine", 0.2);
        const newMatched = [...matchedCards, nextFlipped[0].key, nextFlipped[1].key];
        setMatchedCards(newMatched);
        setFlippedCards([]);
        // Check if all matched
        if (newMatched.length >= memoryCards.length) {
          speakCelebration(language);
          playTone(784, "sine", 0.4);
          setTimeout(() => {
            advanceToNextRound(true);
          }, 800);
        }
      } else {
        // No match
        setTimeout(() => setFlippedCards([]), ageGroup === 1 ? 4000 : ageGroup === 2 ? 2000 : 1000);
      }
    }
  };

  // ── Advancing through rounds and games ──────────────────────────────────────
  const advanceToNextRound = (won) => {
    if (won) {
      playTone(523, "sine", 0.15);
      setHeroScale((s) => Math.min(1.4, s + 0.08));
      setBossScale((s) => Math.max(0.6, s - 0.08));
    } else {
      playHit();
      setPlayerHearts((h) => Math.max(0, h - 1));
      setBossScale((s) => Math.min(1.4, s + 0.08));
    }

    // Reset round-specific interactive card states
    setFlippedCards([]);
    setMatchedCards([]);

    const updatedWon = (gameScores[currentGameIdx]?.roundsWon || 0) + (won ? 1 : 0);

    setGameScores((prev) => {
      const copy = [...prev];
      if (copy[currentGameIdx]) {
        copy[currentGameIdx].roundsWon = updatedWon;
      }
      return copy;
    });

    const nextRound = currentRound + 1;
    if (nextRound < roundsPerGame) {
      setCurrentRound(nextRound);
    } else {
      // Game completed! Calculate stars: 0 to 3
      finishCurrentGame(updatedWon);
    }
  };

  const finishCurrentGame = (finalWonCount) => {
    const wonCount = typeof finalWonCount === "number" ? finalWonCount : (gameScores[currentGameIdx]?.roundsWon || 0);
    let starsEarned = 1;
    const pct = wonCount / roundsPerGame;
    if (pct >= 0.8) starsEarned = 3;
    else if (pct >= 0.5) starsEarned = 2;

    setGameScores((prev) => {
      const copy = [...prev];
      if (copy[currentGameIdx]) {
        copy[currentGameIdx].stars = starsEarned;
        copy[currentGameIdx].dominantEmotion = currentEmotion;
      }
      return copy;
    });

    playFanfare();
    if (currentGameIdx < 4) {
      setStage("intermission");
      speak(
        language === "kn"
          ? `ಅದ್ಭುತ! ಆಟ ${currentGameIdx + 1} ಮುಗಿಯಿತು! ಮುಂದಿನ ಸವಾಲಿಗೆ ಸಿದ್ಧರಾಗಿ!`
          : `Awesome! Challenge ${currentGameIdx + 1} completed! Get ready for the next one!`,
        language
      );
    } else {
      // All 5 games done! Final Victory!
      finishMasteryExam();
    }
  };

  const startNextGame = () => {
    setCurrentGameIdx((prev) => prev + 1);
    setCurrentRound(0);
    setHeroScale(1);
    setBossScale(1);
    setPlayerHearts(3);
    setStage("playing");
  };

  const finishMasteryExam = async () => {
    setStage("results");
    setShowConfetti(true);
    playFanfare();
    speak(
      language === "kn"
        ? "ಅಭಿನಂದನೆಗಳು ಸೂಪರ್‌ಹೀರೋ! ನೀವು ಎಲ್ಲಾ 5 ಸವಾಲುಗಳನ್ನು ಗೆದ್ದಿದ್ದೀರಿ!"
        : "Incredible Superhero! You conquered all 5 Challenge Games!",
      language
    );

    const totalStars = gameScores.reduce((sum, g) => sum + g.stars, 0);

    const payload = {
      totalStars,
      childAge,
      childLevel,
      timeTaken: 180,
      emotionData: emotionCounts,
      gameResults: [
        {
          gameNumber: 1,
          gameId: "emotion_boss",
          gameName: "Emotion Boss Battle",
          skillTested: "Facial Emotion Recognition",
          stars: gameScores[0].stars,
          roundsWon: gameScores[0].roundsWon,
          roundsTotal: roundsPerGame,
          dominantEmotion: gameScores[0].dominantEmotion,
        },
        {
          gameNumber: 2,
          gameId: "pattern_master",
          gameName: "Pattern Master",
          skillTested: "Cognitive Pattern Completion",
          stars: gameScores[1].stars,
          roundsWon: gameScores[1].roundsWon,
          roundsTotal: roundsPerGame,
          dominantEmotion: gameScores[1].dominantEmotion,
        },
        {
          gameNumber: 3,
          gameId: "social_superhero",
          gameName: "Social Superhero",
          skillTested: "Social Scenarios & Empathy",
          stars: gameScores[2].stars,
          roundsWon: gameScores[2].roundsWon,
          roundsTotal: roundsPerGame,
          dominantEmotion: gameScores[2].dominantEmotion,
        },
        {
          gameNumber: 4,
          gameId: "memory_champion",
          gameName: "Memory Champion",
          skillTested: "Visual Working Memory",
          stars: gameScores[3].stars,
          roundsWon: gameScores[3].roundsWon,
          roundsTotal: roundsPerGame,
          dominantEmotion: gameScores[3].dominantEmotion,
        },
        {
          gameNumber: 5,
          gameId: "final_boss",
          gameName: "Final Boss Mixed Skills",
          skillTested: "Cognitive Flexibility Switching",
          stars: gameScores[4].stars,
          roundsWon: gameScores[4].roundsWon,
          roundsTotal: roundsPerGame,
          dominantEmotion: gameScores[4].dominantEmotion,
        },
      ],
    };

    try {
      await submitChallengeExam(child._id, payload);
    } catch (err) {
      console.warn("Challenge submission saved locally:", err);
    }
  };

  const handleDownloadPDF = () => {
    const totalStars = gameScores.reduce((sum, g) => sum + g.stars, 0);
    const status =
      totalStars === 15
        ? "MASTERY ACHIEVED"
        : totalStars >= 12
        ? "NEAR MASTERY"
        : totalStars >= 8
        ? "PROGRESSING"
        : "NEEDS PRACTICE";

    generateChallengeExamPDF({
      child: { name: childName, age: childAge, level: childLevel },
      totalStars,
      masteryStatus: status,
      gameResults: [
        { gameName: "Emotion Boss Battle", skillTested: "Facial Emotion Recognition", stars: gameScores[0].stars, dominantEmotion: gameScores[0].dominantEmotion },
        { gameName: "Pattern Master", skillTested: "Cognitive Pattern Completion", stars: gameScores[1].stars, dominantEmotion: gameScores[1].dominantEmotion },
        { gameName: "Social Superhero", skillTested: "Social Scenarios & Empathy", stars: gameScores[2].stars, dominantEmotion: gameScores[2].dominantEmotion },
        { gameName: "Memory Champion", skillTested: "Visual Working Memory", stars: gameScores[3].stars, dominantEmotion: gameScores[3].dominantEmotion },
        { gameName: "Final Boss Mixed Skills", skillTested: "Cognitive Flexibility Switching", stars: gameScores[4].stars, dominantEmotion: gameScores[4].dominantEmotion },
      ],
      emotionData: emotionCounts,
      calmDownCount,
    });
  };

  /* ──────────────────────────────────────────────────────────────────────────
     RENDER VIEWS
  ────────────────────────────────────────────────────────────────────────── */

  // 1. INTRO / DASHBOARD UNLOCKED SCREEN
  if (stage === "intro") {
    return (
      <div
        ref={containerRef}
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4f46e5 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Nunito', system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: "10px" }}>
          <button
            onClick={() => setLanguage(language === "en" ? "kn" : "en")}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "16px",
              padding: "8px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            🌐 {language === "en" ? "ಕನ್ನಡ" : "English"}
          </button>
          <button
            onClick={toggleFullscreen}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.4)",
              borderRadius: "16px",
              padding: "8px 16px",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            ⛶ {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>

        {/* Center Card */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            backdropFilter: "blur(16px)",
            borderRadius: "32px",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            padding: "40px 32px",
            maxWidth: "600px",
            width: "100%",
            textAlign: "center",
            boxShadow: "0 25px 60px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ fontSize: "4.5rem", marginBottom: "12px", animation: "bounce 1.5s infinite" }}>🏆</div>
          <div
            style={{
              background: "linear-gradient(90deg, #f59e0b, #ef4444)",
              color: "#fff",
              display: "inline-block",
              padding: "6px 20px",
              borderRadius: "99px",
              fontWeight: 900,
              fontSize: "0.95rem",
              letterSpacing: "1px",
              marginBottom: "14px",
            }}
          >
            {language === "kn" ? "ಸವಾಲು ದಿನ ತೆರೆದಿದೆ!" : "CHALLENGE MODE UNLOCKED!"}
          </div>

          <h1 style={{ fontSize: "2.1rem", fontWeight: 900, margin: "0 0 12px 0", lineHeight: 1.2 }}>
            {language === "kn" ? `${childName}, ನಿಮ್ಮ ಶಕ್ತಿಗಳನ್ನು ತೋರಿಸಿ!` : `Show Your Superpowers, ${childName}!`}
          </h1>

          <p style={{ fontSize: "1.1rem", color: "#e0e7ff", lineHeight: 1.6, marginBottom: "24px" }}>
            {language === "kn"
              ? "ನೀವು 7 ದಿನಗಳಿಂದ ತರಬೇತಿ ಪಡೆದಿದ್ದೀರಿ! 5 ಅದ್ಭುತ ಆಟಗಳ ಸವಾಲುಗಳು ನಿಮಗಾಗಿ ಕಾಯುತ್ತಿವೆ! ಎಲ್ಲವನ್ನೂ ಗೆಲ್ಲಲು ನೀವು ಸಿದ್ಧರೇ?"
              : "You have been practicing for 7 days! 5 Special Challenge Games await you! Can you beat all the bosses and save the city?"}
          </p>

          {/* 5 Games Preview Badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "28px" }}>
            {[
              { label: "1. Emotion Boss 👹", color: "#ec4899" },
              { label: "2. Pattern Master 🧩", color: "#8b5cf6" },
              { label: "3. Social Hero 🦸", color: "#3b82f6" },
              { label: "4. Memory Champ 🃏", color: "#10b981" },
              { label: "5. Final Boss 👾", color: "#f59e0b" },
            ].map((g, i) => (
              <span
                key={i}
                style={{
                  background: `${g.color}33`,
                  border: `1.5px solid ${g.color}`,
                  color: "#fff",
                  padding: "5px 12px",
                  borderRadius: "16px",
                  fontSize: "0.82rem",
                  fontWeight: 800,
                }}
              >
                {g.label}
              </span>
            ))}
          </div>

          <button
            onClick={() => {
              setStage("playing");
              speak(
                language === "kn"
                  ? "ಸವಾಲು ಪ್ರಾರಂಭವಾಗಿದೆ! ಭಾವನೆಗಳ ಬಾಸ್ ಎದುರಿಸಿ!"
                  : "Challenge Accepted! Face the Emotion Boss!",
                language
              );
            }}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "#fff",
              border: "none",
              padding: "18px 48px",
              borderRadius: "28px",
              fontSize: "1.3rem",
              fontWeight: 900,
              cursor: "pointer",
              boxShadow: "0 10px 30px rgba(16, 185, 129, 0.5)",
              transition: "transform 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            {language === "kn" ? "ಸವಾಲನ್ನು ಸ್ವೀಕರಿಸಿ! 🚀" : "Accept Challenge! →"}
          </button>
        </div>
      </div>
    );
  }

  // 2. 60-SECOND CALM-DOWN SCREEN (If child is Angry or Fearful for >30s)
  if (stage === "calmdown") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0f172a",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Nunito', system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "5rem", animation: "breatheCircle 4s ease-in-out infinite" }}>🌸</div>
        <h2 style={{ fontSize: "2rem", fontWeight: 900, margin: "16px 0 8px" }}>
          {language === "kn" ? "ಶಾಂತತೆಯ ವಿರಾಮ 🌿" : "Calm Down Breather 🌿"}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "1.1rem", maxWidth: "480px" }}>
          {language === "kn"
            ? "ದೀರ್ಘವಾಗಿ ಉಸಿರು ತೆಗೆದುಕೊಳ್ಳಿ ಮತ್ತು ನಿಧಾನವಾಗಿ ಬಿಡಿ. ನೀವು ತುಂಬಾ ಒಳ್ಳೆಯ ಪ್ರಯತ್ನ ಮಾಡುತ್ತಿದ್ದೀರಿ!"
            : "Take a deep breath in... and gently breathe out. You are doing so well! The challenge is waiting for you."}
        </p>

        {/* Breathing Circle */}
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "4px solid #38bdf8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "24px 0",
            animation: "breathePulse 4s ease-in-out infinite",
          }}
        >
          <span style={{ fontSize: "2rem", fontWeight: 900, color: "#38bdf8" }}>{calmDownTimer}s</span>
        </div>

        <button
          onClick={() => {
            clearInterval(calmDownIntervalRef.current);
            setStage("playing");
          }}
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.4)",
            color: "#fff",
            padding: "10px 24px",
            borderRadius: "20px",
            cursor: "pointer",
            fontWeight: 800,
          }}
        >
          {language === "kn" ? "ನಾನು ಸಿದ್ಧನಿದ್ದೇನೆ →" : "I'm feeling calm now →"}
        </button>
        <style>{`
          @keyframes breathePulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.3); opacity: 1; border-color: #a855f7; }
          }
        `}</style>
      </div>
    );
  }

  // 3. INTERMISSION BETWEEN GAMES
  if (stage === "intermission") {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          fontFamily: "'Nunito', system-ui, sans-serif",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "4.5rem", animation: "bounce 1s infinite" }}>🎉</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: 900, margin: "12px 0" }}>
          {language === "kn"
            ? `ಅದ್ಭುತ! ಆಟ ${currentGameIdx + 1} ಪೂರ್ಣಗೊಂಡಿದೆ!`
            : `Challenge ${currentGameIdx + 1} Conquered!`}
        </h2>
        <div style={{ fontSize: "1.8rem", margin: "10px 0" }}>
          {"⭐".repeat(gameScores[currentGameIdx].stars)}
          {"☆".repeat(3 - gameScores[currentGameIdx].stars)}
        </div>
        <p style={{ color: "#a7f3d0", fontSize: "1.1rem", maxWidth: "450px", marginBottom: "28px" }}>
          {language === "kn"
            ? "ನೀವು ಅದ್ಭುತವಾಗಿ ಆಡುತ್ತಿದ್ದೀರಿ! ಮುಂದಿನ ಸವಾಲು ಇನ್ನೂ ರೋಮಾಂಚನಕಾರಿಯಾಗಿದೆ!"
            : "You are showing real superpower mastery! The next boss challenge is ready for you!"}
        </p>

        <button
          onClick={startNextGame}
          style={{
            background: "linear-gradient(135deg, #f59e0b, #d97706)",
            color: "#fff",
            border: "none",
            padding: "16px 40px",
            borderRadius: "26px",
            fontSize: "1.2rem",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.4)",
          }}
        >
          {language === "kn" ? "ಮುಂದಿನ ಸವಾಲು ಪ್ರಾರಂಭಿಸಿ →" : `Start Game ${currentGameIdx + 2} →`}
        </button>
      </div>
    );
  }

  // 4. FINAL RESULTS & CERTIFICATE SCREEN
  if (stage === "results") {
    const totalStars = gameScores.reduce((sum, g) => sum + g.stars, 0);
    const masteryStatus =
      totalStars === 15
        ? "MASTERY ACHIEVED"
        : totalStars >= 12
        ? "NEAR MASTERY"
        : totalStars >= 8
        ? "PROGRESSING"
        : "NEEDS PRACTICE";

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
          color: "#fff",
          padding: "30px 20px",
          fontFamily: "'Nunito', system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <ConfettiOverlay active={showConfetti} />

        <div
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(14px)",
            borderRadius: "32px",
            border: "2px solid rgba(255, 255, 255, 0.3)",
            maxWidth: "680px",
            width: "100%",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          }}
        >
          <div style={{ fontSize: "5rem", marginBottom: "8px" }}>🏆</div>
          <div
            style={{
              background: totalStars === 15 ? "#10b981" : totalStars >= 12 ? "#f59e0b" : "#3b82f6",
              color: "#fff",
              display: "inline-block",
              padding: "6px 20px",
              borderRadius: "99px",
              fontWeight: 900,
              fontSize: "1rem",
              marginBottom: "12px",
            }}
          >
            {masteryStatus}
          </div>

          <h1 style={{ fontSize: "2rem", fontWeight: 900, margin: "0 0 6px" }}>
            {childName} - Superhero Champion!
          </h1>
          <div style={{ fontSize: "2rem", color: "#fbbf24", margin: "10px 0" }}>
            {totalStars} / 15 ⭐
          </div>

          {/* 5 Games Breakdown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "20px 0", textAlign: "left" }}>
            {[
              { name: "1. Emotion Boss 👹", stars: gameScores[0].stars },
              { name: "2. Pattern Master 🧩", stars: gameScores[1].stars },
              { name: "3. Social Superhero 🦸", stars: gameScores[2].stars },
              { name: "4. Memory Champ 🃏", stars: gameScores[3].stars },
              { name: "5. Final Boss 👾", stars: gameScores[4].stars },
            ].map((g, i) => (
              <div
                key={i}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  borderRadius: "16px",
                  padding: "10px 14px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{g.name}</span>
                <span style={{ color: "#fbbf24", fontWeight: 800 }}>{"⭐".repeat(g.stars)}</span>
              </div>
            ))}
          </div>

          {/* Level Upgrade Callout if 15 Stars */}
          {totalStars === 15 && (
            <div
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))",
                border: "2px solid #10b981",
                borderRadius: "20px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: "0 0 4px", color: "#6ee7b7" }}>✨ Full Mastery Achieved!</h3>
              <p style={{ margin: 0, fontSize: "0.88rem", color: "#e6fffa" }}>
                Therapist has been automatically notified to review and upgrade {childName} to Level {childLevel + 1}!
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={handleDownloadPDF}
              style={{
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                border: "none",
                padding: "14px 28px",
                borderRadius: "20px",
                fontWeight: 900,
                fontSize: "1rem",
                cursor: "pointer",
                boxShadow: "0 6px 18px rgba(245, 158, 11, 0.4)",
              }}
            >
              📄 Download Clinical PDF Report
            </button>
            <button
              onClick={() => navigate("/activities")}
              style={{
                background: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.4)",
                padding: "14px 28px",
                borderRadius: "20px",
                fontWeight: 800,
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              Back to Dashboard →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 5. ACTIVE GAME PLAYING SCREEN
  const currentGameNames = [
    { title: "Game 1: Emotion Boss Battle 👹", titleKn: "ಆಟ 1: ಭಾವನೆಗಳ ಬಾಸ್ ಕಾಳಗ" },
    { title: "Game 2: Pattern Master 🧩", titleKn: "ಆಟ 2: ವಿನ್ಯಾಸ ಮಾಸ್ಟರ್" },
    { title: "Game 3: Social Superhero 🦸", titleKn: "ಆಟ 3: ಸೋಷಿಯಲ್ ಸೂಪರ್‌ಹೀರೋ" },
    { title: "Game 4: Memory Champion 🃏", titleKn: "ಆಟ 4: ನೆನಪಿನ ಚಾಂಪಿಯನ್" },
    { title: "Game 5: Final Boss Mixed Skills 👾", titleKn: "ಆಟ 5: ಅಂತಿಮ ಬಾಸ್ ಮಿಶ್ರ ಕೌಶಲ್ಯ" },
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #172554 100%)",
        color: "#fff",
        fontFamily: "'Nunito', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ── Top Bar ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "14px 24px",
          background: "rgba(15, 23, 42, 0.8)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div>
          <div style={{ fontSize: "0.75rem", color: "#fbbf24", fontWeight: 900, textTransform: "uppercase" }}>
            🏆 CHALLENGE MODE &bull; {language === "kn" ? "ಪರೀಕ್ಷೆ ಅಲ್ಲ, ಸವಾಲಿನ ಆಟ!" : "Not an Exam — Challenge Day!"}
          </div>
          <h2 style={{ margin: "2px 0 0", fontSize: "1.2rem", fontWeight: 900 }}>
            {language === "kn" ? currentGameNames[currentGameIdx].titleKn : currentGameNames[currentGameIdx].title}
          </h2>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Hearts */}
          <div style={{ display: "flex", gap: "4px", fontSize: "1.3rem" }}>
            {[1, 2, 3].map((h) => (
              <span key={h} style={{ opacity: h <= playerHearts ? 1 : 0.2 }}>
                ❤️
              </span>
            ))}
          </div>

          {/* Timer */}
          {ageGroup !== 1 && (
            <div
              style={{
                background: roundTimer <= 5 ? "#ef4444" : "rgba(255,255,255,0.15)",
                padding: "4px 12px",
                borderRadius: "14px",
                fontWeight: 900,
                fontSize: "0.9rem",
              }}
            >
              ⏱ {roundTimer}s
            </div>
          )}

          {/* Fullscreen & Lang */}
          <button
            onClick={toggleFullscreen}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "12px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            ⛶
          </button>
        </div>
      </div>

      {/* ── Main Game Arena + Floating Camera Emotion Detector ── */}
      <div style={{ flex: 1, display: "flex", padding: "20px", gap: "20px", maxWidth: "1100px", margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        
        {/* Arena Left / Center */}
        <div
          style={{
            flex: 1,
            background: "rgba(255, 255, 255, 0.06)",
            borderRadius: "28px",
            border: "2px solid rgba(255, 255, 255, 0.15)",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {/* Round progress indicator */}
          <div style={{ position: "absolute", top: 16, left: 24, fontSize: "0.85rem", color: "#94a3b8", fontWeight: 800 }}>
            Round {currentRound + 1} of {roundsPerGame}
          </div>

          {/* GAME 1: EMOTION BOSS BATTLE */}
          {currentGameIdx === 0 && (
            <div style={{ textAlign: "center", width: "100%", maxWidth: "500px" }}>
              {/* Boss character */}
              <div
                style={{
                  transform: `scale(${bossScale})`,
                  transition: "transform 0.3s ease",
                  marginBottom: "16px",
                }}
              >
                <div style={{ fontSize: "5rem" }}>
                  {bossFaceHidden ? "❓" : emotionBossEmotions[currentRound]?.emoji}
                </div>
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid #ef4444",
                    borderRadius: "14px",
                    padding: "4px 12px",
                    display: "inline-block",
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: "#fca5a5",
                    marginTop: "6px",
                  }}
                >
                  Boss: "Can you tell how I am feeling? Quick!"
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "20px" }}>
                {emotionBossEmotions[currentRound]?.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const isCorrect = opt.includes(emotionBossEmotions[currentRound]?.name);
                      advanceToNextRound(isCorrect);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "2px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                      padding: "16px",
                      borderRadius: "18px",
                      fontSize: "1.1rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 2: PATTERN MASTER */}
          {currentGameIdx === 1 && (
            <div style={{ textAlign: "center", width: "100%", maxWidth: "550px" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: "0 0 16px" }}>
                {language === "kn" ? patternRounds[currentRound]?.titleKn : patternRounds[currentRound]?.title}
              </h3>

              {/* Pattern Sequence Strip */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "12px",
                  background: "rgba(255,255,255,0.1)",
                  padding: "18px",
                  borderRadius: "20px",
                  marginBottom: "24px",
                }}
              >
                {patternRounds[currentRound]?.seq.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "2.2rem",
                      background: item === "❓" ? "rgba(245,158,11,0.3)" : "none",
                      padding: item === "❓" ? "4px 12px" : "0",
                      borderRadius: "12px",
                      border: item === "❓" ? "2px dashed #f59e0b" : "none",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>

              {/* Choices */}
              <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap" }}>
                {patternRounds[currentRound]?.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const isCorrect = opt.startsWith(patternRounds[currentRound]?.correct);
                      advanceToNextRound(isCorrect);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.12)",
                      border: "2px solid rgba(255,255,255,0.3)",
                      color: "#fff",
                      padding: "14px 24px",
                      borderRadius: "16px",
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "transform 0.1s",
                    }}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 3: SOCIAL SUPERHERO */}
          {currentGameIdx === 2 && (
            <div style={{ textAlign: "center", width: "100%", maxWidth: "600px" }}>
              <div style={{ fontSize: "3.5rem", marginBottom: "8px" }}>🦸</div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.5 }}>
                {language === "kn" ? socialScenarios[currentRound]?.promptKn : socialScenarios[currentRound]?.prompt}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {socialScenarios[currentRound]?.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (opt.correct) {
                        setCityBlocksSaved((b) => b + 1);
                        speak("City Block Saved! Heroic decision!", language);
                      }
                      advanceToNextRound(opt.correct);
                    }}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "2px solid rgba(255,255,255,0.25)",
                      color: "#fff",
                      padding: "16px 20px",
                      borderRadius: "18px",
                      fontSize: "1rem",
                      fontWeight: 800,
                      textAlign: "left",
                      cursor: "pointer",
                    }}
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GAME 4: MEMORY CHAMPION */}
          {currentGameIdx === 3 && (
            <div style={{ textAlign: "center", width: "100%" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "1.1rem" }}>Find all matching pairs!</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${ageGroup === 1 ? 3 : ageGroup === 2 ? 4 : 5}, 1fr)`,
                  gap: "10px",
                  maxWidth: "500px",
                  margin: "0 auto",
                }}
              >
                {memoryCards.map((card) => {
                  const isFlipped = flippedCards.some((c) => c.key === card.key) || matchedCards.includes(card.key);
                  return (
                    <button
                      key={card.key}
                      onClick={() => handleCardClick(card)}
                      style={{
                        height: ageGroup === 1 ? "90px" : "75px",
                        background: isFlipped ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg, #4f46e5, #4338ca)",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderRadius: "16px",
                        fontSize: isFlipped ? "2rem" : "1.2rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.2s",
                      }}
                    >
                      {isFlipped ? card.emoji : "❓"}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* GAME 5: FINAL BOSS MIXED SKILLS */}
          {currentGameIdx === 4 && (
            <div style={{ textAlign: "center", width: "100%", maxWidth: "520px" }}>
              <div style={{ fontSize: "5rem", marginBottom: "8px" }}>{finalBossChar.emoji}</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 900, margin: "0 0 12px" }}>
                {finalBossChar.name} - Final Challenge!
              </h3>
              <p style={{ color: "#cbd5e1", fontSize: "1rem", margin: "0 0 20px" }}>
                {language === "kn" ? finalBossRounds[currentRound]?.promptKn : finalBossRounds[currentRound]?.prompt}
              </p>

              {/* Final Boss Choices */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "10px" }}>
                {finalBossRounds[currentRound]?.options.map((opt, i) => {
                  const text = typeof opt === "string" ? opt : opt.text;
                  const isCorrect = typeof opt === "string" ? opt === finalBossRounds[currentRound]?.correct : opt.correct;
                  return (
                    <button
                      key={i}
                      onClick={() => advanceToNextRound(isCorrect)}
                      style={{
                        background: "rgba(255,255,255,0.12)",
                        border: "2px solid rgba(255,255,255,0.3)",
                        color: "#fff",
                        padding: "14px 20px",
                        borderRadius: "16px",
                        fontSize: "1.05rem",
                        fontWeight: 800,
                        cursor: "pointer",
                      }}
                    >
                      {text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Vision Camera & Telemetry Panel (Right Side) */}
        <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Emotion Camera View */}
          <div
            style={{
              background: "rgba(15, 23, 42, 0.7)",
              borderRadius: "20px",
              padding: "12px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "#38bdf8", marginBottom: "8px", textTransform: "uppercase" }}>
              🎥 Camera FER Vision AI
            </div>
            <div style={{ borderRadius: "14px", overflow: "hidden", height: "160px" }}>
              <EmotionDetector isActive={true} onEmotionDetected={handleEmotionDetected} />
            </div>
            <div style={{ marginTop: "10px", fontSize: "0.78rem", color: "#94a3b8" }}>
              Tracking: <strong>{currentEmotion}</strong>
              {negativeEmotionSecs > 0 && (
                <div style={{ color: "#f87171", marginTop: "4px" }}>
                  Calm trigger in: {30 - negativeEmotionSecs}s
                </div>
              )}
            </div>
          </div>

          {/* Superpower status card */}
          <div
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              padding: "16px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
            }}
          >
            <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "#fbbf24", marginBottom: "6px" }}>
              ⚡ Superpower Gauge
            </div>
            <div style={{ height: "10px", background: "rgba(255,255,255,0.2)", borderRadius: "10px", overflow: "hidden" }}>
              <div
                style={{
                  height: "100%",
                  width: `${((currentGameIdx * roundsPerGame + currentRound + 1) / (5 * roundsPerGame)) * 100}%`,
                  background: "linear-gradient(90deg, #10b981, #3b82f6)",
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "8px" }}>
              Age {childAge} &bull; Level {childLevel} Challenge
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
