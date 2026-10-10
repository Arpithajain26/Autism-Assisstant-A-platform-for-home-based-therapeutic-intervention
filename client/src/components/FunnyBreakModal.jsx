import React, { useState, useEffect } from "react";
import { speakInstruction } from "../utils/speechHelper";
import { getHappyBoosterActivity } from "../data/curatedActivities";

// Web Audio synthesizer engine for realistic animal calls & sound effects
const playAnimalCall = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    if (type === "cow") {
      // Low pitch vibrating Moo sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.linearRampToValueAtTime(120, now + 0.5);
      osc.frequency.linearRampToValueAtTime(150, now + 1.0);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.15);
    } else if (type === "duck") {
      // High pitch double Quack
      [600, 520].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(freq, now + idx * 0.25);
        gain.gain.setValueAtTime(0.3, now + idx * 0.25);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.25 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.25);
        osc.stop(now + idx * 0.25 + 0.22);
      });
    } else if (type === "lion") {
      // Booming low frequency Roar
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.4);
      osc.frequency.exponentialRampToValueAtTime(80, now + 1.2);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.35);
    } else if (type === "frog") {
      // Ribbit chirp
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(250, now);
      osc.frequency.linearRampToValueAtTime(450, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === "monkey") {
      // Ooh-ooh ha-ha chatter
      [350, 500, 380, 550].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.3, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.12);
      });
    } else if (type === "elephant") {
      // Trumpet call slide
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.6);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.75);
    } else if (type === "pop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (e) {}
};

