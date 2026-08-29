import React, { useState, useEffect, useRef } from "react";
import { getActivities as fetchApiActivities, logSession as apiLogSession } from "../services/api";
import EmotionDetector from "../components/EmotionDetector";
import InteractiveGameZone from "../components/InteractiveGameZone";
import CertificateModal from "../components/CertificateModal";
import ActivityRatingModal from "../components/ActivityRatingModal";
import { getAgeLevelConfig, getAgeGroup } from "../utils/ageLevelMapping";
import { CURATED_ACTIVITIES } from "../data/curatedActivities";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ─── Curated Activities ─────────────────────────────────────────────────── */
const FALLBACK_ACTIVITIES = CURATED_ACTIVITIES;

const CATEGORIES = [
  { key: "All", en: "🌟 All Activities", kn: "ಎಲ್ಲಾ" },
  { key: "Communication", en: "💬 Talk", kn: "ಸಂವಹನ" },
  { key: "Social Skills", en: "🤝 Friends", kn: "ಸ್ನೇಹಿತರು" },
  { key: "Sensory and Motor", en: "🎵 Move & Feel", kn: "ಚಲನೆ" },
  { key: "Cognitive", en: "🧠 Think", kn: "ಆಲೋಚನೆ" },
  { key: "Life Skills", en: "🏠 Life Skills", kn: "ದೈನಂದಿನ ಜೀವನ" }
];

const EMOTIONS = [
  { name: "Happy", emoji: "😊", color: "#22c55e" },
  { name: "Neutral", emoji: "😐", color: "#6b7280" },
  { name: "Engaged", emoji: "🤩", color: "#3b82f6" },
  { name: "Calm", emoji: "😌", color: "#a855f7" }
];

const SCORES = [
  { score: 1, label: "Oops!", emoji: "😢", color: "#ef4444" },
  { score: 2, label: "OK!", emoji: "😕", color: "#f97316" },
  { score: 3, label: "Good!", emoji: "😐", color: "#eab308" },
  { score: 4, label: "Great!", emoji: "😊", color: "#22c55e" },
  { score: 5, label: "SUPER!", emoji: "🌟", color: "#a855f7" }
];

const STEP_EMOJIS = ["1️⃣", "2️⃣", "3️⃣", "4️⃣"];

const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8"];

