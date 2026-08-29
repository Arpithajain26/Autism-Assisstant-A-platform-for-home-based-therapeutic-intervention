// TherapeuticGames.jsx – All 10 animated therapeutic games for Autism Assistant
// ------------------------------------------------------------
// This file is self‑contained and uses only inline styles / CSS keyframes.
// It integrates with the existing codebase via the `logSession` API located at ../services/api.
// ------------------------------------------------------------

import React, { useState, useEffect, useRef } from "react";
import { logSession } from "../services/api";

// ------------------------------------------------------------
// Utility Hooks
// ------------------------------------------------------------
/** Language toggle hook – returns current language and a translation helper */
const useLanguageToggle = () => {
  const [lang, setLang] = useState("en"); // "en" or "kn"
  const toggle = () => setLang((prev) => (prev === "en" ? "kn" : "en"));
  const t = (dict) => dict[lang] || dict["en"];
  return { lang, toggle, t };
};
/** Difficulty hook – returns config based on child age */
const useDifficulty = (age) => {
  const level = age <= 4 ? 1 : age <= 6 ? 2 : age <= 9 ? 3 : 4;
  const configs = {
    1: { targetSize: 100, maxItems: 5, timeLimit: 3 * 60, reward: "every", reading: false, audio: true },
    2: { targetSize: 70, maxItems: 8, timeLimit: 5 * 60, reward: "every3", reading: true, audio: false },
    3: { targetSize: 50, maxItems: 12, timeLimit: 8 * 60, reward: "completion", reading: true, audio: false },
    4: { targetSize: 40, maxItems: 15, timeLimit: 10 * 60, reward: "points", reading: true, audio: false },
  };
  return { level, config: configs[level] };
};
/** Full‑screen handling hook */
const useFullScreen = (setActiveGame) => {
  const openGame = (gameId) => {
    setActiveGame(gameId);
    document.body.style.overflow = "hidden";
    document.documentElement.requestFullscreen?.().catch(() => {});
  };
  const closeGame = () => {
    setActiveGame(null);
    document.body.style.overflow = "auto";
    document.exitFullscreen?.().catch(() => {});
  };
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") closeGame();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  return { openGame, closeGame };
};
/** Session logger – records start time and sends log on completion */
const useSessionLogger = (gameId) => {
  const startRef = useRef(Date.now());
  const handleComplete = async (score, extra = {}) => {
    const child = JSON.parse(localStorage.getItem("currentChild") || "{}") || {};
    const age = child.age || 6;
    const difficulty = age <= 4 ? 1 : age <= 6 ? 2 : age <= 9 ? 3 : 4;
    await logSession({
      childId: child._id,
      activityId: gameId,
      score,
      emotion: extra.emotion || "neutral",
      duration: Math.floor((Date.now() - startRef.current) / 60000),
      completedAt: new Date(),
      difficulty,
      ageGroup: age,
    });
  };
  return handleComplete;
};

