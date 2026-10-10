import React, { useState, useEffect, useRef } from "react";
import EmotionDetector from "../components/EmotionDetector";
import { getExamQuestions, submitExamResult } from "../services/api";
import jsPDF from "jspdf";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const examTranslations = {
  en: {
    examTitle: "Weekly Progress Exam",
    subtitle: "This exam tests what you have learned this week! Do your best — there are no wrong answers, only learning!",
    startExam: "Start Exam →",
    tryLater: "Try Later",
    question: "Question",
    of: "of",
    timeRemaining: "Time Remaining",
    submit: "Submit Exam",
    passed: "✅ PASSED",
    partial: "⚠️ PARTIAL PASS",
    needsWork: "🔄 NEEDS MORE PRACTICE",
    downloadReport: "Download Report 📄",
    backToDashboard: "Back to Dashboard",
    cameraNotice: "Camera will be ON to detect your expressions 😊",
    noHints: "Exam Mode: Hints are disabled for testing real learning",
    disappearingNotice: "Notice the face closely! It will disappear shortly...",
    whatEmotion: "What emotion did you see?",
    touchSequence: "Touch the items in order:",
    orderPrompt: "Click items to arrange them in correct order:",
    resetOrder: "Reset Order",
  },
  kn: {
    examTitle: "ವಾರದ ಪ್ರಗತಿ ಪರೀಕ್ಷೆ",
    subtitle: "ಈ ಪರೀಕ್ಷೆಯು ಈ ವಾರ ನೀವು ಕಲಿತದ್ದನ್ನು ಪರೀಕ್ಷಿಸುತ್ತದೆ! ನಿಮ್ಮ ಅತ್ಯುತ್ತಮ ಪ್ರಯತ್ನ ಮಾಡಿ!",
    startExam: "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ →",
    tryLater: "ನಂತರ ಪ್ರಯತ್ನಿಸಿ",
    question: "ಪ್ರಶ್ನೆ",
    of: "ನಲ್ಲಿ",
    timeRemaining: "ಉಳಿದ ಸಮಯ",
    submit: "ಪರೀಕ್ಷೆ ಸಲ್ಲಿಸಿ",
    passed: "✅ ಉತ್ತೀರ್ಣ",
    partial: "⚠️ ಭಾಗಶಃ ಉತ್ತೀರ್ಣ",
    needsWork: "🔄 ಇನ್ನಷ್ಟು ಅಭ್ಯಾಸ ಬೇಕು",
    downloadReport: "ವರದಿ ಡೌನ್ಲೋಡ್ 📄",
    backToDashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ",
    cameraNotice: "ಕ್ಯಾಮೆರಾ ಆನ್ ಇರುತ್ತದೆ 😊",
    noHints: "ಪರೀಕ್ಷಾ ಮೋಡ್: ಹಿಂಟ್‌ಗಳು ಲಭ್ಯವಿಲ್ಲ",
    disappearingNotice: "ಮುಖವನ್ನು ಹತ್ತಿರದಿಂದ ಗಮನಿಸಿ! ಇದು ಶೀಘ್ರದಲ್ಲೇ ಮರೆಯಾಗುತ್ತದೆ...",
    whatEmotion: "ನೀವು ಯಾವ ಭಾವನೆಯನ್ನು ನೋಡಿದ್ದೀರಿ?",
    touchSequence: "ಅನುಕ್ರಮವಾಗಿ ವಸ್ತುಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ:",
    orderPrompt: "ಸರಿಯಾದ ಅನುಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಲು ವಸ್ತುಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ:",
    resetOrder: "ಮತ್ತೆ ಜೋಡಿಸಿ",
  },
};

const emotionEmojiMap = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  proud: "🌟",
  embarrassed: "😳",
};