// Rich Visual Animal Cards with SVG Art
const ANIMALS_DATA = [
  {
    id: "cow",
    name: "Cackling Daisy Cow 🐮",
    nameKn: "ನಗುವ ಹಸು 🐮",
    call: "Moo-Hoo-Hoo! 🐄",
    color: "#ec4899",
    bg: "#fce7f3",
    border: "#f472b6",
    fact: "Daisy Cow loves singing in the meadow and has best friends!",
    factKn: "ಹಸುಗಳು ಹಸಿರು ಹುಲ್ಲುಗಾವಲಿನಲ್ಲಿ ಹಾಡಲು ಮತ್ತು ಸ್ನೇಹಿತರ ಜೊತೆ ಆಡಲು ಇಷ್ಟಪಡುತ್ತವೆ!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="#fff" stroke="#ec4899" strokeWidth="4" />
        {/* Cow Spots */}
        <circle cx="32" cy="35" r="10" fill="#334155" />
        <circle cx="68" cy="40" r="8" fill="#334155" />
        <circle cx="50" cy="65" r="16" fill="#fbcfe8" />
        {/* Eyes */}
        <circle cx="40" cy="45" r="4" fill="#0f172a" />
        <circle cx="60" cy="45" r="4" fill="#0f172a" />
        {/* Smile */}
        <path d="M 42 66 Q 50 74 58 66" fill="none" stroke="#be185d" strokeWidth="3" strokeLinecap="round" />
        {/* Horns */}
        <path d="M 30 22 Q 25 10 35 15" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
        <path d="M 70 22 Q 75 10 65 15" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "lion",
    name: "Roaring King Leo 🦁",
    nameKn: "ಸಿಂಹ 🦁",
    call: "Rooaaar-Hahaha! 🦁",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#f59e0b",
    fact: "King Leo roars to say a big happy hello to his pride!",
    factKn: "ಸಿಂಹವು ತನ್ನ ರಾಜ ಮನೆತನಕ್ಕೆ ಹಲೋ ಎಂದು ಗರ್ಜಿಸುತ್ತದೆ!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        {/* Mane */}
        <circle cx="50" cy="50" r="46" fill="#b45309" />
        <circle cx="50" cy="50" r="35" fill="#fbbf24" />
        {/* Eyes */}
        <circle cx="40" cy="45" r="4" fill="#0f172a" />
        <circle cx="60" cy="45" r="4" fill="#0f172a" />
        {/* Nose & Mouth */}
        <polygon points="50,54 44,48 56,48" fill="#78350f" />
        <path d="M 44 60 Q 50 68 56 60" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "duck",
    name: "Quacky Puddles 🦆",
    nameKn: "ಬಾತುಕೋಳಿ 🦆",
    call: "Quack-Quack-Giggle! 🦆",
    color: "#0891b2",
    bg: "#cffaff",
    border: "#06b6d4",
    fact: "Quacky wears waterproof feathers so water slips right off!",
    factKn: "ಬಾತುಕೋಳಿಗೆ ನೀರಿನಲ್ಲಿ ನೆನೆಯದ ವಿಶೇಷ ಪಕ್ಕಗಳಿವೆ!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#facc15" stroke="#0891b2" strokeWidth="3" />
        {/* Beak */}
        <ellipse cx="65" cy="54" rx="16" ry="9" fill="#f97316" />
        {/* Eye */}
        <circle cx="45" cy="40" r="5" fill="#0f172a" />
        <circle cx="43" cy="38" r="2" fill="#fff" />
        {/* Cheek */}
        <circle cx="35" cy="52" r="6" fill="#f43f5e" opacity="0.6" />
      </svg>
    )
  },
  {
    id: "frog",
    name: "Jumping Barnaby 🐸",
    nameKn: "ಕಪ್ಪೆ 🐸",
    call: "Ribbit-Hop-Giggle! 🐸",
    color: "#16a34a",
    bg: "#dcfce7",
    border: "#22c55e",
    fact: "Barnaby Frog can jump 20 times his height into the air!",
    factKn: "ಕಪ್ಪೆ ತನ್ನ ಎತ್ತರಕ್ಕಿಂತ 20 ಪಟ್ಟು ಹೆಚ್ಚು ಎತ್ತರಕ್ಕೆ ಜಿಗಿಯಬಲ್ಲದು!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        <ellipse cx="50" cy="55" rx="40" ry="32" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />
        {/* Big Eyes */}
        <circle cx="32" cy="28" r="14" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />
        <circle cx="68" cy="28" r="14" fill="#4ade80" stroke="#16a34a" strokeWidth="3" />
        <circle cx="32" cy="28" r="6" fill="#0f172a" />
        <circle cx="68" cy="28" r="6" fill="#0f172a" />
        {/* Big Smile */}
        <path d="M 30 60 Q 50 75 70 60" fill="none" stroke="#15803d" strokeWidth="4" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "monkey",
    name: "Chiquita Monkey 🐒",
    nameKn: "ಕೋತಿ 🐒",
    call: "Ooh-Ooh Hahaha! 🍌",
    color: "#b45309",
    bg: "#fef3c7",
    border: "#d97706",
    fact: "Chiquita loves banana smoothies and high-five tickle fights!",
    factKn: "ಕೋತಿಗೆ ಬಾಳೆಹಣ್ಣು ಮತ್ತು ತಮಾಷೆಯ ನಗು ಎಂದರೆ ತುಂಬಾ ಇಷ್ಟ!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#78350f" />
        <ellipse cx="50" cy="55" rx="30" ry="24" fill="#fde68a" />
        {/* Ears */}
        <circle cx="12" cy="50" r="12" fill="#78350f" />
        <circle cx="88" cy="50" r="12" fill="#78350f" />
        {/* Eyes */}
        <circle cx="40" cy="44" r="4" fill="#0f172a" />
        <circle cx="60" cy="44" r="4" fill="#0f172a" />
        {/* Smile */}
        <path d="M 38 62 Q 50 72 62 62" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
      </svg>
    )
  },
  {
    id: "elephant",
    name: "Ellie Elephant 🐘",
    nameKn: "ಆನೆ 🐘",
    call: "Toot-Toot Trumpet! 🐘",
    color: "#64748b",
    bg: "#f1f5f9",
    border: "#94a3b8",
    fact: "Ellie uses her trunk like a giant straw to splash water!",
    factKn: "ಆನೆ ತನ್ನ ಸೊಂಡಿಲನ್ನು ನೀರಿನ ಚಿಮ್ಮುಗೆಯಂತೆ ಬಳಸುತ್ತದೆ!",
    svg: (
      <svg width="70" height="70" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#cbd5e1" stroke="#64748b" strokeWidth="3" />
        {/* Trunk */}
        <path d="M 50 50 Q 40 75 60 75 Q 70 75 65 65" fill="none" stroke="#64748b" strokeWidth="7" strokeLinecap="round" />
        {/* Ears */}
        <ellipse cx="15" cy="45" rx="14" ry="22" fill="#94a3b8" />
        <ellipse cx="85" cy="45" rx="14" ry="22" fill="#94a3b8" />
        {/* Eyes */}
        <circle cx="42" cy="38" r="4" fill="#0f172a" />
      </svg>
    )
  }
];

