import React, { useState, useEffect, useRef } from "react";

/* ─── Flashcard Data Decks ──────────────────────────────────────────────── */
const EMOTION_DECK = [
  { id: "e1", display: "😊", name: "Happy",     nameKn: "ಸಂತೋಷ",  color: "#22c55e", bg: "#dcfce7" },
  { id: "e2", display: "😢", name: "Sad",       nameKn: "ದುಃಖ",   color: "#3b82f6", bg: "#dbeafe" },
  { id: "e3", display: "😠", name: "Angry",     nameKn: "ಕೋಪ",    color: "#ef4444", bg: "#fee2e2" },
  { id: "e4", display: "😮", name: "Surprised", nameKn: "ಆಶ್ಚರ್ಯ", color: "#f59e0b", bg: "#fef3c7" },
  { id: "e5", display: "😨", name: "Scared",    nameKn: "ಭಯ",     color: "#8b5cf6", bg: "#ede9fe" },
  { id: "e6", display: "🤩", name: "Excited",   nameKn: "ಉತ್ಸಾಹ",  color: "#f97316", bg: "#ffedd5" },
  { id: "e7", display: "😴", name: "Sleepy",    nameKn: "ನಿದ್ರಾಲು", color: "#6366f1", bg: "#eef2ff" },
  { id: "e8", display: "🥰", name: "Loved",     nameKn: "ಪ್ರೀತಿ",  color: "#ec4899", bg: "#fdf2f8" },
  { id: "e9", display: "😂", name: "Laughing",  nameKn: "ನಗು",    color: "#84cc16", bg: "#f7fee7" },
  { id: "e10",display: "😎", name: "Cool",      nameKn: "ಕೂಲ್",    color: "#0ea5e9", bg: "#e0f2fe" },
];

const COLOR_DECK = [
  { id: "c1", display: "🔴", bg: "#ef4444", name: "Red",    nameKn: "ಕೆಂಪು",  color: "#ef4444" },
  { id: "c2", display: "🔵", bg: "#3b82f6", name: "Blue",   nameKn: "ನೀಲಿ",   color: "#3b82f6" },
  { id: "c3", display: "🟡", bg: "#eab308", name: "Yellow", nameKn: "ಹಳದಿ",   color: "#eab308" },
  { id: "c4", display: "🟢", bg: "#22c55e", name: "Green",  nameKn: "ಹಸಿರು",  color: "#22c55e" },
  { id: "c5", display: "🟠", bg: "#f97316", name: "Orange", nameKn: "ಕಿತ್ತಳೆ", color: "#f97316" },
  { id: "c6", display: "🟣", bg: "#a855f7", name: "Purple", nameKn: "ಊದಾ",   color: "#a855f7" },
  { id: "c7", display: "🩷", bg: "#ec4899", name: "Pink",   nameKn: "ಗುಲಾಬಿ", color: "#ec4899" },
  { id: "c8", display: "⬛", bg: "#1f2937", name: "Black",  nameKn: "ಕಪ್ಪು",  color: "#374151" },
];

const SHAPE_DECK = [
  { id: "s1", display: "⭕", name: "Circle",   nameKn: "ವೃತ್ತ",    color: "#ef4444", bg: "#fee2e2" },
  { id: "s2", display: "⬛", name: "Square",   nameKn: "ಚೌಕ",     color: "#3b82f6", bg: "#dbeafe" },
  { id: "s3", display: "🔺", name: "Triangle", nameKn: "ತ್ರಿಕೋನ",  color: "#f59e0b", bg: "#fef3c7" },
  { id: "s4", display: "⭐", name: "Star",     nameKn: "ನಕ್ಷತ್ರ",  color: "#f97316", bg: "#ffedd5" },
  { id: "s5", display: "💎", name: "Diamond",  nameKn: "ಡೈಮಂಡ್",  color: "#8b5cf6", bg: "#ede9fe" },
  { id: "s6", display: "🔷", name: "Pentagon", nameKn: "ಪೆಂಟಗನ್", color: "#0ea5e9", bg: "#e0f2fe" },
];

