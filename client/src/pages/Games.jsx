import React, { useState, useEffect, useRef } from "react";
import { logSession } from "../services/api";
import { getAgeLevelConfig } from "../utils/ageLevelMapping";
import CertificateModal from "../components/CertificateModal";
import ActivityRatingModal from "../components/ActivityRatingModal";
import {
  speakInstruction,
  speakCelebration,
  speakGentleGuidance,
  speakEncouragement,
  speakGameSummary,
  setVoiceMuted,
  getVoiceMuted
} from "../utils/speechHelper";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ─────────────────────────────────────────────────────────────
   Web Audio API sound generator + Voice Feedback
   ───────────────────────────────────────────────────────────── */
const playSound = (type, lang = "en") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "success") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
      // 3. On correct answer — audio celebrates!
      speakCelebration(lang);
    } else if (type === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
      // 4. On wrong answer — audio guides gently!
      speakGentleGuidance(lang);
    } else if (type === "pop") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === "click") {
      osc.type = "sine";
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "win") {
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const oscNode = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscNode.type = "sine";
        oscNode.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
        gainNode.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.08);
        oscNode.start(ctx.currentTime + idx * 0.08);
        oscNode.stop(ctx.currentTime + idx * 0.08 + 0.2);
      });
    } else if (type === "chime" || type === "calm") {
      const chimeNotes = [523.25, 659.25, 783.99, 1046.50];
      chimeNotes.forEach((freq, idx) => {
        const oscNode = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscNode.type = "sine";
        oscNode.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);
        gainNode.gain.setValueAtTime(0.04, ctx.currentTime + idx * 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.85);
        oscNode.start(ctx.currentTime + idx * 0.06);
        oscNode.stop(ctx.currentTime + idx * 0.06 + 0.85);
      });
    }
  } catch (e) {
    console.warn("Audio Context not supported/blocked", e);
  }
};

/* ─────────────────────────────────────────────────────────────
   Confetti Component
   ───────────────────────────────────────────────────────────── */
const Confetti = () => {
  const colors = ["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 99 }}>
      {Array.from({ length: 60 }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = 1.8 + Math.random() * 2;
        const size = 6 + Math.random() * 9;
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "-20px",
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              opacity: 0.85,
              animation: `fall ${duration}s linear ${delay}s infinite`
            }}
          />
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Difficulty Helper Constants and Configs
   ───────────────────────────────────────────────────────────── */
const getAgeDifficulty = (age) => {
  if (age <= 5) return { label: "Easy", index: 1, timerMultiplier: 1.5, scale: 1.25, itemsCount: 4 };
  if (age <= 8) return { label: "Medium", index: 2, timerMultiplier: 1.0, scale: 1.0, itemsCount: 8 };
  return { label: "Hard", index: 3, timerMultiplier: 0.7, scale: 0.8, itemsCount: 16 };
};

const EMOTION_EMOJIS = {
  Happy: "😊", Sad: "😢", Angry: "😠", Surprised: "😲",
  Scared: "😨", Proud: "😎", Confused: "😕", Excited: "🤩"
};

const EMOTION_LABELS_KN = {
  Happy: "ಸಂತೋಷ", Sad: "ದುಃಖ", Angry: "ಕೋಪ", Surprised: "ಆಶ್ಚರ್ಯ",
  Scared: "ಭಯ", Proud: "ಹೆಮ್ಮೆ", Confused: "ಗೊಂದಲ", Excited: "ಉತ್ಸಾಹ"
};

/* ─────────────────────────────────────────────────────────────
   32 Interactive Games Sub-Components
   ───────────────────────────────────────────────────────────── */

// a1 - Mirror Play
function GameA1({ age, lang, onComplete }) {
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  const targetEmotions = ["Happy", "Sad", "Surprised"];
  const [targetIdx, setTargetIdx] = useState(0);
  const diff = getAgeDifficulty(age);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(s => { setStream(s); if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => {});
    return () => { if (stream) stream.getTracks().forEach(t => t.stop()); };
  }, []);

  const handleMatch = (emoji) => {
    playSound("success");
    if (targetIdx + 1 >= targetEmotions.length) {
      onComplete(3, "Happy");
    } else {
      setTargetIdx(prev => prev + 1);
    }
  };

  const currentTarget = targetEmotions[targetIdx];

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "2rem", marginBottom: "15px" }}>{lang === "en" ? "Mirror Play" : "ಕನ್ನಡಿ ಆಟ"}</h2>
      <p style={{ fontSize: "1.4rem" }}>
        {lang === "en" ? `Make a ${currentTarget} face in the mirror!` : `ಕನ್ನಡಿಯಲ್ಲಿ ${EMOTION_LABELS_KN[currentTarget]} ಮುಖಭಾವ ಮಾಡಿ!`}
      </p>
      <div style={{ fontSize: "7rem", margin: "25px", animation: "bounceGently 1.5s infinite" }}>
        {EMOTION_EMOJIS[currentTarget]}
      </div>
      <div style={{ position: "relative", width: "100%", maxWidth: "600px", height: "350px", margin: "0 auto 30px", background: "#1e293b", borderRadius: "20px", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid #475569" }}>
        {stream ? (
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }} />
        ) : (
          <div style={{ padding: "30px", fontSize: "1.2rem" }}>📷 {lang === "en" ? "Camera mode simulator. Look at yourself!" : "ಕ್ಯಾಮೆರಾ ಸಿಮ್ಯುಲೇಟರ್. ನಿಮ್ಮನ್ನು ನೋಡಿ!"}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", flexWrap: "wrap" }}>
        {targetEmotions.map(emo => (
          <button key={emo} onClick={() => handleMatch(emo)} className="btn btn-primary" style={{ padding: `${16 * diff.scale}px ${28 * diff.scale}px`, fontSize: "1.3rem", borderRadius: "14px" }}>
            {EMOTION_EMOJIS[emo]} {lang === "en" ? emo : EMOTION_LABELS_KN[emo]}
          </button>
        ))}
      </div>
    </div>
  );
}