/* ─── Confetti Component ──────────────────────────────────────────────────── */
function Confetti({ active }) {
  if (!active) return null;
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: `${Math.random() * 0.5}s`,
    size: `${8 + Math.random() * 8}px`,
    shape: Math.random() > 0.5 ? "circle" : "square"
  }));
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            top: "-20px",
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confettiFall 1.8s ease-in ${p.delay} forwards`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

/* ─── Star Rating Display ─────────────────────────────────────────────────── */
function Stars({ count = 3, size = "1.1rem" }) {
  return (
    <span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{ fontSize: size, filter: i < count ? "none" : "grayscale(1) opacity(0.3)" }}>⭐</span>
      ))}
    </span>
  );
}

/* ─── XP Badge ────────────────────────────────────────────────────────────── */
function XPBadge({ xp }) {
  return (
    <span style={{
      background: "linear-gradient(135deg, #f59e0b, #ef4444)",
      color: "#fff",
      padding: "3px 10px",
      borderRadius: "20px",
      fontSize: "0.78rem",
      fontWeight: "800",
      letterSpacing: "0.5px",
      boxShadow: "0 2px 8px rgba(245,158,11,0.4)"
    }}>+{xp} XP</span>
  );
}

/* ─── Main Component ──────────────────────────────────────────────────────── */
export default function Activities({ user }) {
  const getChildInfo = () => {
    try {
      const stored = localStorage.getItem("currentChild");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed._id) return {
          _id: parsed._id,
          name: parsed.name || "Child",
          level: Number(parsed.level) || 1,
          age: Number(parsed.age) || 6,
          profilePhoto: parsed.profilePhoto || parsed.photo || parsed.avatar || null
        };
      }
    } catch (e) {}
    return {
      _id: user?.childId || user?._id || "child_123",
      name: user?.childName || user?.name || "Child",
      level: Number(user?.level) || 1,
      age: Number(user?.age) || 6,
      profilePhoto: user?.profilePhoto || user?.photo || user?.avatar || null
    };
  };

  const child = getChildInfo();
  const childAgeGroup = getAgeGroup(child.age);

  const [language, setLanguage] = useState("en");
  const [activeCategory, setActiveCategory] = useState("All");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(childAgeGroup);
  const [selectedLevel, setSelectedLevel] = useState(child.level || 1);
  const [completedActivities, setCompletedActivities] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [sessionScore, setSessionScore] = useState(null);
  const [currentEmotionIdx, setCurrentEmotionIdx] = useState(0);
  const [currentEmotion, setCurrentEmotion] = useState("Happy");
  const [emotionConfidence, setEmotionConfidence] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(600);
  const [activities, setActivities] = useState(CURATED_ACTIVITIES);
  const [loading, setLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [totalXP, setTotalXP] = useState(0);
  const [completedStep, setCompletedStep] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [dailySummary, setDailySummary] = useState({ count: 0, scoresList: [], dominantEmotion: "Happy" });
  const [hoveredCard, setHoveredCard] = useState(null);
  const [gameDone, setGameDone] = useState(false);
  const [recentCertificate, setRecentCertificate] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(null);

  useEffect(() => {
    // Keep activities strictly aligned with the curated 45-activity dataset
    setActivities(CURATED_ACTIVITIES);
  }, []);

  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => setCurrentEmotionIdx(prev => (prev + 1) % EMOTIONS.length), 4000);
    return () => clearInterval(interval);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || timerSeconds <= 0) return;
    const timer = setInterval(() => setTimerSeconds(prev => prev > 0 ? prev - 1 : 0), 1000);
    return () => clearInterval(timer);
  }, [activeSession, timerSeconds]);

  const handleStartSession = (act) => {
    setActiveSession(act);
    setSessionScore(null);
    setCurrentEmotionIdx(0);
    setCurrentStep(0);
    setCompletedStep(null);
    setGameDone(false);
    const minsMatch = (act.duration || "").match(/\d+/);
    setTimerSeconds((minsMatch ? parseInt(minsMatch[0], 10) : 10) * 60);
  };

  const handleCompleteSession = async () => {
    if (!sessionScore || !activeSession) return;
    const detectedEmotion = currentEmotion || EMOTIONS[currentEmotionIdx].name;
    const minsMatch = (activeSession.duration || "").match(/\d+/);
    const durationMins = minsMatch ? parseInt(minsMatch[0], 10) : 10;
    try {
      await apiLogSession({ childId: child._id, activityId: activeSession._id, score: sessionScore, emotion: detectedEmotion, confidence: emotionConfidence || 0, duration: durationMins, completedAt: new Date() });
    } catch (e) { console.warn("Session log failed", e); }

    if (!completedActivities.includes(activeSession._id)) {
      setCompletedActivities(prev => [...prev, activeSession._id]);
    }
    setTotalXP(prev => prev + (activeSession.xp || 50));
    setDailySummary(prev => {
      const newScores = [...prev.scoresList, sessionScore];
      return { count: prev.count + 1, scoresList: newScores, dominantEmotion: detectedEmotion };
    });
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2200);

    // Show the rating modal first; certificate will follow after rating
    setShowRatingModal({
      childId: child._id,
      childName: child.name,
      childPhoto: child.profilePhoto,
      activityId: activeSession._id,
      activityTitle: activeSession.title,
      xpEarned: activeSession.xp || 50,
      stars: sessionScore,
      initialScore: sessionScore === "⭐⭐⭐" ? 90 : sessionScore === "⭐⭐" ? 65 : 40,
    });
    setActiveSession(null);
  };

  const handleRatingComplete = (ratingData) => {
    const pending = showRatingModal;
    setShowRatingModal(null);
    // Now show the certificate
    setRecentCertificate({
      childName: pending.childName,
      childPhoto: pending.childPhoto,
      activityTitle: pending.activityTitle,
      xpEarned: pending.xpEarned,
      stars: pending.stars,
    });
  };

  const handleRatingSkip = () => {
    const pending = showRatingModal;
    setShowRatingModal(null);
    // Show the certificate even if they skip rating
    setRecentCertificate({
      childName: pending.childName,
      childPhoto: pending.childPhoto,
      activityTitle: pending.activityTitle,
      xpEarned: pending.xpEarned,
      stars: pending.stars,
    });
  };

  const matchesChildLevel = (act) => {
    if (!act) return false;
    const matchesAge = act.ageGroup === selectedAgeGroup;
    const matchesLvl = Array.isArray(act.level) ? act.level.includes(selectedLevel) : Number(act.level) === Number(selectedLevel);
    return matchesAge && matchesLvl;
  };

  const levelFilteredActivities = activities.filter(matchesChildLevel);
  const displayActivities = levelFilteredActivities.filter(act => activeCategory === "All" || act.category === activeCategory);
  const totalLevelCount = levelFilteredActivities.length;

  const getLevelConfig = (lvl, age) => {
    const cfg = getAgeLevelConfig(age || child.age || 6, lvl);
    const starCount = "⭐".repeat(Math.max(1, Math.min(3, Number(lvl) || 1)));
    return {
      bg: `linear-gradient(135deg, ${cfg.bgColor}, #ffffff)`,
      text: cfg.textColor,
      label: `${starCount} ${language === "kn" ? cfg.labelKn : cfg.label} (Level ${lvl})`,
      shortLabel: `${starCount} ${language === "kn" ? cfg.labelKn : cfg.label}`,
      emoji: cfg.emoji,
      color: cfg.color
    };
  };

  const currentAgeForConfig = selectedAgeGroup === "2-5" ? 3 : selectedAgeGroup === "5-8" ? 6 : 10;
  const levelConfig = getLevelConfig(selectedLevel, currentAgeForConfig);

  const avgScoreNum = dailySummary.scoresList.length > 0
    ? (dailySummary.scoresList.reduce((a, b) => a + b, 0) / dailySummary.scoresList.length).toFixed(1) : 0;

  const timerPct = activeSession ? (timerSeconds / ((activeSession?.duration?.match(/\d+/)?.[0] || 10) * 60)) * 100 : 100;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #fef9ff 0%, #f0f4ff 50%, #fff7f0 100%)",
      fontFamily: "'Nunito', 'Comic Sans MS', system-ui, sans-serif",
      color: "#1f2937",
      paddingBottom: "100px",
      position: "relative",
      overflowX: "hidden"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes spin { 0%{transform:rotate(0)} 100%{transform:rotate(360deg)} }
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.1)} 80%{transform:scale(0.95)} 100%{transform:scale(1);opacity:1} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes wiggle { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-3deg)} 75%{transform:rotate(3deg)} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes slideUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes starPop { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.3) rotate(5deg)} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes progressFill { from{width:0} to{width:var(--target)} }
        .game-card { transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease; }
        .game-card:hover { transform: translateY(-8px) rotate(-1deg) scale(1.02) !important; }
        .bounce-btn:hover { transform: scale(1.08) !important; animation: pulse 0.4s ease; }
        .step-item { transition: all 0.3s ease; cursor: pointer; }
        .step-item:hover { transform: translateX(6px); }
        .step-item.completed { opacity: 0.6; }
      `}</style>

      <Confetti active={showConfetti} />

      {/* ─── Floating background decorations ─── */}
      <div style={{ position: "fixed", top: "5%", right: "3%", fontSize: "3rem", animation: "float 3s ease-in-out infinite", opacity: 0.15, pointerEvents: "none" }}>🎮</div>
      <div style={{ position: "fixed", top: "15%", left: "2%", fontSize: "2.5rem", animation: "float 4s ease-in-out infinite 1s", opacity: 0.12, pointerEvents: "none" }}>⭐</div>
      <div style={{ position: "fixed", bottom: "20%", right: "5%", fontSize: "2rem", animation: "float 3.5s ease-in-out infinite 0.5s", opacity: 0.1, pointerEvents: "none" }}>🌈</div>
      <div style={{ position: "fixed", bottom: "30%", left: "3%", fontSize: "2rem", animation: "float 2.5s ease-in-out infinite 0.8s", opacity: 0.1, pointerEvents: "none" }}>🎯</div>

      {/* ─── HEADER ─── */}
      <header style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 40%, #ec4899 100%)",
        padding: "20px 28px",
        color: "#fff",
        borderRadius: "0 0 32px 32px",
        boxShadow: "0 8px 32px rgba(99,102,241,0.35)",
        marginBottom: "28px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Sparkle BG */}
        {["✦","✧","✦","✧"].map((s, i) => (
          <span key={i} style={{ position: "absolute", top: `${10 + i*20}%`, left: `${5 + i*25}%`, opacity: 0.3, fontSize: "0.9rem", animation: `pulse ${1.5 + i*0.3}s ease-in-out infinite` }}>{s}</span>
        ))}

        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <span style={{ fontSize: "2.2rem", animation: "wiggle 2s ease-in-out infinite" }}>🎮</span>
                <div>
                  <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.2)", letterSpacing: "-0.5px" }}>
                    {child.name}'s Game Zone!
                  </h1>
                  <div style={{ fontSize: "0.95rem", opacity: 0.85, marginTop: "2px" }}>
                    🏆 {completedActivities.length} of {totalLevelCount} quests done today!
                  </div>
                </div>
              </div>

              {/* XP Bar */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "800", opacity: 0.9 }}>⚡ {totalXP} XP</span>
                <div style={{ width: "140px", height: "10px", backgroundColor: "rgba(255,255,255,0.25)", borderRadius: "20px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min((totalXP / 500) * 100, 100)}%`,
                    background: "linear-gradient(90deg, #ffd93d, #ff6b6b)",
                    borderRadius: "20px",
                    transition: "width 0.5s ease",
                    boxShadow: "0 0 8px rgba(255,215,61,0.6)"
                  }} />
                </div>
                <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>Level Up at 500!</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              {/* Level Badge */}
              <div style={{
                background: levelConfig.bg,
                color: levelConfig.text,
                padding: "8px 16px",
                borderRadius: "20px",
                fontWeight: "900",
                fontSize: "0.9rem",
                boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
                border: "2px solid rgba(255,255,255,0.6)"
              }}>
                {levelConfig.label} {levelConfig.emoji}
              </div>

              {/* Language Toggle */}
              <button
                className="bounce-btn"
                onClick={() => setLanguage(language === "en" ? "kn" : "en")}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  border: "2px solid rgba(255,255,255,0.5)",
                  padding: "8px 16px",
                  borderRadius: "20px",
                  fontWeight: "800",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  backdropFilter: "blur(4px)",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                🌐 {language === "en" ? "EN" : "ಕನ್ನಡ"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px" }}>

        {/* ─── Age Group & Level Selector Bar ─── */}
        <section style={{ marginBottom: "20px" }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px",
            alignItems: "center",
            justifyContent: "space-between",
            background: "white",
            padding: "16px 22px",
            borderRadius: "24px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.05)",
            border: "1px solid #f1f5f9"
          }}>
            {/* Age Group Selector */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#64748b" }}>
                👶 {language === "en" ? "Age Group:" : "ವಯೋಮಾನ:"}
              </span>
              {[
                { key: "2-5", label: "2–5 yrs (Toddler)", labelKn: "2–5 ವರ್ಷ" },
                { key: "5-8", label: "5–8 yrs (School)", labelKn: "5–8 ವರ್ಷ" },
                { key: "9-12", label: "9–12 yrs (Pre-teen)", labelKn: "9–12 ವರ್ಷ" }
              ].map(grp => {
                const isSel = selectedAgeGroup === grp.key;
                return (
                  <button
                    key={grp.key}
                    onClick={() => setSelectedAgeGroup(grp.key)}
                    style={{
                      background: isSel ? "#4F6EF7" : "#f8fafc",
                      color: isSel ? "white" : "#475569",
                      border: isSel ? "none" : "1px solid #e2e8f0",
                      padding: "7px 16px",
                      borderRadius: "16px",
                      fontWeight: "800",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isSel ? "0 4px 12px rgba(79,110,247,0.35)" : "none"
                    }}
                  >
                    {language === "en" ? grp.label : grp.labelKn}
                  </button>
                );
              })}
            </div>

            {/* Level Selector */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "#64748b" }}>
                🎯 {language === "en" ? "Level:" : "ಹಂತ:"}
              </span>
              {[1, 2, 3].map(lvl => {
                const isSel = selectedLevel === lvl;
                const tierCfg = getAgeLevelConfig(selectedAgeGroup === "2-5" ? 3 : selectedAgeGroup === "5-8" ? 6 : 10, lvl);
                return (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    style={{
                      background: isSel ? tierCfg.color : "#f8fafc",
                      color: isSel ? "white" : "#475569",
                      border: isSel ? "none" : "1px solid #e2e8f0",
                      padding: "7px 16px",
                      borderRadius: "16px",
                      fontWeight: "800",
                      fontSize: "0.85rem",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isSel ? `0 4px 12px ${tierCfg.color}55` : "none"
                    }}
                  >
                    {tierCfg.emoji} {language === "kn" ? tierCfg.labelKn : tierCfg.label} (L{lvl})
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Category Filter Tabs ─── */}
        <section style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px", scrollbarWidth: "none" }}>
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  className="bounce-btn"
                  onClick={() => setActiveCategory(cat.key)}
                  style={{
                    background: isActive ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.9)",
                    color: isActive ? "#fff" : "#4b5563",
                    border: isActive ? "none" : "2px solid #e5e7eb",
                    padding: "10px 22px",
                    borderRadius: "24px",
                    fontWeight: "800",
                    fontSize: "0.95rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.2s",
                    boxShadow: isActive ? "0 4px 18px rgba(99,102,241,0.4)" : "0 2px 8px rgba(0,0,0,0.06)",
                    transform: isActive ? "scale(1.05)" : "scale(1)"
                  }}
                >
                  {language === "en" ? cat.en : `${cat.en.split(" ")[0]} ${cat.kn}`}
                </button>
              );
            })}
          </div>
        </section>

        {/* ─── Loading State ─── */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "4rem", animation: "spin 1s linear infinite", display: "inline-block" }}>🎮</div>
            <p style={{ color: "#6b7280", fontWeight: "800", fontSize: "1.1rem", marginTop: "16px" }}>Loading your adventures...</p>
          </div>
        ) : displayActivities.length === 0 ? (
          <div style={{ backgroundColor: "#fff", borderRadius: "24px", padding: "60px 20px", textAlign: "center", boxShadow: "0 8px 32px rgba(0,0,0,0.08)", maxWidth: "500px", margin: "40px auto" }}>
            <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🎈</div>
            <h3 style={{ fontSize: "1.4rem", fontWeight: "900", color: "#111827" }}>No activities in this category!</h3>
            <p style={{ color: "#6b7280" }}>ಈ ವರ್ಗದಲ್ಲಿ ಯಾವುದೇ ಚಟುವಟಿಕೆಗಳು ಲಭ್ಯವಿಲ್ಲ</p>
          </div>
        ) : (
          /* ─── Activity Cards Grid ─── */
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
            {displayActivities.map((act, idx) => {
              const isDone = completedActivities.includes(act._id);
              const isHovered = hoveredCard === act._id;

              return (
                <div
                  key={act._id}
                  className="game-card"
                  onMouseEnter={() => setHoveredCard(act._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  style={{
                    background: isDone
                      ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
                      : "#ffffff",
                    borderRadius: "24px",
                    boxShadow: isHovered
                      ? `0 20px 40px ${act.color}33`
                      : "0 4px 20px rgba(0,0,0,0.07)",
                    padding: "0",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: isDone ? `2px solid #22c55e` : `2px solid transparent`,
                    animation: `slideUp 0.4s ease ${idx * 0.05}s both`,
                    position: "relative"
                  }}
                >
                  {/* Card Top Color Banner */}
                  <div style={{
                    background: `linear-gradient(135deg, ${act.color}, ${act.color}cc)`,
                    padding: "20px 20px 40px",
                    position: "relative",
                    overflow: "hidden"
                  }}>
                    {/* BG pattern dots */}
                    {[...Array(6)].map((_, i) => (
                      <div key={i} style={{
                        position: "absolute",
                        width: "50px", height: "50px",
                        borderRadius: "50%",
                        border: "2px solid rgba(255,255,255,0.15)",
                        top: `${-10 + i * 15}%`,
                        right: `${-5 + i * 10}%`
                      }} />
                    ))}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: "3rem", animation: "float 2.5s ease-in-out infinite", display: "inline-block" }}>{act.icon}</span>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                        {isDone && (
                          <div style={{
                            backgroundColor: "#22c55e",
                            color: "#fff",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontWeight: "900",
                            fontSize: "0.8rem",
                            animation: "starPop 0.4s ease"
                          }}>✓ Done! 🎉</div>
                        )}
                        <XPBadge xp={act.xp || 50} />
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div style={{ padding: "0 20px 20px", marginTop: "-20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Category & Therapy Principle pill row */}
                    <div style={{ marginBottom: "12px", display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                      <span style={{
                        backgroundColor: act.bg,
                        color: act.color,
                        padding: "4px 14px",
                        borderRadius: "20px",
                        fontWeight: "800",
                        fontSize: "0.78rem",
                        display: "inline-block",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                      }}>
                        {language === "en" ? act.category : act.categoryKn || act.category}
                      </span>
                      {act.therapyPrinciple && (
                        <span style={{
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "0.72rem",
                          fontWeight: "700",
                          display: "inline-block",
                          border: "1px solid #e2e8f0"
                        }}>
                          🧠 {act.therapyPrinciple}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: "1.25rem", fontWeight: "900", margin: "0 0 4px 0", color: "#111827", lineHeight: 1.2 }}>
                      {act.title}
                    </h3>
                    <div style={{ fontSize: "0.85rem", color: "#6b7280", marginBottom: "10px", fontWeight: "700" }}>
                      {act.titleKn}
                    </div>

                    {/* Description */}
                    <p style={{ fontSize: "0.88rem", color: "#374151", lineHeight: "1.5", margin: "0 0 14px 0" }}>
                      {language === "en" ? act.description : act.descriptionKn}
                    </p>

                    <div style={{ marginTop: "auto" }}>
                      {/* Stars & Duration row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                        <Stars count={act.stars || 3} />
                        <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#4b5563", backgroundColor: "#f3f4f6", padding: "4px 10px", borderRadius: "12px" }}>
                          ⏱ {language === "en" ? act.duration : act.durationKn || act.duration}
                        </span>
                      </div>

                      {/* PLAY button */}
                      <button
                        className="bounce-btn"
                        onClick={() => handleStartSession(act)}
                        style={{
                          width: "100%",
                          background: isDone
                            ? "linear-gradient(135deg,#22c55e,#16a34a)"
                            : `linear-gradient(135deg, ${act.color}, ${act.color}cc)`,
                          color: "#fff",
                          border: "none",
                          padding: "14px",
                          borderRadius: "16px",
                          fontWeight: "900",
                          fontSize: "1rem",
                          cursor: "pointer",
                          boxShadow: `0 6px 20px ${act.color}55`,
                          letterSpacing: "0.5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "8px",
                          transition: "all 0.2s"
                        }}
                      >
                        {isDone ? <>🔁 Play Again!</> : <>▶ Play Now! 🎮</>}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─── GAME SESSION MODAL ─── */}
      {activeSession && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000,
          background: "rgba(15,10,40,0.75)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
        }}>
          <div style={{
            background: "linear-gradient(160deg,#fefffe,#f8f0ff)",
            borderRadius: "28px",
            width: "100%",
            maxWidth: "960px",
            maxHeight: "92vh",
            overflowY: "auto",
            boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)",
            animation: "bounceIn 0.4s cubic-bezier(.34,1.56,.64,1)",
            position: "relative"
          }}>
            {/* Modal Header Banner */}
            <div style={{
              background: `linear-gradient(135deg, ${activeSession.color}, ${activeSession.color}cc)`,
              padding: "24px 24px 32px",
              position: "relative",
              overflow: "hidden",
              borderRadius: "28px 28px 0 0"
            }}>
              {/* BG circles */}
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ position: "absolute", width: `${40 + i * 20}px`, height: `${40 + i * 20}px`, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.15)", bottom: `${-10 + i * 12}%`, right: `${-5 + i * 8}%` }} />
              ))}

              {/* Close X */}
              <button
                onClick={() => setActiveSession(null)}
                style={{ position: "absolute", top: "14px", right: "14px", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.1rem", cursor: "pointer", color: "#fff", fontWeight: "900", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}
              >✕</button>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <span style={{ fontSize: "3.5rem", animation: "wiggle 1.5s ease-in-out infinite", display: "inline-block" }}>{activeSession.icon}</span>
                <div>
                  <h2 style={{ fontSize: "1.6rem", fontWeight: "900", margin: "0 0 4px 0", color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.2)" }}>{activeSession.title}</h2>
                  <div style={{ fontSize: "0.95rem", color: "rgba(255,255,255,0.8)", fontWeight: "700" }}>{activeSession.titleKn}</div>
                  <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Stars count={activeSession.stars || 3} size="1rem" />
                    <XPBadge xp={activeSession.xp || 50} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div style={{
                display: "flex",
                gap: "24px",
                flexWrap: "wrap",
                marginBottom: "24px"
              }}>
                {/* Left Column: Main Interactive Game Zone */}
                <div style={{
                  flex: 1,
                  minWidth: "340px",
                  display: "flex",
                  flexDirection: "column"
                }}>
                  <div style={{ flex: 1 }}>
                    <InteractiveGameZone
                      key={activeSession._id}
                      activity={activeSession}
                      language={language}
                      currentEmotion={currentEmotion}
                      emotionConfidence={emotionConfidence}
                      onComplete={(score) => {
                        setGameDone(true);
                        setSessionScore(score);
                      }}
                    />
                  </div>

                  {/* Game success summary feedback pill */}
                  {sessionScore && (
                    <div style={{
                      background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
                      border: "2px solid #86efac",
                      borderRadius: "16px",
                      padding: "12px 18px",
                      marginTop: "16px",
                      textAlign: "center",
                      animation: "bounceIn 0.4s ease"
                    }}>
                      <div style={{ fontWeight: "900", color: "#166534", fontSize: "1rem" }}>
                        🎯 Game Score: {sessionScore}/5 stars — Ready to claim XP!
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Status & Camera Monitoring Sidebar */}
                <div style={{
                  width: "280px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  margin: "0 auto"
                }}>
                  {/* ─── Timer ─── */}
                  <div style={{
                    background: timerSeconds < 30 ? "linear-gradient(135deg,#fee2e2,#fecaca)" : "linear-gradient(135deg,#eff6ff,#dbeafe)",
                    borderRadius: "18px",
                    padding: "14px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `2px solid ${timerSeconds < 30 ? "#fca5a5" : "#bfdbfe"}`
                  }}>
                    <div>
                      <div style={{ fontWeight: "800", fontSize: "0.8rem", color: timerSeconds < 30 ? "#991b1b" : "#1e40af", marginBottom: "4px" }}>
                        {timerSeconds < 30 ? "⚠️ Almost time!" : "⏱ Time Remaining"}
                      </div>
                      {/* Progress bar */}
                      <div style={{ width: "100px", height: "6px", backgroundColor: "rgba(0,0,0,0.1)", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${timerPct}%`,
                          background: timerSeconds < 30 ? "linear-gradient(90deg,#ef4444,#f97316)" : "linear-gradient(90deg,#3b82f6,#6366f1)",
                          borderRadius: "10px",
                          transition: "width 1s linear"
                        }} />
                      </div>
                    </div>
                    <div style={{
                      fontSize: "1.8rem",
                      fontWeight: "900",
                      fontFamily: "monospace",
                      color: timerSeconds < 30 ? "#ef4444" : "#3b82f6"
                    }}>
                      {Math.floor(timerSeconds / 60).toString().padStart(2, "0")}:{(timerSeconds % 60).toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* ─── Emotion Detector ─── */}
                  <div>
                    <EmotionDetector
                      isActive={activeSession !== null}
                      onEmotionDetected={(emotion, confidence) => { setCurrentEmotion(emotion); setEmotionConfidence(confidence); }}
                    />
                  </div>

                  {/* ─── Live Emotion Badge ─── */}
                  <div style={{
                    background: "#f9fafb",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid #e5e7eb"
                  }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: "800", color: "#4b5563" }}>😊 Mood Radar:</span>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: EMOTIONS[currentEmotionIdx].color, boxShadow: `0 0 8px ${EMOTIONS[currentEmotionIdx].color}` }} />
                      <span style={{ fontWeight: "900", color: EMOTIONS[currentEmotionIdx].color, fontSize: "0.85rem" }}>
                        {currentEmotion ? `${currentEmotion}` : `${EMOTIONS[currentEmotionIdx].name}`}
                      </span>
                    </div>
                  </div>

                  {/* ─── Online Quest Mode ─── */}
                  <div style={{
                    background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
                    border: "2px solid #bfdbfe",
                    borderRadius: "14px",
                    padding: "10px 14px",
                    fontSize: "0.8rem",
                    color: "#1e40af",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center"
                  }}>
                    <span style={{ fontSize: "1.3rem" }}>🎮</span>
                    <div>
                      <strong>Online Interactive Quest</strong>
                      <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                        {language === "kn" ? "ಅಂಕ ಮತ್ತು ಸ್ಟಾರ್ ಪಡೆಯಲು ಆಟವಾಡಿ!" : "Play the animated game on screen to earn stars & XP!"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Complete Button ─── */}
              <button
                className="bounce-btn"
                onClick={handleCompleteSession}
                disabled={!sessionScore}
                style={{
                  width: "100%",
                  background: !sessionScore
                    ? "linear-gradient(135deg,#d1d5db,#9ca3af)"
                    : "linear-gradient(135deg,#22c55e,#16a34a)",
                  color: "#fff",
                  border: "none",
                  padding: "16px",
                  borderRadius: "20px",
                  fontWeight: "900",
                  fontSize: "1.1rem",
                  cursor: !sessionScore ? "not-allowed" : "pointer",
                  boxShadow: !sessionScore ? "none" : "0 8px 24px rgba(34,197,94,0.45)",
                  letterSpacing: "0.5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                {sessionScore
                  ? <>🏆 Complete Quest! Get {activeSession.xp || 50} XP!</>
                  : <>🎮 Play the Game to Finish!</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Daily Summary Bottom Bar ─── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        borderTop: "2px solid #e5e7eb",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.07)",
        padding: "12px 24px"
      }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>🎮</span>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "700" }}>Quests Done</div>
                <div style={{ fontWeight: "900", color: "#111827", fontSize: "1rem" }}>{dailySummary.count}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>⚡</span>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "700" }}>Total XP</div>
                <div style={{ fontWeight: "900", color: "#f59e0b", fontSize: "1rem" }}>{totalXP}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "1.4rem" }}>😊</span>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", fontWeight: "700" }}>Mood</div>
                <div style={{ fontWeight: "900", color: "#3b82f6", fontSize: "1rem" }}>{dailySummary.dominantEmotion}</div>
              </div>
            </div>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            color: "#fff",
            padding: "8px 20px",
            borderRadius: "20px",
            fontWeight: "900",
            fontSize: "0.9rem",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            animation: dailySummary.count > 0 ? "pulse 2s ease-in-out infinite" : "none"
          }}>
            {dailySummary.count > 0 ? "🌟 Amazing work! Keep going!" : "💪 Start your first quest!"}
          </div>
        </div>
      </div>

      {showRatingModal && (
        <ActivityRatingModal
          childId={showRatingModal.childId}
          childName={showRatingModal.childName}
          activityId={showRatingModal.activityId}
          activityTitle={showRatingModal.activityTitle}
          initialScore={showRatingModal.initialScore}
          onComplete={handleRatingComplete}
          onCancel={handleRatingSkip}
        />
      )}

      {recentCertificate && (
        <CertificateModal
          childName={recentCertificate.childName}
          childPhoto={recentCertificate.childPhoto}
          activityTitle={recentCertificate.activityTitle}
          xpEarned={recentCertificate.xpEarned}
          stars={recentCertificate.stars}
          onClose={() => setRecentCertificate(null)}
        />
      )}
    </div>
  );
}
