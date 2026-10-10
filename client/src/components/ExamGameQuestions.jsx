import React, { useState, useEffect } from "react";

export const examTranslations = {
  en: {
    examTitle: "Weekly Progress Exam",
    subtitle: "This exam tests what you have learned through interactive games! Do your best — there are no wrong answers, only learning!",
    startExam: "Start Game Exam →",
    tryLater: "Try Later",
    question: "Challenge",
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
    examTitle: "ವಾರದ ಆಟದ ಪರೀಕ್ಷೆ",
    subtitle: "ಈ ಪರೀಕ್ಷೆಯು ಆಟಗಳ ಮೂಲಕ ನೀವು ಕಲಿತದ್ದನ್ನು ಪರೀಕ್ಷಿಸುತ್ತದೆ! ನಿಮ್ಮ ಅತ್ಯುತ್ತಮ ಪ್ರಯತ್ನ ಮಾಡಿ!",
    startExam: "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ →",
    tryLater: "ನಂತರ ಪ್ರಯತ್ನಿಸಿ",
    question: "ಸವಾಲು",
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

export const emotionEmojiMap = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  proud: "🌟",
  embarrassed: "😳",
};

/* ─── Question Type 1: EmotionIdentifyQuestion ───────────────────────────── */
export const EmotionIdentifyQuestion = ({ question, level, ageGroup, onAnswer, language = "en" }) => {
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

  const t = examTranslations[language] || examTranslations.en;

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      {showFace ? (
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "6.5rem", animation: "pulse 2s infinite" }}>
            {currentEmotion.emoji}
          </div>
          {(level === 1 || ageGroup === 3) && (
            <div style={{ color: "#f59e0b", fontSize: "0.9rem", fontWeight: "700", marginTop: "8px" }}>
              ⏱️ {t.disappearingNotice}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: "1.3rem", color: "#e2e8f0", marginBottom: "32px", fontWeight: "800" }}>
          ❓ {t.whatEmotion}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: availableEmotions.length <= 2 ? "1fr 1fr" : "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "14px",
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
              padding: "16px 12px",
              fontSize: "1.05rem",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
              textTransform: "capitalize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "transform 0.2s, background 0.2s"
            }}
          >
            <span style={{ fontSize: "1.5rem" }}>{emotionEmojiMap[emo] || "😊"}</span>
            <span>{emo}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ─── Question Type 2: SocialScenarioQuestion ────────────────────────────── */