const PICTURE_DECK = [
  { id: "p1", display: "🍎", name: "Apple",    nameKn: "ಸೇಬು",   color: "#ef4444", bg: "#fee2e2" },
  { id: "p2", display: "🐶", name: "Dog",      nameKn: "ನಾಯಿ",   color: "#f97316", bg: "#ffedd5" },
  { id: "p3", display: "🌸", name: "Flower",   nameKn: "ಹೂವು",   color: "#ec4899", bg: "#fdf2f8" },
  { id: "p4", display: "🚗", name: "Car",      nameKn: "ಕಾರು",   color: "#3b82f6", bg: "#dbeafe" },
  { id: "p5", display: "⚽", name: "Ball",     nameKn: "ಚೆಂಡು",  color: "#22c55e", bg: "#dcfce7" },
  { id: "p6", display: "🎂", name: "Cake",     nameKn: "ಕೇಕ್",   color: "#f59e0b", bg: "#fef3c7" },
  { id: "p7", display: "🐱", name: "Cat",      nameKn: "ಬೆಕ್ಕು",  color: "#8b5cf6", bg: "#ede9fe" },
  { id: "p8", display: "🌈", name: "Rainbow",  nameKn: "ಕಾಮನಬಿಲ್ಲು", color: "#6366f1", bg: "#eef2ff" },
  { id: "p9", display: "🍌", name: "Banana",   nameKn: "ಬಾಳೆ",   color: "#eab308", bg: "#fef9c3" },
  { id: "p10",display: "🌙", name: "Moon",     nameKn: "ಚಂದ್ರ",  color: "#0ea5e9", bg: "#e0f2fe" },
];

/* Map activity title → deck */
const GAME_DECKS = {
  "Emotion Flashcards": EMOTION_DECK,
  "Color Sorting":       COLOR_DECK,
  "Shape Matching":      SHAPE_DECK,
  "Picture Exchange":    PICTURE_DECK,
};

/* Util: shuffle array */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Util: pick N items excluding one */
function pickDistractors(deck, correctId, n) {
  return shuffle(deck.filter(d => d.id !== correctId)).slice(0, n);
}

/* Build rounds: pick 6 unique cards as correct answers */
function buildRounds(deck) {
  const cards = shuffle(deck).slice(0, Math.min(6, deck.length));
  return cards.map(card => {
    const distractors = pickDistractors(deck, card.id, 3);
    const options = shuffle([card, ...distractors]);
    return { card, options };
  });
}

/* ─── Confetti burst ─────────────────────────────────────────────────────── */
const CONFETTI_COLORS = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff922b", "#cc5de8"];

function MiniConfetti({ active }) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", overflow: "hidden", borderRadius: "inherit" }}>
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{
          position: "absolute",
          top: "-10px",
          left: `${5 + Math.random() * 90}%`,
          width: `${6 + Math.random() * 6}px`,
          height: `${6 + Math.random() * 6}px`,
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          animation: `cfall 0.9s ease-in ${(i * 0.04).toFixed(2)}s forwards`,
        }} />
      ))}
      <style>{`@keyframes cfall{0%{transform:translateY(0) rotate(0deg);opacity:1}100%{transform:translateY(200px) rotate(540deg);opacity:0}}`}</style>
    </div>
  );
}