export default function FunnyBreakModal({
  open,
  onClose,
  childAge = 6,
  childLevel = 1,
  onCompleteFunnyBreak,
  language = "en"
}) {
  if (!open) return null;

  const ageGroup = childAge <= 5 ? "2-5" : childAge <= 8 ? "5-8" : "9-12";
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [dancingAnimalId, setDancingAnimalId] = useState(null);
  const [playedCount, setPlayedCount] = useState(0);

  // Floating bubbles for 5-8 age group game
  const [bubbles, setBubbles] = useState([
    { id: 1, text: "2 + 2 = 4 🍌", color: "#ec4899", textKn: "2 + 2 = 4 🍌" },
    { id: 2, text: "Meow! 🐱", color: "#3b82f6", textKn: "ಮ್ಯಾವ್! 🐱" },
    { id: 3, text: "Hahaha! 😂", color: "#22c55e", textKn: "ಹಾಹಾಹಾ! 😂" },
    { id: 4, text: "Super Star ⭐", color: "#f59e0b", textKn: "ಸೂಪರ್ ಸ್ಟಾರ್ ⭐" }
  ]);
  const [poppedBubbles, setPoppedBubbles] = useState([]);

  useEffect(() => {
    playAnimalCall("monkey");
    const msg = language === "kn" 
      ? "ಕ್ಷಣದಲ್ಲೇ ನಿನ್ನ ಬೇಸರ ದೂರ ಮಾಡೋಣ! ಪ್ರಾಣಿಗಳ ಹಬ್ಬದಲ್ಲಿ ಪಾಲ್ಗೊಳ್ಳಿ!" 
      : "Immediate Mood Boost! Tap the dancing animals to hear their real funny sounds and turn that frown upside down!";
    speakInstruction(msg, language);
  }, []);

  const handleAnimalTap = (animal) => {
    setSelectedAnimal(animal);
    setDancingAnimalId(animal.id);
    playAnimalCall(animal.id);
    setPlayedCount(prev => prev + 1);

    const factText = language === "kn" ? `${animal.nameKn}! ${animal.factKn}` : `${animal.name}! ${animal.call} ${animal.fact}`;
    speakInstruction(factText, language);

    setTimeout(() => setDancingAnimalId(null), 1200);
  };

  const handleBubblePop = (b) => {
    playAnimalCall("pop");
    setPoppedBubbles(prev => [...prev, b.id]);
    setPlayedCount(prev => prev + 1);
    speakInstruction(language === "kn" ? b.textKn : b.text, language);
  };

  const nextRecommendedActivity = getHappyBoosterActivity(ageGroup, childLevel);

  const handleFinish = () => {
    if (onCompleteFunnyBreak) {
      onCompleteFunnyBreak(nextRecommendedActivity);
    }
    onClose();
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.82)",
      backdropFilter: "blur(10px)",
      zIndex: 10000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px"
    }}>
      <style>{`
        @keyframes danceBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-16px) rotate(8deg) scale(1.1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.4); }
          50% { box-shadow: 0 0 30px rgba(245, 158, 11, 0.8); }
        }
      `}</style>

      <div style={{
        background: "linear-gradient(145deg, #ffffff 0%, #fff7ed 50%, #fef2f2 100%)",
        borderRadius: "32px",
        maxWidth: "680px",
        width: "100%",
        maxHeight: "92vh",
        overflowY: "auto",
        padding: "26px",
        boxShadow: "0 25px 60px rgba(239, 68, 68, 0.35)",
        border: "4px solid #f59e0b",
        textAlign: "center",
        position: "relative"
      }}>
        {/* Immediate Alert Header */}
        <div style={{
          background: "linear-gradient(135deg, #ef4444 0%, #ec4899 50%, #f59e0b 100%)",
          color: "#fff",
          padding: "12px 22px",
          borderRadius: "24px",
          fontSize: "1.15rem",
          fontWeight: "900",
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
          boxShadow: "0 6px 20px rgba(239, 68, 68, 0.4)",
          animation: "pulseGlow 2s infinite"
        }}>
          <span style={{ fontSize: "1.6rem" }}>⚡😂</span>
          <span>{language === "kn" ? "ತಕ್ಷಣದ ಹ್ಯಾಪಿ ಮೂಡ್ ಬೂಸ್ಟರ್!" : "Instant Mood Booster: Funny Animal Fiesta!"}</span>
        </div>

        <p style={{ color: "#334155", fontSize: "0.98rem", fontWeight: "800", marginBottom: "20px" }}>
          {language === "kn"
            ? "ನಾವು ನಿನ್ನ ಮುಖದಲ್ಲಿ ಸಣ್ಣ ಬೇಸರ ಕಂಡೆವು! ಬನ್ನಿ ಈ ಪ್ರಾಣಿಗಳ ಜೊತೆ ಆಡಿ ತಕ್ಷಣ ನಗೋಣ!"
            : "We saw you felt sad! Tap the animated animals to make them dance and play real funny sounds!"}
        </p>

        {/* ─── AGE 2-5 & GENERAL: REAL SVG ANIMAL ORCHESTRA & DANCING STAGE ─── */}
        <div style={{
          background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
          borderRadius: "24px",
          padding: "20px",
          marginBottom: "20px",
          border: "2px solid #86efac"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "900", color: "#166534", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            <span>🎵</span>
            <span>{language === "kn" ? "ಪ್ರಾಣಿಗಳನ್ನು ಸ್ಪರ್ಶಿಸಿ ನೃತ್ಯ ಮಾಡಿಸಿ! 💃" : "Tap an animal to hear real sounds & watch them dance! 💃"}</span>
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "14px" }}>
            {ANIMALS_DATA.map((animal) => {
              const isDancing = dancingAnimalId === animal.id;
              const isSelected = selectedAnimal?.id === animal.id;
              return (
                <button
                  key={animal.id}
                  onClick={() => handleAnimalTap(animal)}
                  style={{
                    background: animal.bg,
                    border: isSelected ? `3.5px solid ${animal.color}` : `2px solid ${animal.border}`,
                    borderRadius: "22px",
                    padding: "14px 10px",
                    cursor: "pointer",
                    transition: "all 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    transform: isDancing ? "scale(1.15) rotate(6deg)" : "scale(1)",
                    animation: isDancing ? "danceBounce 0.6s infinite" : "none",
                    boxShadow: isSelected ? `0 8px 24px ${animal.color}66` : "0 4px 12px rgba(0,0,0,0.06)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center"
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    {animal.svg}
                  </div>
                  <div style={{ fontWeight: "900", color: animal.color, fontSize: "0.88rem", marginBottom: "2px" }}>
                    {language === "kn" ? animal.nameKn : animal.name}
                  </div>
                  <span style={{ fontSize: "0.72rem", background: "white", padding: "2px 8px", borderRadius: "10px", color: "#475569", fontWeight: "800" }}>
                    {animal.call.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedAnimal && (
            <div style={{
              marginTop: "16px",
              background: "#ffffff",
              border: `2px dashed ${selectedAnimal.color}`,
              padding: "12px 18px",
              borderRadius: "18px",
              color: selectedAnimal.color,
              fontWeight: "900",
              fontSize: "0.95rem",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
            }}>
              🔊 {selectedAnimal.call} — {language === "kn" ? selectedAnimal.factKn : selectedAnimal.fact}
            </div>
          )}
        </div>

        {/* ─── EXTRA FUN: SILLY BUBBLE POPPING (FOR SCHOOL AGE 5-8) ─── */}
        {ageGroup !== "2-5" && (
          <div style={{
            background: "#fef3c7",
            borderRadius: "24px",
            padding: "16px",
            marginBottom: "20px",
            border: "2px solid #fde047"
          }}>
            <h4 style={{ margin: "0 0 10px", fontSize: "0.98rem", fontWeight: "900", color: "#854d0e" }}>
              🎈 {language === "kn" ? "ತಮಾಷೆಯ ಬಬಲ್ಸ್‌ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ ಹರಿಸಿ!" : "Pop the Silly Laughing Bubbles for Extra Joy! 🎈"}
            </h4>
            <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              {bubbles.map(b => {
                const isPopped = poppedBubbles.includes(b.id);
                return (
                  <button
                    key={b.id}
                    onClick={() => handleBubblePop(b)}
                    disabled={isPopped}
                    style={{
                      background: isPopped ? "#e2e8f0" : b.color,
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: "80px",
                      height: "80px",
                      fontWeight: "900",
                      fontSize: "0.8rem",
                      cursor: isPopped ? "default" : "pointer",
                      opacity: isPopped ? 0.3 : 1,
                      transform: isPopped ? "scale(0.7)" : "scale(1)",
                      transition: "all 0.3s ease",
                      boxShadow: isPopped ? "none" : "0 6px 16px rgba(0,0,0,0.15)"
                    }}
                  >
                    {isPopped ? "💥 POP!" : language === "kn" ? b.textKn : b.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Assigned Activity Notification */}
        <div style={{
          background: "#ffffff",
          borderRadius: "20px",
          padding: "14px",
          marginBottom: "20px",
          border: "2px solid #bfdbfe",
          boxShadow: "0 4px 12px rgba(59, 130, 246, 0.1)"
        }}>
          <div style={{ fontSize: "0.78rem", fontWeight: "900", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            🎁 {language === "kn" ? "ತಕ್ಷಣ ನಿಗದಿಯಾದ ಹ್ಯಾಪಿ ಆಟ:" : "Immediately Assigned Mood Recovery Task:"}
          </div>
          <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#0f172a", marginTop: "4px" }}>
            {nextRecommendedActivity?.title || "Happy Melody Dance"} (+50 Happy XP ⭐)
          </div>
        </div>

        {/* Action Button to launch next happy activity */}
        <button
          onClick={handleFinish}
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
            color: "#fff",
            border: "none",
            padding: "16px 36px",
            borderRadius: "26px",
            fontWeight: "900",
            fontSize: "1.1rem",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(34, 197, 94, 0.45)",
            width: "100%",
            transition: "all 0.2s"
          }}
        >
          🎉 {language === "en" ? "I'm Full of Smiles Now! Start Next Happy Activity 🚀" : "ನಾನು ಈಗ ನಗುತ್ತಿದ್ದೇನೆ! ಮುಂದಿನ ಹ್ಯಾಪಿ ಆಟ ಪ್ರಾರಂಭಿಸಿ 🚀"}
        </button>
      </div>
    </div>
  );
}