export const SocialScenarioQuestion = ({ question, onAnswer, language = "en" }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "16px 20px",
              fontSize: "1rem",
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
export const PatternCompleteQuestion = ({ question, onAnswer }) => {
  const pattern = question?.patternDisplay || ["🔴", "🔵", "🔴", "❓"];
  const options = question?.options || [];

  return (
    <div style={{ textAlign: "center", width: "100%" }}>
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "12px",
        background: "rgba(255,255,255,0.06)",
        padding: "20px",
        borderRadius: "20px",
        marginBottom: "28px",
        border: "1.5px solid rgba(255,255,255,0.15)"
      }}>
        {pattern.map((item, i) => (
          <div key={i} style={{
            fontSize: item === "❓" ? "2.6rem" : "3rem",
            width: "60px",
            height: "60px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: item === "❓" ? "#4f46e5" : "transparent",
            borderRadius: "16px",
            color: "#fff",
            fontWeight: "900",
            boxShadow: item === "❓" ? "0 0 16px rgba(79,70,229,0.8)" : "none"
          }}>
            {item}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "#312e81",
              border: "3px solid #6366f1",
              borderRadius: "18px",
              padding: "14px 24px",
              fontSize: "2rem",
              fontWeight: "900",
              color: "#fff",
              cursor: "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,0.3)",
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
export const InstructionFollowQuestion = ({ question, onAnswer, language = "en" }) => {
  const items = question?.items || [];
  const requiredStepsCount = question?.requiredStepsCount || 1;
  const [clickedSequence, setClickedSequence] = useState([]);

  const t = examTranslations[language] || examTranslations.en;

  const handleItemClick = (item) => {
    if (clickedSequence.includes(item.id)) return;
    const newSeq = [...clickedSequence, item.id];
    setClickedSequence(newSeq);

    if (newSeq.length >= requiredStepsCount) {
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
      <div style={{ color: "#a5b4fc", fontWeight: "800", marginBottom: "16px" }}>
        {t.touchSequence} ({clickedSequence.length}/{requiredStepsCount})
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
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
                borderRadius: "20px",
                padding: "20px 24px",
                cursor: isSelected ? "default" : "pointer",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 6px 18px rgba(0,0,0,0.3)"
              }}
            >
              {isSelected && (
                <div style={{
                  position: "absolute",
                  top: "-10px",
                  right: "-10px",
                  background: "#22c55e",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "0.95rem"
                }}>
                  {clickedIdx + 1}
                </div>
              )}
              <span style={{ fontSize: "3.8rem" }}>{item.symbol}</span>
              <span style={{ color: "#fff", fontWeight: "800", fontSize: "0.95rem" }}>
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
export const TurnTakingQuestion = ({ question, onAnswer, language = "en" }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{
        background: "rgba(255,255,255,0.06)",
        padding: "20px",
        borderRadius: "18px",
        marginBottom: "20px",
        textAlign: "center",
        border: "1.5px solid rgba(255,255,255,0.15)"
      }}>
        <div style={{ fontSize: "3.5rem", marginBottom: "6px" }}>🎲 👦 👧</div>
        <div style={{ color: "#c7d2fe", fontWeight: "700" }}>Turn Taking Game Scenario</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "linear-gradient(135deg, #312e81, #4338ca)",
              color: "#fff",
              border: "2px solid #6366f1",
              borderRadius: "16px",
              padding: "14px 18px",
              fontSize: "1rem",
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
export const EmotionCausePairQuestion = ({ question, onAnswer, language = "en" }) => {
  const options = question?.options || [];
  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onAnswer(opt.id, opt.correct)}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "16px",
              padding: "16px 20px",
              fontSize: "1.05rem",
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
export const SequenceOrderQuestion = ({ question, onAnswer, language = "en" }) => {
  const rawItems = question?.items || [];
  const [availableItems, setAvailableItems] = useState([]);
  const [orderedItems, setOrderedItems] = useState([]);

  const t = examTranslations[language] || examTranslations.en;

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
      <div style={{ color: "#a5b4fc", fontWeight: "800", marginBottom: "14px" }}>
        {t.orderPrompt}
      </div>

      {/* Selected Order Box */}
      <div style={{
        minHeight: "70px",
        background: "rgba(255,255,255,0.06)",
        border: "2px dashed #818cf8",
        borderRadius: "18px",
        padding: "10px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        marginBottom: "16px"
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
              padding: "10px 14px",
              borderRadius: "12px",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <span style={{ background: "#312e81", borderRadius: "50%", width: "22px", height: "22px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {idx + 1}
            </span>
            <span>{language === "kn" ? item.titleKn || item.titleEn : item.titleEn}</span>
          </div>
        ))}
      </div>

      {/* Remaining Items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {availableItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleSelectItem(item)}
            style={{
              background: "rgba(255, 255, 255, 0.12)",
              color: "#ffffff",
              border: "2px solid rgba(255, 255, 255, 0.25)",
              borderRadius: "14px",
              padding: "12px 16px",
              fontSize: "0.98rem",
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
            marginTop: "14px",
            background: "transparent",
            color: "#f87171",
            border: "1px solid #f87171",
            borderRadius: "12px",
            padding: "6px 14px",
            fontWeight: "700",
            cursor: "pointer"
          }}
        >
          🔄 {t.resetOrder}
        </button>
      )}
    </div>
  );
};

/* ─── Question Type 8: CalmingStrategyQuestion ───────────────────────────── */
export const CalmingStrategyQuestion = ({ question, onAnswer, language = "en" }) => {
  const options = question?.options || [];
  const isMultiSelect = Boolean(question?.isMultiSelect);
  const [selectedIds, setSelectedIds] = useState([]);

  const t = examTranslations[language] || examTranslations.en;

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
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                padding: "14px 18px",
                fontSize: "1rem",
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
                  width: "20px",
                  height: "20px",
                  borderRadius: "6px",
                  border: "2px solid #fff",
                  background: isSelected ? "#22c55e" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "900",
                  fontSize: "0.85rem"
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
            marginTop: "18px",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            border: "none",
            borderRadius: "16px",
            padding: "12px 28px",
            fontWeight: "900",
            fontSize: "1.05rem",
            cursor: selectedIds.length === 0 ? "not-allowed" : "pointer",
            width: "100%",
            opacity: selectedIds.length === 0 ? 0.5 : 1
          }}
        >
          {t.submit} →
        </button>
      )}
    </div>
  );
};