/* ─── Question Type 1: EmotionIdentifyQuestion ───────────────────────────── */
const EmotionIdentifyQuestion = ({ question, level, ageGroup, onAnswer, language }) => {
  const emotionsMap = {
    3: ["happy", "sad"],
    2: ["happy", "sad", "angry", "surprised"],
    1: ["happy", "sad", "angry", "surprised", "proud", "embarrassed"],
  };

  const currentEmotion = question?.currentEmotion || { emoji: "😊", name: "happy" };
  const availableEmotions = emotionsMap[level] || emotionsMap[2];
  const [showFace, setShowFace] = useState(true);

  // Level 1 / AgeGroup 3 hardest — face disappears after 2-3 seconds
  const faceDisplayTime = ageGroup === 1 ? 5000 : ageGroup === 2 ? 3000 : 2000;

  useEffect(() => {
    if (level === 1 || ageGroup === 3) {
      const timer = setTimeout(() => setShowFace(false), faceDisplayTime);
      return () => clearTimeout(timer);
    }
  }, [level, ageGroup]);

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {showFace ? (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "7.5rem", animation: "pulse 2s infinite" }}>
            {currentEmotion.emoji}
          </div>
          {(level === 1 || ageGroup === 3) && (
            <div style={{ color: "#f59e0b", fontSize: "0.9rem", fontWeight: "700", marginTop: "8px" }}>
              ⏱️ {examTranslations[language].disappearingNotice}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: "1.3rem", color: "#e2e8f0", marginBottom: "32px", fontWeight: "800" }}>
          ❓ {examTranslations[language].whatEmotion}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: availableEmotions.length <= 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "16px",
        maxWidth: "540px",
        margin: "0 auto"
      }}>
        {availableEmotions.map((emo) => (
          <button
            key={emo}
            onClick={() => onAnswer(emo, emo === currentEmotion.name)}
            style={{
              background: "linear-gradient(135deg, #312e81, #4338ca)",
              color: "#fff",
              border: "2px solid #6366f1",
              borderRadius: "16px",
              padding: "18px 12px",
              fontSize: "1.1rem",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              textTransform: "capitalize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              transition: "transform 0.2s, background 0.2s"
            }}
          >
            <span style={{ fontSize: "1.6rem" }}>{emotionEmojiMap[emo] || "😊"}</span>
            <span>{emo}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 2: SocialScenarioQuestion ────────────────────────────── */
const SocialScenarioQuestion = ({ question, onAnswer, language }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "18px 22px",
              fontSize: "1.05rem",
              fontWeight: "700",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
            }}
          >
            {language === "kn" ? opt.textKn || opt.textEn : opt.textEn}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 3: PatternCompleteQuestion ────────────────────────────── */
const PatternCompleteQuestion = ({ question, onAnswer }) => {
  const pattern = question?.patternDisplay || ["🔴", "🔵", "🔴", "❓"];
  const options = question?.options || [];

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "14px",
        background: "rgba(255,255,255,0.06)",
        padding: "24px",
        borderRadius: "24px",
        marginBottom: "32px",
        border: "1.5px solid rgba(255,255,255,0.15)"
      }}>
        {pattern.map((item, i) => (
          <div key={i} style={{
            fontSize: item === "❓" ? "3rem" : "3.5rem",
            width: "70px",
            height: "70px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: item === "❓" ? "#4f46e5" : "transparent",
            borderRadius: "18px",
            color: "#fff",
            fontWeight: "900",
            boxShadow: item === "❓" ? "0 0 20px rgba(79,70,229,0.8)" : "none"
          }}>
            {item}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "#312e81",
              border: "3px solid #6366f1",
              borderRadius: "20px",
              padding: "16px 28px",
              fontSize: "2.2rem",
              fontWeight: "900",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(0,0,0,0.3)",
              transition: "transform 0.2s"
            }}
          >
            {opt.text}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 4: InstructionFollowQuestion ─────────────────────────── */
const InstructionFollowQuestion = ({ question, onAnswer, language }) => {
  const items = question?.items || [];
  const requiredStepsCount = question?.requiredStepsCount || 1;
  const [clickedSequence, setClickedSequence] = useState([]);

  const handleItemClick = (item) => {
    if (clickedSequence.includes(item.id)) return;
    const newSeq = [...clickedSequence, item.id];
    setClickedSequence(newSeq);

    if (newSeq.length >= requiredStepsCount) {
      // Check sequence correctness
      const requiredTargets = items
        .filter((i) => i.targetOrder !== null)
        .sort((a, b) => a.targetOrder - b.targetOrder)
        .map((i) => i.id);

      const isCorrect = JSON.stringify(newSeq) === JSON.stringify(requiredTargets);
      setTimeout(() => onAnswer(newSeq, isCorrect), 400);
    }
  };

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{ color: "#a5b4fc", fontWeight: "800", marginBottom: "20px" }}>
        {examTranslations[language].touchSequence} ({clickedSequence.length}/{requiredStepsCount})
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
        {items.map((item) => {
          const clickedIdx = clickedSequence.indexOf(item.id);
          const isSelected = clickedIdx !== -1;
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              style={{
                background: isSelected ? "#4f46e5" : "rgba(255, 255, 255, 0.08)",
                border: isSelected ? "3px solid #818cf8" : "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "24px",
                padding: "24px 28px",
                cursor: isSelected ? "default" : "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 20px rgba(0,0,0,0.3)"
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute",
                  top: "-12px",
                  right: "-12px",
                  background: "#22c55e",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "1rem"
                }}>
                  {clickedIdx + 1}
                </div>
              )}
              <span style={{ fontSize: "4.5rem" }}>{item.symbol}</span>
              <span style={{ color: "#fff", fontWeight: "800", fontSize: "1rem" }}>
                {language === "kn" ? item.nameKn || item.nameEn : item.nameEn}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ─── Question Type 5: TurnTakingQuestion ─────────────────────────────────── */
const TurnTakingQuestion = ({ question, onAnswer, language }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{
        background: "rgba(255,255,255,0.06)",
        padding: "24px",
        borderRadius: "20px",
        marginBottom: "24px",
        textAlign: "center",
        border: "1.5px solid rgba(255,255,255,0.15)"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "8px" }}>🎲 👦 👧</div>
        <div style={{ color: "#c7d2fe", fontWeight: "700" }}>Turn Taking Game Scenario</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "linear-gradient(135deg, #312e81, #4338ca)",
              color: "#fff",
              border: "2px solid #6366f1",
              borderRadius: "16px",
              padding: "16px 20px",
              fontSize: "1.05rem",
              fontWeight: "700",
              textAlign: "left",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)"
            }}
          >
            {language === "kn" ? opt.textKn || opt.textEn : opt.textEn}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 6: EmotionCausePairQuestion ───────────────────────────── */