// ------------------------------------------------------------
// Common UI Components
// ------------------------------------------------------------
const TakeawayScreen = ({ childName, score, takeaway, onPlayAgain, onNextGame, onBack }) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #1e1b4b, #312e81)",
      zIndex: 99999,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎓</div>
    <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "white", marginBottom: "8px" }}>
      Great job {childName}!
    </div>
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: "16px",
        padding: "24px",
        maxWidth: "500px",
        marginBottom: "24px",
      }}
    >
      <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", marginBottom: "12px", letterSpacing: "1px" }}>
        🧩 WHAT THIS GAME TEACHES
      </div>
      <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.95rem", lineHeight: "1.7" }}>{takeaway}</div>
    </div>
    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
      <button onClick={onPlayAgain}>Play Again</button>
      <button onClick={onNextGame}>Next Game</button>
      <button onClick={onBack}>Back to Games</button>
    </div>
  </div>
);
const DifficultyBadge = ({ age }) => {
  const d = age <= 4 ? 1 : age <= 6 ? 2 : age <= 9 ? 3 : 4;
  const labels = ["", "Beginner", "Elementary", "Intermediate", "Advanced"];
  const colors = ["", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];
  return (
    <span
      style={{
        background: colors[d] + "22",
        color: colors[d],
        padding: "3px 10px",
        borderRadius: "99px",
        fontSize: "0.75rem",
        fontWeight: 700,
      }}
    >
      {"⭐".repeat(d)} {labels[d]}
    </span>
  );
};
const LanguageToggle = ({ lang, toggle }) => (
  <button onClick={toggle} style={{ marginLeft: 8 }}>
    {lang === "en" ? "EN / ಕನ್ನಡ" : "ಕನ್ನಡ / EN"}
  </button>
);
const GameCard = ({ title, description, age, onPlay }) => (
  <div
    style={{
      background: "white",
      borderRadius: 16,
      padding: 16,
      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "100%",
    }}
  >
    <h3 style={{ margin: 0, fontSize: "1.2rem" }}>{title}</h3>
    <p style={{ flexGrow: 1 }}>{description}</p>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <DifficultyBadge age={age} />
      <button onClick={onPlay}>Play</button>
    </div>
  </div>
);

// ------------------------------------------------------------
// Game Wrapper – Handles fullscreen, logging, takeaway overlay
// ------------------------------------------------------------
const GameWrapper = ({ gameId, GameComponent, takeawayText, onClose }) => {
  const child = JSON.parse(localStorage.getItem("currentChild") || "{}") || {};
  const childName = child.name || "Friend";
  const [showTakeaway, setShowTakeaway] = useState(false);
  const [score, setScore] = useState(0);
  const logComplete = useSessionLogger(gameId);
  const handleComplete = async (finalScore, extra) => {
    setScore(finalScore);
    await logComplete(finalScore, extra);
    setShowTakeaway(true);
  };
  const handlePlayAgain = () => {
    setShowTakeaway(false);
    setScore(0);
  };
  const handleNextGame = () => {
    onClose();
  };
  return (
    <div style={{ position: "relative", background: "#0f172a", minHeight: "100vh" }}>
      <GameComponent onComplete={handleComplete} />
      {showTakeaway && (
        <TakeawayScreen
          childName={childName}
          score={score}
          takeaway={takeawayText}
          onPlayAgain={handlePlayAgain}
          onNextGame={handleNextGame}
          onBack={onClose}
        />
      )}
    </div>
  );
};

// ------------------------------------------------------------
// Helper – fire confetti (optional CDN fallback)
// ------------------------------------------------------------
const fireConfetti = () => {
  if (window.confetti) {
    window.confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  }
};