// a2 - Sorting Shapes (Physics Animated Game Loop)
function GameA2({ age, lang, onComplete }) {
  const diff = getAgeDifficulty(age);
  const bucketCount = diff.index === 1 ? 2 : diff.index === 2 ? 3 : 4;
  const shapesList = [
    { type: "Circle", color: "#f43f5e", emoji: "🔴" },
    { type: "Square", color: "#3b82f6", emoji: "🟦" },
    { type: "Triangle", color: "#10b981", emoji: "🔺" },
    { type: "Star", color: "#f59e0b", emoji: "⭐" }
  ].slice(0, bucketCount);

  const [shape, setShape] = useState(() => ({ ...shapesList[0], x: 50, y: 0 }));
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(2);

  useEffect(() => {
    const gameInterval = setInterval(() => {
      setShape(prev => {
        if (prev.y >= 85) {
          playSound("error");
          return { ...shapesList[Math.floor(Math.random() * shapesList.length)], x: 20 + Math.random() * 60, y: 0 };
        }
        return { ...prev, y: prev.y + speed };
      });
    }, 45);
    return () => clearInterval(gameInterval);
  }, [speed]);

  const handleSort = (type) => {
    if (type === shape.type) {
      playSound("success");
      const nextScore = score + 1;
      setScore(nextScore);
      if (nextScore >= 5) {
        onComplete(3, "Happy");
      } else {
        setShape({ ...shapesList[Math.floor(Math.random() * shapesList.length)], x: 20 + Math.random() * 60, y: 0 });
        setSpeed(s => s + 0.3);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Sorting Shapes" : "ಆಕಾರ ವಿಂಗಡಣೆ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "Sort the falling shape into its correct bucket!" : "ಬೀಳುತ್ತಿರುವ ಆಕಾರವನ್ನು ಹೊಂದಾಣಿಕೆಯ ಬಕೆಟ್‌ಗೆ ಸೇರಿಸಿ!"}</p>
      
      {/* Visual playground */}
      <div style={{ position: "relative", width: "100%", height: "300px", background: "#0f172a", borderRadius: "16px", border: "2px solid #334155", overflow: "hidden", margin: "20px 0" }}>
        <div style={{
          position: "absolute",
          top: `${shape.y}%`,
          left: `${shape.x}%`,
          fontSize: "3.5rem",
          transform: "translate(-50%, -50%)",
          transition: "top 0.05s linear",
          animation: "float 1.5s infinite"
        }}>
          {shape.emoji}
        </div>
        <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "1.2rem", fontWeight: "bold" }}>
          🎯 {lang === "en" ? "Score" : "ಅಂಕ"}: {score} / 5
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {shapesList.map(s => (
          <button key={s.type} onClick={() => handleSort(s.type)} style={{
            background: "#1e293b", border: `4px solid ${s.color}`, borderRadius: "20px",
            padding: "20px 30px", minWidth: "120px", color: "white", fontSize: "1.3rem", cursor: "pointer",
            transition: "transform 0.2s", boxShadow: `0 4px 15px ${s.color}33`
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{ fontSize: "2rem", marginBottom: "5px" }}>🗑️</div>
            <div style={{ fontWeight: "bold", color: s.color }}>{lang === "en" ? s.type : (s.type === "Circle" ? "ವರ್ತುಲ" : s.type === "Square" ? "ಚೌಕ" : s.type === "Triangle" ? "ತ್ರಿಕೋನ" : "ನಕ್ಷತ್ರ")}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// a3 - Name That Sound
function GameA3({ age, lang, onComplete }) {
  const diff = getAgeDifficulty(age);
  const animalSounds = [
    { animal: "Bird", emoji: "🐦", freq: 800, titleKn: "ಪಕ್ಷಿ" },
    { animal: "Cow", emoji: "🐄", freq: 150, titleKn: "ಹಸು" },
    { animal: "Cat", emoji: "🐱", freq: 440, titleKn: "ಬೆಕ್ಕು" },
    { animal: "Dog", emoji: "🐶", freq: 300, titleKn: "ನಾಯಿ" }
  ];

  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const currentSound = animalSounds[round % animalSounds.length];

  const playAnimalSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = currentSound.animal === "Cow" ? "sawtooth" : currentSound.animal === "Bird" ? "sine" : "triangle";
      osc.frequency.setValueAtTime(currentSound.freq, ctx.currentTime);
      if (currentSound.animal === "Bird") {
        osc.frequency.exponentialRampToValueAtTime(1250, ctx.currentTime + 0.3);
      }
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  };

  const handleGuess = (animal) => {
    if (animal === currentSound.animal) {
      playSound("success");
      setScore(s => s + 1);
    } else {
      playSound("error");
    }
    if (round + 1 >= 5) {
      onComplete(score >= 4 ? 3 : score >= 2 ? 2 : 1, "Proud");
    } else {
      setRound(r => r + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Name That Sound" : "ಶಬ್ದ ಗುರುತಿಸಿ"}</h2>
      <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "Listen to the sound and guess who made it!" : "ಶಬ್ದವನ್ನು ಕೇಳಿ ಮತ್ತು ಯಾರು ಮಾಡಿದರು ಎಂದು ಊಹಿಸಿ!"}</p>
      
      <button onClick={playAnimalSound} className="btn btn-primary" style={{ padding: "20px 40px", fontSize: "1.5rem", margin: "40px", borderRadius: "16px", animation: "pulseSlow 2s infinite" }}>
        📢 {lang === "en" ? "Play Sound" : "ಶಬ್ದ ಕೇಳಿ"}
      </button>

      <div style={{ display: "flex", gap: "20px", justifyContent: "center", flexWrap: "wrap" }}>
        {animalSounds.map(a => (
          <button key={a.animal} onClick={() => handleGuess(a.animal)} style={{
            background: "#1e293b", border: "2px solid #475569", borderRadius: "20px",
            padding: "25px 40px", fontSize: "2rem", color: "white", cursor: "pointer",
            transition: "all 0.2s"
          }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div>{a.emoji}</div>
            <div style={{ fontSize: "1.2rem", marginTop: "8px" }}>{lang === "en" ? a.animal : a.titleKn}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// a4 - Bubble Popping (Sinewave Float Animation)
function GameA4({ age, lang, onComplete }) {
  const diff = getAgeDifficulty(age);
  const [bubbles, setBubbles] = useState([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(Math.round(30 * diff.timerMultiplier));

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(t => {
      if (t <= 1) {
        clearInterval(timer);
        onComplete(poppedCount >= 15 ? 3 : poppedCount >= 8 ? 2 : 1, "Excited");
        return 0;
      }
      return t - 1;
    }), 1000);
    return () => clearInterval(timer);
  }, [poppedCount]);

  useEffect(() => {
    const addBubble = () => {
      const id = Math.random();
      const size = (70 + Math.random() * 40) * diff.scale;
      const startLeft = Math.random() * 80;
      const speed = 1.5 + Math.random() * 2 * (diff.index === 3 ? 1.5 : 1);
      const waveFreq = 0.05 + Math.random() * 0.05;
      const waveAmp = 10 + Math.random() * 15;
      setBubbles(prev => [...prev, { id, size, startLeft, left: startLeft, speed, bottom: -100, ageTicks: 0, waveFreq, waveAmp }]);
    };

    const bubbleInterval = setInterval(addBubble, 1000);

    const animationFrame = setInterval(() => {
      setBubbles(prev => prev.map(b => {
        const nextTicks = b.ageTicks + 1;
        const newLeft = b.startLeft + Math.sin(nextTicks * b.waveFreq) * (b.waveAmp / 10);
        return { ...b, bottom: b.bottom + b.speed, ageTicks: nextTicks, left: newLeft };
      }).filter(b => b.bottom < 500));
    }, 30);

    return () => {
      clearInterval(bubbleInterval);
      clearInterval(animationFrame);
    };
  }, [diff]);

  const handlePop = (id) => {
    playSound("pop");
    setPoppedCount(p => p + 1);
    setBubbles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px", color: "white" }}>
      <h2 style={{ fontSize: "1.8rem", textAlign: "center" }}>{lang === "en" ? "Bubble Popping" : "ಗುಳ್ಳೆ ಒಡೆಯುವುದು"}</h2>
      <div style={{ position: "relative", width: "100%", height: "450px", background: "#0f172a", borderRadius: "24px", overflow: "hidden", border: "3px solid #334155" }}>
        <div style={{ position: "absolute", top: "20px", left: "20px", display: "flex", gap: "30px", fontSize: "1.2rem", fontWeight: "bold", zIndex: 10 }}>
          <div>🫧 {lang === "en" ? "Popped" : "ಒಡೆದಿದ್ದು"}: {poppedCount}</div>
          <div>⏱️ {lang === "en" ? "Time" : "ಸಮಯ"}: {timeLeft}s</div>
        </div>
        {bubbles.map(b => (
          <div key={b.id} onClick={() => handlePop(b.id)} style={{
            position: "absolute", bottom: `${b.bottom}px`, left: `${b.left}%`,
            width: `${b.size}px`, height: `${b.size}px`, borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, rgba(79,110,247,0.35) 60%, rgba(79,110,247,0.85) 100%)",
            boxShadow: "0 6px 15px rgba(79,110,247,0.3)", cursor: "pointer",
            transform: "translate(-50%, 0)",
            transition: "bottom 0.05s linear, left 0.05s linear"
          }} />
        ))}
      </div>
    </div>
  );
}

// a5 - Playdough Sculpting
function GameA5({ age, lang, onComplete }) {
  const canvasRef = useRef(null);
  const [color, setColor] = useState("#f43f5e");
  const [brushSize, setBrushSize] = useState(15);
  const [isDrawing, setIsDrawing] = useState(false);
  const diff = getAgeDifficulty(age);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  const startDraw = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    ctx.strokeStyle = color;
    ctx.lineWidth = brushSize * diff.scale;
    ctx.lineCap = "round";
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    playSound("click");
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Playdough Sculpting" : "ಮಣ್ಣಿನ ಶಿಲ್ಪ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "Draw or shape something beautiful!" : "ಸುಂದರವಾದ ಆಕೃತಿ ಬಿಡಿಸಿ!"}</p>
      
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", marginBottom: "20px" }}>
        {["#f43f5e", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ffffff"].map(c => (
          <button key={c} onClick={() => { playSound("click"); setColor(c); }} style={{
            background: c, width: "45px", height: "45px", borderRadius: "50%",
            border: color === c ? "4px solid var(--primary)" : "2px solid #475569", cursor: "pointer",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
          }} />
        ))}
      </div>

      <canvas ref={canvasRef} width={500} height={320} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} style={{
        background: "#1e293b", border: "3px dashed #475569", borderRadius: "20px", cursor: "crosshair", touchAction: "none"
      }} />

      <div style={{ marginTop: "20px", display: "flex", gap: "20px", justifyContent: "center" }}>
        <button onClick={clearCanvas} className="btn btn-ghost" style={{ border: "2px solid #475569", color: "white", padding: "12px 24px" }}>
          🧹 {lang === "en" ? "Clear" : "ಶುದ್ಧೀಕರಿಸಿ"}
        </button>
        <button onClick={() => { playSound("win"); onComplete(3, "Happy"); }} className="btn btn-success" style={{ padding: "12px 30px" }}>
          💾 {lang === "en" ? "Finished" : "ಪೂರ್ಣಗೊಂಡಿದೆ"}
        </button>
      </div>
    </div>
  );
}

// a6 - Story Builder
function GameA6({ age, lang, onComplete }) {
  const initialCards = [
    { step: 1, emoji: "🌅", desc: "Sunrise", descKn: "ಸೂರ್ಯೋದಯ" },
    { step: 2, emoji: "🪥", desc: "Brushing", descKn: "ಹಲ್ಲುಜ್ಜುವುದು" },
    { step: 3, emoji: "🍳", desc: "Breakfast", descKn: "ಉಪಹಾರ" },
    { step: 4, emoji: "🏫", desc: "School", descKn: "ಶಾಲೆ" }
  ];

  const [cards, setCards] = useState(() => [...initialCards].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState([]);

  const handleSelect = (card) => {
    playSound("click");
    if (selected.find(c => c.step === card.step)) {
      setSelected(prev => prev.filter(c => c.step !== card.step));
    } else {
      const nextSelect = [...selected, card];
      setSelected(nextSelect);
      if (nextSelect.length === initialCards.length) {
        const isCorrect = nextSelect.every((c, i) => c.step === i + 1);
        if (isCorrect) {
          playSound("success");
          setTimeout(() => onComplete(3, "Happy"), 850);
        } else {
          playSound("error");
          setSelected([]);
        }
      }
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Story Builder" : "ಕಥೆ ನಿರ್ಮಾಣ"}</h2>
      <p style={{ fontSize: "1.2rem", marginBottom: "25px" }}>{lang === "en" ? "Click the scenes in order of morning routine!" : "ಮುಂಜಾನೆಯ ಕ್ರಮದಲ್ಲಿ ದೃಶ್ಯಗಳ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ!"}</p>
      
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", margin: "30px 0" }}>
        {cards.map(c => {
          const isSel = selected.find(s => s.step === c.step);
          return (
            <button key={c.step} onClick={() => handleSelect(c)} style={{
              background: isSel ? "var(--primary)" : "#1e293b",
              border: "3px solid #475569", borderRadius: "20px", padding: "20px",
              width: "120px", cursor: "pointer", transition: "all 0.2s"
            }}>
              <div style={{ fontSize: "3.5rem" }}>{c.emoji}</div>
              <div style={{ fontSize: "1.05rem", marginTop: "10px", color: "white", fontWeight: "bold" }}>{lang === "en" ? c.desc : c.descKn}</div>
            </button>
          );
        })}
      </div>
      <div style={{ color: "var(--text-muted)", fontSize: "1.1rem", fontWeight: "bold" }}>
        {lang === "en" ? `Selected: ${selected.length} / ${initialCards.length}` : `ಆಯ್ಕೆ ಮಾಡಿದ್ದು: ${selected.length} / ${initialCards.length}`}
      </div>
    </div>
  );
}

// a7 - Describe and Find
function GameA7({ age, lang, onComplete }) {
  const options = [
    { emoji: "🍌", name: "Banana", nameKn: "ಬಾಳೆಹಣ್ಣು", desc: "I am yellow, sweet, and monkeys love me. What am I?", descKn: "ನಾನು ಹಳದಿ ಬಣ್ಣದಲ್ಲಿದ್ದೇನೆ, ಸಿಹಿಯಾಗಿದ್ದೇನೆ, ಮತ್ತು ಮಂಗಗಳು ನನ್ನನ್ನು ಇಷ್ಟಪಡುತ್ತವೆ. ನಾನು ಯಾರು?" },
    { emoji: "🍎", name: "Apple", nameKn: "ಸೇಬು", desc: "I am red, round, and crunchy. What am I?", descKn: "ನಾನು ಕೆಂಪು ಬಣ್ಣದ, ದುಂಡಗಿನ ಹಣ್ಣು. ನಾನು ಯಾರು?" },
    { emoji: "🐸", name: "Frog", nameKn: "ಕಪ್ಪೆ", desc: "I am green, live near ponds, and say ribbit. What am I?", descKn: "ನಾನು ಹಸಿರು ಬಣ್ಣದಲ್ಲಿದ್ದು ಹಾರಿ ಶಬ್ದ ಮಾಡುತ್ತೇನೆ. ನಾನು ಯಾರು?" }
  ];

  const [round, setRound] = useState(0);
  const current = options[round];

  const handleChoose = (name) => {
    if (name === current.name) {
      playSound("success");
      if (round + 1 >= options.length) {
        onComplete(3, "Happy");
      } else {
        setRound(r => r + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Describe and Find" : "ವಿವರಿಸಿ ಮತ್ತು ಹುಡುಕಿ"}</h2>
      <div style={{ background: "#1e293b", padding: "30px", borderRadius: "20px", border: "2px solid #475569", margin: "30px 0" }}>
        <p style={{ fontSize: "1.5rem", fontStyle: "italic", lineHeight: "1.6" }}>"{lang === "en" ? current.desc : current.descKn}"</p>
      </div>
      <div style={{ display: "flex", gap: "25px", justifyContent: "center" }}>
        {options.map(o => (
          <button key={o.name} onClick={() => handleChoose(o.name)} style={{
            background: "#0f172a", border: "2px solid #475569", borderRadius: "24px",
            padding: "30px", width: "150px", cursor: "pointer", color: "white"
          }}>
            <div style={{ fontSize: "4.5rem" }}>{o.emoji}</div>
            <div style={{ marginTop: "10px", fontSize: "1.1rem", fontWeight: "bold" }}>{lang === "en" ? o.name : o.nameKn}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// a8 - Word Builder
function GameA8({ age, lang, onComplete }) {
  const words = [
    { word: "CAT", kn: "ಬೆಕ್ಕು", emoji: "🐱" },
    { word: "SUN", kn: "ಸೂರ್ಯ", emoji: "☀️" },
    { word: "DOG", kn: "ನಾಯಿ", emoji: "🐶" }
  ];

  const [idx, setIdx] = useState(0);
  const current = words[idx];
  const [built, setBuilt] = useState("");

  const handleLetter = (l) => {
    playSound("click");
    const next = built + l;
    setBuilt(next);
    if (next === current.word) {
      playSound("success");
      if (idx + 1 >= words.length) {
        onComplete(3, "Proud");
      } else {
        setIdx(i => i + 1);
        setBuilt("");
      }
    } else if (!current.word.startsWith(next)) {
      playSound("error");
      setBuilt("");
    }
  };

  const letters = current.word.split("").sort(() => Math.random() - 0.5);

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Word Builder" : "ಪದ ನಿರ್ಮಾಣ"}</h2>
      <div style={{ fontSize: "7rem", margin: "15px" }}>{current.emoji}</div>
      <div style={{ background: "#1e293b", padding: "20px", minHeight: "65px", borderRadius: "12px", display: "flex", gap: "15px", justifyContent: "center", margin: "25px 0" }}>
        {built.split("").map((l, i) => (
          <span key={i} style={{ fontSize: "2rem", fontWeight: "bold", borderBottom: "4px solid var(--primary)", minWidth: "35px" }}>{l}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        {letters.map((l, idx) => (
          <button key={idx} onClick={() => handleLetter(l)} style={{
            background: "var(--primary)", border: "none", color: "white",
            fontSize: "2rem", fontWeight: "bold", padding: "15px 25px",
            borderRadius: "12px", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)"
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

// a9 - Question Ball
function GameA9({ age, lang, onComplete }) {
  const [bouncing, setBouncing] = useState(true);
  const [question, setQuestion] = useState(null);

  const questions = [
    { q: "What makes you smile?", qKn: "ಯಾವುದು ನಿಮಗೆ ನಗು ತರಿಸುತ್ತದೆ?", ans: ["Playing outside", "Eating sweet apples", "Waving hello"] },
    { q: "How do you feel when you share toys?", qKn: "ಆಟಿಕೆಗಳನ್ನು ಹಂಚಿಕೊಂಡಾಗ ನಿಮಗೆ ಹೇಗನಿಸುತ್ತದೆ?", ans: ["Happy 😊", "Proud 😎", "Excited 🤩"] }
  ];

  const handleBallClick = () => {
    playSound("pop");
    setBouncing(false);
    setQuestion(questions[Math.floor(Math.random() * questions.length)]);
  };

  const handleAnswer = () => {
    playSound("success");
    onComplete(3, "Happy");
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Question Ball" : "ಪ್ರಶ್ನೆ ಚೆಂಡು"}</h2>
      {bouncing ? (
        <div>
          <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "Tap the ball to stop and reveal a question!" : "ಪ್ರಶ್ನೆಯನ್ನು ನೋಡಲು ಚೆಂಡನ್ನು ತಟ್ಟಿರಿ!"}</p>
          <div onClick={handleBallClick} style={{
            width: "160px", height: "160px", borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #ef4444, #b91c1c)",
            margin: "50px auto", cursor: "pointer",
            animation: "bounceGently 1s infinite ease-in-out",
            boxShadow: "0 10px 25px rgba(239, 68, 68, 0.4)"
          }} />
        </div>
      ) : (
        <div style={{ background: "#1e293b", padding: "30px", borderRadius: "24px", border: "2px solid #475569" }}>
          <h3 style={{ fontSize: "1.6rem" }}>{lang === "en" ? question.q : question.qKn}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "30px" }}>
            {question.ans.map((a, i) => (
              <button key={i} onClick={handleAnswer} className="btn btn-primary" style={{ padding: "16px", fontSize: "1.2rem", borderRadius: "12px" }}>{a}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// a10 - Emotion Charades Camera
function GameA10({ age, lang, onComplete }) {
  const [counter, setCounter] = useState(3);
  const [playing, setPlaying] = useState(false);

  const startCharades = () => {
    playSound("click");
    setPlaying(true);
    const interval = setInterval(() => {
      setCounter(c => {
        if (c <= 1) {
          clearInterval(interval);
          playSound("win");
          onComplete(3, "Proud");
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Emotion Charades" : "ಭಾವನೆ ಅಭಿನಯ"}</h2>
      {!playing ? (
        <div>
          <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "Make a proud pose. Click play to start countdown!" : "ಹೆಮ್ಮೆಯ ಮುಖಭಾವ ಮಾಡಿ. ಆಟ ಪ್ರಾರಂಭಿಸಲು ಒತ್ತಿರಿ!"}</p>
          <div style={{ fontSize: "7rem", margin: "30px" }}>😎</div>
          <button onClick={startCharades} className="btn btn-primary" style={{ padding: "18px 36px", fontSize: "1.2rem", borderRadius: "14px" }}>
            ▶ {lang === "en" ? "Start" : "ಪ್ರಾರಂಭಿಸಿ"}
          </button>
        </div>
      ) : (
        <div style={{ fontSize: "4.5rem", margin: "60px 0" }}>
          ⏱️ {counter > 0 ? counter : "Cheese! 📸"}
        </div>
      )}
    </div>
  );
}

// a11 - Compliment Builder
function GameA11({ age, lang, onComplete }) {
  const tiles = ["You", "are", "awesome", "today"];
  const tilesKn = ["ನೀವು", "ಇಂದು", "ಅದ್ಭುತವಾಗಿದ್ದೀರಿ"];
  const target = lang === "en" ? tiles : tilesKn;
  const [selected, setSelected] = useState([]);

  const handleTile = (tile) => {
    playSound("click");
    if (selected.includes(tile)) return;
    const next = [...selected, tile];
    setSelected(next);
    if (next.length === target.length) {
      playSound("success");
      onComplete(3, "Happy");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Compliment Builder" : "ಹೊಗಳಿಕೆ ನಿರ್ಮಾಣ"}</h2>
      <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "Build a sweet compliment!" : "ಸುಂದರವಾದ ಹೊಗಳಿಕೆಯನ್ನು ರಚಿಸಿ!"}</p>
      <div style={{ margin: "30px", fontSize: "6rem", animation: "bounceGently 1.5s infinite" }}>🐼</div>
      <div style={{ minHeight: "65px", background: "#1e293b", padding: "15px", borderRadius: "12px", marginBottom: "30px", display: "flex", gap: "10px", justifyContent: "center" }}>
        {selected.map((s, idx) => (
          <span key={idx} style={{ background: "var(--primary)", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "1.2rem" }}>{s}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        {target.filter(t => !selected.includes(t)).map((t, i) => (
          <button key={i} onClick={() => handleTile(t)} style={{
            background: "#475569", border: "none", color: "white", padding: "12px 20px",
            borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "1.2rem"
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// b1 - Emotion Flashcards
function GameB1({ age, lang, onComplete }) {
  const cards = [
    { emo: "Happy", emoji: "😊", labelKn: "ಸಂತೋಷ" },
    { emo: "Sad", emoji: "😢", labelKn: "ದುಃಖ" },
    { emo: "Angry", emoji: "😠", labelKn: "ಕೋಪ" }
  ];
  const [idx, setIdx] = useState(0);
  const current = cards[idx];

  const handleSelect = (ans) => {
    if (ans === current.emo) {
      playSound("success");
      if (idx + 1 >= cards.length) {
        onComplete(3, "Happy");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Emotion Flashcards" : "ಭಾವನೆ ಫ್ಲಾಶ್ಕಾರ್ಡ್"}</h2>
      <div style={{ width: "220px", height: "280px", margin: "40px auto", background: "#1e293b", borderRadius: "24px", border: "3px solid var(--primary)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: "7rem" }}>{current.emoji}</div>
      </div>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        {cards.map(c => (
          <button key={c.emo} onClick={() => handleSelect(c.emo)} className="btn btn-primary" style={{ padding: "16px 28px", fontSize: "1.2rem", borderRadius: "12px" }}>
            {lang === "en" ? c.emo : c.labelKn}
          </button>
        ))}
      </div>
    </div>
  );
}

// b2 - Story Sequencing
function GameB2({ age, lang, onComplete }) {
  const routine = [
    { step: 1, text: "Wake up", textKn: "ಎದ್ದೇಳು", icon: "🌅" },
    { step: 2, text: "Brush teeth", textKn: "ಹಲ್ಲುಜ್ಜಿ", icon: "🪥" },
    { step: 3, text: "Dress up", textKn: "ಬಟ್ಟೆ ಧರಿಸಿ", icon: "👕" },
    { step: 4, text: "School bus", textKn: "ಶಾಲಾ ಬಸ್ಸು", icon: "🚌" }
  ];

  const [cards, setCards] = useState(() => [...routine].sort(() => Math.random() - 0.5));
  const [selected, setSelected] = useState([]);

  const handleCard = (card) => {
    playSound("click");
    if (selected.find(c => c.step === card.step)) {
      setSelected(selected.filter(c => c.step !== card.step));
    } else {
      const nextSel = [...selected, card];
      setSelected(nextSel);
      if (nextSel.length === routine.length) {
        if (nextSel.every((c, i) => c.step === i + 1)) {
          playSound("success");
          onComplete(3, "Proud");
        } else {
          playSound("error");
          setSelected([]);
        }
      }
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Story Sequencing" : "ಕಥೆ ಅನುಕ್ರಮ"}</h2>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", margin: "35px 0" }}>
        {cards.map(c => {
          const isSel = selected.find(s => s.step === c.step);
          return (
            <button key={c.step} onClick={() => handleCard(c)} style={{
              background: isSel ? "var(--primary)" : "#1e293b",
              border: "3px solid #475569", borderRadius: "20px", padding: "16px",
              width: "110px", cursor: "pointer", color: "white"
            }}>
              <div style={{ fontSize: "3rem" }}>{c.icon}</div>
              <div style={{ fontSize: "1rem", marginTop: "8px", fontWeight: "bold" }}>{lang === "en" ? c.text : c.textKn}</div>
            </button>
          );
        })}
      </div>
      <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>{lang === "en" ? "Arrange daily routine in sequence" : "ದಿನಚರಿಯನ್ನು ಸರಿಯಾದ ಅನುಕ್ರಮದಲ್ಲಿ ಜೋಡಿಸಿ"}</p>
    </div>
  );
}

// b3 - Turn Taking Board Game
function GameB3({ age, lang, onComplete }) {
  const [turn, setTurn] = useState("player");
  const [pos, setPos] = useState(0);
  const [botPos, setBotPos] = useState(0);
  const target = 10;

  const rollDice = () => {
    if (turn !== "player") return;
    playSound("click");
    const roll = Math.floor(Math.random() * 3) + 1;
    const nextPos = Math.min(pos + roll, target);
    setPos(nextPos);
    if (nextPos === target) {
      playSound("win");
      onComplete(3, "Happy");
      return;
    }
    setTurn("bot");
    setTimeout(() => {
      const botRoll = Math.floor(Math.random() * 3) + 1;
      const nextBot = Math.min(botPos + botRoll, target);
      setBotPos(nextBot);
      playSound("click");
      if (nextBot === target) {
        onComplete(2, "Sad");
      } else {
        setTurn("player");
      }
    }, 1500);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Turn Taking Board Game" : "ಸರದಿ ಆಟ"}</h2>
      <div style={{ display: "flex", justifyContent: "space-around", margin: "30px 0" }}>
        <div style={{ background: "#1e293b", padding: "15px 30px", borderRadius: "16px", border: "1px solid #475569" }}>
          <h4 style={{ margin: 0, fontSize: "1.2rem" }}>🧒 {lang === "en" ? "Your Pos" : "ನಿಮ್ಮ ಸ್ಥಾನ"}: {pos} / 10</h4>
        </div>
        <div style={{ background: "#1e293b", padding: "15px 30px", borderRadius: "16px", border: "1px solid #475569" }}>
          <h4 style={{ margin: 0, fontSize: "1.2rem" }}>🤖 {lang === "en" ? "Robot Pos" : "ರೋಬೋಟ್ ಸ್ಥಾನ"}: {botPos} / 10</h4>
        </div>
      </div>
      <button onClick={rollDice} disabled={turn !== "player"} className="btn btn-primary" style={{ padding: "18px 36px", fontSize: "1.3rem", borderRadius: "14px" }}>
        🎲 {turn === "player" ? (lang === "en" ? "Roll Dice" : "ದಾಳ ಉರುಳಿಸಿ") : (lang === "en" ? "Robot's Turn..." : "ರೋಬೋಟ್ ಸರದಿ...")}
      </button>
    </div>
  );
}

// b4 - Balloon Tapping (Rising Sinewave Wobble)
function GameB4({ age, lang, onComplete }) {
  const diff = getAgeDifficulty(age);
  const [score, setScore] = useState(0);
  const [balloons, setBalloons] = useState([]);
  const [missed, setMissed] = useState(0);

  useEffect(() => {
    const handle = setInterval(() => {
      const size = 60 + Math.random() * 30;
      const startLeft = Math.random() * 80;
      const id = Math.random();
      const color = ["#ef4444", "#3b82f6", "#10b981", "#eab308"][Math.floor(Math.random() * 4)];
      const waveFreq = 0.04 + Math.random() * 0.04;
      const waveAmp = 12 + Math.random() * 12;
      setBalloons(prev => [...prev, { id, size, startLeft, left: startLeft, bottom: -120, color, ageTicks: 0, waveFreq, waveAmp }]);
    }, 1200);

    const physics = setInterval(() => {
      setBalloons(prev => {
        const next = prev.map(b => {
          const nextTicks = b.ageTicks + 1;
          const newLeft = b.startLeft + Math.sin(nextTicks * b.waveFreq) * (b.waveAmp / 10);
          return { ...b, bottom: b.bottom + (2.5 + diff.index), ageTicks: nextTicks, left: newLeft };
        });
        const missedList = next.filter(b => b.bottom > 500);
        if (missedList.length > 0) {
          setMissed(m => {
            const nextMiss = m + missedList.length;
            if (nextMiss >= 3) {
              onComplete(score >= 8 ? 3 : score >= 4 ? 2 : 1, "Sad");
            }
            return nextMiss;
          });
        }
        return next.filter(b => b.bottom <= 500);
      });
    }, 30);

    return () => {
      clearInterval(handle);
      clearInterval(physics);
    };
  }, [score, diff]);

  const tapBalloon = (id) => {
    playSound("pop");
    setScore(s => s + 1);
    setBalloons(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem", textAlign: "center", color: "white" }}>{lang === "en" ? "Balloon Tapping" : "ಬಲೂನ್ ತಟ್ಟುವುದು"}</h2>
      <div style={{ position: "relative", width: "100%", height: "450px", background: "#0f172a", borderRadius: "24px", overflow: "hidden", color: "white", border: "3px solid #334155" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "15px 25px", fontWeight: "bold", fontSize: "1.1rem", zIndex: 10, position: "relative" }}>
          <div>🎈 {lang === "en" ? "Score" : "ಅಂಕ"}: {score}</div>
          <div>❌ {lang === "en" ? "Missed" : "ತಪ್ಪಿದ್ದು"}: {missed} / 3</div>
        </div>
        {balloons.map(b => (
          <div key={b.id} onClick={() => tapBalloon(b.id)} style={{
            position: "absolute", bottom: `${b.bottom}px`, left: `${b.left}%`,
            width: `${b.size}px`, height: `${b.size * 1.3}px`, background: b.color,
            borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%", cursor: "pointer",
            boxShadow: `0 8px 20px ${b.color}44`,
            transform: "translate(-50%, 0)",
            transition: "bottom 0.05s linear, left 0.05s linear"
          }}>
            {/* Balloon string */}
            <div style={{ width: "2px", height: "40px", background: "#cbd5e1", margin: "100% auto 0" }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// b5 - Simple Cooking Together
function GameB5({ age, lang, onComplete }) {
  const steps = ["Bread 🍞", "Tomato 🍅", "Cheese 🧀", "Lettuce 🥬", "Bread 🍞"];
  const stepsKn = ["ಬ್ರೆಡ್ 🍞", "ಟೊಮೆಟೊ 🍅", "ಚೀಸ್ 🧀", "ಲೆಟಿಸ್ 🥬", "ಬ್ರೆಡ್ 🍞"];
  const target = lang === "en" ? steps : stepsKn;
  const [dish, setDish] = useState([]);

  const addIngredient = (item) => {
    playSound("click");
    const expected = target[dish.length];
    if (item === expected) {
      const nextDish = [...dish, item];
      setDish(nextDish);
      if (nextDish.length === target.length) {
        playSound("win");
        setTimeout(() => onComplete(3, "Happy"), 850);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Cooking Together" : "ಅಡುಗೆ ಆಟ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "Build a sandwich in correct order!" : "ಸರಿಯಾದ ಕ್ರಮದಲ್ಲಿ ಸ್ಯಾಂಡ್‌ವಿಚ್ ಮಾಡಿ!"}</p>
      
      <div style={{ background: "#1e293b", width: "200px", minHeight: "200px", margin: "25px auto", padding: "15px", borderRadius: "20px", display: "flex", flexDirection: "column-reverse", gap: "8px", alignItems: "center", border: "2px solid #475569" }}>
        {dish.map((d, i) => (
          <span key={i} style={{ padding: "8px 16px", background: "var(--primary)", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem", animation: "bounceGently 0.4s ease-out" }}>{d}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        {Array.from(new Set(target)).map(t => (
          <button key={t} onClick={() => addIngredient(t)} className="btn btn-ghost" style={{ border: "2px solid #475569", color: "white", padding: "10px 20px", fontSize: "1.1rem" }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

// b6 - Memory Match Cards (3D Flipping Animation)
function GameB6({ age, lang, onComplete }) {
  const diff = getAgeDifficulty(age);
  const emojis = ["🦁", "🐯", "🐼", "🦊", "🐻", "🐨", "🐵", "🦄"];
  const pairCount = diff.index === 1 ? 2 : diff.index === 2 ? 4 : 6;
  const [deck, setDeck] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);

  useEffect(() => {
    const list = [...emojis.slice(0, pairCount), ...emojis.slice(0, pairCount)].sort(() => Math.random() - 0.5);
    setDeck(list.map((emo, idx) => ({ id: idx, emoji: emo })));
  }, [pairCount]);

  const handleCard = (card) => {
    if (flipped.length >= 2 || flipped.includes(card.id) || matched.includes(card.emoji)) return;
    playSound("click");
    const nextFlipped = [...flipped, card.id];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      const first = deck[nextFlipped[0]];
      const second = deck[nextFlipped[1]];
      if (first.emoji === second.emoji) {
        playSound("success");
        const nextMatched = [...matched, first.emoji];
        setMatched(nextMatched);
        setFlipped([]);
        if (nextMatched.length === pairCount) {
          setTimeout(() => onComplete(3, "Proud"), 850);
        }
      } else {
        setTimeout(() => {
          playSound("error");
          setFlipped([]);
        }, 1000);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Memory Match Cards" : "ಜ್ಞಾಪಕ ಹೊಂದಾಣಿಕೆ"}</h2>
      <style>{`
        .perspective-container { perspective: 800px; }
        .flip-card-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.6s; transform-style: preserve-3d;
        }
        .is-flipped { transform: rotateY(180deg); }
        .flip-card-front, .flip-card-back {
          position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .flip-card-front { background: #1e293b; border: 2px solid #475569; }
        .flip-card-back { background: #3b82f6; transform: rotateY(180deg); }
      `}</style>
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${pairCount <= 4 ? 2 : 4}, 90px)`,
        gap: "15px", justifyContent: "center", margin: "35px auto"
      }} className="perspective-container">
        {deck.map(c => {
          const isOpen = flipped.includes(c.id) || matched.includes(c.emoji);
          return (
            <div key={c.id} onClick={() => handleCard(c)} style={{ width: "90px", height: "120px", cursor: "pointer" }}>
              <div className={`flip-card-inner ${isOpen ? "is-flipped" : ""}`}>
                <div className="flip-card-front" style={{ fontSize: "2rem" }}>❓</div>
                <div className="flip-card-back" style={{ fontSize: "2.5rem" }}>{c.emoji}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// b7 - Pattern Completion
function GameB7({ age, lang, onComplete }) {
  const patterns = [
    { seq: ["🔴", "🔵", "🔴", "🔵"], next: "🔴", options: ["🔴", "🔵", "🔺"] },
    { seq: ["🍎", "🍌", "🍎", "🍌"], next: "🍎", options: ["🍎", "🍌", "🍇"] }
  ];
  const [idx, setIdx] = useState(0);
  const current = patterns[idx];

  const handleSelect = (item) => {
    if (item === current.next) {
      playSound("success");
      if (idx + 1 >= patterns.length) {
        onComplete(3, "Happy");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Pattern Completion" : "ಮಾದರಿ ಪೂರ್ಣಗೊಳಿಸಿ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "What comes next in the pattern?" : "ಮಾದರಿಯಲ್ಲಿ ಮುಂದೆ ಬರುವುದು ಯಾವುದು?"}</p>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", fontSize: "4.5rem", margin: "40px 0" }}>
        {current.seq.map((s, i) => <span key={i}>{s}</span>)}
        <span style={{ borderBottom: "4px dashed white", minWidth: "60px", display: "inline-block", height: "60px" }}></span>
      </div>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {current.options.map(o => (
          <button key={o} onClick={() => handleSelect(o)} style={{ fontSize: "3.5rem", background: "#1e293b", border: "2px solid #475569", padding: "15px 30px", borderRadius: "16px", cursor: "pointer" }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// b8 - Category Sort Drag Drop
function GameB8({ age, lang, onComplete }) {
  const items = [
    { name: "Apple 🍎", cat: "Food", nameKn: "ಸೇಬು 🍎" },
    { name: "Lion 🦁", cat: "Animal", nameKn: "ಸಿಂಹ 🦁" },
    { name: "Car 🚗", cat: "Vehicle", nameKn: "ಕಾರು 🚗" }
  ];
  const [idx, setIdx] = useState(0);
  const current = items[idx];

  const handleSort = (cat) => {
    if (cat === current.cat) {
      playSound("success");
      if (idx + 1 >= items.length) {
        onComplete(3, "Proud");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Category Sort" : "ವರ್ಗ ವಿಂಗಡಣೆ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "Where does this object belong?" : "ಈ ವಸ್ತು ಎಲ್ಲಿಗೆ ಸೇರುತ್ತದೆ?"}</p>
      <div style={{ fontSize: "6rem", margin: "35px", animation: "bounceGently 1.5s infinite" }}>{lang === "en" ? current.name : current.nameKn}</div>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {["Food", "Animal", "Vehicle"].map(cat => (
          <button key={cat} onClick={() => handleSort(cat)} className="btn btn-primary" style={{ padding: "18px 30px", fontSize: "1.2rem", borderRadius: "12px" }}>
            {lang === "en" ? cat : (cat === "Food" ? "ಆಹಾರ" : cat === "Animal" ? "ಪ್ರಾಣಿ" : "ವಾಹನ")}
          </button>
        ))}
      </div>
    </div>
  );
}

// b9 - Simon Says (Glowing Active Pads)
function GameB9({ age, lang, onComplete }) {
  const [seq, setSeq] = useState([0, 1]);
  const [userSeq, setUserSeq] = useState([]);
  const [lit, setLit] = useState(null);
  const colors = ["#ef4444", "#3b82f6", "#10b981", "#eab308"];

  const playSeq = () => {
    seq.forEach((id, idx) => {
      setTimeout(() => {
        setLit(id);
        playSound("click");
        setTimeout(() => setLit(null), 300);
      }, idx * 600);
    });
  };

  useEffect(() => {
    playSeq();
  }, [seq]);

  const handlePad = (id) => {
    playSound("click");
    const nextSeq = [...userSeq, id];
    setUserSeq(nextSeq);
    const expected = seq[userSeq.length];
    if (id !== expected) {
      playSound("error");
      setUserSeq([]);
      playSeq();
    } else if (nextSeq.length === seq.length) {
      playSound("success");
      onComplete(3, "Happy");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Simon Says" : "ಸೈಮನ್ ಹೇಳುತ್ತಾರೆ"}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "130px 130px", gap: "20px", justifyContent: "center", margin: "40px auto" }}>
        {colors.map((c, i) => (
          <div key={i} onClick={() => handlePad(i)} style={{
            width: "130px", height: "130px", background: c, borderRadius: "24px",
            opacity: lit === i ? 1 : 0.45, cursor: "pointer", transition: "all 0.15s",
            transform: lit === i ? "scale(1.08)" : "scale(1)",
            boxShadow: lit === i ? `0 0 30px ${c}` : "none"
          }} />
        ))}
      </div>
    </div>
  );
}

// b10 - Picture Exchange Click
function GameB10({ age, lang, onComplete }) {
  const options = [
    { label: "Water 💧", labelKn: "ನೀರು 💧" },
    { label: "Toy 🧸", labelKn: "ಆಟಿಕೆ 🧸" },
    { label: "Apple 🍎", labelKn: "ಸೇಬು 🍎" }
  ];

  const handleSelect = (item) => {
    playSound("success");
    onComplete(3, "Happy");
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Picture Exchange Click" : "ಚಿತ್ರ ವಿನಿಮಯ ಕ್ಲಿಕ್"}</h2>
      <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "What do you want?" : "ನಿಮಗೆ ಏನು ಬೇಕು?"}</p>
      <div style={{ fontSize: "6rem", margin: "25px" }}>🙋‍♂️</div>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {options.map(o => (
          <button key={o.label} onClick={() => handleSelect(o.label)} style={{
            background: "#1e293b", border: "2px solid #475569", borderRadius: "20px",
            padding: "25px 35px", color: "white", cursor: "pointer", fontSize: "1.2rem"
          }}>
            <div>{lang === "en" ? o.label : o.labelKn}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// b11 - Yes No Button Game
function GameB11({ age, lang, onComplete }) {
  const questions = [
    { q: "Is an elephant big?", qKn: "ಆನೆ ದೊಡ್ಡದಾಗಿದೆಯೇ?", ans: "YES" },
    { q: "Do birds live in water?", qKn: "ಪಕ್ಷಿಗಳು ನೀರಿನಲ್ಲಿ ವಾಸಿಸುತ್ತವೆಯೇ?", ans: "NO" }
  ];
  const [idx, setIdx] = useState(0);
  const current = questions[idx];

  const handleAnswer = (val) => {
    if (val === current.ans) {
      playSound("success");
      if (idx + 1 >= questions.length) {
        onComplete(3, "Proud");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Yes No Button Game" : "ಹೌದು ಇಲ್ಲ ಆಟ"}</h2>
      <h3 style={{ margin: "50px 0", fontSize: "1.8rem" }}>{lang === "en" ? current.q : current.qKn}</h3>
      <div style={{ display: "flex", gap: "30px", justifyContent: "center" }}>
        <button onClick={() => handleAnswer("YES")} className="btn btn-success" style={{ padding: "20px 45px", fontSize: "1.3rem", borderRadius: "14px" }}>
          👍 {lang === "en" ? "YES" : "ಹೌದು"}
        </button>
        <button onClick={() => handleAnswer("NO")} style={{ background: "#ef4444", color: "white", padding: "20px 45px", fontSize: "1.3rem", border: "none", borderRadius: "14px", cursor: "pointer" }}>
          👎 {lang === "en" ? "NO" : "ಇಲ್ಲ"}
        </button>
      </div>
    </div>
  );
}

// b12 - Name That Object
function GameB12({ age, lang, onComplete }) {
  const items = [
    { emoji: "✏️", name: "Pencil", nameKn: "ಪೆನ್ಸಿಲ್", options: ["Pencil", "Apple", "Book"] },
    { emoji: "🚗", name: "Car", nameKn: "ಕಾರು", options: ["Car", "Dog", "Cup"] }
  ];
  const [idx, setIdx] = useState(0);
  const current = items[idx];

  const handleSelect = (name) => {
    if (name === current.name) {
      playSound("success");
      if (idx + 1 >= items.length) {
        onComplete(3, "Happy");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Name That Object" : "ವಸ್ತು ಗುರುತಿಸಿ"}</h2>
      <div style={{ fontSize: "7rem", margin: "30px" }}>{current.emoji}</div>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        {current.options.map(o => (
          <button key={o} onClick={() => handleSelect(o)} className="btn btn-primary" style={{ padding: "16px 30px", fontSize: "1.2rem", borderRadius: "12px" }}>
            {lang === "en" ? o : (o === "Pencil" ? "ಪೆನ್ಸಿಲ್" : o === "Apple" ? "ಸೇಬು" : o === "Book" ? "ಪುಸ್ತಕ" : o === "Car" ? "ಕಾರು" : o === "Dog" ? "ನಾಯಿ" : "ಕಪ್")}
          </button>
        ))}
      </div>
    </div>
  );
}

// b13 - Request the Item
function GameB13({ age, lang, onComplete }) {
  const target = ["HELP", "PLEASE"];
  const [selected, setSelected] = useState([]);

  const handlePress = (word) => {
    playSound("click");
    const next = [...selected, word];
    setSelected(next);
    if (next.length === target.length) {
      if (next.every((w, i) => w === target[i])) {
        playSound("success");
        onComplete(3, "Happy");
      } else {
        playSound("error");
        setSelected([]);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Request the Item" : "ವಸ್ತು ಕೇಳಿ"}</h2>
      <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "The toy is too high. How do you ask?" : "ಆಟಿಕೆ ಬಹಳ ಎತ್ತರದಲ್ಲಿದೆ. ಹೇಗೆ ಕೇಳುತ್ತೀರಿ?"}</p>
      <div style={{ fontSize: "6rem", margin: "25px" }}>🧸🧗‍♀️</div>
      <div style={{ background: "#1e293b", padding: "15px", minHeight: "55px", borderRadius: "12px", margin: "20px auto", width: "max-content", display: "flex", gap: "12px" }}>
        {selected.map((w, i) => (
          <span key={i} style={{ background: "var(--primary)", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: "1.1rem" }}>{w}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
        {["MORE", "HELP", "PLEASE"].map(w => (
          <button key={w} onClick={() => handlePress(w)} style={{ background: "#475569", border: "none", color: "white", padding: "15px 25px", borderRadius: "10px", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem" }}>{w}</button>
        ))}
      </div>
    </div>
  );
}

// c1 - Role Play Scenarios
function GameC1({ age, lang, onComplete }) {
  const scenario = {
    q: "A classmate drops their pencil. What is a helpful response?",
    qKn: "ಸಹಪಾಠಿ ತನ್ನ ಪೆನ್ಸಿಲ್ ಕೆಳಗೆ ಹಾಕುತ್ತಾರೆ. ಅದಕ್ಕೆ ಸಹಾಯದ ಪ್ರತಿಕ್ರಿಯೆ ಏನು?",
    ans: [
      { text: "Pick it up and hand it to them", textKn: "ಅದನ್ನು ಆರಿಸಿ ಅವರಿಗೆ ನೀಡುವುದು", correct: true },
      { text: "Ignore it and walk away", textKn: "ಅದನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ ಹೊರಡುವುದು", correct: false }
    ]
  };

  const handleChoice = (correct) => {
    if (correct) {
      playSound("success");
      onComplete(3, "Proud");
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Role Play Scenario" : "ಪಾತ್ರಾಭಿನಯ"}</h2>
      <p style={{ fontSize: "1.3rem", margin: "35px 0", lineHeight: "1.5" }}>{lang === "en" ? scenario.q : scenario.qKn}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {scenario.ans.map((a, i) => (
          <button key={i} onClick={() => handleChoice(a.correct)} className="btn btn-primary" style={{ padding: "18px", fontSize: "1.15rem", borderRadius: "12px" }}>
            {lang === "en" ? a.text : a.textKn}
          </button>
        ))}
      </div>
    </div>
  );
}

// c2 - Obstacle Course (Side-Scrolling Parallax Animation Loop)
function GameC2({ age, lang, onComplete }) {
  const [posY, setPosY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [score, setScore] = useState(0);
  const [bgOffset, setBgOffset] = useState(0);
  const [obsX, setObsX] = useState(100);

  const jump = () => {
    if (isJumping) return;
    playSound("click");
    setIsJumping(true);
    setPosY(100);
    setTimeout(() => {
      setPosY(0);
      setIsJumping(false);
    }, 600);
  };

  useEffect(() => {
    const loop = setInterval(() => {
      // Parallax scroll BG
      setBgOffset(prev => (prev + 1.5) % 100);

      // Move obstacle smoothly
      setObsX(prev => {
        if (prev <= -5) {
          setScore(s => {
            const next = s + 1;
            if (next >= 5) {
              clearInterval(loop);
              onComplete(3, "Happy");
            }
            return next;
          });
          return 100;
        }
        return prev - 2.5;
      });
    }, 35);
    return () => clearInterval(loop);
  }, []);

  return (
    <div onClick={jump} style={{ width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem", textAlign: "center", color: "white" }}>{lang === "en" ? "Obstacle Course" : "ಅಡೆತಡೆ ಓಟ"}</h2>
      <div style={{ position: "relative", width: "100%", height: "260px", background: "#0f172a", borderRadius: "20px", border: "2px solid #475569", overflow: "hidden", cursor: "pointer" }}>
        
        {/* Parallax sky dots */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(255,255,255,0.05) 5%, transparent 10%)", backgroundPosition: `${-bgOffset * 3}px 0px`, opacity: 0.5 }} />

        <div style={{ position: "absolute", top: "15px", left: "20px", color: "white", fontWeight: "bold", fontSize: "1.2rem", zIndex: 10 }}>
          {lang === "en" ? "Stars" : "ನಕ್ಷತ್ರಗಳು"}: {score} / 5
        </div>

        {/* Runner */}
        <div style={{
          position: "absolute", bottom: `${posY + 20}px`, left: "10%",
          fontSize: "3.5rem", transition: "bottom 0.05s linear",
          animation: !isJumping ? "bounceGently 0.5s infinite" : "none"
        }}>
          🏃‍♂️
        </div>

        {/* Obstacle */}
        <div style={{ position: "absolute", bottom: "20px", left: `${obsX}%`, fontSize: "2.5rem" }}>
          🪵
        </div>

        <div style={{ position: "absolute", bottom: 0, width: "100%", height: "20px", background: "#10b981" }} />
        <p style={{ position: "absolute", bottom: "40%", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.45)", fontSize: "1.1rem", fontWeight: "bold" }}>
          {lang === "en" ? "Tap anywhere to jump!" : "ಹಾರಲು ಎಲ್ಲಿಯಾದರೂ ತಟ್ಟಿರಿ!"}
        </p>
      </div>
    </div>
  );
}

// c3 - Peer Play Date
function GameC3({ age, lang, onComplete }) {
  const scenario = {
    q: "You and Amit want to play with the same firetruck. What is a sharing choice?",
    qKn: "ನೀವು ಮತ್ತು ಅಮಿತ್ ಒಂದೇ ಆಟಿಕೆ ಕಾರಿನೊಂದಿಗೆ ಆಟವಾಡಲು ಬಯಸುತ್ತೀರಿ. ಹಂಚಿಕೊಳ್ಳುವ ಆಯ್ಕೆ ಯಾವುದು?",
    ans: [
      { text: "Suggest taking turns (Amit plays for 5 mins, then you)", textKn: "ಸರದಿ ಬದಲಾಯಿಸಲು ಸೂಚಿಸಿ", correct: true },
      { text: "Pull the toy away from Amit", textKn: "ಅಮಿತ್ ಕೈಯಿಂದ ಆಟಿಕೆ ಕಸಿದುಕೊಳ್ಳಿ", correct: false }
    ]
  };

  const handleChoice = (correct) => {
    if (correct) {
      playSound("success");
      onComplete(3, "Happy");
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2>{lang === "en" ? "Peer Play Date" : "ಗೆಳೆಯರ ಆಟ"}</h2>
      <p style={{ fontSize: "1.2rem", margin: "30px 0" }}>{lang === "en" ? scenario.q : scenario.qKn}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {scenario.ans.map((a, i) => (
          <button key={i} onClick={() => handleChoice(a.correct)} className="btn btn-primary" style={{ padding: "14px", fontSize: "1.05rem" }}>
            {lang === "en" ? a.text : a.textKn}
          </button>
        ))}
      </div>
    </div>
  );
}

// c4 - Feelings Journal
function GameC4({ age, lang, onComplete }) {
  const [emo, setEmo] = useState("");
  const emotionsList = ["Happy", "Sad", "Angry", "Calm"];

  const handleSave = () => {
    if (!emo) return;
    playSound("win");
    onComplete(3, emo);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Feelings Journal" : "ಭಾವನೆ ಡೈರಿ"}</h2>
      <p style={{ fontSize: "1.2rem" }}>{lang === "en" ? "How are you feeling today?" : "ಇಂದು ನಿಮಗೆ ಹೇಗನಿಸುತ್ತಿದೆ?"}</p>
      
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", margin: "30px 0" }}>
        {emotionsList.map(e => (
          <button key={e} onClick={() => { playSound("click"); setEmo(e); }} style={{
            background: emo === e ? "var(--primary)" : "#1e293b",
            border: "3px solid #475569", borderRadius: "20px", padding: "20px 30px",
            cursor: "pointer", color: "white"
          }}>
            <div style={{ fontSize: "3.5rem" }}>{EMOTION_EMOJIS[e]}</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>{lang === "en" ? e : EMOTION_LABELS_KN[e]}</div>
          </button>
        ))}
      </div>

      <button onClick={handleSave} disabled={!emo} className="btn btn-success" style={{ padding: "16px 36px", fontSize: "1.2rem", borderRadius: "12px" }}>
        💾 {lang === "en" ? "Save Entry" : "ಉಳಿಸಿ"}
      </button>
    </div>
  );
}

// c5 - Community Helper Interview
function GameC5({ age, lang, onComplete }) {
  const dialogs = [
    { q: "What tools do you use, Doctor?", qKn: "ವೈದ್ಯರೇ, ನೀವು ಯಾವ ಉಪಕರಣ ಬಳಸುತ್ತೀರಿ?", a: "I use a stethoscope to listen to your heartbeat.", aKn: "ನಾನು ನಿಮ್ಮ ಹೃದಯ ಬಡಿತ ಕೇಳಲು ಸ್ಟೆತಸ್ಕೋಪ್ ಬಳಸುತ್ತೇನೆ." },
    { q: "How do you help us, Doctor?", qKn: "ವೈದ್ಯರೇ, ನೀವು ನಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡುತ್ತೀರಿ?", a: "I help you stay healthy and treat you when sick.", aKn: "ನಾನು ನೀವು ಆರೋಗ್ಯವಾಗಿರಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ." }
  ];
  const [reply, setReply] = useState("");

  const ask = (ans) => {
    playSound("click");
    setReply(ans);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Helper Interview" : "ಸಹಾಯಕ ಸಂದರ್ಶನ"}</h2>
      <div style={{ margin: "30px", fontSize: "6rem" }}>🩺👩‍⚕️</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
        {dialogs.map((d, i) => (
          <button key={i} onClick={() => ask(lang === "en" ? d.a : d.aKn)} className="btn btn-primary" style={{ padding: "14px", fontSize: "1.1rem" }}>
            🗣️ {lang === "en" ? d.q : d.qKn}
          </button>
        ))}
      </div>
      {reply && (
        <div style={{ background: "#1e293b", padding: "20px", borderRadius: "14px", border: "1px solid #475569" }}>
          <p style={{ fontStyle: "italic", margin: 0, fontSize: "1.2rem" }}>"{reply}"</p>
        </div>
      )}
      <button onClick={() => { playSound("win"); onComplete(3, "Happy"); }} className="btn btn-success" style={{ marginTop: "20px", padding: "12px 24px" }}>
        {lang === "en" ? "Finish Interview" : "ಸಂದರ್ಶನ ಮುಗಿಸಿ"}
      </button>
    </div>
  );
}

// c6 - Mirror Expression Camera
function GameC6({ age, lang, onComplete }) {
  const expressions = ["Happy", "Surprised"];
  const [idx, setIdx] = useState(0);

  const match = () => {
    playSound("success");
    if (idx + 1 >= expressions.length) {
      onComplete(3, "Happy");
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Mirror Expression" : "ಕನ್ನಡಿ ಅಭಿವ್ಯಕ್ತಿ"}</h2>
      <p style={{ fontSize: "1.25rem" }}>{lang === "en" ? `Try to show a ${expressions[idx]} face!` : `${EMOTION_LABELS_KN[expressions[idx]]} ಮುಖಭಾವ ತೋರಿಸಿ!`}</p>
      <div style={{ fontSize: "7rem", margin: "30px", animation: "bounceGently 1.5s infinite" }}>{EMOTION_EMOJIS[expressions[idx]]}</div>
      <button onClick={match} className="btn btn-primary" style={{ padding: "16px 32px", fontSize: "1.2rem", borderRadius: "12px" }}>
        📸 {lang === "en" ? "Match Expression" : "ಭಾವನೆ ಹೊಂದಿಸಿ"}
      </button>
    </div>
  );
}

// c7 - Turn Taking Ball Animation
function GameC7({ age, lang, onComplete }) {
  const [turn, setTurn] = useState("Amit");
  const [score, setScore] = useState(0);

  useEffect(() => {
    const handle = setInterval(() => {
      setTurn(t => {
        if (t === "Amit") {
          playSound("click");
          return "You";
        } else {
          return "Amit";
        }
      });
    }, 1800);
    return () => clearInterval(handle);
  }, []);

  const throwBall = () => {
    if (turn !== "You") return;
    playSound("success");
    setScore(s => {
      const next = s + 1;
      if (next >= 4) {
        onComplete(3, "Happy");
      }
      return next;
    });
    setTurn("Amit");
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Turn Taking Ball" : "ಸರದಿ ಚೆಂಡು"}</h2>
      <div style={{ display: "flex", justifyContent: "space-around", margin: "40px 0", alignItems: "center" }}>
        <div style={{ border: turn === "Amit" ? "3px solid #10b981" : "none", padding: "15px 25px", borderRadius: "16px", background: "#1e293b", fontSize: "1.2rem" }}>🤖 Amit</div>
        <div style={{ fontSize: "3.5rem", animation: "float 1s infinite ease-in-out" }}>🏀</div>
        <div style={{ border: turn === "You" ? "3px solid #3b82f6" : "none", padding: "15px 25px", borderRadius: "16px", background: "#1e293b", fontSize: "1.2rem" }}>🧒 You</div>
      </div>
      <button onClick={throwBall} disabled={turn !== "You"} className="btn btn-primary" style={{ padding: "18px 36px", fontSize: "1.25rem", borderRadius: "14px" }}>
        {turn === "You" ? (lang === "en" ? "Throw Ball!" : "ಚೆಂಡು ಎಸೆಯಿರಿ!") : (lang === "en" ? "Amit's turn..." : "ಅಮಿತ್ ಸರದಿ...")}
      </button>
    </div>
  );
}

// c8 - Emotion Matching Game
function GameC8({ age, lang, onComplete }) {
  const options = [
    { emoji: "😊", name: "Happy", nameKn: "ಸಂತೋಷ" },
    { emoji: "😢", name: "Sad", nameKn: "ದುಃಖ" },
    { emoji: "😠", name: "Angry", nameKn: "ಕೋಪ" }
  ];
  const [idx, setIdx] = useState(0);
  const current = options[idx];

  const handleSelect = (name) => {
    if (name === current.name) {
      playSound("success");
      if (idx + 1 >= options.length) {
        onComplete(3, "Happy");
      } else {
        setIdx(idx + 1);
      }
    } else {
      playSound("error");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Emotion Matching" : "ಭಾವನೆ ಹೊಂದಾಣಿಕೆ"}</h2>
      <div style={{ fontSize: "7rem", margin: "40px" }}>{current.emoji}</div>
      <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
        {options.map(o => (
          <button key={o.name} onClick={() => handleSelect(o.name)} className="btn btn-primary" style={{ padding: "16px 28px", fontSize: "1.2rem", borderRadius: "12px" }}>
            {lang === "en" ? o.name : o.nameKn}
          </button>
        ))}
      </div>
    </div>
  );
}

// c9 - Hello Goodbye Practice
function GameC9({ age, lang, onComplete }) {
  const [mode, setMode] = useState("hello");

  const wave = () => {
    playSound("success");
    if (mode === "hello") {
      setMode("goodbye");
    } else {
      onComplete(3, "Happy");
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Hello Goodbye Practice" : "ಹಲೋ ಬೈ ಅಭ್ಯಾಸ"}</h2>
      <div style={{ fontSize: "7rem", margin: "35px", animation: "bounceGently 1.5s infinite" }}>👋👦</div>
      <p style={{ fontSize: "1.2rem", marginBottom: "25px" }}>{mode === "hello" ? (lang === "en" ? "Wave Hello!" : "ಹಲೋ ಹೇಳಿ!") : (lang === "en" ? "Wave Goodbye!" : "ಬೈ ಹೇಳಿ!")}</p>
      <button onClick={wave} className="btn btn-primary" style={{ padding: "18px 36px", fontSize: "1.2rem", borderRadius: "14px" }}>
        {mode === "hello" ? (lang === "en" ? "Wave Hello" : "ಹಲೋ ಹೇಳಿ") : (lang === "en" ? "Wave Goodbye" : "ಬೈ ಹೇಳಿ")}
      </button>
    </div>
  );
}

// c10 - Car Down Ramp (Wheel Rotating Physics Animation)
function GameC10({ age, lang, onComplete }) {
  const [pushed, setPushed] = useState(false);

  const pushCar = () => {
    playSound("click");
    setPushed(true);
    setTimeout(() => {
      playSound("win");
      onComplete(3, "Excited");
    }, 1500);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Car Down Ramp" : "ರ್ಯಾಂಪ್ ಕಾರು"}</h2>
      <style>{`
        @keyframes rotateWheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinning-wheel {
          animation: rotateWheel 0.2s linear infinite;
        }
      `}</style>
      <div style={{ position: "relative", width: "100%", height: "240px", background: "#1e293b", borderRadius: "20px", overflow: "hidden", margin: "25px 0", border: "2px solid #475569" }}>
        
        {/* Animated sliding car container */}
        <div style={{
          position: "absolute", bottom: pushed ? "15px" : "150px", left: pushed ? "85%" : "15px",
          display: "flex", gap: "10px", alignItems: "center",
          transition: "all 1.5s cubic-bezier(0.25, 1, 0.5, 1)",
          transform: "translate(-50%, 0)"
        }}>
          <div style={{ fontSize: "3.5rem", position: "relative" }}>
            🚗
            {pushed && (
              <div style={{ display: "flex", gap: "25px", position: "absolute", bottom: "3px", left: "10px" }}>
                <span className="spinning-wheel" style={{ fontSize: "0.8rem", display: "inline-block" }}>⚙️</span>
                <span className="spinning-wheel" style={{ fontSize: "0.8rem", display: "inline-block" }}>⚙️</span>
              </div>
            )}
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "20px", background: "#f59e0b", transform: "skewY(-12deg)", transformOrigin: "bottom left" }} />
      </div>
      <button onClick={pushCar} disabled={pushed} className="btn btn-primary" style={{ padding: "18px 36px", fontSize: "1.2rem", borderRadius: "14px" }}>
        🚀 {lang === "en" ? "PUSH!" : "ತಳ್ಳಿರಿ!"}
      </button>
    </div>
  );
}

// c11 - Calm Music Player
function GameC11({ age, lang, onComplete }) {
  const [pulse, setPulse] = useState(false);

  const playCalm = () => {
    playSound("success");
    setPulse(true);
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Calm Music Player" : "ಶಾಂತ ಸಂಗೀತ"}</h2>
      <div style={{
        width: "150px", height: "150px", borderRadius: "50%",
        background: "radial-gradient(circle, #8b5cf6, #5b21b6)",
        margin: "45px auto", cursor: "pointer",
        transform: pulse ? "scale(1.15)" : "scale(1)",
        transition: "transform 0.8s ease-in-out",
        boxShadow: pulse ? "0 0 35px #8b5cf6" : "0 4px 15px rgba(0,0,0,0.3)"
      }} onClick={playCalm} />
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? "Tap circle to hear soothing tones" : "ಶಾಂತ ಧ್ವನಿ ಕೇಳಲು ವೃತ್ತದ ಮೇಲೆ ತಟ್ಟಿರಿ"}</p>
      <button onClick={() => onComplete(3, "Calm")} className="btn btn-success" style={{ marginTop: "30px", padding: "12px 28px" }}>
        {lang === "en" ? "Finished" : "ಮುಗಿಸಿ"}
      </button>
    </div>
  );
}

// c12 - Sensory Bubble Screen (Physics Elastic Bouncing Screen)
function GameC12({ age, lang, onComplete }) {
  const [bubbles, setBubbles] = useState([
    { id: 1, x: 50, y: 50, dx: 2, dy: 3, size: 70, color: "rgba(139,92,246,0.85)" },
    { id: 2, x: 120, y: 180, dx: -3, dy: 2, size: 85, color: "rgba(244,63,94,0.85)" },
    { id: 3, x: 250, y: 80, dx: 3, dy: -2, size: 75, color: "rgba(16,185,129,0.85)" }
  ]);
  const [popped, setPopped] = useState(0);

  useEffect(() => {
    const physicsLoop = setInterval(() => {
      setBubbles(prev => prev.map(b => {
        let nextX = b.x + b.dx;
        let nextY = b.y + b.dy;
        let nextDx = b.dx;
        let nextDy = b.dy;

        // Bounce off X borders
        if (nextX <= 0 || nextX >= 400) nextDx = -nextDx;
        // Bounce off Y borders
        if (nextY <= 0 || nextY >= 200) nextDy = -nextDy;

        return { ...b, x: nextX, y: nextY, dx: nextDx, dy: nextDy };
      }));
    }, 30);
    return () => clearInterval(physicsLoop);
  }, []);

  const handlePop = (id) => {
    playSound("pop");
    const next = popped + 1;
    setPopped(next);
    setBubbles(prev => prev.filter(b => b.id !== id));
    if (next >= 3) {
      setTimeout(() => onComplete(3, "Calm"), 600);
    }
  };

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px" }}>
      <h2 style={{ fontSize: "1.8rem" }}>{lang === "en" ? "Sensory Bubble Screen" : "ಸಂವೇದನಾ ಗುಳ್ಳೆ ಪರದೆ"}</h2>
      <p style={{ fontSize: "1.1rem" }}>{lang === "en" ? `Pop the bouncing bubbles! (${popped} / 3)` : `ಚಲಿಸುವ ಗುಳ್ಳೆಗಳನ್ನು ಒಡೆಯಿರಿ! (${popped} / 3)`}</p>
      
      <div style={{ position: "relative", width: "100%", height: "280px", background: "#0f172a", borderRadius: "20px", border: "2px solid #475569", overflow: "hidden", margin: "20px 0" }}>
        {bubbles.map(b => (
          <div key={b.id} onClick={() => handlePop(b.id)} style={{
            position: "absolute", top: `${b.y}px`, left: `${b.x}px`,
            width: `${b.size}px`, height: `${b.size}px`, borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0%, ${b.color} 100%)`,
            boxShadow: "0 6px 15px rgba(0,0,0,0.3)", cursor: "pointer",
            transition: "top 0.03s linear, left 0.03s linear"
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MORAL GAME 1: The Sharing Tree (Kindness & Turn-Taking)
// ─────────────────────────────────────────────────────────────
function GameMoralSharing({ age, lang, onComplete }) {
  const [round, setRound] = useState(1);
  const [sharedCount, setSharedCount] = useState(0);
  const [hearts, setHearts] = useState([]);
  const [finished, setFinished] = useState(false);

  const roundsData = [
    {
      round: 1,
      titleEn: "Share Apples with Hungry Bunny 🐰",
      titleKn: "ಹಸಿದ ಮೊಲದೊಂದಿಗೆ ಸೇಬು ಹಂಚಿಕೊಳ್ಳಿ 🐰",
      giver: { name: "Squirrel 🐿️", has: 4, item: "🍎" },
      receiver: { name: "Bunny 🐰", needed: 2 },
      targetShare: 2,
      moralEn: "When we share our food, no friend stays hungry!",
      moralKn: "ನಾವು ಹಂಚಿಕೊಂಡಾಗ ಯಾವುದೇ ಸ್ನೇಹಿತ ಹಸಿದಿರುವುದಿಲ್ಲ!",
    },
    {
      round: 2,
      titleEn: "Share Crayons to Color the Rainbow 🌈",
      titleKn: "ಕಾಮನಬಿಲ್ಲು ಬಣ್ಣಿಸಲು ಕ್ರೇಯಾನ್ ಹಂಚಿಕೊಳ್ಳಿ 🌈",
      giver: { name: "Owl 🦉", has: 4, item: "🖍️" },
      receiver: { name: "Bear 🐻", needed: 2 },
      targetShare: 2,
      moralEn: "Sharing our toys makes playtime twice as fun!",
      moralKn: "ಆಟಿಕೆಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳುವುದು ಆಟವನ್ನು ಹೆಚ್ಚು ಮೋಜು ಮಾಡುತ್ತದೆ!",
    },
    {
      round: 3,
      titleEn: "Share Flowers for Forest Bouquet 🌸",
      titleKn: "ಹೂಗುಚ್ಛಕ್ಕಾಗಿ ಹೂಗಳನ್ನು ಹಂಚಿಕೊಳ್ಳಿ 🌸",
      giver: { name: "Deer 🦌", has: 4, item: "🌼" },
      receiver: { name: "Fox 🦊", needed: 2 },
      targetShare: 2,
      moralEn: "Kindness is a seed that blossoms into true friendship!",
      moralKn: "ದಯೆಯು ನಿಜವಾದ ಸ್ನೇಹವಾಗಿ ಅರಳುವ ಬೀಜವಾಗಿದೆ!",
    },
  ];

  const currentRound = roundsData[round - 1] || roundsData[0];

  const triggerHeart = (e) => {
    const id = Date.now() + Math.random();
    setHearts((prev) => [...prev, { id, left: 40 + Math.random() * 20 }]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1200);
  };

  const handleShareItem = () => {
    if (sharedCount >= currentRound.targetShare) return;
    playSound("pop");
    triggerHeart();
    const nextShared = sharedCount + 1;
    setSharedCount(nextShared);

    if (nextShared === currentRound.targetShare) {
      playSound("success");
      setTimeout(() => {
        if (round < 3) {
          setRound((r) => r + 1);
          setSharedCount(0);
        } else {
          setFinished(true);
          playSound("win");
        }
      }, 1200);
    }
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "4.5rem", marginBottom: "10px", animation: "bounceGently 1s infinite" }}>🌳✨</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#facc15", marginBottom: "8px" }}>
          {lang === "en" ? "The Sharing Tree is Blooming!" : "ಹಂಚಿಕೊಳ್ಳುವ ಮರ ಅರಳಿದೆ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(217,119,6,0.3))",
            border: "2px solid #f59e0b",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#fef08a", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "🌟 When we share and take turns, we make the world a warmer and happier place for all our friends!"
              : "🌟 ನಾವು ಹಂಚಿಕೊಂಡಾಗ ಮತ್ತು ಸರದಿ ತೆಗೆದುಕೊಂಡಾಗ, ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಜಗತ್ತು ಸಂತೋಷದ ಸ್ಥಳವಾಗುತ್ತದೆ!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Happy")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(16,185,129,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "750px", position: "relative" }}>
      {/* Floating hearts */}
      {hearts.map((h) => (
        <div
          key={h.id}
          style={{
            position: "absolute",
            bottom: "40%",
            left: `${h.left}%`,
            fontSize: "2rem",
            animation: "float 1.2s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          💖
        </div>
      ))}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ background: "#334155", padding: "6px 14px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "800" }}>
          Round {round} of 3 🌳
        </span>
        <span style={{ color: "#facc15", fontWeight: "800", fontSize: "0.95rem" }}>
          Moral: {lang === "en" ? "Sharing brings friendship!" : "ಹಂಚಿಕೆ ಸ್ನೇಹವನ್ನು ತರುತ್ತದೆ!"}
        </span>
      </div>

      <h2 style={{ fontSize: "1.9rem", fontWeight: "900", margin: "0 0 6px" }}>
        {lang === "en" ? currentRound.titleEn : currentRound.titleKn}
      </h2>
      <p style={{ color: "#94a3b8", fontSize: "1.05rem", margin: "0 0 24px" }}>
        {lang === "en"
          ? `Click ${currentRound.giver.item} to share with ${currentRound.receiver.name}! (${sharedCount} / ${currentRound.targetShare} shared)`
          : `${currentRound.giver.item} ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಹಂಚಿಕೊಳ್ಳಿ! (${sharedCount} / ${currentRound.targetShare})`}
      </p>

      {/* Sharing Arena */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          border: "2px solid #334155",
          borderRadius: "24px",
          padding: "30px 20px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
          margin: "20px 0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        {/* Giver Character */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "4.5rem", marginBottom: "4px" }}>{currentRound.giver.name.split(" ")[1]}</div>
          <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#e2e8f0" }}>{currentRound.giver.name}</div>
          <div style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
            Remaining: {currentRound.giver.has - sharedCount}
          </div>
        </div>

        {/* Share Action Arrow & Items */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ fontSize: "2rem" }}>➡️ 🤝 ➡️</div>
          <button
            onClick={handleShareItem}
            disabled={sharedCount >= currentRound.targetShare}
            style={{
              background: sharedCount >= currentRound.targetShare ? "#64748b" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white",
              border: "none",
              padding: "14px 28px",
              borderRadius: "16px",
              fontSize: "1.3rem",
              fontWeight: "900",
              cursor: sharedCount >= currentRound.targetShare ? "default" : "pointer",
              boxShadow: "0 6px 20px rgba(245,158,11,0.4)",
              transform: sharedCount >= currentRound.targetShare ? "none" : "scale(1.05)",
              transition: "all 0.15s ease",
            }}
          >
            {sharedCount >= currentRound.targetShare
              ? "✅ Perfectly Shared!"
              : `Tap to Share ${currentRound.giver.item}`}
          </button>
        </div>

        {/* Receiver Character */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "4.5rem",
              marginBottom: "4px",
              animation: sharedCount > 0 ? "bounceGently 0.8s infinite" : "none",
            }}
          >
            {sharedCount > 0 ? "🥰" : currentRound.receiver.name.split(" ")[1]}
          </div>
          <div style={{ fontWeight: "800", fontSize: "1.05rem", color: "#e2e8f0" }}>{currentRound.receiver.name}</div>
          <div style={{ color: sharedCount >= currentRound.targetShare ? "#4ade80" : "#fbbf24", fontSize: "0.85rem", marginTop: "4px" }}>
            Received: {sharedCount} / {currentRound.targetShare} {currentRound.giver.item}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MORAL GAME 2: The Helping Hands Quest (Empathy & Everyday Heroes)
// ─────────────────────────────────────────────────────────────
function GameMoralHelping({ age, lang, onComplete }) {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); // 'correct' | 'wrong'
  const [kindnessPoints, setKindnessPoints] = useState(0);
  const [finished, setFinished] = useState(false);

  const scenarios = [
    {
      titleEn: "Nina dropped her puzzle pieces! 🧩",
      titleKn: "ನೀನಾ ಪಝಲ್ ತುಂಡುಗಳನ್ನು ಕೆಳಗೆ ಹಾಕಿದಳು! 🧩",
      descEn: "Nina is on the floor looking sad because her puzzle got scattered.",
      descKn: "ನೀನಾ ನೆಲದ ಮೇಲೆ ದುಃಖದಿಂದ ಕುಳಿತಿದ್ದಾಳೆ.",
      emoji: "😢",
      resolvedEmoji: "😊",
      choices: [
        {
          textEn: "Walk away and say it's her fault",
          textKn: "ಹೋಗಿ ಅವಳದೇ ತಪ್ಪು ಎಂದು ಹೇಳಿ",
          correct: false,
          hint: "Think how you would feel if you dropped something!",
        },
        {
          textEn: "Kneel down & say 'Don't worry, let me help you pick them up!' 🤝",
          textKn: "'ಚಿಂತೆ ಬೇಡ, ನಾನು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ!' ಎಂದು ಹೇಳಿ 🤝",
          correct: true,
          outcome: "Nina smiles warmly: 'Thank you so much! You are so kind!'",
        },
      ],
      moral: "Helping someone clean up turns tears into smiles!",
    },
    {
      titleEn: "Sam is sitting alone at recess 🥺",
      titleKn: "ಸ್ಯಾಮ್ ಒಬ್ಬನೇ ಕುಳಿತಿದ್ದಾನೆ 🥺",
      descEn: "All the other kids are playing tag, and Sam is sitting alone on the bench.",
      descKn: "ಉಳಿದ ಮಕ್ಕಳು ಆಡುತ್ತಿದ್ದಾರೆ, ಸ್ಯಾಮ್ ಮಾತ್ರ ಒಬ್ಬನೇ ಕುಳಿತಿದ್ದಾನೆ.",
      emoji: "🥺",
      resolvedEmoji: "😄",
      choices: [
        {
          textEn: "Smile & say 'Hi Sam! Do you want to play catch with me?' ⚽",
          textKn: "'ಹಾಯ್ ಸ್ಯಾಮ್! ನನ್ನ ಜೊತೆ ಆಡಲು ಬರುತ್ತೀಯಾ?' ಎಂದು ಕೇಳಿ ⚽",
          correct: true,
          outcome: "Sam's face lights up: 'Yes! I would love that!'",
        },
        {
          textEn: "Ignore him and play only with other kids",
          textKn: "ಅವನನ್ನು ನಿರ್ಲಕ್ಷಿಸಿ",
          correct: false,
          hint: "Including a lonely friend makes everyone feel loved.",
        },
      ],
      moral: "Inviting someone who is alone makes you a true friend!",
    },
    {
      titleEn: "Grandma has heavy grocery bags 🛍️",
      titleKn: "ಅಜ್ಜಿಯ ಬಳಿ ಭಾರವಾದ ಚೀಲಗಳಿವೆ 🛍️",
      descEn: "Grandma is carrying bags and trying to open the entrance door.",
      descKn: "ಅಜ್ಜಿ ಚೀಲಗಳನ್ನು ಹೊತ್ತು ಬಾಗಿಲು ತೆರೆಯಲು ಪ್ರಯತ್ನಿಸುತ್ತಿದ್ದಾರೆ.",
      emoji: "👵",
      resolvedEmoji: "👵💖",
      choices: [
        {
          textEn: "Run inside first to watch cartoons",
          textKn: "ಕಾರ್ಟೂನ್ ನೋಡಲು ಒಳಗೆ ಓಡಿಹೋಗಿ",
          correct: false,
          hint: "A superhero always holds the door for elders.",
        },
        {
          textEn: "Hold the door open and carry the small bread bag 🚪🍞",
          textKn: "ಬಾಗಿಲನ್ನು ಹಿಡಿದು ಸಹಾಯ ಮಾಡಿ 🚪🍞",
          correct: true,
          outcome: "Grandma beams: 'Bless you child, what a wonderful helper!'",
        },
      ],
      moral: "Small helpful deeds show respect and deep love!",
    },
  ];

  const current = scenarios[scenarioIdx] || scenarios[0];

  const handleChoice = (isCorrect) => {
    if (isCorrect) {
      playSound("success");
      setFeedback("correct");
      setKindnessPoints((p) => p + 1);

      setTimeout(() => {
        setFeedback(null);
        if (scenarioIdx < scenarios.length - 1) {
          setScenarioIdx((s) => s + 1);
        } else {
          setFinished(true);
          playSound("win");
        }
      }, 1400);
    } else {
      playSound("error");
      setFeedback("wrong");
    }
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "4.5rem", marginBottom: "10px", animation: "bounceGently 1s infinite" }}>🦸‍♂️🏅</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#facc15", marginBottom: "8px" }}>
          {lang === "en" ? "Kindness Superhero Badge Earned!" : "ದಯಾಪರ ಹೀರೋ ಬ್ಯಾಡ್ಜ್ ಲಭಿಸಿದೆ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.3), rgba(67,56,202,0.4))",
            border: "2px solid #818cf8",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#e0e7ff", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "🌟 Small acts of kindness and helping hands have the power to turn anyone's day from sad into sunny!"
              : "🌟 ಸಣ್ಣ ಸಹಾಯ ಮತ್ತು ದಯೆಯು ಯಾವುದೇ ವ್ಯಕ್ತಿಯ ದಿನವನ್ನು ಸಂತೋಷಕರವಾಗಿ ಬದಲಾಯಿಸುವ ಶಕ್ತಿ ಹೊಂದಿದೆ!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Happy")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #4f46e5, #4338ca)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(79,70,229,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "750px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <span style={{ background: "#334155", padding: "6px 14px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "800" }}>
          Scenario {scenarioIdx + 1} of {scenarios.length} 🤝
        </span>
        <span style={{ color: "#38bdf8", fontWeight: "800", fontSize: "0.95rem" }}>
          Kindness Meter: {Math.round(((scenarioIdx + (feedback === "correct" ? 1 : 0)) / scenarios.length) * 100)}% 🌟
        </span>
      </div>

      <div
        style={{
          background: "linear-gradient(135deg, #1e293b, #0f172a)",
          border: "2px solid #334155",
          borderRadius: "24px",
          padding: "28px",
          marginBottom: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        }}
      >
        <div style={{ fontSize: "4.5rem", marginBottom: "8px" }}>
          {feedback === "correct" ? current.resolvedEmoji : current.emoji}
        </div>
        <h2 style={{ fontSize: "1.8rem", fontWeight: "900", color: "#f8fafc", margin: "0 0 8px" }}>
          {lang === "en" ? current.titleEn : current.titleKn}
        </h2>
        <p style={{ color: "#94a3b8", fontSize: "1.05rem", margin: "0 0 16px", lineHeight: "1.5" }}>
          {lang === "en" ? current.descEn : current.descKn}
        </p>

        {feedback === "correct" && (
          <div style={{ background: "rgba(16,185,129,0.2)", border: "1px solid #10b981", borderRadius: "14px", padding: "12px", color: "#34d399", fontWeight: "800", fontSize: "1.05rem", animation: "bounceGently 0.5s" }}>
            ✨ {current.choices.find((c) => c.correct)?.outcome || "Great choice!"}
          </div>
        )}

        {feedback === "wrong" && (
          <div style={{ background: "rgba(239,68,68,0.2)", border: "1px solid #ef4444", borderRadius: "14px", padding: "12px", color: "#f87171", fontWeight: "700", fontSize: "0.95rem" }}>
            💡 Hint: {current.choices.find((c) => !c.correct)?.hint || "Try thinking about the kindest choice!"}
          </div>
        )}
      </div>

      {/* Choice Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {current.choices.map((ch, i) => (
          <button
            key={i}
            onClick={() => handleChoice(ch.correct)}
            disabled={feedback === "correct"}
            style={{
              padding: "16px 24px",
              borderRadius: "18px",
              border: "1.5px solid #475569",
              background: feedback === "correct" && ch.correct ? "linear-gradient(135deg, #059669, #10b981)" : "#1e293b",
              color: "white",
              fontSize: "1.1rem",
              fontWeight: "800",
              cursor: feedback === "correct" ? "default" : "pointer",
              boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              transition: "all 0.15s ease",
            }}
          >
            <span style={{ fontSize: "1.3rem" }}>{ch.correct ? "🌟" : "👉"}</span>
            <span>{lang === "en" ? ch.textEn : ch.textKn}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RELAXATION GAME 1 (Level 1 / Age 2–5): The Gentle Butterfly Garden 🦋🌸
// ─────────────────────────────────────────────────────────────
function GameRelaxationButterfly({ age, lang, onComplete }) {
  const [bloomed, setBloomed] = useState([]);
  const [breathePhase, setBreathePhase] = useState("in");
  const [butterflyPos, setButterflyPos] = useState({ x: 50, y: 35 });
  const [sparkles, setSparkles] = useState([]);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathePhase((prev) => (prev === "in" ? "out" : "in"));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const flowers = [
    { id: 1, nameEn: "Pink Lotus", nameKn: "ಗುಲಾಬಿ ಕಮಲ", emoji: "🪷", color: "#f472b6", bg: "rgba(244, 114, 182, 0.2)", x: 18, y: 70 },
    { id: 2, nameEn: "Golden Sunflower", nameKn: "ಸೂರ್ಯಕಾಂತಿ", emoji: "🌻", color: "#facc15", bg: "rgba(250, 204, 21, 0.2)", x: 38, y: 65 },
    { id: 3, nameEn: "Lavender Orchid", nameKn: "ಲ್ಯಾವೆಂಡರ್", emoji: "🪻", color: "#c084fc", bg: "rgba(192, 132, 252, 0.2)", x: 62, y: 65 },
    { id: 4, nameEn: "Gentle Daisy", nameKn: "ಡೈಸಿ ಹೂವು", emoji: "🌼", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.2)", x: 82, y: 70 },
  ];

  const handleWaterFlower = (flower) => {
    if (bloomed.includes(flower.id)) return;
    playSound("chime");
    const next = [...bloomed, flower.id];
    setBloomed(next);
    setButterflyPos({ x: flower.x, y: flower.y - 18 });

    const newSparkle = { id: Date.now(), x: flower.x, y: flower.y };
    setSparkles((prev) => [...prev, newSparkle]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== newSparkle.id));
    }, 1500);

    if (next.length === flowers.length) {
      playSound("win");
      setTimeout(() => setFinished(true), 1200);
    }
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "5rem", marginBottom: "8px", animation: "bounceGently 1s infinite" }}>🦋🌸✨</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#f472b6", marginBottom: "8px" }}>
          {lang === "en" ? "The Garden is Peaceful & Blooming!" : "ಶಾಂತಿಯುತ ಉದ್ಯಾನ ಅರಳಿದೆ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(244,114,182,0.25), rgba(192,132,252,0.25))",
            border: "2px solid #f472b6",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(244,114,182,0.3)",
          }}
        >
          <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#fdf2f8", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "🌸 Patience is like a blooming flower. When we take slow, gentle breaths and stay gentle, peace blossoms all around us!"
              : "🌸 ತಾಳ್ಮೆಯು ಅರಳುವ ಹೂವಿನಂತೆ. ನಾವು ನಿಧಾನವಾಗಿ ದೀರ್ಘ ಉಸಿರಾಡಿದಾಗ, ಶಾಂತಿ ನಮ್ಮ ಸುತ್ತಲೂ ಅರಳುತ್ತದೆ!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Calm")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(236,72,153,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px", userSelect: "none" }}>
      {/* Visual Breathing Guide */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(139,92,246,0.15))",
          border: "1.5px solid rgba(244,114,182,0.4)",
          borderRadius: "20px",
          padding: "14px 20px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            fontSize: "2.4rem",
            transition: "transform 3.8s ease-in-out",
            transform: breathePhase === "in" ? "scale(1.35)" : "scale(0.85)",
            filter: "drop-shadow(0 0 10px rgba(244,114,182,0.8))",
          }}
        >
          🌸
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#f472b6" }}>
            {breathePhase === "in"
              ? (lang === "en" ? "Breathe In Slowly... 🌬️ (Smell the flower)" : "ನಿಧಾನವಾಗಿ ದೀರ್ಘ ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ... 🌬️")
              : (lang === "en" ? "Breathe Out Softly... 🌾 (Blow the dandelion)" : "ನಿಧಾನವಾಗಿ ಉಸಿರು ಹೊರಹಾಕಿ... 🌾")}
          </div>
          <div style={{ fontSize: "0.85rem", color: "#e2e8f0", opacity: 0.85 }}>
            {lang === "en" ? "Relax your shoulders and tap a gentle dewdrop below" : "ನಿಮ್ಮ ಭುಜಗಳನ್ನು ಸಡಿಲಗೊಳಿಸಿ ಮತ್ತು ಕೆಳಗಿನ ಹೂವನ್ನು ಮುಟ್ಟಿ"}
          </div>
        </div>
      </div>

      {/* Garden Meadow */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "320px",
          background: "linear-gradient(180deg, #1e1b4b 0%, #1e293b 55%, #064e3b 100%)",
          borderRadius: "24px",
          border: "2px solid #334155",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
          marginBottom: "16px",
        }}
      >
        {[10, 30, 50, 70, 90].map((left, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: `${15 + (idx % 3) * 20}%`,
              left: `${left}%`,
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.4)",
              boxShadow: "0 0 8px #fff",
              animation: `float ${2.5 + idx * 0.4}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* The Animated Butterfly */}
        <div
          style={{
            position: "absolute",
            left: `${butterflyPos.x}%`,
            top: `${butterflyPos.y}%`,
            transform: "translate(-50%, -50%)",
            fontSize: "3.2rem",
            transition: "left 1s cubic-bezier(0.2, 0.8, 0.2, 1), top 1s cubic-bezier(0.2, 0.8, 0.2, 1)",
            zIndex: 10,
            cursor: "pointer",
            filter: "drop-shadow(0 0 14px rgba(244,114,182,0.9))",
          }}
          onClick={() => {
            playSound("calm");
            setButterflyPos((prev) => ({
              x: Math.max(15, Math.min(85, prev.x + (Math.random() - 0.5) * 25)),
              y: Math.max(20, Math.min(60, prev.y + (Math.random() - 0.5) * 20)),
            }));
          }}
        >
          🦋
        </div>

        {/* Sparkles */}
        {sparkles.map((sp) => (
          <div
            key={sp.id}
            style={{
              position: "absolute",
              left: `${sp.x}%`,
              top: `${sp.y - 15}%`,
              transform: "translate(-50%, -50%)",
              fontSize: "1.8rem",
              animation: "bounceGently 0.8s ease-out",
              pointerEvents: "none",
            }}
          >
            ✨✨✨
          </div>
        ))}

        {/* 4 Meadow Flowers */}
        {flowers.map((f) => {
          const isBloomed = bloomed.includes(f.id);
          return (
            <div
              key={f.id}
              onClick={() => handleWaterFlower(f)}
              style={{
                position: "absolute",
                left: `${f.x}%`,
                top: `${f.y}%`,
                transform: "translate(-50%, -50%)",
                cursor: isBloomed ? "default" : "pointer",
                textAlign: "center",
                transition: "transform 0.3s",
              }}
            >
              {!isBloomed && (
                <div
                  style={{
                    fontSize: "1.6rem",
                    animation: "bounceGently 1.5s infinite",
                    marginBottom: "4px",
                    filter: "drop-shadow(0 0 8px #67e8f9)",
                  }}
                >
                  💧
                </div>
              )}

              <div
                style={{
                  fontSize: isBloomed ? "4rem" : "2.6rem",
                  transition: "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  filter: isBloomed ? `drop-shadow(0 0 16px ${f.color})` : "grayscale(0.6)",
                  opacity: isBloomed ? 1 : 0.7,
                }}
              >
                {isBloomed ? f.emoji : "🌱"}
              </div>

              <div
                style={{
                  background: isBloomed ? f.bg : "rgba(255,255,255,0.1)",
                  color: isBloomed ? f.color : "#94a3b8",
                  padding: "4px 10px",
                  borderRadius: "12px",
                  fontSize: "0.78rem",
                  fontWeight: "800",
                  marginTop: "6px",
                  border: isBloomed ? `1px solid ${f.color}` : "1px dashed #64748b",
                }}
              >
                {isBloomed ? (lang === "en" ? "Bloomed ✨" : "ಅರಳಿದೆ ✨") : (lang === "en" ? "Tap Dew 💧" : "ಮುಟ್ಟಿ 💧")}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
        {lang === "en"
          ? `Gently tap each droplet to help the garden bloom (${bloomed.length} / 4)`
          : `ಉದ್ಯಾನ ಅರಳಿಸಲು ಪ್ರತಿಯೊಂದು ಹನಿಯನ್ನು ಮುಟ್ಟಿ (${bloomed.length} / 4)`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RELAXATION GAME 2 (Level 2 / Age 5–8): Ocean of Calm & Little Turtle 🐢🌊
// ─────────────────────────────────────────────────────────────
function GameRelaxationOceanTurtle({ age, lang, onComplete }) {
  const [clearedWorries, setClearedWorries] = useState([]);
  const [affirmation, setAffirmation] = useState(null);
  const [waveBreath, setWaveBreath] = useState("in");
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setWaveBreath((w) => (w === "in" ? "out" : "in"));
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const worries = [
    {
      id: "w1",
      cloudTextEn: "Loud Noises 📢",
      cloudTextKn: "ದೊಡ್ಡ ಶಬ್ದಗಳು 📢",
      transformEmoji: "🐬",
      transformTextEn: "Gentle Dolphin",
      transformTextKn: "ಸ್ನೇಹಿ ಡಾಲ್ಫಿನ್",
      affirmationEn: "When sounds feel loud, I can cover my ears or ask for quiet.",
      affirmationKn: "ಶಬ್ದ ದೊಡ್ಡದಾದಾಗ, ನಾನು ಕಿವಿ ಮುಚ್ಚಿಕೊಳ್ಳಬಹುದು ಅಥವಾ ಶಾಂತಿಗೆ ಕೇಳಬಹುದು.",
    },
    {
      id: "w2",
      cloudTextEn: "Feeling Rushed ⏰",
      cloudTextKn: "ಆತುರ ಅನಿಸುವುದು ⏰",
      transformEmoji: "⭐",
      transformTextEn: "Golden Sea Star",
      transformTextKn: "ಬಂಗಾರದ ನಕ್ಷತ್ರಮೀನು",
      affirmationEn: "There is no rush. I can take my time, one calm step at a time.",
      affirmationKn: "ಆತುರವಿಲ್ಲ. ನಾನು ನಿಧಾನವಾಗಿ, ಒಂದೊಂದಾಗಿ ಮಾಡಬಹುದು.",
    },
    {
      id: "w3",
      cloudTextEn: "Frustration 😤",
      cloudTextKn: "ಕೋಪ ಮತ್ತು ಹತಾಶೆ 😤",
      transformEmoji: "🪸",
      transformTextEn: "Peaceful Coral",
      transformTextKn: "ಶಾಂತ ಹವಳ",
      affirmationEn: "Frustration is like a big wave. Slow breaths help it gently wash away.",
      affirmationKn: "ಕೋಪವು ಅಲೆಯಂತೆ. ನಿಧಾನ ಉಸಿರಾಟ ಅದನ್ನು ಶಾಂತಗೊಳಿಸುತ್ತದೆ.",
    },
    {
      id: "w4",
      cloudTextEn: "Feeling Worried 😟",
      cloudTextKn: "ಆತಂಕ ಮತ್ತು ಭಯ 😟",
      transformEmoji: "🐠",
      transformTextEn: "Glowing Clownfish",
      transformTextKn: "ಕಾಂತಿಯುತ ಮೀನು",
      affirmationEn: "I am safe and supported. Calmness is always inside me.",
      affirmationKn: "ನಾನು ಸುರಕ್ಷಿತವಾಗಿದ್ದೇನೆ. ಶಾಂತಿ ಸದಾ ನನ್ನ ಒಳಗಿದೆ.",
    },
  ];

  const handleClearWorry = (item) => {
    if (clearedWorries.includes(item.id)) return;
    playSound("chime");
    const next = [...clearedWorries, item.id];
    setClearedWorries(next);
    setAffirmation(lang === "en" ? item.affirmationEn : item.affirmationKn);

    if (next.length === worries.length) {
      playSound("win");
      setTimeout(() => setFinished(true), 1500);
    }
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "5rem", marginBottom: "8px", animation: "bounceGently 1s infinite" }}>🐢💙🌊</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#38bdf8", marginBottom: "8px" }}>
          {lang === "en" ? "Little Turtle Reached Mama Turtle!" : "ಪುಟ್ಟ ಆಮೆ ಅಮ್ಮನ ಬಳಿ ತಲುಪಿದೆ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(56,189,248,0.25), rgba(14,165,233,0.3))",
            border: "2px solid #38bdf8",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(56,189,248,0.3)",
          }}
        >
          <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#e0f2fe", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "🌊 Even the biggest waves will pass. When we take calm breaths and stay patient, we can swim peacefully through any storm!"
              : "🌊 ದೊಡ್ಡ ಅಲೆಗಳೂ ಕಳೆದುಹೋಗುತ್ತವೆ. ನಾವು ಶಾಂತವಾಗಿ ಉಸಿರಾಡಿದಾಗ, ಎಲ್ಲವನ್ನೂ ಶಾಂತಿಯಿಂದ ಎದುರಿಸಬಹುದು!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Calm")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #0284c7, #0d9488)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(2,132,199,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  const progressPercent = Math.round((clearedWorries.length / worries.length) * 100);

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px", userSelect: "none" }}>
      {/* Wave Tide Breathing Bar */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(2,132,199,0.25), rgba(13,148,136,0.2))",
          border: "1.5px solid #0284c7",
          borderRadius: "20px",
          padding: "14px 20px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ fontSize: "1.8rem" }}>🌊</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: "900", color: "#38bdf8", fontSize: "0.95rem" }}>
              {waveBreath === "in"
                ? (lang === "en" ? "Ocean Inhale 🌊 (Wave Rises)" : "ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ 🌊 (ಅಲೆ ಏರುತ್ತದೆ)")
                : (lang === "en" ? "Ocean Exhale 🌊 (Wave Recedes)" : "ಉಸಿರು ಹೊರಹಾಕಿ 🌊 (ಅಲೆ ಇಳಿಯುತ್ತದೆ)")}
            </div>
            <div style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              {lang === "en" ? "Breathe rhythmically with the sea tide" : "ಸಮುದ್ರದ ಅಲೆಯೊಂದಿಗೆ ಶಾಂತವಾಗಿ ಉಸಿರಾಡಿ"}
            </div>
          </div>
        </div>
        <div style={{ background: "#0f172a", padding: "6px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "800", color: "#38bdf8" }}>
          Turtle Journey: {progressPercent}% 🐢
        </div>
      </div>

      {/* Underwater Serene Reef */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "280px",
          background: "radial-gradient(circle at 50% 30%, #0369a1 0%, #0c4a6e 60%, #082f49 100%)",
          borderRadius: "24px",
          border: "2px solid #0284c7",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          marginBottom: "16px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ position: "relative", height: "40px", borderBottom: "2px dashed rgba(255,255,255,0.2)" }}>
          <div
            style={{
              position: "absolute",
              left: `${10 + progressPercent * 0.75}%`,
              top: "-8px",
              fontSize: "2.4rem",
              transition: "left 1s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: "drop-shadow(0 0 10px rgba(56,189,248,0.8))",
            }}
          >
            🐢
          </div>
          <div
            style={{
              position: "absolute",
              right: "4%",
              top: "-12px",
              fontSize: "2.6rem",
              filter: "drop-shadow(0 0 12px rgba(52,211,153,0.8))",
            }}
          >
            🐢💖
          </div>
        </div>

        {/* 4 Worry Bubbles Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
            zIndex: 5,
          }}
        >
          {worries.map((w) => {
            const isCleared = clearedWorries.includes(w.id);
            return (
              <div
                key={w.id}
                onClick={() => handleClearWorry(w)}
                style={{
                  background: isCleared
                    ? "linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,95,70,0.4))"
                    : "linear-gradient(135deg, rgba(30,41,59,0.85), rgba(15,23,42,0.9))",
                  border: isCleared ? "1.5px solid #34d399" : "1.5px solid rgba(255,255,255,0.15)",
                  borderRadius: "16px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: isCleared ? "default" : "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: isCleared ? "0 4px 16px rgba(16,185,129,0.3)" : "none",
                }}
              >
                <div style={{ fontSize: "2rem", transition: "transform 0.3s" }}>
                  {isCleared ? w.transformEmoji : "💭"}
                </div>
                <div style={{ textAlign: "left", flex: 1 }}>
                  <div style={{ fontWeight: "800", fontSize: "0.95rem", color: isCleared ? "#34d399" : "#e2e8f0" }}>
                    {isCleared
                      ? (lang === "en" ? w.transformTextEn : w.transformTextKn)
                      : (lang === "en" ? w.cloudTextEn : w.cloudTextKn)}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: isCleared ? "#a7f3d0" : "#94a3b8" }}>
                    {isCleared
                      ? (lang === "en" ? "Transformed to Peace ✨" : "ಶಾಂತಿಯಾಯಿತು ✨")
                      : (lang === "en" ? "Tap to Calm Down 🌊" : "ಶಾಂತಗೊಳಿಸಲು ಮುಟ್ಟಿ 🌊")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {affirmation && (
        <div
          style={{
            background: "rgba(16,185,129,0.2)",
            border: "1px solid #10b981",
            borderRadius: "14px",
            padding: "10px 16px",
            color: "#6ee7b7",
            fontWeight: "700",
            fontSize: "0.95rem",
            animation: "bounceGently 0.5s ease",
            marginBottom: "10px",
          }}
        >
          💬 "{affirmation}"
        </div>
      )}

      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        {lang === "en"
          ? "Tap any stormy feeling bubble to dissolve it into friendly sea creatures"
          : "ಅಲೆಯ ಗುಳ್ಳೆಯನ್ನು ಮುಟ್ಟಿ ಸಮುದ್ರ ಜೀವಿಗಳನ್ನಾಗಿ ಪರಿವರ್ತಿಸಿ"}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RELAXATION GAME 3 (Level 3 / Age 9–12): Sky of Gratitude & Mindful Stargazer 🌌✨
// ─────────────────────────────────────────────────────────────
function GameRelaxationStargazer({ age, lang, onComplete }) {
  const [constellationIdx, setConstellationIdx] = useState(0);
  const [connectedStars, setConnectedStars] = useState([]);
  const [boxBreath, setBoxBreath] = useState(1);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setBoxBreath((b) => (b % 4) + 1);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const constellations = [
    {
      id: "c1",
      titleEn: "Constellation of Gratitude 💖",
      titleKn: "ಕೃತಜ್ಞತೆಯ ನಕ್ಷತ್ರಪುಂಜ 💖",
      shape: "Heart",
      stars: [
        { id: 1, x: 30, y: 35, label: "1" },
        { id: 2, x: 50, y: 25, label: "2" },
        { id: 3, x: 70, y: 35, label: "3" },
        { id: 4, x: 50, y: 70, label: "4" },
      ],
      meaningEn: "I am deeply grateful for the family, friends, and helpers who love and care for me.",
      meaningKn: "ನನ್ನನ್ನು ಪ್ರೀತಿಸುವ ಕುಟುಂಬ ಮತ್ತು ಸ್ನೇಹಿತರಿಗೆ ನಾನು ಸದಾ ಕೃತಜ್ಞನಾಗಿದ್ದೇನೆ.",
    },
    {
      id: "c2",
      titleEn: "Constellation of Inner Strength 🛡️",
      titleKn: "ಆಂತರಿಕ ಶಕ್ತಿಯ ನಕ್ಷತ್ರಪುಂಜ 🛡️",
      shape: "Shield",
      stars: [
        { id: 1, x: 35, y: 30, label: "1" },
        { id: 2, x: 65, y: 30, label: "2" },
        { id: 3, x: 65, y: 65, label: "3" },
        { id: 4, x: 35, y: 65, label: "4" },
      ],
      meaningEn: "I am patient with myself. I have the quiet inner courage to handle challenges.",
      meaningKn: "ನನಗೆ ನನ್ನ ಮೇಲೆ ನಂಬಿಕೆಯಿದೆ. ಸವಾಲುಗಳನ್ನು ಎದುರಿಸುವ ಧೈರ್ಯ ನನ್ನಲ್ಲಿದೆ.",
    },
    {
      id: "c3",
      titleEn: "Constellation of Peaceful Wings 🕊️",
      titleKn: "ಶಾಂತಿಯುತ ರೆಕ್ಕೆಗಳ ನಕ್ಷತ್ರಪುಂಜ 🕊️",
      shape: "Dove",
      stars: [
        { id: 1, x: 25, y: 45, label: "1" },
        { id: 2, x: 50, y: 30, label: "2" },
        { id: 3, x: 75, y: 45, label: "3" },
        { id: 4, x: 50, y: 65, label: "4" },
      ],
      meaningEn: "Tonight my thoughts are quiet and rested. Tomorrow is full of light and possibility.",
      meaningKn: "ಈ ರಾತ್ರಿ ನನ್ನ ಮನಸ್ಸು ಶಾಂತವಾಗಿದೆ. ನಾಳೆಯ ದಿನ ಅದ್ಭುತವಾಗಿರಲಿದೆ.",
    },
  ];

  const current = constellations[constellationIdx] || constellations[0];

  const handleStarClick = (starId) => {
    if (connectedStars.includes(starId)) return;
    const expected = connectedStars.length + 1;
    if (starId !== expected) return;

    playSound("chime");
    const next = [...connectedStars, starId];
    setConnectedStars(next);

    if (next.length === current.stars.length) {
      playSound("success");
      setTimeout(() => {
        if (constellationIdx < constellations.length - 1) {
          setConstellationIdx((c) => c + 1);
          setConnectedStars([]);
        } else {
          setFinished(true);
          playSound("win");
        }
      }, 1500);
    }
  };

  const breathLabels = {
    1: { en: "Inhale (4s) 🌌", kn: "ಉಸಿರೆಳೆದುಕೊಳ್ಳಿ (4s) 🌌" },
    2: { en: "Hold Calmly (4s) 🌙", kn: "ಹಿಡಿದುಕೊಳ್ಳಿ (4s) 🌙" },
    3: { en: "Exhale Slowly (4s) 🕊️", kn: "ಹೊರಹಾಕಿ (4s) 🕊️" },
    4: { en: "Rest in Peace (4s) ✨", kn: "ಶಾಂತವಾಗಿರಿ (4s) ✨" },
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "5rem", marginBottom: "8px", animation: "bounceGently 1s infinite" }}>🌌✨🕊️</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#facc15", marginBottom: "8px" }}>
          {lang === "en" ? "The Constellations of Peace are Lit!" : "ಶಾಂತಿಯ ನಕ್ಷತ್ರಪುಂಜಗಳು ಬೆಳಗಿವೆ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(79,70,229,0.25), rgba(124,58,237,0.3))",
            border: "2px solid #a855f7",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(168,85,247,0.3)",
          }}
        >
          <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#f3e8ff", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "✨ Even in the darkest night, finding things to be grateful for lights up our entire universe with hope and peace!"
              : "✨ ಕತ್ತಲೆಯಲ್ಲೂ ನಾವು ಕೃತಜ್ಞರಾಗಿರುವ ವಿಷಯಗಳು ನಮ್ಮ ಜಗತ್ತನ್ನು ಶಾಂತಿ ಮತ್ತು ಭರವಸೆಯಿಂದ ಬೆಳಗಿಸುತ್ತವೆ!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Calm")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(124,58,237,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px", userSelect: "none" }}>
      {/* Box Breathing Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #1e1b4b, #312e81)",
          border: "1.5px solid #6366f1",
          borderRadius: "20px",
          padding: "14px 20px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: "900", color: "#c7d2fe", fontSize: "0.95rem" }}>
            {lang === "en" ? current.titleEn : current.titleKn}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#a5b4fc" }}>
            Constellation {constellationIdx + 1} of {constellations.length}
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            padding: "8px 16px",
            borderRadius: "14px",
            fontWeight: "900",
            fontSize: "0.9rem",
            color: "#facc15",
            border: "1px solid rgba(250,204,21,0.4)",
          }}
        >
          🧘 {lang === "en" ? breathLabels[boxBreath].en : breathLabels[boxBreath].kn}
        </div>
      </div>

      {/* Cosmic Sky Board */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "300px",
          background: "radial-gradient(ellipse at 50% 20%, #1e1b4b 0%, #0f172a 70%, #020617 100%)",
          borderRadius: "24px",
          border: "2px solid #4338ca",
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
          marginBottom: "16px",
        }}
      >
        {[15, 28, 42, 60, 75, 88].map((left, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              top: `${20 + (idx % 4) * 20}%`,
              left: `${left}%`,
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: "#fff",
              opacity: 0.5,
              animation: "sparkleGlow 2s infinite ease-in-out",
            }}
          />
        ))}

        {/* Constellation Stars */}
        {current.stars.map((st) => {
          const isConnected = connectedStars.includes(st.id);
          const isNext = st.id === connectedStars.length + 1;
          return (
            <div
              key={st.id}
              onClick={() => handleStarClick(st.id)}
              style={{
                position: "absolute",
                left: `${st.x}%`,
                top: `${st.y}%`,
                transform: "translate(-50%, -50%)",
                width: isConnected ? "48px" : "42px",
                height: isConnected ? "48px" : "42px",
                borderRadius: "50%",
                background: isConnected
                  ? "radial-gradient(circle, #facc15 0%, #eab308 100%)"
                  : isNext
                  ? "radial-gradient(circle, #818cf8 0%, #4f46e5 100%)"
                  : "rgba(255,255,255,0.15)",
                border: isConnected ? "2px solid #fff" : isNext ? "2px solid #a5b4fc" : "1px solid #475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: isNext ? "pointer" : "default",
                boxShadow: isConnected
                  ? "0 0 20px #facc15"
                  : isNext
                  ? "0 0 16px rgba(129,140,248,0.8)"
                  : "none",
                animation: isNext ? "bounceGently 1.2s infinite" : "none",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                zIndex: 10,
              }}
            >
              <span style={{ fontSize: "1.1rem", fontWeight: "900", color: isConnected ? "#1e1b4b" : "#fff" }}>
                {isConnected ? "★" : st.label}
              </span>
            </div>
          );
        })}
      </div>

      <div
        style={{
          background: "rgba(79,70,229,0.2)",
          border: "1px solid #6366f1",
          borderRadius: "14px",
          padding: "10px 16px",
          color: "#e0e7ff",
          fontSize: "0.92rem",
          fontWeight: "600",
          marginBottom: "10px",
        }}
      >
        ✨ {lang === "en" ? current.meaningEn : current.meaningKn}
      </div>

      <div style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
        {lang === "en"
          ? `Tap star #${connectedStars.length + 1} to connect the constellation lines (${connectedStars.length} / ${current.stars.length})`
          : `ನಕ್ಷತ್ರ #${connectedStars.length + 1} ಮುಟ್ಟಿ ನಕ್ಷತ್ರಪುಂಜವನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ (${connectedStars.length} / ${current.stars.length})`}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// RELAXATION GAME 4 (Adaptive All Levels / All Ages): The Zen Stone Garden 🪨🎋
// ─────────────────────────────────────────────────────────────
function GameRelaxationZenStones({ age, lang, onComplete }) {
  const [stacked, setStacked] = useState([]);
  const [sandRipples, setSandRipples] = useState([]);
  const [finished, setFinished] = useState(false);

  const stones = [
    { id: 1, nameEn: "Smooth River Slate", nameKn: "ನದಿಯ ಕಪ್ಪು ಶಿಲೆ", color: "#475569", width: 180, height: 42, emoji: "🪨" },
    { id: 2, nameEn: "Serene Jade Stone", nameKn: "ಶಾಂತ ಜೇಡ್ ಹರಳು", color: "#059669", width: 145, height: 38, emoji: "🟢" },
    { id: 3, nameEn: "Rose Quartz Pebble", nameKn: "ಗುಲಾಬಿ ಕ್ವಾರ್ಟ್ಸ್", color: "#db2777", width: 110, height: 34, emoji: "🌸" },
    { id: 4, nameEn: "Golden Amber Cap", nameKn: "ಚಿನ್ನದ ಅಂಬರ್ ಕಲ್ಲು", color: "#d97706", width: 75, height: 30, emoji: "🟡" },
  ];

  const handleStackStone = (stone) => {
    if (stacked.includes(stone.id)) return;
    const nextExpected = stacked.length + 1;
    if (stone.id !== nextExpected) return;

    playSound("chime");
    const next = [...stacked, stone.id];
    setStacked(next);

    if (next.length === stones.length) {
      playSound("win");
      setTimeout(() => setFinished(true), 1400);
    }
  };

  const handleSandClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    playSound("click");
    const newRip = { id: Date.now(), x, y };
    setSandRipples((prev) => [...prev.slice(-3), newRip]);
  };

  if (finished) {
    return (
      <div style={{ textAlign: "center", color: "white", maxWidth: "600px", padding: "20px" }}>
        <Confetti />
        <div style={{ fontSize: "5rem", marginBottom: "8px", animation: "bounceGently 1s infinite" }}>🪨🎋✨</div>
        <h2 style={{ fontSize: "2.2rem", fontWeight: "900", color: "#34d399", marginBottom: "8px" }}>
          {lang === "en" ? "Perfect Balance & Inner Peace!" : "ಪರಿಪೂರ್ಣ ಸಮತೋಲನ ಮತ್ತು ಆಂತರಿಕ ಶಾಂತಿ!"}
        </h2>
        <div
          style={{
            background: "linear-gradient(135deg, rgba(5,150,105,0.25), rgba(16,185,129,0.3))",
            border: "2px solid #10b981",
            borderRadius: "20px",
            padding: "20px",
            margin: "20px 0",
            boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
          }}
        >
          <div style={{ fontSize: "1.3rem", marginBottom: "6px" }}>📜 <strong>Moral of the Story:</strong></div>
          <p style={{ fontSize: "1.15rem", lineHeight: "1.6", color: "#d1fae5", margin: 0, fontWeight: "700" }}>
            {lang === "en"
              ? "🎋 Balance comes from a quiet heart. When we move gently and with care, everything in our life finds its peaceful place!"
              : "🎋 ಸಮತೋಲನವು ಶಾಂತ ಹೃದಯದಿಂದ ಬರುತ್ತದೆ. ನಾವು ನಿಧಾನವಾಗಿ ಮತ್ತು ಎಚ್ಚರಿಕೆಯಿಂದ ಸಾಗಿದಾಗ ಎಲ್ಲವೂ ಸರಿಹೋಗುತ್ತದೆ!"}
          </p>
        </div>
        <button
          onClick={() => onComplete(3, "Calm")}
          style={{
            padding: "14px 36px",
            fontSize: "1.1rem",
            fontWeight: "900",
            borderRadius: "16px",
            border: "none",
            background: "linear-gradient(135deg, #059669, #0d9488)",
            color: "white",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(5,150,105,0.4)",
          }}
        >
          ⭐ {lang === "en" ? "Finish & Collect 3 Stars!" : "ಮುಗಿಸಿ 3 ನಕ್ಷತ್ರ ಪಡೆಯಿರಿ!"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", color: "white", width: "100%", maxWidth: "800px", userSelect: "none" }}>
      {/* Zen Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b, #0f766e)",
          border: "1.5px solid #10b981",
          borderRadius: "20px",
          padding: "12px 20px",
          marginBottom: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: "900", color: "#a7f3d0", fontSize: "0.95rem" }}>
            {lang === "en" ? "The Zen Stone Garden 🎋" : "ಝೆನ್ ಕಲ್ಲಿನ ಉದ್ಯಾನ 🎋"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#d1fae5" }}>
            {lang === "en" ? "Stack stones gently in sequence to create a balance cairn" : "ಸಮತೋಲನ ಸೃಷ್ಟಿಸಲು ಕಲ್ಲುಗಳನ್ನು ಜೋಡಿಸಿ"}
          </div>
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", padding: "6px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "800", color: "#34d399" }}>
          Balanced: {stacked.length} / {stones.length} 🪨
        </div>
      </div>

      {/* Main Altar Area */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {/* Cairn Stacking Altar */}
        <div
          style={{
            flex: "1 1 340px",
            height: "260px",
            background: "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "20px",
            border: "2px solid #334155",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            alignItems: "center",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4)",
            position: "relative",
          }}
        >
          {/* Base Pedestal */}
          <div
            style={{
              width: "220px",
              height: "18px",
              background: "#334155",
              borderRadius: "10px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
            }}
          />

          {/* Stacked Stones */}
          <div
            style={{
              position: "absolute",
              bottom: "38px",
              display: "flex",
              flexDirection: "column-reverse",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {stones.map((st) => {
              if (!stacked.includes(st.id)) return null;
              return (
                <div
                  key={st.id}
                  style={{
                    width: `${st.width}px`,
                    height: `${st.height}px`,
                    background: `linear-gradient(135deg, ${st.color}, #1e293b)`,
                    borderRadius: "50px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                    animation: "bounceGently 0.5s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "800",
                    fontSize: "0.8rem",
                  }}
                >
                  {st.emoji}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sand Ripple Garden */}
        <div
          onClick={handleSandClick}
          style={{
            flex: "1 1 300px",
            height: "260px",
            background: "radial-gradient(circle, #fde68a 0%, #d97706 80%, #92400e 100%)",
            borderRadius: "20px",
            border: "2px solid #f59e0b",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "14px",
              background: "rgba(0,0,0,0.3)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "8px",
              fontSize: "0.75rem",
              fontWeight: "700",
            }}
          >
            🎋 {lang === "en" ? "Click to rake sand ripples" : "ಮರಳಿನಲ್ಲಿ ಅಲೆಗಳನ್ನು ಸೃಷ್ಟಿಸಿ"}
          </div>

          {sandRipples.map((rip) => (
            <div
              key={rip.id}
              style={{
                position: "absolute",
                left: `${rip.x}px`,
                top: `${rip.y}px`,
                transform: "translate(-50%, -50%)",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.7)",
                animation: "sparkleGlow 1s ease-out",
                pointerEvents: "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* Available Stones Picker */}
      <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
        {stones.map((st) => {
          const isStacked = stacked.includes(st.id);
          const isNext = st.id === stacked.length + 1;
          return (
            <button
              key={st.id}
              onClick={() => handleStackStone(st)}
              disabled={isStacked || !isNext}
              style={{
                background: isStacked ? "#334155" : isNext ? "linear-gradient(135deg, #059669, #10b981)" : "#1e293b",
                color: isStacked ? "#94a3b8" : "white",
                border: isNext ? "2px solid #34d399" : "1px solid #475569",
                borderRadius: "14px",
                padding: "10px 16px",
                cursor: isNext ? "pointer" : "not-allowed",
                fontWeight: "800",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: isNext ? "0 4px 15px rgba(16,185,129,0.35)" : "none",
                transform: isNext ? "scale(1.03)" : "scale(1)",
                transition: "all 0.2s",
              }}
            >
              <span>{st.emoji}</span>
              <span>{lang === "en" ? st.nameEn : st.nameKn}</span>
              {isStacked && <span>✅</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Launcher Core Component
   ───────────────────────────────────────────────────────────── */
export default function Games({ user }) {
  const storedChild = (() => {
    try {
      const stored = localStorage.getItem("currentChild");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  })();

  const childLevel = Number(storedChild?.level) || 1;
  const childAge = Number(storedChild?.age) || 6;

  const [selectedAgeGroup, setSelectedAgeGroup] = useState(() => getAgeGroup(childAge));
  const effectiveAge = selectedAgeGroup === "2-5" ? 3 : selectedAgeGroup === "5-8" ? 6 : 10;

  const [activeLevel, setActiveLevel] = useState(`Level ${childLevel}`);
  const [activeGameId, setActiveGameId] = useState(null);
  const [gameState, setGameState] = useState("playing");
  const [gameResult, setGameResult] = useState({ score: 3, emotion: "Happy", duration: 0 });
  const [gameLanguage, setGameLanguage] = useState("en");
  const [showCert, setShowCert] = useState(false);
  const [showGameRating, setShowGameRating] = useState(false);
  const [voiceMutedState, setVoiceMutedState] = useState(getVoiceMuted());

  useEffect(() => {
    if (activeGameId) {
      document.body.style.overflow = "hidden";
      startTimeRef.current = Date.now();

      // 1. Audio automatically plays instructions on start
      const targetGame = GAMES_LIST.find(g => g.id === activeGameId);
      if (targetGame) {
        const title = gameLanguage === "en" ? targetGame.title : targetGame.titleKn;
        const welcome = gameLanguage === "en"
          ? `Welcome to ${title}! Let's play together!`
          : `${title} ಗೆ ಸ್ವಾಗತ! ಒಟ್ಟಿಗೆ ಆಡೋಣ!`;
        speakInstruction(welcome, gameLanguage);
      }
    } else {
      document.body.style.overflow = "auto";
    }
  }, [activeGameId, gameLanguage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveGameId(null);
        setGameState("playing");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleGameComplete = async (score, emotion) => {
    const durationSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    const durationMin = Number((durationSec / 60).toFixed(2));
    setGameResult({ score, emotion, duration: durationMin });
    setGameState("summary");

    // 5. Game ends — audio summarizes and praises!
    const currentGame = GAMES_LIST.find(g => g.id === activeGameId);
    speakGameSummary(score, currentGame ? `You earned ${score} stars in ${currentGame.title}!` : "", gameLanguage);

    try {
      await logSession({
        childId: storedChild?._id || user?.childId || user?._id || "anonymous_child",
        activityId: activeGameId,
        score,
        emotion,
        duration: durationMin,
        completedAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not log session", e);
    }
  };

  const GAMES_LIST = [
    // 🧘 Special Relaxation & Moral Story Games (Age & Level Adapted)
    {
      id: "r1",
      level: 1,
      targetAgeGroup: "2-5",
      title: "The Gentle Butterfly Garden",
      titleKn: "ಕೋಮಲ ಚಿಟ್ಟೆ ಉದ್ಯಾನ",
      category: "Relaxation & Moral",
      icon: "🦋",
      component: GameRelaxationButterfly,
      difficulty: 1,
      moral: "Patience is like a blooming flower. When we take slow deep breaths and stay gentle, peace blossoms all around us! 🌸",
      moralKn: "ತಾಳ್ಮೆಯು ಅರಳುವ ಹೂವಿನಂತೆ. ನಾವು ನಿಧಾನವಾಗಿ ದೀರ್ಘ ಉಸಿರಾಡಿದಾಗ, ಶಾಂತಿ ನಮ್ಮ ಸುತ್ತಲೂ ಅರಳುತ್ತದೆ! 🌸",
      isRelaxationGame: true,
      isMoralGame: true,
      ageLabel: "👶 Ages 2–5 (Toddler)",
    },
    {
      id: "r2",
      level: 2,
      targetAgeGroup: "5-8",
      title: "The Ocean of Calm & Little Turtle",
      titleKn: "ಶಾಂತ ಸಮುದ್ರ ಮತ್ತು ಪುಟ್ಟ ಆಮೆ",
      category: "Relaxation & Moral",
      icon: "🐢",
      component: GameRelaxationOceanTurtle,
      difficulty: 2,
      moral: "Even the biggest waves will pass. When we take calm breaths and stay patient, we can swim peacefully through any storm! 🌊",
      moralKn: "ದೊಡ್ಡ ಅಲೆಗಳೂ ಕಳೆದುಹೋಗುತ್ತವೆ. ನಾವು ಶಾಂತವಾಗಿ ಉಸಿರಾಡಿದಾಗ, ಎಲ್ಲವನ್ನೂ ಶಾಂತಿಯಿಂದ ಎದುರಿಸಬಹುದು! 🌊",
      isRelaxationGame: true,
      isMoralGame: true,
      ageLabel: "🎒 Ages 5–8 (School)",
    },
    {
      id: "r3",
      level: 3,
      targetAgeGroup: "9-12",
      title: "Sky of Gratitude & Mindful Stargazer",
      titleKn: "ಕೃತಜ್ಞತೆಯ ಆಕಾಶ ಮತ್ತು ನಕ್ಷತ್ರ ವೀಕ್ಷಕ",
      category: "Relaxation & Moral",
      icon: "🌌",
      component: GameRelaxationStargazer,
      difficulty: 3,
      moral: "Even in the darkest night, finding things to be grateful for lights up our entire universe with hope and peace! ✨",
      moralKn: "ಕತ್ತಲೆಯಲ್ಲೂ ನಾವು ಕೃತಜ್ಞರಾಗಿರುವ ವಿಷಯಗಳು ನಮ್ಮ ಜಗತ್ತನ್ನು ಶಾಂತಿ ಮತ್ತು ಭರವಸೆಯಿಂದ ಬೆಳಗಿಸುತ್ತವೆ! ✨",
      isRelaxationGame: true,
      isMoralGame: true,
      ageLabel: "🚀 Ages 9–12 (Pre-teen)",
    },
    {
      id: "r4",
      level: 1,
      targetAgeGroup: "All",
      title: "The Zen Stone Garden",
      titleKn: "ಝೆನ್ ಕಲ್ಲಿನ ಉದ್ಯಾನ",
      category: "Relaxation & Moral",
      icon: "🪨",
      component: GameRelaxationZenStones,
      difficulty: 1,
      moral: "Balance comes from a quiet heart. When we move gently and with care, everything finds its peaceful place! 🎋",
      moralKn: "ಸಮತೋಲನವು ಶಾಂತ ಹೃದಯದಿಂದ ಬರುತ್ತದೆ. ನಾವು ನಿಧಾನವಾಗಿ ಮತ್ತು ಎಚ್ಚರಿಕೆಯಿಂದ ಸಾಗಿದಾಗ ಎಲ್ಲವೂ ಸರಿಹೋಗುತ್ತದೆ! 🎋",
      isRelaxationGame: true,
      isMoralGame: true,
      ageLabel: "🌱 All Ages & Levels",
    },

    // 🌟 Special Moral & Values Story Games (Age & Level Adapted)
    {
      id: "m1",
      level: 1,
      title: "The Sharing Tree",
      titleKn: "ಹಂಚಿಕೊಳ್ಳುವ ಮರ",
      category: "Moral & Values",
      icon: "🌳",
      component: GameMoralSharing,
      difficulty: 1,
      moral: "When we share and take turns, we make the world a warmer and happier place for all our friends! 🍎",
      moralKn: "ನಾವು ಹಂಚಿಕೊಂಡಾಗ ಮತ್ತು ಸರದಿ ತೆಗೆದುಕೊಂಡಾಗ, ಪ್ರತಿಯೊಬ್ಬರಿಗೂ ಜಗತ್ತು ಸಂತೋಷದ ಸ್ಥಳವಾಗುತ್ತದೆ! 🍎",
      isMoralGame: true,
      ageLabel: "👶 Ages 2–5 (Toddler)",
    },
    {
      id: "m2",
      level: 2,
      title: "The Helping Hands Quest",
      titleKn: "ಸಹಾಯ ಮಾಡುವ ಕೈಗಳು",
      category: "Moral & Values",
      icon: "🤝",
      component: GameMoralHelping,
      difficulty: 2,
      moral: "Small acts of kindness and helping hands have the power to turn anyone's day from sad into sunny! 🦸‍♂️",
      moralKn: "ಸಣ್ಣ ಸಹಾಯ ಮತ್ತು ದಯೆಯು ಯಾವುದೇ ವ್ಯಕ್ತಿಯ ದಿನವನ್ನು ಸಂತೋಷಕರವಾಗಿ ಬದಲಾಯಿಸುವ ಶಕ್ತಿ ಹೊಂದಿದೆ! 🦸‍♂️",
      isMoralGame: true,
      ageLabel: "🎒 Ages 5–8 (School)",
    },

    // Level 1
    { id: "a1", level: 1, title: "Mirror Play", titleKn: "ಕನ್ನಡಿ ಆಟ", category: "Social", icon: "🪞", component: GameA1, difficulty: 1 },
    { id: "a2", level: 1, title: "Sorting Shapes", titleKn: "ಆಕಾರ ವಿಂಗಡಣೆ", category: "Cognitive", icon: "📐", component: GameA2, difficulty: 2 },
    { id: "a3", level: 1, title: "Name That Sound", titleKn: "ಶಬ್ದ ಗುರುತಿಸಿ", category: "Sensory", icon: "🔊", component: GameA3, difficulty: 2 },
    { id: "a4", level: 1, title: "Bubble Popping", titleKn: "ಗುಳ್ಳೆ ಒಡೆಯುವುದು", category: "Motor", icon: "🫧", component: GameA4, difficulty: 1 },
    { id: "a5", level: 1, title: "Playdough Sculpting", titleKn: "ಮಣ್ಣಿನ ಶಿಲ್ಪ", category: "Sensory", icon: "🎨", component: GameA5, difficulty: 1 },
    { id: "a6", level: 1, title: "Story Builder", titleKn: "ಕಥೆ ನಿರ್ಮಾಣ", category: "Cognitive", icon: "📚", component: GameA6, difficulty: 3 },
    { id: "a7", level: 1, title: "Describe and Find", titleKn: "ವಿವರಿಸಿ ಮತ್ತು ಹುಡುಕಿ", category: "Cognitive", icon: "🔍", component: GameA7, difficulty: 2 },
    { id: "a8", level: 1, title: "Word Builder", titleKn: "ಪದ ನಿರ್ಮಾಣ", category: "Cognitive", icon: "🔠", component: GameA8, difficulty: 3 },
    { id: "a9", level: 1, title: "Question Ball", titleKn: "ಪ್ರಶ್ನೆ ಚೆಂಡು", category: "Communication", icon: "⚽", component: GameA9, difficulty: 2 },
    { id: "a10", level: 1, title: "Emotion Charades", titleKn: "ಭಾವನೆ ಅಭಿನಯ", category: "Emotional", icon: "🎭", component: GameA10, difficulty: 2 },
    { id: "a11", level: 1, title: "Compliment Builder", titleKn: "ಹೊಗಳಿಕೆ ನಿರ್ಮಾಣ", category: "Social", icon: "💬", component: GameA11, difficulty: 1 },

    // Level 2
    { id: "b1", level: 2, title: "Emotion Flashcards", titleKn: "ಭಾವನೆ ಫ್ಲಾಶ್ಕಾರ್ಡ್", category: "Emotional", icon: "🃏", component: GameB1, difficulty: 1 },
    { id: "b2", level: 2, title: "Story Sequencing", titleKn: "ಕಥೆ ಅನುಕ್ರಮ", category: "Cognitive", icon: "🔄", component: GameB2, difficulty: 2 },
    { id: "b3", level: 2, title: "Turn Taking Board Game", titleKn: "ಸರದಿ ಆಟ", category: "Social", icon: "🎲", component: GameB3, difficulty: 2 },
    { id: "b4", level: 2, title: "Balloon Tapping", titleKn: "ಬಲೂನ್ ತಟ್ಟುವುದು", category: "Motor", icon: "🎈", component: GameB4, difficulty: 1 },
    { id: "b5", level: 2, title: "Cooking Together", titleKn: "ಅಡುಗೆ ಆಟ", category: "Life Skills", icon: "🥪", component: GameB5, difficulty: 2 },
    { id: "b6", level: 2, title: "Memory Match Cards", titleKn: "ಜ್ಞಾಪಕ ಹೊಂದಾಣಿಕೆ", category: "Cognitive", icon: "🧠", component: GameB6, difficulty: 3 },
    { id: "b7", level: 2, title: "Pattern Completion", titleKn: "ಮಾದರಿ ಪೂರ್ಣಗೊಳಿಸಿ", category: "Cognitive", icon: "🔴", component: GameB7, difficulty: 2 },
    { id: "b8", level: 2, title: "Category Sort", titleKn: "ವರ್ಗ ವಿಂಗಡಣೆ", category: "Cognitive", icon: "📦", component: GameB8, difficulty: 2 },
    { id: "b9", level: 2, title: "Simon Says", titleKn: "ಸೈಮನ್ ಹೇಳುತ್ತಾರೆ", category: "Motor", icon: "🚨", component: GameB9, difficulty: 3 },
    { id: "b10", level: 2, title: "Picture Exchange Click", titleKn: "ಚಿತ್ರ ವಿನಿಮಯ ಕ್ಲಿಕ್", category: "Communication", icon: "🖼️", component: GameB10, difficulty: 1 },
    { id: "b11", level: 2, title: "Yes No Button Game", titleKn: "ಹೌದು ಇಲ್ಲ ಆಟ", category: "Cognitive", icon: "🔘", component: GameB11, difficulty: 2 },
    { id: "b12", level: 2, title: "Name That Object", titleKn: "ವಸ್ತು ಗುರುತಿಸಿ", category: "Cognitive", icon: "🧸", component: GameB12, difficulty: 1 },
    { id: "b13", level: 2, title: "Request the Item", titleKn: "ವಸ್ತು ಕೇಳಿ", category: "Communication", icon: "🙋‍♀️", component: GameB13, difficulty: 2 },

    // Level 3
    { id: "c1", level: 3, title: "Role Play Scenarios", titleKn: "ಪಾತ್ರಾಭಿನಯ", category: "Social", icon: "🗣️", component: GameC1, difficulty: 2 },
    { id: "c2", level: 3, title: "Obstacle Course", titleKn: "ಅಡೆತಡೆ ಓಟ", category: "Motor", icon: "🏃‍♂️", component: GameC2, difficulty: 3 },
    { id: "c3", level: 3, title: "Peer Play Date", titleKn: "ಗೆಳೆಯರ ಆಟ", category: "Social", icon: "🧑‍🤝‍🧑", component: GameC3, difficulty: 2 },
    { id: "c4", level: 3, title: "Feelings Journal", titleKn: "ಭಾವನೆ ಡೈರಿ", category: "Emotional", icon: "📓", component: GameC4, difficulty: 1 },
    { id: "c5", level: 3, title: "Helper Interview", titleKn: "ಸಹಾಯಕ ಸಂದರ್ಶನ", category: "Communication", icon: "🩺", component: GameC5, difficulty: 2 },
    { id: "c6", level: 3, title: "Mirror Expression", titleKn: "ಕನ್ನಡಿ ಅಭಿವ್ಯಕ್ತಿ", category: "Emotional", icon: "📸", component: GameC6, difficulty: 2 },
    { id: "c7", level: 3, title: "Turn Taking Ball", titleKn: "ಸರದಿ ಚೆಂಡು", category: "Social", icon: "🏀", component: GameC7, difficulty: 2 },
    { id: "c8", level: 3, title: "Emotion Matching", titleKn: "ಭಾವನೆ ಹೊಂದಾಣಿಕೆ", category: "Emotional", icon: "😀", component: GameC8, difficulty: 2 },
    { id: "c9", level: 3, title: "Hello Goodbye Practice", titleKn: "ಹಲೋ ಬೈ ಅಭ್ಯಾಸ", category: "Social", icon: "👋", component: GameC9, difficulty: 1 },
    { id: "c10", level: 3, title: "Car Down Ramp", titleKn: "ರ್ಯಾಂಪ್ ಕಾರು", category: "Sensory", icon: "🚗", component: GameC10, difficulty: 2 },
    { id: "c11", level: 3, title: "Calm Music Player", titleKn: "ಶಾಂತ ಸಂಗೀತ", category: "Sensory", icon: "🎵", component: GameC11, difficulty: 1 },
    { id: "c12", level: 3, title: "Sensory Bubble Screen", titleKn: "ಸಂವೇದನಾ ಗುಳ್ಳೆ ಪರದೆ", category: "Sensory", icon: "🫧", component: GameC12, difficulty: 1 }
  ];

  const filteredGames = GAMES_LIST.filter(g => {
    if (activeLevel === "Relaxation") return g.isRelaxationGame;
    if (activeLevel === "Moral") return g.isMoralGame;
    if (activeLevel === "All") return true;
    return `Level ${g.level}` === activeLevel;
  });

  const activeGame = GAMES_LIST.find(g => g.id === activeGameId);

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", padding: "20px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes bounceGently {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(105vh) rotate(360deg); opacity: 0; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header section */}
      <div style={{ textAlign: "center", marginBottom: "30px" }}>
        <h1 style={{ fontWeight: "800", fontSize: "2.4rem", color: "#0f172a", marginBottom: "8px" }}>
          🧩 Autism Assistant Games
        </h1>
        <p style={{ color: "#475569", fontSize: "1.05rem", margin: "0 0 20px 0" }}>
          Interactive, responsive and structured therapies for child development
        </p>

        {/* Age Group Selector */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontWeight: "800", color: "#64748b", alignSelf: "center", fontSize: "0.9rem" }}>👶 Age Group:</span>
          {[
            { key: "2-5", label: "2–5 yrs (Toddler)" },
            { key: "5-8", label: "5–8 yrs (School)" },
            { key: "9-12", label: "9–12 yrs (Pre-teen)" }
          ].map(grp => {
            const isSel = selectedAgeGroup === grp.key;
            return (
              <button
                key={grp.key}
                onClick={() => { playSound("click"); setSelectedAgeGroup(grp.key); }}
                style={{
                  background: isSel ? "#4F6EF7" : "white",
                  color: isSel ? "white" : "#475569",
                  border: isSel ? "none" : "1px solid #e2e8f0",
                  padding: "8px 18px",
                  borderRadius: "18px",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  cursor: "pointer",
                  boxShadow: isSel ? "0 4px 12px rgba(79,110,247,0.3)" : "none",
                  transition: "all 0.2s"
                }}
              >
                {grp.label}
              </button>
            );
          })}
        </div>

        {/* Filter bar */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          {["All", "Relaxation", "Moral", "Level 1", "Level 2", "Level 3"].map(level => {
            const isActive = activeLevel === level;
            let tabLabel = "⭐ Show All";
            if (level === "Relaxation") {
              tabLabel = "🧘 Relaxation & Calm (4 Games)";
            } else if (level === "Moral") {
              tabLabel = "🌟 Moral & Values Stories";
            } else if (level.startsWith("Level ")) {
              const lvlNum = parseInt(level.replace("Level ", ""), 10);
              const tierCfg = getAgeLevelConfig(effectiveAge, lvlNum);
              tabLabel = `${tierCfg.emoji} ${tierCfg.label} (Level ${lvlNum})`;
            }
            return (
              <button
                key={level}
                onClick={() => { playSound("click"); setActiveLevel(level); }}
                style={{
                  background: isActive
                    ? (level === "Relaxation"
                        ? "linear-gradient(135deg, #059669, #0d9488)"
                        : level === "Moral"
                        ? "linear-gradient(135deg, #f59e0b, #ec4899)"
                        : "#4F6EF7")
                    : "white",
                  color: isActive
                    ? "white"
                    : (level === "Relaxation"
                        ? "#059669"
                        : level === "Moral"
                        ? "#d97706"
                        : "#475569"),
                  border: isActive
                    ? "none"
                    : (level === "Relaxation"
                        ? "1.5px solid #10b981"
                        : level === "Moral"
                        ? "1.5px solid #f59e0b"
                        : "1px solid #e2e8f0"),
                  padding: "10px 20px",
                  borderRadius: "20px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  boxShadow: isActive ? "0 4px 12px rgba(0,0,0,0.15)" : "0 2px 5px rgba(0,0,0,0.05)",
                  transition: "all 0.2s"
                }}
              >
                {tabLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid listing */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "20px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {filteredGames.map(game => {
          const tierCfg = getAgeLevelConfig(effectiveAge, game.level);
          return (
          <div
            key={game.id}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
              border: game.isRelaxationGame
                ? "2px solid #34d399"
                : game.isMoralGame
                ? "2px solid #fbbf24"
                : "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              transition: "transform 0.2s, box-shadow 0.2s",
              position: "relative"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.03)";
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{
                    background: game.isRelaxationGame
                      ? "linear-gradient(135deg, #059669, #0ea5e9)"
                      : game.isMoralGame
                      ? "linear-gradient(135deg, #f59e0b, #ec4899)"
                      : tierCfg.bgColor,
                    color: (game.isRelaxationGame || game.isMoralGame) ? "white" : tierCfg.textColor,
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    boxShadow: game.isRelaxationGame
                      ? "0 2px 8px rgba(5,150,105,0.3)"
                      : game.isMoralGame
                      ? "0 2px 8px rgba(245,158,11,0.3)"
                      : "none"
                  }}>
                    {game.isRelaxationGame
                      ? "🧘 Relaxation & Moral"
                      : game.isMoralGame
                      ? "🌟 Moral Story"
                      : `${tierCfg.emoji} ${tierCfg.label} (L${game.level})`}
                  </span>
                  {game.ageLabel && (
                    <span style={{
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1px solid #cbd5e1",
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontSize: "0.72rem",
                      fontWeight: "700"
                    }}>
                      {game.ageLabel}
                    </span>
                  )}
                </div>
                <span style={{ color: game.isRelaxationGame ? "#059669" : game.isMoralGame ? "#d97706" : "#94a3b8", fontSize: "0.8rem", fontWeight: "bold", textTransform: "uppercase" }}>
                  {game.category}
                </span>
              </div>

              <div style={{ fontSize: "2.8rem", margin: "10px 0", animation: "bounceGently 2s infinite ease-in-out", width: "max-content" }}>
                {game.icon}
              </div>

              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", color: "#0f172a", margin: "4px 0" }}>{game.title}</h3>
              <h4 style={{ fontSize: "0.95rem", fontWeight: "600", color: "#4F6EF7", margin: "0 0 12px 0" }}>{game.titleKn}</h4>

              <div style={{ display: "flex", gap: "2px", marginBottom: "16px" }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i} style={{ color: i < game.difficulty ? "#f59e0b" : "#cbd5e1" }}>⭐</span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { playSound("click"); setActiveGameId(game.id); setGameState("playing"); }}
              className="btn btn-primary"
              style={{
                width: "100%",
                background: "#4F6EF7",
                border: "none",
                color: "white",
                padding: "12px",
                borderRadius: "10px",
                fontWeight: "bold",
                cursor: "pointer",
                textAlign: "center"
              }}
            >
              Play Game
            </button>
          </div>
        );})}
      </div>

      {/* FULLSCREEN GAME MODAL OVERLAY */}
      {activeGameId && activeGame && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "#0f172a",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          color: "white",
          padding: "20px"
        }}>
          {/* Header Bar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingBottom: "15px",
            borderBottom: "1px solid #1e293b",
            marginBottom: "20px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "1.8rem" }}>{activeGame.icon}</span>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800" }}>
                  {gameLanguage === "en" ? activeGame.title : activeGame.titleKn}
                </h3>
                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  Level {activeGame.level} &bull; {getAgeLevelConfig(effectiveAge, activeGame.level).emoji} {getAgeLevelConfig(effectiveAge, activeGame.level).label} &bull; Target Age Config: {effectiveAge} yrs ({getAgeDifficulty(effectiveAge).label})
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* Voice Guide Mute / Unmute Toggle */}
              <button
                onClick={() => {
                  const nextMuted = !voiceMutedState;
                  setVoiceMutedState(nextMuted);
                  setVoiceMuted(nextMuted);
                }}
                style={{
                  background: voiceMutedState ? "#334155" : "linear-gradient(135deg, #10b981, #059669)",
                  border: "1px solid #475569",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                {voiceMutedState ? "🔇 Voice: OFF" : "🔊 Voice: ON"}
              </button>

              {/* Language toggle */}
              <button
                onClick={() => { playSound("click"); setGameLanguage(prev => prev === "en" ? "kn" : "en"); }}
                style={{
                  background: "#1e293b",
                  border: "1px solid #475569",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: "bold"
                }}
              >
                🌐 {gameLanguage === "en" ? "ಕನ್ನಡ" : "English"}
              </button>

              {/* Close Button */}
              <button
                onClick={() => { playSound("click"); setActiveGameId(null); setGameState("playing"); }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "1.8rem",
                  cursor: "pointer",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>
          </div>

          {/* Game Window Panel */}
          <div style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            {gameState === "playing" ? (
              /* GIANT WRAPPER PANEL FOR LARGER PLAY SCREEN */
              <div style={{
                width: "100%",
                maxWidth: "1000px",
                height: "calc(100vh - 180px)",
                background: "#1e293b",
                borderRadius: "24px",
                border: "2px solid #334155",
                padding: "30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                overflow: "auto",
                position: "relative",
                animation: "scaleUp 0.35s ease-out"
              }}>
                {React.createElement(activeGame.component, {
                  age: effectiveAge,
                  lang: gameLanguage,
                  onComplete: handleGameComplete
                })}
              </div>
            ) : (
              /* SCORE SUMMARY CONTAINER */
              <div style={{
                textAlign: "center",
                background: "#1e293b",
                borderRadius: "20px",
                padding: "32px",
                width: "90%",
                maxWidth: "420px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "1px solid #334155",
                animation: "pulseSlow 2s infinite"
              }}>
                <Confetti />
                <h2 style={{ fontSize: "2rem", fontWeight: "800", color: "#10b981", marginBottom: "10px" }}>
                  🎉 Awesome Work!
                </h2>
                <p style={{ color: "#94a3b8", fontSize: "0.95rem", margin: "0 0 16px 0" }}>
                  Session successfully logged to your dashboard database.
                </p>

                {/* Golden Moral Scroll Takeaway */}
                {activeGame?.moral && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(234,179,8,0.08))",
                    border: "1.5px solid #f59e0b",
                    borderRadius: "14px",
                    padding: "14px",
                    margin: "0 0 18px 0",
                    textAlign: "center",
                    boxShadow: "0 4px 15px rgba(245,158,11,0.2)"
                  }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: "900", color: "#fbbf24", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
                      ✨ Moral Takeaway ✨
                    </div>
                    <div style={{ fontSize: "0.92rem", color: "#fef3c7", fontStyle: "italic", lineHeight: "1.4" }}>
                      "{activeGame.moral}"
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "center", gap: "5px", fontSize: "2.2rem", margin: "16px 0" }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} style={{ color: i < gameResult.score ? "#f59e0b" : "#475569" }}>⭐</span>
                  ))}
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", marginBottom: "25px" }}>
                  <span style={{ background: "#334155", padding: "6px 12px", borderRadius: "12px", fontSize: "0.85rem" }}>
                    ⏱️ {gameResult.duration} min
                  </span>
                  <span style={{ background: "#334155", padding: "6px 12px", borderRadius: "12px", fontSize: "0.85rem" }}>
                    {EMOTION_EMOJIS[gameResult.emotion]} {gameResult.emotion}
                  </span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    onClick={() => { playSound("click"); setShowGameRating(true); }}
                    style={{
                      width: "100%", padding: "12px", fontSize: "1rem", fontWeight: "900",
                      background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: "10px",
                      cursor: "pointer", color: "white", boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                    }}
                  >
                    🏆 View / Print Certificate
                  </button>

                  <button
                    onClick={() => { playSound("click"); setGameState("playing"); startTimeRef.current = Date.now(); }}
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "12px", fontSize: "1rem", fontWeight: "bold", background: "#4F6EF7", border: "none", borderRadius: "10px", cursor: "pointer", color: "white" }}
                  >
                    🔄 Play Again
                  </button>

                  <button
                    onClick={() => { playSound("click"); setActiveGameId(null); setGameState("playing"); }}
                    style={{
                      width: "100%", padding: "12px", fontSize: "1rem", fontWeight: "bold",
                      background: "transparent", border: "1px solid #475569", borderRadius: "10px",
                      cursor: "pointer", color: "white"
                    }}
                  >
                    🎒 Back to Launcher
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showGameRating && activeGame && (
        <ActivityRatingModal
          childId={storedChild?._id || user?.childId || user?._id || "anonymous_child"}
          childName={storedChild?.name || user?.name || "Super Star"}
          childAge={storedChild?.age || 4}
          childLevel={storedChild?.level || 1}
          activityId={activeGameId}
          activityTitle={activeGame.title}
          detectedEmotion={gameResult?.emotion || currentEmotion || "Happy"}
          emotionConfidence={88}
          initialScore={gameResult?.score >= 3 ? 90 : gameResult?.score >= 2 ? 65 : 40}
          onComplete={(ratingData) => {
            setShowGameRating(false);
            if (ratingData && ratingData.launchHappyActivity) {
              if (onNavigate) {
                onNavigate("/activities", { state: { happyActivity: ratingData.launchHappyActivity } });
              } else {
                window.location.href = "/activities";
              }
              return;
            }
            setShowCert(true);
          }}
          onCancel={() => { setShowGameRating(false); setShowCert(true); }}
        />
      )}

      {showCert && activeGame && (
        <CertificateModal
          childName={storedChild?.name || user?.name || "Super Star"}
          childPhoto={storedChild?.profilePhoto || user?.profilePhoto}
          activityTitle={activeGame.title}
          xpEarned={100}
          stars={gameResult.score}
          onClose={() => setShowCert(false)}
        />
      )}
    </div>
  );
}