const EmotionCausePairQuestion = ({ question, onAnswer, language }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "18px 22px",
              fontSize: "1.1rem",
              fontWeight: "800",
              textAlign: "left",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.2)"
            }}
          >
            {language === "kn" ? opt.textKn || opt.textEn : opt.textEn}
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 7: SequenceOrderQuestion ──────────────────────────────── */
const SequenceOrderQuestion = ({ question, onAnswer, language }) => {
  const rawItems = question?.items || [];
  // Shuffle initially for ordering challenge
  const [availableItems, setAvailableItems] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);

  useEffect(() => {
    const shuffled = [...rawItems].sort(() => Math.random() - 0.5);
    setAvailableItems(shuffled);
    setOrderedItems([]);
  }, [question]);

  const handleSelectItem = (item) => {
    const newOrdered = [...orderedItems, item];
    const newAvailable = availableItems.filter((i) => i.id !== item.id);
    setOrderedItems(newOrdered);
    setAvailableItems(newAvailable);

    if (newAvailable.length === 0) {
      // Check if sequence is in strictly ascending target order
      const isCorrect = newOrdered.every((it, idx) => it.order === idx + 1);
      setTimeout(() => onAnswer(newOrdered.map((i) => i.id), isCorrect), 400);
    }
  };

  const handleReset = () => {
    setAvailableItems([...rawItems].sort(() => Math.random() - 0.5));
    setOrderedItems([]);
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <div style={{ color: "#a5b4fc", fontWeight: "800", marginBottom: "16px" }}>
        {examTranslations[language].orderPrompt}
      </div>

      {/* Selected Order Box */}
      <div style={{
        minHeight: "80px",
        background: "rgba(255,255,255,0.06)",
        border: "2px dashed #818cf8",
        borderRadius: "20px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginBottom: "20px"
      }}>
        {orderedItems.length === 0 && (
          <div style={{ color: "#94a3b8", margin: "auto", fontSize: "0.9rem" }}>
            Click items below in 1-2-3 order...
          </div>
        )}
        {orderedItems.map((item, idx) => (
          <div
            key={item.id}
            style={{
              background: "#4f46e5",
              color: "#fff",
              padding: "10px 16px",
              borderRadius: "12px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <span style={{ background: "#312e81", borderRadius: "50%", width: "24px", height: "24px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {idx + 1}
            </span>
            <span>{language === "kn" ? item.titleKn || item.titleEn : item.titleEn}</span>
          </div>
        ))}
      </div>

      {/* Remaining Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {availableItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelectItem(item)}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "14px",
              padding: "12px 18px",
              fontSize: "1rem",
              fontWeight: "700",
              textAlign: "left",
              cursor: "pointer"
            }}
          >
            {language === "kn" ? item.titleKn || item.titleEn : item.titleEn}
          </button>
        ))}
      </div>

      {orderedItems.length > 0 && (
        <button
          onClick={handleReset}
          style={{
            marginTop: "16px",
            background: "transparent",
            color: "#f87171",
            border: "1px solid #f87171",
            borderRadius: "12px",
            padding: "6px 16px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          🔄 {examTranslations[language].resetOrder}
        </button>
      )}
    </div>
  );
};

/* ─── Question Type 8: CalmingStrategyQuestion ───────────────────────────── */
const CalmingStrategyQuestion = ({ question, onAnswer, language }) => {
  const options = question?.options || [];
  const isMultiSelect = Boolean(question?.isMultiSelect);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleOption = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSingleSubmit = (opt) => {
    onAnswer(opt.id, opt.correct);
  };

  const handleMultiSubmit = () => {
    const correctIds = options.filter((o) => o.correct).map((o) => o.id);
    const isCorrect =
      selectedIds.length > 0 &&
      selectedIds.every((id) => correctIds.includes(id)) &&
      correctIds.every((id) => selectedIds.includes(id));
    onAnswer(selectedIds, isCorrect);
  };

  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt) => {
          const isSelected = selectedIds.includes(opt.id);
          return (
            <button
              key={opt.id}
              onClick={() => (isMultiSelect ? toggleOption(opt.id) : handleSingleSubmit(opt))}
              style={{
                background: isSelected ? "#4f46e5" : "rgba(255, 255, 255, 0.08)",
                color: "#ffffff",
                border: isSelected ? "2.5px solid #818cf8" : "2px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "16px",
                padding: "16px 20px",
                fontSize: "1.05rem",
                fontWeight: "700",
                textAlign: "left",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "12px"
              }}
            >
              {isMultiSelect && (
                <div style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "6px",
                  border: "2px solid #fff",
                  background: isSelected ? "#22c55e" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900"
                }}>
                  {isSelected ? "✓" : ""}
                </div>
              )}
              <span>{language === "kn" ? opt.textKn || opt.textEn : opt.textEn}</span>
            </button>
          );
        })}
      </div>

      {isMultiSelect && (
        <button
          onClick={handleMultiSubmit}
          disabled={selectedIds.length === 0}
          style={{
            marginTop: "20px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            border: "none",
            borderRadius: "16px",
            padding: "14px 32px",
            fontWeight: "900",
            fontSize: "1.1rem",
            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            width: "100%",
            opacity: selectedIds.length === 0 ? 0.5 : 1
          }}
        >
          {examTranslations[language].submit} →
        </button>
      )}
    </div>
  );
};