// ------------------------------------------------------------
// Individual Game Implementations (simplified but functional)
// ------------------------------------------------------------
// 1. Emotion Mirror
const EmotionMirror = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const emotionsByLevel = {
    1: ["happy", "sad", "angry"],
    2: ["happy", "sad", "angry", "scared", "surprised"],
    3: ["happy", "sad", "angry", "scared", "surprised", "disgusted", "confused"],
    4: ["happy", "sad", "angry", "scared", "surprised", "disgusted", "confused", "proud", "embarrassed", "jealous", "bored"],
  };
  const emotions = emotionsByLevel[level];
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const handleSelect = (em) => {
    const correct = em === emotions[currentIdx];
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    } else {
      const face = document.getElementById("face");
      if (face) {
        face.classList.add("shake");
        setTimeout(() => face.classList.remove("shake"), 500);
      }
    }
    const nextIdx = (currentIdx + 1) % emotions.length;
    setCurrentIdx(nextIdx);
    if (score + 1 >= emotions.length) {
      setTimeout(() => onComplete(score + 1, {}), 800);
    }
  };
  const faceColor = {
    happy: "#ffd700",
    sad: "#87cefa",
    angry: "#ff4500",
    scared: "#9370db",
    surprised: "#ffa500",
    disgusted: "#8fbc8f",
    confused: "#808080",
    proud: "#ff69b4",
    embarrassed: "#ffb6c1",
    jealous: "#6b8e23",
    bored: "#a9a9a9",
  }[emotions[currentIdx]];
  return (
    <div style={{ padding: 20, color: "white" }}>
      <style>{`@keyframes facePulse { from { transform: scale(1); } to { transform: scale(1.05); } } .shake { animation: shake 0.5s; } @keyframes shake { 0% { transform: translateX(0); } 25% { transform: translateX(-5px); } 50% { transform: translateX(5px); } 75% { transform: translateX(-5px); } 100% { transform: translateX(0); } }`}</style>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg id="face" width="200" height="200" style={{ animation: "facePulse 2s infinite" }}>
          <circle cx="100" cy="100" r="80" fill={faceColor} />
        </svg>
        <div style={{ marginLeft: 40 }}>
          {emotions.map((e) => (
            <button key={e} onClick={() => handleSelect(e)} style={{ width: config.targetSize, height: config.targetSize, fontSize: 24, margin: 8 }}>
              {t({ en: e.toUpperCase(), kn: e })}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 20 }}>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 2. Attention Spotlight (simplified)
const AttentionSpotlight = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const speedMap = { 1: 8000, 2: 5000, 3: 3000, 4: 1500 };
  const visibleTimeMap = { 1: 3000, 2: 2000, 3: 1000, 4: 500 };
  const objectsCountMap = { 1: 1, 2: 2, 3: 3, 4: 5 };
  const [objects, setObjects] = useState([]);
  const [score, setScore] = useState(0);
  const containerRef = useRef(null);
  useEffect(() => {
    const interval = setInterval(() => {
      const newObjs = [];
      for (let i = 0; i < objectsCountMap[level]; i++) {
        const size = config.targetSize;
        const rect = containerRef.current?.getBoundingClientRect();
        const x = Math.random() * ((rect?.width || 800) - size);
        const y = Math.random() * ((rect?.height || 600) - size);
        newObjs.push({ id: Date.now() + i, x, y, shown: true });
      }
      setObjects(newObjs);
      setTimeout(() => setObjects([]), visibleTimeMap[level]);
    }, speedMap[level]);
    return () => clearInterval(interval);
  }, [level]);
  const handleClick = (obj) => {
    if (obj.shown) {
      setScore((s) => s + 1);
      fireConfetti();
    }
  };
  return (
    <div style={{ position: "relative", height: "100vh", background: "#0f172a", color: "white" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", overflow: "hidden", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            background: "radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 80%)",
            transition: "background-position 0.5s",
          }}
        />
        {objects.map((obj) => (
          <div
            key={obj.id}
            onClick={() => handleClick(obj)}
            style={{
              position: "absolute",
              top: obj.y,
              left: obj.x,
              width: config.targetSize,
              height: config.targetSize,
              background: "#4F6EF7",
              borderRadius: "50%",
              cursor: "pointer",
              animation: "fadeIn 0.3s",
            }}
          />
        ))}
      </div>
      <div style={{ position: "absolute", top: 10, right: 10 }}>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 3. Sensory Garden (simplified)
const SensoryGarden = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const [flowers, setFlowers] = useState([]);
  const [score, setScore] = useState(0);
  const handleTap = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setFlowers((f) => [...f, { id, x, y }]);
    setScore((s) => s + 1);
    fireConfetti();
  };
  return (
    <div style={{ width: "100%", height: "100vh", background: "linear-gradient(#a8e6cf, #dcedc1)", overflow: "hidden", position: "relative", color: "#0f172a" }} onClick={handleTap}>
      {flowers.map((f) => (
        <div key={f.id} style={{ position: "absolute", left: f.x - 20, top: f.y - 20, width: 40, height: 40, background: "radial-gradient(circle, #ffeb3b, #f57c00)", borderRadius: "50%", animation: "grow 0.5s forwards" }} />
      ))}
      <style>{`@keyframes grow { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
      <div style={{ position: "absolute", top: 10, right: 10, padding: 8, background: "rgba(255,255,255,0.7)", borderRadius: 8 }}>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 4. Turn Taking Train (simplified)
const TurnTakingTrain = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const greenTimeMap = { 1: 5000, 2: 3000, 3: 2000, 4: 1500 };
  const [green, setGreen] = useState(false);
  const [lives, setLives] = useState(level === 1 ? 3 : level === 2 ? 2 : 1);
  const [score, setScore] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => setGreen(true), Math.random() * 2000 + 1000);
    return () => clearTimeout(timeout);
  }, []);
  const handleGo = () => {
    if (green) {
      setScore((s) => s + 1);
      fireConfetti();
      setGreen(false);
      setTimeout(() => setGreen(true), greenTimeMap[level]);
    } else {
      setLives((l) => l - 1);
      if (lives - 1 <= 0) onComplete(score, {});
    }
  };
  return (
    <div style={{ background: "#0f172a", color: "white", height: "100vh", position: "relative", padding: 20 }}>
      <div style={{ fontSize: "2rem", marginBottom: 20 }}>{t({ en: "YOUR TURN", kn: "ನಿಮ್ಮ ಟರ್ನ್" })}</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ width: 60, height: 120, background: green ? "#22c55e" : "#ef4444", transition: "background 0.3s" }} />
      </div>
      <button onClick={handleGo} style={{ padding: "12px 24px", fontSize: "1rem" }}>{t({ en: "Go", kn: "ಹುಡು" })}</button>
      <div style={{ marginTop: 20 }}>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <div>{t({ en: `Lives: ${lives}`, kn: `ಜೀವಗಳು: ${lives}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 5. Social Story Game (simplified)
const SocialStoryGame = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const stories = {
    1: [{ scenario: "share toy", options: ["share", "keep"] }],
    2: [{ scenario: "play together", options: ["join", "ignore", "take"] }],
    3: [{ scenario: "help friend", options: ["help", "watch", "mock"] }],
    4: [{ scenario: "solve conflict", options: ["talk", "argue", "ignore", "seek adult"] }],
  };
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const currentStory = stories[level][current];
  const handleChoice = (choice) => {
    const correct = choice === currentStory.options[0];
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    if (current + 1 >= stories[level].length) {
      onComplete(score + (correct ? 1 : 0), {});
    } else {
      setCurrent((c) => c + 1);
    }
  };
  return (
    <div style={{ padding: 20, color: "white", background: "#0f172a", minHeight: "100vh" }}>
      <h2>{t({ en: "Social Story", kn: "ಸಾಮಾಜಿಕ ಕಥೆ" })}</h2>
      <p>{t({ en: currentStory.scenario, kn: currentStory.scenario })}</p>
      <div>{currentStory.options.map((opt) => (
        <button key={opt} onClick={() => handleChoice(opt)} style={{ margin: 8, padding: "8px 16px" }}>{t({ en: opt, kn: opt })}</button>
      ))}</div>
      <div>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 6. Pattern Wizard (simplified)
const PatternWizard = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const patterns = {
    1: { seq: ["🔴", "🔵"], options: ["🔴", "🔵"] },
    2: { seq: ["🔴", "🔵", "🔴", "🔵"], options: ["🔴", "🔵", "🟢"] },
    3: { seq: ["1", "2", "3", "4"], options: ["5", "6", "7", "8"] },
    4: { seq: ["🟣", "🟡", "🟣", "🟡", "🟣"], options: ["🟡", "🟣", "🟢", "🔴", "🟠"] },
  };
  const current = patterns[level];
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const handlePick = (choice) => {
    const correct = choice === current.seq[current.seq.length - 1];
    if (correct) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    if (round + 1 >= 5) {
      onComplete(score + (correct ? 1 : 0), {});
    } else {
      setRound((r) => r + 1);
    }
  };
  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 20 }}>
      <h3>{t({ en: "Find the next pattern element", kn: "ನಮೂನೆಯ ಮುಂದಿನ ಅಂಶವನ್ನು ಹುಡುಕಿ" })}</h3>
      <div style={{ fontSize: "2rem", marginBottom: 20 }}>{current.seq.join(" ")}</div>
      <div>{current.options.map((opt) => (
        <button key={opt} onClick={() => handlePick(opt)} style={{ margin: 6, fontSize: "1.5rem" }}>{opt}</button>
      ))}</div>
      <div>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 7. Friendship Builder (simplified)
const FriendshipBuilder = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const steps = { 1: ["wave"], 2: ["wave", "name"], 3: ["wave", "name", "question", "activity"], 4: ["wave", "name", "question", "listen", "suggest", "goodbye"] }[level];
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const actionsMap = {
    wave: t({ en: "Wave", kn: "ಅಲೆ" }),
    name: t({ en: "Say Name", kn: "ಹೆಸರು ಹೇಳು" }),
    question: t({ en: "Ask Question", kn: "ಪ್ರಶ್ನೆ ಕೇಳು" }),
    activity: t({ en: "Suggest Activity", kn: "ಚಟುವಟಿಕೆ ಸೂಚಿಸು" }),
    listen: t({ en: "Listen", kn: "ಆಲಿಸು" }),
    goodbye: t({ en: "Goodbye", kn: "ವಿದಾಯ" }),
  };
  const handleAction = (act) => {
    if (act === steps[currentStep]) {
      setScore((s) => s + 1);
      fireConfetti();
    }
    if (currentStep + 1 >= steps.length) {
      onComplete(score + 1, {});
    } else {
      setCurrentStep((c) => c + 1);
    }
  };
  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 20 }}>
      <h3>{t({ en: "Friendship Builder", kn: "ಸ್ನೇಹಿತ ನಿರ್ಮಾಣ" })}</h3>
      <p>{t({ en: `Step ${currentStep + 1} of ${steps.length}`, kn: `ಪಟ್ಟಿ ${currentStep + 1} / ${steps.length}` })}</p>
      <div>{Object.keys(actionsMap).map((key) => (
        <button key={key} onClick={() => handleAction(key)} style={{ margin: 6 }}>{actionsMap[key]}</button>
      ))}</div>
      <div>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 8. Calm Down Corner (simplified)