/* ─── Main FlashcardGame Component ──────────────────────────────────────── */
export default function FlashcardGame({ activity, language = "en", onComplete }) {
  const deck = GAME_DECKS[activity?.title] || EMOTION_DECK;
  const [rounds]         = useState(() => buildRounds(deck));
  const [roundIdx, setRoundIdx]   = useState(0);
  const [selected, setSelected]   = useState(null);   // chosen option id
  const [isCorrect, setIsCorrect] = useState(null);   // true/false/null
  const [score, setScore]         = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cardFlip, setCardFlip]   = useState(false);
  const [finished, setFinished]   = useState(false);
  const [shakingId, setShakingId] = useState(null);
  const timeoutRef = useRef(null);

  const total = rounds.length;
  const current = rounds[roundIdx];

  /* Auto-advance after answer */
  useEffect(() => {
    if (selected === null) return;
    return () => clearTimeout(timeoutRef.current);
  }, [selected]);

  const handleSelect = (option) => {
    if (selected !== null) return; // already answered
    const correct = option.id === current.card.id;
    setSelected(option.id);
    setIsCorrect(correct);
    if (correct) {
      setScore(s => s + 1);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
    } else {
      setShakingId(option.id);
      setTimeout(() => setShakingId(null), 600);
    }
    // Advance after 1.2s
    timeoutRef.current = setTimeout(() => {
      setSelected(null);
      setIsCorrect(null);
      setCardFlip(true);
      setTimeout(() => {
        setCardFlip(false);
        if (roundIdx + 1 >= total) {
          setFinished(true);
          onComplete && onComplete(Math.round(((score + (correct ? 1 : 0)) / total) * 5));
        } else {
          setRoundIdx(r => r + 1);
        }
      }, 350);
    }, 1200);
  };

  /* ── Finished Screen ── */
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const stars = score >= total ? 5 : score >= Math.ceil(total * 0.8) ? 4 : score >= Math.ceil(total * 0.6) ? 3 : score >= Math.ceil(total * 0.4) ? 2 : 1;
    return (
      <div style={{ textAlign: "center", padding: "20px 10px", position: "relative" }}>
        <MiniConfetti active={true} />
        <div style={{ fontSize: "5rem", animation: "bounceIn 0.6s ease", display: "inline-block", marginBottom: "10px" }}>
          {pct === 100 ? "🏆" : pct >= 60 ? "🌟" : "💪"}
        </div>
        <h3 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#111827", margin: "0 0 6px" }}>
          {pct === 100 ? "PERFECT! You're a superstar!" : pct >= 60 ? "Great job! Amazing!" : "Good try! Keep going!"}
        </h3>
        <div style={{ fontSize: "0.95rem", color: "#6b7280", marginBottom: "20px" }}>
          {score} / {total} correct  &nbsp;•&nbsp;  {pct}%
        </div>
        {/* Star rating */}
        <div style={{ fontSize: "2.4rem", marginBottom: "20px", letterSpacing: "4px" }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ filter: i < stars ? "none" : "grayscale(1) opacity(0.3)", animation: i < stars ? `starPop 0.4s ease ${i * 0.1}s both` : "none", display: "inline-block" }}>⭐</span>
          ))}
        </div>
        {/* Per-round mini recap */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
          {rounds.map((r, i) => (
            <div key={i} style={{ fontSize: "1.8rem", opacity: 0.9, animation: `starPop 0.3s ease ${i * 0.06}s both`, display: "inline-block" }}>
              {r.card.display}
            </div>
          ))}
        </div>
        <style>{`
          @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.2)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
          @keyframes starPop{0%{transform:scale(0) rotate(-30deg);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        `}</style>
      </div>
    );
  }

  if (!current) return null;

  /* ── Game Round ── */
  return (
    <div style={{ fontFamily: "'Nunito', system-ui, sans-serif", userSelect: "none" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');
        @keyframes cardAppear{0%{transform:scale(0.5) rotate(-8deg);opacity:0}70%{transform:scale(1.06) rotate(2deg)}100%{transform:scale(1) rotate(0);opacity:1}}
        @keyframes cardFlipOut{0%{transform:rotateY(0);opacity:1}100%{transform:rotateY(90deg);opacity:0}}
        @keyframes optionBounce{0%{transform:translateY(20px);opacity:0}70%{transform:translateY(-5px)}100%{transform:translateY(0);opacity:1}}
        @keyframes correctPulse{0%{transform:scale(1)}30%{transform:scale(1.12)}60%{transform:scale(0.97)}100%{transform:scale(1)}}
        @keyframes wrongShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-12px)}30%{transform:translateX(10px)}45%{transform:translateX(-8px)}60%{transform:translateX(6px)}75%{transform:translateX(-4px)}}
        @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.2)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes starPop{0%{transform:scale(0) rotate(-30deg);opacity:0}60%{transform:scale(1.3)}100%{transform:scale(1);opacity:1}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}
      `}</style>

      {/* ── Progress bar ── */}
      <div style={{ marginBottom: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <span style={{ fontWeight: "800", fontSize: "0.85rem", color: "#6b7280" }}>
            🎯 Round {roundIdx + 1} of {total}
          </span>
          <span style={{ fontWeight: "900", fontSize: "0.9rem", color: "#f59e0b" }}>
            ⭐ {score} correct!
          </span>
        </div>
        <div style={{ height: "10px", backgroundColor: "#f3f4f6", borderRadius: "20px", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${((roundIdx) / total) * 100}%`,
            background: "linear-gradient(90deg, #6366f1, #ec4899)",
            borderRadius: "20px",
            transition: "width 0.5s ease",
            boxShadow: "0 0 8px rgba(99,102,241,0.4)"
          }} />
        </div>
      </div>

      {/* ── Question prompt ── */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{
          display: "inline-block",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff",
          padding: "8px 22px",
          borderRadius: "24px",
          fontWeight: "900",
          fontSize: "1rem",
          boxShadow: "0 4px 14px rgba(99,102,241,0.3)"
        }}>
          {activity?.title === "Color Sorting"
            ? "🌈 What colour is this?"
            : activity?.title === "Shape Matching"
            ? "🔷 What shape is this?"
            : "👆 What feeling is this?"}
        </div>
        {language === "kn" && (
          <div style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "6px", fontWeight: "700" }}>
            {activity?.title === "Color Sorting" ? "ಈ ಬಣ್ಣ ಯಾವುದು?" : activity?.title === "Shape Matching" ? "ಈ ಆಕಾರ ಯಾವುದು?" : "ಈ ಭಾವನೆ ಯಾವುದು?"}
          </div>
        )}
      </div>

      {/* ── Flashcard ── */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "28px", position: "relative" }}>
        <MiniConfetti active={showConfetti} />

        <div style={{
          width: "200px",
          height: "200px",
          borderRadius: "32px",
          background: isCorrect === true
            ? "linear-gradient(135deg, #dcfce7, #bbf7d0)"
            : isCorrect === false
            ? "linear-gradient(135deg, #fee2e2, #fecaca)"
            : `linear-gradient(135deg, ${current.card.bg}, ${current.card.bg}cc)`,
          border: isCorrect === true
            ? "4px solid #22c55e"
            : isCorrect === false
            ? "4px solid #ef4444"
            : `4px solid ${current.card.color}55`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isCorrect === true
            ? "0 0 40px rgba(34,197,94,0.5)"
            : isCorrect === false
            ? "0 0 30px rgba(239,68,68,0.35)"
            : `0 16px 48px ${current.card.color}33`,
          animation: cardFlip
            ? "cardFlipOut 0.35s ease forwards"
            : "cardAppear 0.5s cubic-bezier(.34,1.56,.64,1)",
          transition: "background 0.3s, border-color 0.3s, box-shadow 0.3s",
          position: "relative",
          overflow: "hidden"
        }}>
          {/* BG bubble decoration */}
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: "absolute",
              width: `${40 + i * 25}px`,
              height: `${40 + i * 25}px`,
              borderRadius: "50%",
              border: `2px solid ${current.card.color}22`,
              top: `${5 + i * 20}%`,
              right: `${-10 + i * 15}%`,
              animation: `float ${2 + i * 0.5}s ease-in-out infinite`
            }} />
          ))}

          <div style={{
            fontSize: activity?.title === "Color Sorting" ? "5rem" : "7rem",
            animation: "float 2s ease-in-out infinite",
            display: "inline-block",
            lineHeight: 1,
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.15))"
          }}>
            {current.card.display}
          </div>

          {/* Feedback overlay */}
          {isCorrect === true && (
            <div style={{
              position: "absolute",
              bottom: "12px",
              fontSize: "2rem",
              animation: "bounceIn 0.3s ease"
            }}>🎉</div>
          )}
          {isCorrect === false && (
            <div style={{
              position: "absolute",
              bottom: "12px",
              fontSize: "1.6rem",
              animation: "bounceIn 0.3s ease"
            }}>💪 Try again!</div>
          )}
        </div>
      </div>

      {/* ── Answer Options ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "14px",
        maxWidth: "480px",
        margin: "0 auto"
      }}>
        {current.options.map((option, i) => {
          const isChosen  = selected === option.id;
          const isRight   = option.id === current.card.id;
          const revealRight = selected !== null && isRight;
          const revealWrong = isChosen && !isRight;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              style={{
                background: revealRight
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : revealWrong
                  ? "linear-gradient(135deg, #ef4444, #dc2626)"
                  : `linear-gradient(135deg, ${option.bg || "#f3f4f6"}, ${option.bg || "#e5e7eb"})`,
                border: revealRight
                  ? "3px solid #16a34a"
                  : revealWrong
                  ? "3px solid #dc2626"
                  : `3px solid ${option.color || "#d1d5db"}44`,
                borderRadius: "20px",
                padding: "18px 12px",
                cursor: selected !== null ? "default" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                boxShadow: revealRight
                  ? "0 8px 24px rgba(34,197,94,0.45)"
                  : revealWrong
                  ? "0 4px 16px rgba(239,68,68,0.35)"
                  : `0 4px 16px ${option.color || "#999"}22`,
                animation: revealWrong
                  ? "wrongShake 0.5s ease"
                  : revealRight
                  ? "correctPulse 0.5s ease"
                  : `optionBounce 0.4s ease ${i * 0.07}s both`,
                transform: "scale(1)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => { if (selected === null) e.currentTarget.style.transform = "scale(1.06)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {/* Icon */}
              <span style={{ fontSize: "2.6rem", filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.12))" }}>
                {option.display}
              </span>
              {/* Label */}
              <span style={{
                fontWeight: "900",
                fontSize: "1rem",
                color: revealRight || revealWrong ? "#fff" : (option.color || "#111827"),
                fontFamily: "'Nunito', sans-serif",
                textShadow: revealRight || revealWrong ? "0 1px 4px rgba(0,0,0,0.2)" : "none"
              }}>
                {language === "kn" ? option.nameKn : option.name}
              </span>
              {/* Feedback icon */}
              {revealRight && <span style={{ fontSize: "1.4rem", animation: "bounceIn 0.3s ease" }}>✅</span>}
              {revealWrong && <span style={{ fontSize: "1.4rem", animation: "bounceIn 0.3s ease" }}>❌</span>}
            </button>
          );
        })}
      </div>

      {/* ── Hint row ── */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: "700", animation: "pulse 2s infinite" }}>
          👆 Tap the right answer!  {language === "kn" ? "• ಸರಿಯಾದ ಉತ್ತರ ತಟ್ಟಿ!" : ""}
        </span>
      </div>
    </div>
  );
}