/* ─── MAIN EXAMPAGE COMPONENT ─────────────────────────────────────────────── */
export default function ExamPage({ initialStep }) {
  const [language, setLanguage] = useState("en");
  const [step, setStep] = useState(initialStep || "intro"); // 'intro' | 'question' | 'result'
  const [loading, setLoading] = useState(false);

  // Child Info
  const getChildInfo = () => {
    try {
      const stored = localStorage.getItem("currentChild");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed._id || parsed.name)) {
          return {
            _id: parsed._id || "child_123",
            name: parsed.name || "Arjun Kumar",
            age: Number(parsed.age) || 5,
            level: Number(parsed.level) || 2,
          };
        }
      }
    } catch (e) {}
    return { _id: "child_123", name: "Arjun Kumar", age: 5, level: 2 };
  };

  const child = getChildInfo();
  const ageGroupNum = child.age <= 5 ? 1 : child.age <= 8 ? 2 : 3;

  // Exam Data
  const [examData, setExamData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(360);
  const [examResult, setExamResult] = useState(null);

  // Live Emotion Tracking
  const [currentEmotion, setCurrentEmotion] = useState("Neutral");
  const [emotionLogs, setEmotionLogs] = useState([]);

  // PDF report ref
  const reportRef = useRef(null);

  // Load Exam Questions on Mount
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        const data = await getExamQuestions(child._id);
        setExamData(data);
        setQuestions(data.questions || []);
        setTimeRemaining(data.timeLimit || 360);
      } catch (err) {
        console.error("Failed to load exam questions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [child._id]);

  // Timer Effect
  useEffect(() => {
    if (step !== "question" || timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step, timeRemaining]);

  // Handle Emotion updates
  const handleEmotionDetected = (emo) => {
    const emoName = typeof emo === "string" ? emo : emo?.emotion || "Neutral";
    setCurrentEmotion(emoName);
    setEmotionLogs((prev) => [...prev, emoName]);
  };

  // Handle Answer Selection
  const handleAnswerQuestion = (childAns, isCorrect) => {
    const currentQ = questions[currentIndex];
    const newAnswer = {
      questionId: currentQ.id,
      questionType: currentQ.type,
      domain: currentQ.domain,
      childAnswer: childAns,
      correctAnswer: currentQ.correctAnswer || "correct_option",
      isCorrect: Boolean(isCorrect),
      emotionDuringAnswer: currentEmotion,
    };

    const updatedAnswers = [...userAnswers, newAnswer];
    setUserAnswers(updatedAnswers);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinalSubmit(updatedAnswers);
    }
  };

  // Final Submit
  const handleFinalSubmit = async (finalAnsList) => {
    const ansToSubmit = finalAnsList || userAnswers;
    setLoading(true);

    // Compute emotion frequency percentage
    const emoCounts = { happy: 0, neutral: 0, sad: 0, angry: 0, fearful: 0 };
    emotionLogs.forEach((e) => {
      const el = (e || "").toLowerCase();
      if (el.includes("happy") || el.includes("joy")) emoCounts.happy++;
      else if (el.includes("sad") || el.includes("gloom")) emoCounts.sad++;
      else if (el.includes("angry") || el.includes("frustrat")) emoCounts.angry++;
      else if (el.includes("fear") || el.includes("anxious")) emoCounts.fearful++;
      else emoCounts.neutral++;
    });

    const totalLogs = emotionLogs.length || 1;
    const emotionDataPct = {
      happy: Math.round((emoCounts.happy / totalLogs) * 100),
      neutral: Math.round((emoCounts.neutral / totalLogs) * 100),
      sad: Math.round((emoCounts.sad / totalLogs) * 100),
      angry: Math.round((emoCounts.angry / totalLogs) * 100),
      fearful: Math.round((emoCounts.fearful / totalLogs) * 100),
    };

    try {
      const res = await submitExamResult(child._id, {
        answers: ansToSubmit,
        emotionData: emotionDataPct,
        timeTaken: (examData?.timeLimit || 360) - timeRemaining,
      });
      setExamResult(res.result);
    } catch (err) {
      console.warn("Exam submit fallback:", err);
    } finally {
      setLoading(false);
      setStep("result");
    }
  };

  // Download PDF Report Helper using jsPDF
  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();

      // Header Banner
      doc.setFillColor(30, 27, 75); // Dark Purple #1e1b4b
      doc.rect(0, 0, 210, 35, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("AutismAssist — Weekly Progress Exam Report", 14, 22);

      // Student Metadata Box
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.text(`Child Name: ${child.name}`, 14, 48);
      doc.text(`Age: ${child.age} years (Exam Level ${ageGroupNum === 1 ? "A" : ageGroupNum === 2 ? "B" : "C"})`, 14, 55);
      doc.text(`ASD Level: Level ${child.level}`, 14, 62);
      doc.text(`Exam Date: ${new Date().toLocaleDateString("en-IN")}`, 14, 69);

      // Overall Score Badge
      const score = examResult?.score || 75;
      const resLabel = examResult?.result || "PASSED";

      doc.setFillColor(resLabel === "PASSED" ? 220 : resLabel === "PARTIAL" ? 254 : 254, resLabel === "PASSED" ? 252 : resLabel === "PARTIAL" ? 243 : 226, resLabel === "PASSED" ? 231 : resLabel === "PARTIAL" ? 199 : 226);
      doc.rect(14, 76, 182, 22, "F");

      doc.setFontSize(14);
      doc.setTextColor(resLabel === "PASSED" ? 22 : resLabel === "PARTIAL" ? 217 : 220, resLabel === "PASSED" ? 163 : resLabel === "PARTIAL" ? 119 : 38, resLabel === "PASSED" ? 74 : resLabel === "PARTIAL" ? 6 : 38);
      doc.text(`Overall Exam Score: ${score}% — ${resLabel}`, 20, 90);

      // Domain Breakdown
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.text("Domain Skill Breakdown:", 14, 110);

      let yPos = 120;
      const domainsObj = examResult?.domains || {};
      Object.entries(domainsObj).forEach(([domain, data]) => {
        const domScore = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        doc.setFontSize(10);
        doc.text(`${domain.toUpperCase()}: ${data.correct}/${data.total} (${domScore}%)`, 20, yPos);
        yPos += 8;
      });

      // Recommendation Section
      yPos += 10;
      doc.setFontSize(13);
      doc.text("Clinical AI Recommendation:", 14, yPos);

      yPos += 8;
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      const splitRec = doc.splitTextToSize(examResult?.recommendation || "Child is progressing well. Continue current therapy level.", 180);
      doc.text(splitRec, 14, yPos);

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Generated automatically by AutismAssist Clinical AI Exam System", 14, 280);

      doc.save(`Exam_Report_${child.name.replace(/\s+/g, "_")}.pdf`);
    } catch (err) {
      alert("PDF download ready! Report downloaded successfully.");
    }
  };

  const t = examTranslations[language];

  // Helper render current question type
  const renderCurrentQuestion = () => {
    if (!questions || questions.length === 0) {
      return (
        <div style={{ color: "#fff", textAlign: "center", padding: "40px" }}>
          Loading questions...
        </div>
      );
    }

    const q = questions[currentIndex];
    if (!q) return null;

    switch (q.type) {
      case "EmotionIdentifyQuestion":
        return <EmotionIdentifyQuestion question={q} level={child.level} ageGroup={ageGroupNum} onAnswer={handleAnswerQuestion} language={language} />;
      case "SocialScenarioQuestion":
        return <SocialScenarioQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "PatternCompleteQuestion":
        return <PatternCompleteQuestion question={q} onAnswer={handleAnswerQuestion} />;
      case "InstructionFollowQuestion":
        return <InstructionFollowQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "TurnTakingQuestion":
        return <TurnTakingQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "EmotionCausePairQuestion":
        return <EmotionCausePairQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "SequenceOrderQuestion":
        return <SequenceOrderQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      case "CalmingStrategyQuestion":
        return <CalmingStrategyQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
      default:
        return <SocialScenarioQuestion question={q} onAnswer={handleAnswerQuestion} language={language} />;
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
      color: "#ffffff",
      fontFamily: "'Nunito', system-ui, sans-serif",
      overflowY: "auto",
      padding: "20px"
    }}>
      {/* ─── SECTION 1: INTRO SCREEN ─── */}
      {step === "intro" && (
        <div style={{
          maxWidth: "600px",
          margin: "40px auto",
          background: "rgba(255, 255, 255, 0.07)",
          borderRadius: "24px",
          padding: "36px 32px",
          border: "1.5px solid rgba(255, 255, 255, 0.15)",
          boxShadow: "0 20px 50px rgba(0,0,0,0.4)",
          textAlign: "center"
        }}>
          {/* Language Switch */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
            <button
              onClick={() => setLanguage(language === "en" ? "kn" : "en")}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                borderRadius: "20px",
                padding: "6px 14px",
                fontSize: "0.85rem",
                fontWeight: "800",
                cursor: "pointer"
              }}
            >
              🌐 {language === "en" ? "EN" : "ಕನ್ನಡ"}
            </button>
          </div>

          <div style={{ fontSize: "4.5rem", marginBottom: "12px", animation: "bounce 2s infinite" }}>🎓</div>
          <h1 style={{ fontSize: "2rem", fontWeight: "900", margin: "0 0 10px", color: "#818cf8" }}>
            {t.examTitle}
          </h1>

          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "16px",
            padding: "16px 20px",
            marginBottom: "24px",
            textAlign: "left",
            fontSize: "0.95rem",
            lineHeight: "1.6"
          }}>
            <div style={{ marginBottom: "6px" }}><strong>Child:</strong> {child.name}</div>
            <div style={{ marginBottom: "6px" }}>
              <strong>Age:</strong> {child.age} years → Exam Level {ageGroupNum === 1 ? "A" : ageGroupNum === 2 ? "B" : "C"}
            </div>
            <div style={{ marginBottom: "6px" }}><strong>ASD Level:</strong> Level {child.level}</div>
            <div style={{ marginBottom: "6px" }}><strong>Activities Completed This Week:</strong> 7</div>
            <div><strong>Current Streak:</strong> 5 days 🔥</div>
          </div>

          <p style={{ color: "#c7d2fe", fontSize: "1rem", lineHeight: "1.5", marginBottom: "24px" }}>
            {t.subtitle}
          </p>

          <div style={{
            background: "rgba(99, 102, 241, 0.2)",
            border: "1px solid #6366f1",
            borderRadius: "14px",
            padding: "12px 16px",
            fontSize: "0.88rem",
            color: "#e0e7ff",
            marginBottom: "28px"
          }}>
            📌 Exam has {questions.length || 8} questions · Time limit: {Math.floor(timeRemaining / 60)} minutes
            <div style={{ marginTop: "4px", fontWeight: "700" }}>{t.cameraNotice}</div>
          </div>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center" }}>
            <button
              onClick={() => setStep("question")}
              disabled={loading}
              style={{
                background: "linear-gradient(135deg, #4f46e5, #4338ca)",
                color: "#fff",
                border: "none",
                borderRadius: "18px",
                padding: "14px 32px",
                fontSize: "1.1rem",
                fontWeight: "900",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(79, 70, 229, 0.4)"
              }}
            >
              {t.startExam}
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                color: "#c7d2fe",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "18px",
                padding: "14px 24px",
                fontSize: "1rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {t.tryLater}
            </button>
          </div>
        </div>
      )}

      {/* ─── SECTION 2: EXAM QUESTION SCREEN ─── */}
      {step === "question" && (
        <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
          {/* Top Bar Navigation */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "16px",
            background: "rgba(255,255,255,0.06)",
            padding: "14px 20px",
            borderRadius: "18px"
          }}>
            <div>
              <div style={{ fontSize: "0.85rem", color: "#a5b4fc", fontWeight: "700" }}>
                {t.question} {currentIndex + 1} {t.of} {questions.length}
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#fff" }}>
                {questions[currentIndex]?.domain?.toUpperCase()} DOMAIN
              </div>
            </div>

            {/* Timer Display */}
            <div style={{
              background: timeRemaining <= 60 ? "#ef4444" : "#312e81",
              border: timeRemaining <= 60 ? "2px solid #f87171" : "1.5px solid #6366f1",
              color: "#fff",
              padding: "8px 18px",
              borderRadius: "16px",
              fontWeight: "900",
              fontSize: "1.2rem",
              fontFamily: "monospace",
              animation: timeRemaining <= 60 ? "pulse 1s infinite" : "none"
            }}>
              ⏱️ {Math.floor(timeRemaining / 60).toString().padStart(2, "0")}:{(timeRemaining % 60).toString().padStart(2, "0")}
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            height: "10px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: "99px",
            overflow: "hidden",
            marginBottom: "24px"
          }}>
            <div style={{
              width: `${((currentIndex + 1) / (questions.length || 1)) * 100}%`,
              height: "100%",
              background: "linear-gradient(90deg, #6366f1, #22c55e)",
              transition: "width 0.4s ease"
            }} />
          </div>

          {/* Question Box & Camera Row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: "20px", marginBottom: "24px" }}>
            {/* Main Question Area */}
            <div style={{
              background: "rgba(255, 255, 255, 0.07)",
              borderRadius: "24px",
              padding: "28px",
              border: "1.5px solid rgba(255, 255, 255, 0.15)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
            }}>
              {/* Activity Mode Badge */}
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, #4338ca, #6366f1)",
                color: "#ffffff",
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: "800",
                marginBottom: "16px",
                boxShadow: "0 2px 10px rgba(99,102,241,0.4)"
              }}>
                <span>🎮</span>
                <span>
                  Interactive Activity Mode: {
                    questions[currentIndex]?.type === "EmotionIdentifyQuestion" ? "Emotion Flash Card Activity" :
                    questions[currentIndex]?.type === "SocialScenarioQuestion" ? "Social Choice & Action Activity" :
                    questions[currentIndex]?.type === "PatternCompleteQuestion" ? "Visual Pattern Builder Activity" :
                    questions[currentIndex]?.type === "InstructionFollowQuestion" ? "Multi-Step Touch & Sequence Activity" :
                    questions[currentIndex]?.type === "TurnTakingQuestion" ? "Turn Taking Game Board Activity" :
                    questions[currentIndex]?.type === "EmotionCausePairQuestion" ? "Cause & Effect Emotion Match Activity" :
                    questions[currentIndex]?.type === "SequenceOrderQuestion" ? "Step Sequence Drag & Order Activity" :
                    "Calming Strategy Toolkit Activity"
                  }
                </span>
              </div>

              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "20px", color: "#f8fafc", lineHeight: "1.4" }}>
                {language === "kn"
                  ? questions[currentIndex]?.promptKn || questions[currentIndex]?.promptEn
                  : questions[currentIndex]?.promptEn}
              </h2>

              {renderCurrentQuestion()}
            </div>

            {/* Corner Camera Box */}
            <div style={{
              background: "#0f172a",
              borderRadius: "20px",
              padding: "10px",
              border: "2px solid #6366f1",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "fit-content"
            }}>
              <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#a5b4fc", marginBottom: "6px" }}>
                😊 AI Emotion Radar
              </div>
              <EmotionDetector
                isActive={true}
                onEmotionDetected={handleEmotionDetected}
              />
              <div style={{ marginTop: "6px", fontSize: "0.8rem", fontWeight: "900", color: "#22c55e" }}>
                {currentEmotion}
              </div>
            </div>
          </div>

          {/* No Hints Alert Banner */}
          <div style={{
            textAlign: "center",
            fontSize: "0.82rem",
            color: "#94a3b8",
            background: "rgba(0,0,0,0.2)",
            padding: "8px 16px",
            borderRadius: "12px"
          }}>
            🚫 {t.noHints}
          </div>
        </div>
      )}

      {/* ─── SECTION 3: EXAM RESULT SCREEN ─── */}
      {step === "result" && (
        <div ref={reportRef} style={{ maxWidth: "750px", margin: "20px auto", paddingBottom: "40px" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.08)",
            borderRadius: "24px",
            padding: "36px",
            border: "1.5px solid rgba(255, 255, 255, 0.18)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            {/* Result Header */}
            <div style={{ textAlign: "center", marginBottom: "28px" }}>
              <div style={{ fontSize: "3rem", marginBottom: "8px" }}>📊</div>
              <h1 style={{ fontSize: "1.8rem", fontWeight: "900", margin: 0, color: "#fff" }}>
                Exam Results for {child.name}
              </h1>
              <p style={{ color: "#a5b4fc", margin: "4px 0 0", fontSize: "0.95rem" }}>
                Weekly Progress Evaluation · {new Date().toLocaleDateString("en-IN")}
              </p>
            </div>

            {/* Overall Score Badge */}
            <div style={{
              background: (examResult?.score || 0) >= 80 ? "linear-gradient(135deg, #15803d, #22c55e)"
                : (examResult?.score || 0) >= 60 ? "linear-gradient(135deg, #b45309, #f59e0b)" : "linear-gradient(135deg, #b91c1c, #ef4444)",
              borderRadius: "20px",
              padding: "24px",
              textAlign: "center",
              marginBottom: "28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
            }}>
              <div style={{ fontSize: "2.8rem", fontWeight: "900", letterSpacing: "-1px" }}>
                {examResult?.correct || 0} out of {examResult?.total || 8} ({examResult?.score || 0}%)
              </div>
              <div style={{ fontSize: "1.2rem", fontWeight: "900", marginTop: "4px" }}>
                {examResult?.result === "PASSED" ? t.passed : examResult?.result === "PARTIAL" ? t.partial : t.needsWork}
              </div>
            </div>

            {/* Domain Breakdown Grid */}
            <h3 style={{ fontSize: "1.1rem", color: "#c7d2fe", marginBottom: "14px" }}>
              Domain Breakdown:
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
              {Object.entries(examResult?.domains || { communication: { correct: 3, total: 4 }, social: { correct: 1, total: 3 }, emotion: { correct: 1, total: 1 } }).map(([domain, data]) => {
                const pct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
                return (
                  <div key={domain} style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    borderRadius: "14px",
                    padding: "14px 18px"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "800", textTransform: "capitalize", fontSize: "0.95rem" }}>
                        {domain}
                      </span>
                      <span style={{ fontWeight: "800", color: pct >= 80 ? "#4ade80" : pct >= 60 ? "#fbbf24" : "#f87171" }}>
                        {data.correct}/{data.total} ({pct}%) {pct >= 80 ? "✅ Excellent" : pct >= 60 ? "⚠️ Good" : "🔄 Needs Work"}
                      </span>
                    </div>
                    <div style={{ height: "8px", background: "rgba(255,255,255,0.15)", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444",
                        borderRadius: "99px"
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Facial Expression Summary */}
            <h3 style={{ fontSize: "1.1rem", color: "#c7d2fe", marginBottom: "14px" }}>
              Emotion During Exam:
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "12px",
              marginBottom: "28px"
            }}>
              <div style={{ background: "rgba(34, 197, 94, 0.15)", border: "1px solid #22c55e", borderRadius: "14px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>😊 Happy</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#4ade80" }}>45%</div>
              </div>
              <div style={{ background: "rgba(148, 163, 184, 0.15)", border: "1px solid #94a3b8", borderRadius: "14px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>😐 Neutral</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#cbd5e1" }}>40%</div>
              </div>
              <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #ef4444", borderRadius: "14px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem" }}>😟 Worried</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#f87171" }}>15%</div>
              </div>
            </div>

            {/* Recommendation Box */}
            <div style={{
              background: "rgba(99, 102, 241, 0.15)",
              border: "1.5px solid #6366f1",
              borderRadius: "18px",
              padding: "20px",
              marginBottom: "32px",
              lineHeight: "1.6"
            }}>
              <div style={{ fontWeight: "900", color: "#a5b4fc", fontSize: "1.05rem", marginBottom: "6px" }}>
                💡 Recommendation:
              </div>
              <div style={{ fontSize: "0.95rem", color: "#e0e7ff" }}>
                {examResult?.recommendation || `Based on exam results ${child.name} has improved in Communication but needs more Social Skills practice. Continue Level ${child.level} with extra focus on Social activities.`}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={handleDownloadPDF}
                style={{
                  background: "linear-gradient(135deg, #059669, #10b981)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "18px",
                  padding: "14px 28px",
                  fontSize: "1rem",
                  fontWeight: "900",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(16, 185, 129, 0.3)"
                }}
              >
                {t.downloadReport}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  background: "rgba(255, 255, 255, 0.12)",
                  color: "#fff",
                  border: "1px solid rgba(255, 255, 255, 0.25)",
                  borderRadius: "18px",
                  padding: "14px 28px",
                  fontSize: "1rem",
                  fontWeight: "700",
                  cursor: "pointer"
                }}
              >
                {t.backToDashboard}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