const CalmDownCorner = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const [selectedEmotion, setSelectedEmotion] = useState(null);
  const [score, setScore] = useState(0);
  const emotions = ["happy", "sad", "angry", "worried"];
  const strategies = { breathing: t({ en: "Breathing", kn: "ಉಸಿರೆಳೆ" }), muscle: t({ en: "Muscle Relax", kn: "ತಂತು ವಿಶ್ರಾಂತಿ" }), happyPlace: t({ en: "Happy Place", kn: "ಸಂತೋಷದ ಸ್ಥಳ" }) };
  const handleStrategy = (strat) => {
    setScore((s) => s + 1);
    fireConfetti();
    onComplete(score + 1, {});
  };
  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 20 }}>
      <h3>{t({ en: "How are you feeling?", kn: "ನೀವು ಹೇಗೆ ಅನುಭವಿಸುತ್ತಿದ್ದೀರಿ?" })}</h3>
      <div>{emotions.map((e) => (
        <button key={e} onClick={() => setSelectedEmotion(e)} style={{ margin: 4 }}>{t({ en: e, kn: e })}</button>
      ))}</div>
      {selectedEmotion && (
        <div style={{ marginTop: 20 }}>
          <h4>{t({ en: "Pick a strategy", kn: "ತಂತ್ರ ಆಯ್ಕೆಮಾಡಿ" })}</h4>
          <div>{Object.entries(strategies).map(([key, label]) => (
            <button key={key} onClick={() => handleStrategy(key)} style={{ margin: 4 }}>{label}</button>
          ))}</div>
        </div>
      )}
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 9. Communication Rocket (simplified)
const CommunicationRocket = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const [fuel, setFuel] = useState(0);
  const items = ["🚀", "🪐", "🌟"];
  const handlePick = () => {
    setFuel((f) => {
      const newFuel = f + 1;
      if (newFuel >= items.length) {
        onComplete(newFuel, {});
        fireConfetti();
      }
      return newFuel;
    });
  };
  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 20, textAlign: "center" }}>
      <h2>{t({ en: "Fuel the Rocket!", kn: "ರಾಕೆಟ್‌ಗೆ ಇಂಧನ ಹಾಕಿ!" })}</h2>
      <div style={{ fontSize: "3rem", margin: "20px 0" }}>{items[fuel] || "🚀"}</div>
      <button onClick={handlePick} style={{ padding: "12px 24px" }}>{t({ en: "Add Fuel", kn: "ಇಂಧನ ಸೇರಿಸಿ" })}</button>
      <div style={{ marginTop: 20 }}>{t({ en: `Fuel: ${fuel}/${items.length}`, kn: `ಇಂಧನ: ${fuel}/${items.length}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};
// 10. Daily Life Adventure (simplified)
const DailyLifeAdventure = ({ onComplete }) => {
  const { lang, toggle, t } = useLanguageToggle();
  const age = JSON.parse(localStorage.getItem("currentChild"))?.age || 6;
  const { level, config } = useDifficulty(age);
  const routines = {
    1: [{ steps: ["wet hands", "soap hands"] }],
    2: [{ steps: ["put shirt", "button shirt", "wear shoes", "eat breakfast"] }],
    3: [{ steps: ["brush teeth", "make bed", "pack bag", "walk to school", "greet teacher", "sit"] }],
    4: [{ steps: ["wake up", "brush teeth", "dress", "eat breakfast", "pack bag", "go to school", "attend class", "homework"] }],
  }[level];
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const handleNext = () => {
    setScore((s) => s + 1);
    fireConfetti();
    if (currentStep + 1 >= routines[0].steps.length) {
      onComplete(score + 1, {});
    } else {
      setCurrentStep((c) => c + 1);
    }
  };
  return (
    <div style={{ background: "#0f172a", color: "white", minHeight: "100vh", padding: 20 }}>
      <h3>{t({ en: "Daily Routine", kn: "ದೈನಂದಿನ ರೂಟೀನ್" })}</h3>
      <p>{t({ en: `Step ${currentStep + 1}:`, kn: `ಹಂತ ${currentStep + 1}:` })} {t({ en: routines[0].steps[currentStep], kn: routines[0].steps[currentStep] })}</p>
      <button onClick={handleNext} style={{ padding: "10px 20px" }}>{t({ en: "Done", kn: "ಮುಗಿತು" })}</button>
      <div style={{ marginTop: 20 }}>{t({ en: `Score: ${score}`, kn: `ಸ್ಕೋರ್ಸ್: ${score}` })}</div>
      <LanguageToggle lang={lang} toggle={toggle} />
    </div>
  );
};

// ------------------------------------------------------------
// Main component – renders the grid and handles navigation
// ------------------------------------------------------------
const TherapeuticGames = () => {
  const [childAge, setChildAge] = useState(JSON.parse(localStorage.getItem("currentChild"))?.age || 6);
  const [activeGame, setActiveGame] = useState(null);
  const games = [
    { id: "emotion-mirror", title: "Emotion Mirror 🪞", description: "Recognize and imitate facial emotions", component: EmotionMirror, takeaway: `Understanding emotions helps us connect with others. Autistic children often find emotion recognition challenging because facial expressions can be subtle and confusing. Regular practice with this game builds the ability to read social cues which is essential for daily communication.` },
    { id: "attention-spotlight", title: "Attention Spotlight 🔦", description: "Joint attention and visual tracking", component: AttentionSpotlight, takeaway: `Joint attention — the ability to focus on the same thing as another person — is one of the earliest social skills and is often delayed in autistic children. This game trains visual tracking and sustained attention which are foundation skills for learning and communication.` },
    { id: "sensory-garden", title: "Sensory Garden 🌸", description: "Sensory regulation and calm down", component: SensoryGarden, takeaway: `Sensory regulation is the ability to manage and respond to sensory input in ways that support daily functioning. Many autistic children experience sensory overload which leads to meltdowns and anxiety. Regular calming activities train the nervous system to self‑regulate.` },
    { id: "turn-taking-train", title: "Turn Taking Train 🚂", description: "Turn taking and waiting skills", component: TurnTakingTrain, takeaway: `Turn taking is a fundamental social skill that underlies conversation sharing and cooperative play. Autistic children often struggle with waiting because they have difficulty with delayed gratification and understanding reciprocal social exchanges.` },
    { id: "social-story", title: "Social Story Game 📖", description: "Social understanding and appropriate responses", component: SocialStoryGame, takeaway: `Social stories were developed by Carol Gray specifically for autistic children to help them understand social situations and appropriate responses. They work by providing explicit social information that neurotypical children absorb implicitly from observation.` },
    { id: "pattern-wizard", title: "Pattern Wizard 🔮", description: "Cognitive flexibility and pattern recognition", component: PatternWizard, takeaway: `Pattern recognition is a cognitive strength in many autistic individuals. This game channels that strength while also building cognitive flexibility — the ability to switch between rules and adapt to changing patterns.` },
    { id: "friendship-builder", title: "Friendship Builder 🤝", description: "Understanding friendship concepts", component: FriendshipBuilder, takeaway: `Friendship skills are often the most challenging area for autistic children because they require multiple simultaneous social processes — reading cues giving cues taking turns and managing emotions.` },
    { id: "calm-down-corner", title: "Calm Down Corner 😤➡️😊", description: "Emotional regulation and coping strategies", component: CalmDownCorner, takeaway: `Emotional dysregulation is one of the most significant challenges for autistic children and often leads to meltdowns and behavioral difficulties. Teaching explicit calm down strategies gives children tools to manage overwhelming emotions before they escalate.` },
    { id: "communication-rocket", title: "Communication Rocket 🚀", description: "Functional communication and requesting", component: CommunicationRocket, takeaway: `Functional communication — the ability to make needs and wants known — is the most fundamental goal in autism therapy. Many autistic children who do not yet use speech can learn to communicate through pointing gestures pictures or AAC devices.` },
    { id: "daily-life-adventure", title: "Daily Life Adventure 🏠", description: "Daily living skills and independence", component: DailyLifeAdventure, takeaway: `Daily living skills — the routines and tasks needed for independent functioning — are a primary focus of autism therapy. Task analysis breaks complex routines into small learnable steps which is a core ABA technique proven effective for autistic learners of all abilities.` },
  ];
  const { openGame, closeGame } = useFullScreen(setActiveGame);
  if (activeGame) {
    const game = games.find((g) => g.id === activeGame);
    const GameComp = game.component;
    return (
      <GameWrapper
        gameId={game.id}
        GameComponent={GameComp}
        takeawayText={game.takeaway.replace("[child name]", JSON.parse(localStorage.getItem("currentChild"))?.name || "Friend")}
        onClose={closeGame}
      />
    );
  }
  return (
    <div style={{ padding: 20, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1>Therapeutic Games</h1>
      <div style={{ marginBottom: 20 }}>
        <label>
          Age: <input type="number" min={2} max={12} value={childAge} onChange={(e) => { const newAge = parseInt(e.target.value, 10) || 6; setChildAge(newAge); const child = JSON.parse(localStorage.getItem("currentChild") || "{}") || {}; child.age = newAge; localStorage.setItem("currentChild", JSON.stringify(child)); }} />
        </label>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "16px" }}>
        {games.map((g) => (
          <GameCard key={g.id} title={g.title} description={g.description} age={childAge} onPlay={() => openGame(g.id)} />
        ))}
      </div>
    </div>
  );
};
export default TherapeuticGames;
