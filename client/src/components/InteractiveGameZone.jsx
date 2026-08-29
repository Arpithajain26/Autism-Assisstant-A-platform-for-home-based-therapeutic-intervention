import React, { useState, useEffect, useRef } from "react";
import FlashcardGame from "./FlashcardGame";

// Web Audio API Synthesizer for self-contained sound effects
const playSynthSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === "pop") {
      // Short high-pitched pluck
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === "correct") {
      // Double chime
      const notes = [523.25, 659.25]; // C5, E5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.1 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.22);
      });
    } else if (type === "wrong") {
      // Low buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else if (type === "synth_bell") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } else if (type === "synth_ring") {
      // Pulsing telephone ring
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      // FM modulation
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.value = 20;
      modGain.gain.value = 30;
      mod.connect(modGain);
      modGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      mod.start();
      osc.start();
      mod.stop(ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === "synth_car") {
      // Deep engine rumble
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.6);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.75);
    }
  } catch (e) {
    console.warn("AudioContext block", e);
  }
};

/* ─── MINI GAME COMPONENTS ───────────────────────────────────────────────── */

// 1. MIRROR PLAY (webcam face matching simulator)
function MirrorPlayGame({ language, currentEmotion, confidence, onComplete }) {
  const targetEmotions = ["Happy", "Sad", "Angry", "Surprised"];
  const emotionEmojis = { Happy: "😊", Sad: "😢", Angry: "😠", Surprised: "😮" };
  const emotionKn = { Happy: "ಸಂತೋಷ", Sad: "ದುಃಖ", Angry: "ಕೋಪ", Surprised: "ಆಶ್ಚರ್ಯ" };
  
  const [targetIdx, setTargetIdx] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const currentTarget = targetEmotions[targetIdx];

  useEffect(() => {
    if (currentEmotion === currentTarget && confidence > 40) {
      playSynthSound("correct");
      setSuccessCount(c => {
        const next = c + 1;
        if (next >= 3) {
          onComplete && onComplete(5);
        } else {
          setTargetIdx(t => (t + 1) % targetEmotions.length);
        }
        return next;
      });
    }
  }, [currentEmotion, confidence]);

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#6366f1", marginBottom: "12px" }}>
        🎭 Mimic the Emoji Face!
      </div>
      <div style={{ fontSize: "5rem", animation: "float 2s infinite" }}>
        {emotionEmojis[currentTarget]}
      </div>
      <h3 style={{ fontSize: "1.8rem", fontWeight: "900", margin: "10px 0" }}>
        Show a <span style={{ color: "#ec4899" }}>{currentTarget}</span> Face!
      </h3>
      {language === "kn" && (
        <div style={{ fontSize: "1.1rem", color: "#4b5563", fontWeight: "800" }}>
          {emotionKn[currentTarget]} ಮುಖ ತೋರಿಸಿ!
        </div>
      )}
      <div style={{ marginTop: "16px", display: "flex", justifyContent: "center", gap: "8px" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ fontSize: "1.8rem", opacity: i < successCount ? 1 : 0.25 }}>⭐</span>
        ))}
      </div>
      <p style={{ fontSize: "0.8rem", color: "#6b7280", marginTop: "12px" }}>
        Look at the camera detector below and match the feeling!
      </p>
    </div>
  );
}

// 2. SORTING SHAPES
function SortingShapesGame({ language, onComplete }) {
  const itemsToSort = [
    { id: 1, type: "circle", display: "🔴", color: "#ef4444", name: "Red Circle", nameKn: "ಕೆಂಪು ವೃತ್ತ" },
    { id: 2, type: "square", display: "🟦", color: "#3b82f6", name: "Blue Square", nameKn: "ನೀಲಿ ಚೌಕ" },
    { id: 3, type: "triangle", display: "🔺", color: "#f59e0b", name: "Yellow Triangle", nameKn: "ಹಳದಿ ತ್ರಿಕೋನ" },
    { id: 4, type: "circle", display: "🟢", color: "#22c55e", name: "Green Circle", nameKn: "ಹಸಿರು ವೃತ್ತ" },
    { id: 5, type: "square", display: "⬛", color: "#1f2937", name: "Black Square", nameKn: "ಕಪ್ಪು ಚೌಕ" },
    { id: 6, type: "triangle", display: "🔶", color: "#f97316", name: "Orange Triangle", nameKn: "ಕಿತ್ತಳೆ ತ್ರಿಕೋನ" }
  ];

  const [index, setIndex] = useState(0);
  const [success, setSuccess] = useState(0);
  const currentItem = itemsToSort[index];

  const handleBucketSelect = (bucketType) => {
    if (bucketType === currentItem.type) {
      playSynthSound("correct");
      setSuccess(s => s + 1);
    } else {
      playSynthSound("wrong");
    }

    if (index + 1 >= itemsToSort.length) {
      onComplete && onComplete(Math.max(1, Math.round(((success + (bucketType === currentItem.type ? 1 : 0)) / itemsToSort.length) * 5)));
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#a855f7", marginBottom: "14px" }}>
        🔷 Shape Sorting Quest!
      </div>
      
      {/* Target Item */}
      <div style={{
        background: "linear-gradient(135deg,#f3e8ff,#faf5ff)",
        padding: "24px",
        borderRadius: "24px",
        display: "inline-block",
        marginBottom: "24px",
        border: "3px solid #e9d5ff",
        animation: "pulse 1.5s infinite"
      }}>
        <div style={{ fontSize: "4.5rem", lineHeight: 1 }}>{currentItem.display}</div>
        <div style={{ fontWeight: "900", color: "#6b21a8", marginTop: "8px", fontSize: "1.1rem" }}>
          {language === "kn" ? currentItem.nameKn : currentItem.name}
        </div>
      </div>

      {/* Target Buckets */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", maxWidth: "380px", margin: "0 auto" }}>
        {[
          { type: "circle", label: "Circles ⭕", labelKn: "ವೃತ್ತಗಳು", bg: "#fee2e2", border: "#fca5a5" },
          { type: "square", label: "Squares ⬛", labelKn: "ಚೌಕಗಳು", bg: "#dbeafe", border: "#93c5fd" },
          { type: "triangle", label: "Triangles 🔺", labelKn: "ತ್ರಿಕೋನಗಳು", bg: "#fef3c7", border: "#fde68a" }
        ].map(b => (
          <button
            key={b.type}
            onClick={() => handleBucketSelect(b.type)}
            style={{
              background: b.bg,
              border: `3px solid ${b.border}`,
              borderRadius: "18px",
              padding: "16px 8px",
              cursor: "pointer",
              fontWeight: "900",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span style={{ fontSize: "1.6rem" }}>📥</span>
            <span>{language === "kn" ? b.labelKn : b.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// 3. NAME THAT SOUND
function NameThatSoundGame({ language, onComplete }) {
  const soundTracks = [
    { id: 1, type: "bell", display: "🔔", soundType: "synth_bell", options: ["Bell", "Dog", "Car"], optionsKn: ["ಗಂಟೆ", "ನಾಯಿ", "ಕಾರು"], correctIdx: 0 },
    { id: 2, type: "phone", display: "☎️", soundType: "synth_ring", options: ["Rain", "Bell", "Phone"], optionsKn: ["ಮಳೆ", "ಗಂಟೆ", "ದೂರವಾಣಿ"], correctIdx: 2 },
    { id: 3, type: "car", display: "🚗", soundType: "synth_car", options: ["Cat", "Car", "Rain"], optionsKn: ["ಬೆಕ್ಕು", "ಕಾರು", "ಮಳೆ"], correctIdx: 1 }
  ];

  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const current = soundTracks[index];

  const playTrackSound = () => {
    setIsPlaying(true);
    playSynthSound(current.soundType);
    setTimeout(() => setIsPlaying(false), 1000);
  };

  const handleSelect = (idx) => {
    const isCorrect = idx === current.correctIdx;
    if (isCorrect) {
      playSynthSound("correct");
      setScore(s => s + 1);
    } else {
      playSynthSound("wrong");
    }

    if (index + 1 >= soundTracks.length) {
      onComplete && onComplete(Math.round(((score + (isCorrect ? 1 : 0)) / soundTracks.length) * 5));
    } else {
      setIndex(i => i + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#f59e0b", marginBottom: "16px" }}>
        🎵 Auditory Explorer Game!
      </div>

      {/* Large Speaker / Play Button */}
      <button
        onClick={playTrackSound}
        style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: isPlaying ? "linear-gradient(135deg,#f59e0b,#d97706)" : "linear-gradient(135deg,#fef3c7,#fde68a)",
          border: "4px solid #f59e0b",
          fontSize: "3.5rem",
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: isPlaying ? "0 0 20px rgba(245,158,11,0.5)" : "0 8px 24px rgba(0,0,0,0.1)",
          transform: isPlaying ? "scale(1.08)" : "scale(1)",
          transition: "all 0.2s"
        }}
      >
        📢
      </button>

      <div style={{ fontWeight: "900", color: "#374151", marginBottom: "20px" }}>
        {language === "kn" ? "ಧ್ವನಿಯನ್ನು ಆಲಿಸಿ ಮತ್ತು ಊಹಿಸಿ!" : "Tap the button, listen, and guess the sound!"}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "300px", margin: "0 auto" }}>
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(i)}
            style={{
              background: "#fff",
              border: "2px solid #e5e7eb",
              borderRadius: "16px",
              padding: "14px",
              fontWeight: "900",
              fontSize: "1rem",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "transform 0.1s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            {language === "kn" ? current.optionsKn[i] : opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// 4. BUBBLE POPPING
function BubblePoppingGame({ onComplete }) {
  const [bubbles, setBubbles] = useState([]);
  const [popped, setPopped] = useState(0);
  const containerRef = useRef(null);

  useEffect(() => {
    // Generate bubbles over time
    const interval = setInterval(() => {
      if (bubbles.length >= 8) return;
      const size = 60 + Math.random() * 40;
      const left = Math.random() * 80;
      const newBubble = {
        id: Math.random().toString(),
        size,
        left,
        top: 250,
        speed: 1.5 + Math.random() * 2,
        color: `hsl(${Math.random() * 360}, 85%, 80%)`
      };
      setBubbles(prev => [...prev, newBubble]);
    }, 800);

    return () => clearInterval(interval);
  }, [bubbles]);

  // Frame tick animation
  useEffect(() => {
    const handle = requestAnimationFrame(function animate() {
      setBubbles(prev => 
        prev
          .map(b => ({ ...b, top: b.top - b.speed }))
          .filter(b => b.top > -b.size) // keep bubbles on screen
      );
      requestAnimationFrame(animate);
    });
    return () => cancelAnimationFrame(handle);
  }, []);

  const handlePop = (id) => {
    playSynthSound("pop");
    setBubbles(prev => prev.filter(b => b.id !== id));
    setPopped(p => {
      const next = p + 1;
      if (next >= 12) {
        onComplete && onComplete(5);
      }
      return next;
    });
  };

  return (
    <div style={{ textAlign: "center", padding: "16px", userSelect: "none" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#3b82f6", marginBottom: "8px" }}>
        🫧 Pop 12 Bubbles! ({popped}/12 popped)
      </div>

      <div
        ref={containerRef}
        style={{
          height: "260px",
          background: "linear-gradient(180deg,#e0f2fe,#bae6fd)",
          border: "3px solid #7dd3fc",
          borderRadius: "24px",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {bubbles.map(b => (
          <div
            key={b.id}
            onClick={() => handlePop(b.id)}
            style={{
              position: "absolute",
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              top: `${b.top}px`,
              backgroundColor: b.color,
              borderRadius: "50%",
              border: "3px solid rgba(255,255,255,0.7)",
              boxShadow: "inset -5px -5px 15px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.1)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              transition: "transform 0.1s"
            }}
          >
            ⭐
          </div>
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "10px" }}>
        ✨ Click or tap the rising bubbles to pop them!
      </p>
    </div>
  );
}

// 5. PLAYDOUGH SCULPTING ( virtual clay board )
function PlaydoughSculptingGame({ language, onComplete }) {
  const stamps = ["🦁", "🦊", "🌸", "⭐", "🦖", "🍎", "🍩"];
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#f783ac"];
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [selectedStamp, setSelectedStamp] = useState(stamps[0]);
  const [placedItems, setPlacedItems] = useState([]);

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 20;
    const y = e.clientY - rect.top - 20;
    playSynthSound("pop");
    setPlacedItems(prev => [...prev, { x, y, symbol: selectedStamp, color: selectedColor }]);
  };

  const handleDone = () => {
    onComplete && onComplete(5);
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ec4899", marginBottom: "12px" }}>
        🎨 Virtual Playdough sculpting board
      </div>

      {/* Selectors */}
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "10px" }}>
        {colors.map(c => (
          <button
            key={c}
            onClick={() => setSelectedColor(c)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: c,
              border: selectedColor === c ? "3px solid #111" : "2px solid #fff",
              cursor: "pointer"
            }}
          />
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "14px" }}>
        {stamps.map(s => (
          <button
            key={s}
            onClick={() => setSelectedStamp(s)}
            style={{
              fontSize: "1.4rem",
              background: selectedStamp === s ? "#f3e8ff" : "#fff",
              border: selectedStamp === s ? "2px solid #a855f7" : "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "4px 8px",
              cursor: "pointer"
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sculpting Canvas */}
      <div
        onClick={handleCanvasClick}
        style={{
          height: "220px",
          background: "#fdf2f8",
          border: "4px dashed #fbcfe8",
          borderRadius: "20px",
          position: "relative",
          cursor: "crosshair",
          overflow: "hidden"
        }}
      >
        {placedItems.length === 0 && (
          <div style={{ color: "#db2777", opacity: 0.5, paddingTop: "90px", fontWeight: "800", pointerEvents: "none" }}>
            {language === "kn" ? "ಕ್ಲೇ ಸ್ಟ್ಯಾಂಪ್ ಮಾಡಲು ಟ್ಯಾಪ್ ಮಾಡಿ!" : "Tap inside to stamp playdough shapes!"}
          </div>
        )}
        {placedItems.map((item, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: `${item.x}px`,
              top: `${item.y}px`,
              fontSize: "2rem",
              background: `${item.color}cc`,
              borderRadius: "50%",
              width: "44px",
              height: "44px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              animation: "bounceIn 0.3s ease"
            }}
          >
            {item.symbol}
          </div>
        ))}
      </div>

      <button
        onClick={handleDone}
        disabled={placedItems.length < 3}
        className="bounce-btn"
        style={{
          marginTop: "14px",
          background: placedItems.length >= 3 ? "linear-gradient(135deg, #10b981, #059669)" : "#d1d5db",
          color: "#fff",
          border: "none",
          padding: "10px 24px",
          borderRadius: "16px",
          fontWeight: "900",
          cursor: placedItems.length >= 3 ? "pointer" : "default"
        }}
      >
        ✨ {language === "kn" ? "ಶಿಲ್ಪ ಪೂರ್ಣಗೊಂಡಿದೆ" : "Done Sculpting! 🏆"}
      </button>
    </div>
  );
}

// 7. STORY SEQUENCING
function StorySequencingGame({ language, onComplete }) {
  const steps = [
    { id: 1, label: "Wake up ⏰", labelKn: "ಎದ್ದೇಳು", order: 1 },
    { id: 2, label: "Brush teeth 🪥", labelKn: "ಹಲ್ಲುಜ್ಜು", order: 2 },
    { id: 3, label: "Go to school 🏫", labelKn: "ಶಾಲೆಗೆ ಹೋಗು", order: 3 }
  ];

  const [selection, setSelection] = useState([]);
  const [shuffledSteps] = useState(() => [...steps].sort(() => Math.random() - 0.5));

  const handleSelect = (step) => {
    if (selection.includes(step.id)) return;
    const nextSelection = [...selection, step.id];
    setSelection(nextSelection);
    playSynthSound("pop");

    if (nextSelection.length === steps.length) {
      // Check if order is 1, 2, 3
      const isCorrectOrder = nextSelection.every((id, idx) => {
        const item = steps.find(s => s.id === id);
        return item.order === idx + 1;
      });

      if (isCorrectOrder) {
        playSynthSound("correct");
        setTimeout(() => onComplete && onComplete(5), 1000);
      } else {
        playSynthSound("wrong");
        setTimeout(() => setSelection([]), 1200); // reset on wrong sequence
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#6366f1", marginBottom: "14px" }}>
        🕒 Order the Story sequence!
      </div>
      
      {/* Target Timeline */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        {[1, 2, 3].map(pos => {
          const selectedId = selection[pos - 1];
          const matchedItem = steps.find(s => s.id === selectedId);
          return (
            <div
              key={pos}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "16px",
                border: "3px dashed #cbd5e1",
                background: matchedItem ? "linear-gradient(135deg,#e0e7ff,#c7d2fe)" : "#f8fafc",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
                fontWeight: "900",
                color: "#4f46e5"
              }}
            >
              {matchedItem ? (
                <>
                  <span style={{ fontSize: "2rem" }}>📦</span>
                  <span>{language === "kn" ? matchedItem.labelKn : matchedItem.label}</span>
                </>
              ) : (
                <span>Step {pos}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ fontWeight: "700", marginBottom: "14px", color: "#6b7280" }}>
        {language === "kn" ? "ಕ್ರಮವಾಗಿ ಕಾರ್ಡ್ ಕ್ಲಿಕ್ ಮಾಡಿ!" : "Tap card in correct timeline order!"}
      </div>

      {/* Options */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        {shuffledSteps.map(s => {
          const isChosen = selection.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() => handleSelect(s)}
              disabled={isChosen}
              style={{
                padding: "12px",
                borderRadius: "16px",
                border: "2px solid #e2e8f0",
                background: isChosen ? "#f1f5f9" : "#fff",
                cursor: isChosen ? "default" : "pointer",
                fontWeight: "900",
                opacity: isChosen ? 0.4 : 1
              }}
            >
              <div>🎬</div>
              <div style={{ fontSize: "0.85rem" }}>{language === "kn" ? s.labelKn : s.label}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 8. TURN TAKING BOARD GAME (play against friendly panda)
function BoardGameGame({ language, onComplete }) {
  const [playerPos, setPlayerPos] = useState(0);
  const [pandaPos, setPandaPos] = useState(0);
  const [turn, setTurn] = useState("player"); // player / panda
  const [diceVal, setDiceVal] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const totalTiles = 8;

  const rollDice = () => {
    if (turn !== "player" || isRolling) return;
    setIsRolling(true);
    playSynthSound("pop");

    setTimeout(() => {
      const rolled = Math.floor(Math.random() * 2) + 1; // 1 or 2 steps
      setDiceVal(rolled);
      setPlayerPos(p => {
        const next = Math.min(totalTiles - 1, p + rolled);
        if (next >= totalTiles - 1) {
          playSynthSound("correct");
          setTimeout(() => onComplete && onComplete(5), 1200);
        } else {
          setTurn("panda");
        }
        return next;
      });
      setIsRolling(false);
    }, 800);
  };

  // Panda automatic turn
  useEffect(() => {
    if (turn !== "panda") return;
    const t = setTimeout(() => {
      const rolled = Math.floor(Math.random() * 2) + 1;
      setPandaPos(p => {
        const next = Math.min(totalTiles - 1, p + rolled);
        if (next >= totalTiles - 1) {
          playSynthSound("wrong");
          setTimeout(() => onComplete && onComplete(4), 1200);
        } else {
          setTurn("player");
        }
        return next;
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [turn]);

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#10b981", marginBottom: "14px" }}>
        🎲 Board Trail Quest!
      </div>

      {/* Trail Map */}
      <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "22px" }}>
        {Array.from({ length: totalTiles }).map((_, idx) => {
          const isPlayerHere = playerPos === idx;
          const isPandaHere = pandaPos === idx;
          return (
            <div
              key={idx}
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                border: "2px solid #e2e8f0",
                background: idx === totalTiles - 1 ? "#fef3c7" : "#fff",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "0.8rem"
              }}
            >
              {idx === totalTiles - 1 ? "🏁" : idx + 1}
              <div style={{ position: "absolute", top: "-18px", display: "flex", gap: "2px" }}>
                {isPlayerHere && <span style={{ fontSize: "1.2rem", animation: "float 2s infinite" }}>🧒</span>}
                {isPandaHere && <span style={{ fontSize: "1.2rem", animation: "float 2s infinite 0.5s" }}>🐼</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginBottom: "10px" }}>
        <button
          onClick={rollDice}
          disabled={turn !== "player" || isRolling}
          className="bounce-btn"
          style={{
            background: turn === "player" ? "linear-gradient(135deg,#10b981,#059669)" : "#d1d5db",
            color: "#fff",
            padding: "10px 24px",
            border: "none",
            borderRadius: "16px",
            fontWeight: "900",
            cursor: turn === "player" ? "pointer" : "default"
          }}
        >
          {isRolling ? "🎲 Rolling..." : "🎲 Roll Dice!"}
        </button>

        {diceVal && (
          <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "#059669" }}>
            +{diceVal} spaces!
          </div>
        )}
      </div>

      <div style={{ fontWeight: "800", color: turn === "player" ? "#047857" : "#d97706" }}>
        {turn === "player"
          ? (language === "kn" ? "ನಿಮ್ಮ ಸರದಿ! ದಾಳ ಉರುಳಿಸಿ." : "Your Turn! Roll the dice.")
          : (language === "kn" ? "ಪಾಂಡಾ ಸರದಿ..." : "Friendly Panda is rolling...")}
      </div>
    </div>
  );
}

// 9. BALLOON TAPPING
function BalloonTappingGame({ onComplete }) {
  const [balloonY, setBalloonY] = useState(30);
  const [taps, setTaps] = useState(0);

  useEffect(() => {
    // Balloon drifts down
    const interval = setInterval(() => {
      setBalloonY(y => {
        const next = y + 8;
        if (next > 210) {
          playSynthSound("wrong");
          return 30; // reset
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleTap = () => {
    playSynthSound("pop");
    setBalloonY(30); // tap bounces it to top
    setTaps(t => {
      const next = t + 1;
      if (next >= 10) {
        onComplete && onComplete(5);
      }
      return next;
    });
  };

  return (
    <div style={{ textAlign: "center", padding: "16px", userSelect: "none" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ec4899", marginBottom: "8px" }}>
        🎈 Keep balloon up! Tap {taps}/10 times
      </div>

      <div style={{
        height: "220px",
        background: "linear-gradient(180deg,#fff1f2,#ffe4e6)",
        border: "3px solid #fda4af",
        borderRadius: "20px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Balloon */}
        <div
          onClick={handleTap}
          style={{
            position: "absolute",
            left: "calc(50% - 30px)",
            top: `${balloonY}px`,
            width: "60px",
            height: "75px",
            background: "radial-gradient(circle at 20px 20px, #ff4d6d, #c9184a)",
            borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
            cursor: "pointer",
            boxShadow: "0 10px 15px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "900",
            color: "#fff",
            fontSize: "0.8rem"
          }}
        >
          🎈
          {/* Thread */}
          <div style={{ width: "2px", height: "30px", background: "#f43f5e", position: "absolute", bottom: "-30px" }} />
        </div>
      </div>
    </div>
  );
}

// 10. SIMPLE COOKING (Pizza / Sandwich Builder)
function CookingGame({ language, onComplete }) {
  const steps = ["Bread 🍞", "Cheese 🧀", "Tomato 🍅", "Lettuce 🥬", "Bread 🍞"];
  const stepsKn = ["ಬ್ರೆಡ್ 🍞", "ಚೀಸ್ 🧀", "ಟೊಮೆಟೊ 🍅", "ಲೆಟಿಸ್ 🥬", "ಬ್ರೆಡ್ 🍞"];
  const [currentIdx, setCurrentIdx] = useState(0);

  const handleAddIngredient = (item) => {
    const target = steps[currentIdx];
    if (item.toLowerCase() === target.toLowerCase()) {
      playSynthSound("correct");
      if (currentIdx + 1 >= steps.length) {
        onComplete && onComplete(5);
      } else {
        setCurrentIdx(i => i + 1);
      }
    } else {
      playSynthSound("wrong");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#f59e0b", marginBottom: "14px" }}>
        🥪 Sandwich Kitchen Game!
      </div>

      <div style={{
        background: "#fffbeb",
        padding: "16px",
        borderRadius: "20px",
        border: "3px solid #fde68a",
        marginBottom: "20px",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "6px"
      }}>
        {currentIdx === 0 && <span style={{ color: "#b45309", fontWeight: "800" }}>Let's build a sandwich!</span>}
        {Array.from({ length: currentIdx }).map((_, idx) => (
          <div
            key={idx}
            style={{
              fontWeight: "900",
              fontSize: "1.1rem",
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "4px 20px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
              animation: "bounceIn 0.3s ease"
            }}
          >
            {language === "kn" ? stepsKn[idx] : steps[idx]}
          </div>
        ))}
      </div>

      <div style={{ fontWeight: "900", marginBottom: "14px", color: "#b45309" }}>
        👉 Next ingredient: <span style={{ color: "#d97706" }}>{language === "kn" ? stepsKn[currentIdx] : steps[currentIdx]}</span>
      </div>

      {/* Option items to click */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
        {["Cheese 🧀", "Bread 🍞", "Tomato 🍅", "Lettuce 🥬"].map(item => (
          <button
            key={item}
            onClick={() => handleAddIngredient(item)}
            className="bounce-btn"
            style={{
              padding: "10px 14px",
              borderRadius: "14px",
              background: "#fff",
              border: "2px solid #f59e0b",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

// 11. ROLE PLAY SCENARIOS
function RolePlayGame({ language, onComplete }) {
  const dialogs = [
    {
      prompt: "Ice Cream Seller: 'Hello! What flavor ice cream would you like?' 🍦",
      promptKn: "ಐಸ್ ಕ್ರೀಮ್ ವ್ಯಾಪಾರಿ: 'ನಮಸ್ಕಾರ! ನಿಮಗೆ ಯಾವ ಫ್ಲೇವರ್ ಐಸ್ ಕ್ರೀಮ್ ಬೇಕು?' 🍦",
      options: [
        { text: "Say 'I want chocolate please' 🍫", textKn: "'ಚಾಕೊಲೇಟ್ ಪ್ಲೀಸ್' ಎಂದು ಹೇಳಿ", score: 5 },
        { text: "Point and say nothing 😶", textKn: "ಸನ್ನೆ ಮಾಡಿ ಸುಮ್ಮನಿರಿ", score: 3 }
      ]
    },
    {
      prompt: "Ice Cream Seller: 'Here is your chocolate scoop! That will be 2 coins.' 🪙",
      promptKn: "ಐಸ್ ಕ್ರೀಮ್ ವ್ಯಾಪಾರಿ: 'ಇಗೋ ಚಾಕೊಲೇಟ್ ಸ್ಕೂಪ್! 2 ನಾಣ್ಯಗಳಾಗುತ್ತವೆ.' 🪙",
      options: [
        { text: "Hand over coins and say 'Thank you!' 🙏", textKn: "ನಾಣ್ಯಗಳನ್ನು ನೀಡಿ 'ಧನ್ಯವಾದಗಳು' ಹೇಳಿ", score: 5 },
        { text: "Take ice cream and walk away 🏃", textKn: "ತೆಗೆದುಕೊಂಡು ಓಡಿಹೋಗಿ", score: 2 }
      ]
    }
  ];

  const [step, setStep] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const current = dialogs[step];

  const handleSelect = (option) => {
    playSynthSound("correct");
    setTotalScore(s => s + option.score);
    if (step + 1 >= dialogs.length) {
      onComplete && onComplete(Math.round((totalScore + option.score) / 2));
    } else {
      setStep(s => s + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#6366f1", marginBottom: "14px" }}>
        🎭 Social Dialogue Role-Play!
      </div>

      <div style={{
        background: "linear-gradient(135deg,#e0e7ff,#eff6ff)",
        border: "3px solid #818cf8",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "20px",
        fontWeight: "900",
        color: "#3730a3",
        fontSize: "1.05rem"
      }}>
        {language === "kn" ? current.promptKn : current.prompt}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            style={{
              padding: "14px",
              borderRadius: "16px",
              background: "#fff",
              border: "2px solid #818cf8",
              fontWeight: "900",
              cursor: "pointer",
              textAlign: "left"
            }}
          >
            {language === "kn" ? opt.textKn : opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// 12. OBSTACLE COURSE
function ObstacleCourseGame({ language, onComplete }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [charJump, setCharJump] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [score, setScore] = useState(0);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setObstacles([{ x: 280, id: 1 }]);
  };

  // Jump control
  const handleJump = () => {
    if (charJump) return;
    playSynthSound("pop");
    setCharJump(true);
    setTimeout(() => setCharJump(false), 600);
  };

  // Frame tick runner
  useEffect(() => {
    if (!isPlaying) return;
    const handle = setInterval(() => {
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, x: o.x - 12 }));
        
        // Check collision or check pass
        const collision = next.some(o => o.x > 30 && o.x < 70 && !charJump);
        if (collision) {
          playSynthSound("wrong");
          setIsPlaying(false);
          onComplete && onComplete(4);
          return [];
        }

        // Keep obstacles on screen
        const filtered = next.filter(o => {
          if (o.x <= 0) {
            setScore(s => {
              const nextScore = s + 1;
              if (nextScore >= 5) {
                playSynthSound("correct");
                setIsPlaying(false);
                onComplete && onComplete(5);
              }
              return nextScore;
            });
            return false;
          }
          return true;
        });

        // Spawn new obstacle
        if (filtered.length === 0) {
          filtered.push({ x: 280, id: Math.random() });
        }
        return filtered;
      });
    }, 100);

    return () => clearInterval(handle);
  }, [isPlaying, charJump]);

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ef4444", marginBottom: "14px" }}>
        🏃 Obstacle Jump Course! (Jump 5 blocks: {score}/5)
      </div>

      {!isPlaying ? (
        <button
          onClick={startGame}
          className="bounce-btn"
          style={{
            background: "linear-gradient(135deg,#ef4444,#dc2626)",
            color: "#fff",
            padding: "16px 36px",
            border: "none",
            borderRadius: "20px",
            fontWeight: "900",
            fontSize: "1.2rem",
            cursor: "pointer"
          }}
        >
          🚀 Start Runner Game!
        </button>
      ) : (
        <div
          onClick={handleJump}
          style={{
            height: "180px",
            background: "linear-gradient(180deg,#ecfdf5,#d1fae5)",
            border: "3px solid #6ee7b7",
            borderRadius: "20px",
            position: "relative",
            cursor: "pointer",
            overflow: "hidden"
          }}
        >
          {/* Runner */}
          <div style={{
            position: "absolute",
            left: "40px",
            bottom: charJump ? "70px" : "15px",
            fontSize: "2.5rem",
            transition: charJump ? "bottom 0.25s ease-out" : "bottom 0.3s ease-in",
            lineHeight: 1
          }}>
            🧒
          </div>

          {/* Obstacle cone */}
          {obstacles.map(o => (
            <div
              key={o.id}
              style={{
                position: "absolute",
                left: `${o.x}px`,
                bottom: "15px",
                fontSize: "1.8rem",
                lineHeight: 1
              }}
            >
              ⚠️
            </div>
          ))}

          <div style={{ position: "absolute", top: "10px", width: "100%", textAlign: "center", fontSize: "0.85rem", fontWeight: "900", color: "#065f46" }}>
            Tap screen to JUMP!
          </div>
        </div>
      )}
    </div>
  );
}

// 13. PEER PLAY DATE (sharing scenarios choices)
function SharingSimulatorGame({ language, onComplete }) {
  const scenario = {
    prompt: "Your friend wants to play with your favorite fire truck. 🚒 What should we do?",
    promptKn: "ನಿಮ್ಮ ಸ್ನೇಹಿತ ನಿಮ್ಮ ನೆಚ್ಚಿನ ಅಗ್ನಿಶಾಮಕ ಟ್ರಕ್‌ನೊಂದಿಗೆ ಆಡಲು ಬಯಸುತ್ತಾನೆ. 🚒 ನಾವು ಏನು ಮಾಡಬೇಕು?",
    options: [
      { text: "🤝 Share! Say 'Let's take turns playing.'", textKn: "'ಸರತಿಯಲ್ಲಿ ಆಡೋಣ' ಎಂದು ಹಂಚಿಕೊಳ್ಳಿ", score: 5 },
      { text: "😠 Pull the truck away and say 'It's mine!'", textKn: "'ಇದು ನನ್ನದು' ಎಂದು ಕಿತ್ತುಕೊಳ್ಳಿ", score: 2 }
    ]
  };

  const handleSelect = (opt) => {
    if (opt.score === 5) playSynthSound("correct");
    else playSynthSound("wrong");
    onComplete && onComplete(opt.score);
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#a855f7", marginBottom: "14px" }}>
        🤝 Friend Sharing Simulator
      </div>

      <div style={{
        background: "linear-gradient(135deg,#f3e8ff,#faf5ff)",
        border: "3px solid #c084fc",
        borderRadius: "20px",
        padding: "20px",
        marginBottom: "20px",
        fontWeight: "900",
        color: "#6b21a8"
      }}>
        {language === "kn" ? scenario.promptKn : scenario.prompt}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
        {scenario.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleSelect(opt)}
            style={{
              padding: "14px",
              borderRadius: "16px",
              background: "#fff",
              border: "2px solid #c084fc",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            {language === "kn" ? opt.textKn : opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// 14. FEELINGS JOURNAL
function FeelingsJournalGame({ language, onComplete }) {
  const [selectedFeeling, setSelectedFeeling] = useState("");
  const feelings = ["😊 Happy", "😢 Sad", "😠 Angry", "😮 Surprised", "😨 Scared"];
  const feelingsKn = ["😊 ಸಂತೋಷ", "😢 ದುಃಖ", "😠 ಕೋಪ", "😮 ಆಶ್ಚರ್ಯ", "😨 ಭಯ"];

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#10b981", marginBottom: "14px" }}>
        📝 Colorful Mood Explorer Journal
      </div>

      <div style={{ fontWeight: "800", color: "#4b5563", marginBottom: "12px" }}>
        {language === "kn" ? "ಇಂದು ನಿಮ್ಮ ಭಾವನೆ ಹೇಗಿದೆ?" : "Select your primary mood today:"}
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {feelings.map((f, i) => (
          <button
            key={f}
            onClick={() => { setSelectedFeeling(f); playSynthSound("pop"); }}
            style={{
              padding: "8px 16px",
              borderRadius: "14px",
              background: selectedFeeling === f ? "linear-gradient(135deg,#10b981,#059669)" : "#fff",
              border: selectedFeeling === f ? "2px solid #059669" : "2px solid #cbd5e1",
              color: selectedFeeling === f ? "#fff" : "#1f2937",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            {language === "kn" ? feelingsKn[i] : f}
          </button>
        ))}
      </div>

      {/* Writing Box */}
      {selectedFeeling && (
        <div style={{ animation: "bounceIn 0.3s ease" }}>
          <textarea
            rows="3"
            placeholder={language === "kn" ? "ಇಂದು ನಡೆದದ್ದನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ..." : "Write down what made you feel this way today..."}
            style={{
              width: "100%",
              maxWidth: "340px",
              borderRadius: "14px",
              border: "2px solid #10b981",
              padding: "10px",
              fontSize: "0.9rem",
              fontFamily: "inherit",
              marginBottom: "12px"
            }}
          />
          <br />
          <button
            onClick={() => onComplete && onComplete(5)}
            className="bounce-btn"
            style={{
              background: "linear-gradient(135deg,#10b981,#059669)",
              color: "#fff",
              border: "none",
              padding: "10px 24px",
              borderRadius: "14px",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            Save Journal entry 🏆
          </button>
        </div>
      )}
    </div>
  );
}

// 15. COMMUNITY HELPER INTERVIEW
function HelperInterviewGame({ language, onComplete }) {
  const roles = [
    { name: "Doctor 🩺", nameKn: "ವೈದ್ಯರು", tool: "Stethoscope", toolIcon: "🩺", question: "What do you use to check my heart?" },
    { name: "Firefighter 🧑‍🚒", nameKn: "ಅಗ್ನಿಶಾಮಕರು", tool: "Fire Truck", toolIcon: "🚒", question: "How do you put out fires?" },
    { name: "Teacher 🧑‍🏫", nameKn: "ಶಿಕ್ಷಕರು", tool: "Book", toolIcon: "📚", question: "What do you write on the board with?" }
  ];

  const [roleIdx, setRoleIdx] = useState(0);
  const [success, setSuccess] = useState(false);
  const current = roles[roleIdx];

  const handleToolMatch = (tool) => {
    if (tool === current.tool) {
      playSynthSound("correct");
      setSuccess(true);
    } else {
      playSynthSound("wrong");
    }
  };

  const handleNext = () => {
    setSuccess(false);
    if (roleIdx + 1 >= roles.length) {
      onComplete && onComplete(5);
    } else {
      setRoleIdx(r => r + 1);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#f59e0b", marginBottom: "14px" }}>
        🧑‍⚕️ Match the Community Helper's Tool!
      </div>

      <div style={{
        background: "linear-gradient(135deg,#fef3c7,#fffbeb)",
        padding: "18px",
        borderRadius: "20px",
        border: "3px solid #fde68a",
        marginBottom: "20px",
        display: "inline-block"
      }}>
        <div style={{ fontSize: "3rem" }}>🙋</div>
        <div style={{ fontWeight: "900", fontSize: "1.2rem", color: "#b45309" }}>
          {language === "kn" ? current.nameKn : current.name}
        </div>
      </div>

      {!success ? (
        <>
          <div style={{ fontWeight: "700", marginBottom: "14px" }}>
            {language === "kn" ? "ಅವರ ಸರಿಯಾದ ಉಪಕರಣ ಯಾವುದು?" : "What tool do they use?"}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            {roles.map(r => (
              <button
                key={r.tool}
                onClick={() => handleToolMatch(r.tool)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "14px",
                  background: "#fff",
                  border: "2px solid #e5e7eb",
                  cursor: "pointer",
                  fontSize: "1.6rem"
                }}
              >
                {r.toolIcon}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{ animation: "bounceIn 0.3s ease" }}>
          <div style={{
            background: "#dcfce7",
            color: "#166534",
            padding: "12px 18px",
            borderRadius: "16px",
            fontWeight: "900",
            marginBottom: "14px"
          }}>
            🗣️ Interview Question: "{current.question}"
          </div>
          <button
            onClick={handleNext}
            className="bounce-btn"
            style={{
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#fff",
              padding: "8px 24px",
              border: "none",
              borderRadius: "14px",
              fontWeight: "900",
              cursor: "pointer"
            }}
          >
            {roleIdx + 1 >= roles.length ? "Finish Quest! 🏆" : "Next Helper ➡️"}
          </button>
        </div>
      )}
    </div>
  );
}


// 16. WORD BUILDER GAME
function WordBuilderGame({ language, onComplete }) {
  const words = [
    { word: "CAT", wordKn: "ಬೆಕ್ಕು", icon: "🐱", hint: "A furry pet" },
    { word: "STAR", wordKn: "ನಕ್ಷತ್ರ", icon: "⭐", hint: "Shines in sky" },
    { word: "FISH", wordKn: "ಮೀನು", icon: "🐟", hint: "Swims in water" },
    { word: "SUN", wordKn: "ಸೂರ್ಯ", icon: "☀️", hint: "Bright and warm" }
  ];

  const [wordIdx, setWordIdx] = useState(0);
  const current = words[wordIdx];
  const [currentLetters, setCurrentLetters] = useState([]);
  const [scrambled, setScrambled] = useState([]);

  useEffect(() => {
    setCurrentLetters([]);
    const letters = current.word.split("");
    const shuffled = [...letters].sort(() => Math.random() - 0.5);
    setScrambled(shuffled);
  }, [wordIdx]);

  const handlePickLetter = (letter, idx) => {
    playSynthSound("pop");
    const nextLetters = [...currentLetters, letter];
    setCurrentLetters(nextLetters);
    setScrambled(prev => prev.filter((_, i) => i !== idx));

    if (nextLetters.join("") === current.word) {
      playSynthSound("correct");
      setTimeout(() => {
        if (wordIdx + 1 >= words.length) {
          onComplete && onComplete(5);
        } else {
          setWordIdx(i => i + 1);
        }
      }, 700);
    } else if (nextLetters.length === current.word.length) {
      playSynthSound("wrong");
      setTimeout(() => {
        setCurrentLetters([]);
        setScrambled([...current.word.split("")].sort(() => Math.random() - 0.5));
      }, 500);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#6366f1", marginBottom: "10px" }}>
        🔤 Word Builder Adventure!
      </div>
      <div style={{ fontSize: "4.5rem", animation: "float 2s infinite" }}>{current.icon}</div>
      <div style={{ fontSize: "1rem", color: "#6b7280", fontWeight: "800", margin: "6px 0 16px" }}>
        {language === "kn" ? current.wordKn : current.hint}
      </div>

      {/* Target Word Slots */}
      <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "20px" }}>
        {current.word.split("").map((_, i) => (
          <div
            key={i}
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "14px",
              background: currentLetters[i] ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
              border: "3px solid #c7d2fe",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.8rem",
              fontWeight: "900",
              boxShadow: currentLetters[i] ? "0 4px 14px rgba(99,102,241,0.3)" : "none"
            }}
          >
            {currentLetters[i] || ""}
          </div>
        ))}
      </div>

      {/* Scrambled Clickable Letter Tiles */}
      <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
        {scrambled.map((l, i) => (
          <button
            key={i}
            onClick={() => handlePickLetter(l, i)}
            className="bounce-btn"
            style={{
              width: "54px",
              height: "54px",
              borderRadius: "16px",
              background: "#ffffff",
              border: "3px solid #6366f1",
              color: "#4338ca",
              fontSize: "1.8rem",
              fontWeight: "900",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(0,0,0,0.08)"
            }}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

// 17. 5-FINGER STAR BREATHING PACER
function StarBreathingGame({ language, onComplete }) {
  const [phase, setPhase] = useState("Inhale");
  const [count, setCount] = useState(1);
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount(c => {
        if (c >= 4) {
          setPhase(p => {
            if (p === "Inhale") {
              playSynthSound("synth_bell");
              return "Exhale";
            } else {
              setCycles(cy => {
                const next = cy + 1;
                if (next >= 3) {
                  onComplete && onComplete(5);
                }
                return next;
              });
              playSynthSound("pop");
              return "Inhale";
            }
          });
          return 1;
        }
        return c + 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isInhale = phase === "Inhale";

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#059669", marginBottom: "14px" }}>
        ⭐ Calm Star Breathing Pacer
      </div>

      <div style={{
        width: "160px",
        height: "160px",
        margin: "0 auto 20px",
        borderRadius: "50%",
        background: isInhale ? "linear-gradient(135deg,#a7f3d0,#34d399)" : "linear-gradient(135deg,#bae6fd,#60a5fa)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        transform: isInhale ? "scale(1.2)" : "scale(0.85)",
        transition: "transform 4s ease-in-out, background 1s ease",
        boxShadow: "0 10px 30px rgba(5,150,105,0.2)"
      }}>
        <div style={{ fontSize: "3.5rem" }}>{isInhale ? "🌸" : "💨"}</div>
        <div style={{ fontWeight: "900", fontSize: "1.2rem", marginTop: "4px" }}>
          {language === "kn" ? (isInhale ? "ಉಸಿರು ಒಳಗೆ" : "ಉಸಿರು ಹೊರಗೆ") : phase}
        </div>
        <div style={{ fontSize: "1.2rem", fontWeight: "800" }}>{count}s</div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px" }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ fontSize: "1.8rem", opacity: i < cycles ? 1 : 0.25 }}>⭐</span>
        ))}
      </div>
      <p style={{ color: "#475569", fontSize: "0.85rem", marginTop: "10px", fontWeight: "700" }}>
        {language === "kn" ? "ನಕ್ಷತ್ರದ ಜೊತೆಗೆ ನಿಧಾನವಾಗಿ ಉಸಿರಾಡಿ..." : "Breathe slowly with the calming star..."}
      </p>
    </div>
  );
}

// 18. CAUSE & EFFECT BALL CHUTE
function BallChuteGame({ language, onComplete }) {
  const [balls, setBalls] = useState([]);
  const [score, setScore] = useState(0);

  const handleDrop = () => {
    playSynthSound("synth_car");
    playSynthSound("pop");
    const colors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"];
    const id = Date.now();
    setBalls(prev => [...prev, { id, color: colors[prev.length % colors.length] }]);
    const nextScore = score + 1;
    setScore(nextScore);

    if (nextScore >= 4) {
      setTimeout(() => onComplete && onComplete(5), 1000);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#f59e0b", marginBottom: "14px" }}>
        🎪 Ball Drop & Chute Fun!
      </div>

      <div style={{
        height: "180px",
        background: "linear-gradient(180deg,#fffbeb,#fef3c7)",
        borderRadius: "20px",
        border: "3px dashed #fde68a",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: "16px"
      }}>
        {balls.map((b, i) => (
          <div
            key={b.id}
            style={{
              position: "absolute",
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              backgroundColor: b.color,
              bottom: "16px",
              left: `${15 + (i * 20)}%`,
              animation: "bounceIn 0.5s ease",
              boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "900"
            }}
          >
            ⚽
          </div>
        ))}
        {balls.length === 0 && (
          <span style={{ fontSize: "0.9rem", color: "#b45309", fontWeight: "800" }}>
            {language === "kn" ? "ಚೆಂಡನ್ನು ಬಿಡಲು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ!" : "Tap the button to drop balls into the chute!"}
          </span>
        )}
      </div>

      <button
        onClick={handleDrop}
        className="bounce-btn"
        style={{
          background: "linear-gradient(135deg,#f59e0b,#d97706)",
          color: "#fff",
          padding: "12px 28px",
          border: "none",
          borderRadius: "16px",
          fontWeight: "900",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 6px 18px rgba(245,158,11,0.3)"
        }}
      >
        🔴 Drop Ball! ({score}/4)
      </button>
    </div>
  );
}

// 19. SENSORY TREASURE DIG (Canvas Scratch & Reveal)
function SensoryDigGame({ language, onComplete }) {
  const [revealed, setRevealed] = useState([false, false, false]);

  const handleDig = (idx) => {
    playSynthSound("pop");
    const next = [...revealed];
    next[idx] = true;
    setRevealed(next);

    if (next.every(Boolean)) {
      playSynthSound("correct");
      setTimeout(() => onComplete && onComplete(5), 800);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#8b5cf6", marginBottom: "12px" }}>
        🏖️ Sensory Sand Treasure Hunt!
      </div>
      <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: "0 0 16px" }}>
        {language === "kn" ? "ಮರಳನ್ನು ಅಗೆದು ಗುಪ್ತ ರತ್ನಗಳನ್ನು ಹುಡುಕಿ!" : "Tap the sand piles to dig and uncover hidden gems!"}
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
        {[
          { icon: "💎", name: "Diamond", color: "#38bdf8" },
          { icon: "👑", name: "Crown", color: "#facc15" },
          { icon: "⭐", name: "Star", color: "#f43f5e" }
        ].map((item, i) => (
          <div
            key={i}
            onClick={() => !revealed[i] && handleDig(i)}
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "20px",
              background: revealed[i] ? "linear-gradient(135deg,#f0fdf4,#dcfce7)" : "linear-gradient(135deg,#fde68a,#d97706)",
              border: revealed[i] ? "3px solid #22c55e" : "3px dashed #b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5rem",
              cursor: revealed[i] ? "default" : "pointer",
              boxShadow: "0 6px 18px rgba(0,0,0,0.1)",
              animation: revealed[i] ? "starPop 0.4s ease" : "pulse 2s infinite"
            }}
          >
            {revealed[i] ? item.icon : "🏖️"}
          </div>
        ))}
      </div>
    </div>
  );
}

// 20. 4-ZONES OF REGULATION GAME
function ZonesRegulationGame({ language, onComplete }) {
  const feelings = [
    { name: "Sad 😢", zone: "blue", nameKn: "ದುಃಖ" },
    { name: "Calm 😊", zone: "green", nameKn: "ಶಾಂತ" },
    { name: "Excited 🤩", zone: "yellow", nameKn: "ಉತ್ಸಾಹ" },
    { name: "Mad 😡", zone: "red", nameKn: "ಕೋಪ" }
  ];

  const [idx, setIdx] = useState(0);
  const current = feelings[idx];

  const handleZone = (selectedZone) => {
    if (selectedZone === current.zone) {
      playSynthSound("correct");
      if (idx + 1 >= feelings.length) {
        onComplete && onComplete(5);
      } else {
        setIdx(i => i + 1);
      }
    } else {
      playSynthSound("wrong");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#10b981", marginBottom: "14px" }}>
        🧭 4 Zones of Emotion Detective!
      </div>

      <div style={{
        background: "#f8fafc",
        padding: "16px",
        borderRadius: "20px",
        border: "2px solid #e2e8f0",
        display: "inline-block",
        marginBottom: "16px"
      }}>
        <div style={{ fontSize: "2rem", fontWeight: "900" }}>{current.name}</div>
        <div style={{ fontSize: "0.85rem", color: "#64748b" }}>{language === "kn" ? current.nameKn : "Which zone does this feeling belong to?"}</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
        {[
          { zone: "blue", label: "Blue Zone 💤", labelKn: "ನೀಲಿ ವಲಯ (ಆಯಾಸ)", bg: "#dbeafe", color: "#1e40af" },
          { zone: "green", label: "Green Zone 🌿", labelKn: "ಹಸಿರು ವಲಯ (ಶಾಂತ)", bg: "#dcfce7", color: "#166534" },
          { zone: "yellow", label: "Yellow Zone ⚡", labelKn: "ಹಳದಿ ವಲಯ (ಉತ್ಸಾಹ)", bg: "#fef3c7", color: "#854d0e" },
          { zone: "red", label: "Red Zone 🔥", labelKn: "ಕೆಂಪು ವಲಯ (ಕೋಪ)", bg: "#fee2e2", color: "#991b1b" }
        ].map(z => (
          <button
            key={z.zone}
            onClick={() => handleZone(z.zone)}
            style={{
              background: z.bg,
              color: z.color,
              border: `2px solid ${z.color}44`,
              padding: "12px 8px",
              borderRadius: "14px",
              fontWeight: "900",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            {language === "kn" ? z.labelKn : z.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// 21. INTERACTIVE TASK CHECKLIST GAME
function TaskRoutineGame({ activity, language, onComplete }) {
  const steps = activity?.instructions?.length ? activity.instructions : [
    { en: "Step 1: Check your focus", kn: "ಹಂತ 1: ನಿಮ್ಮ ಗಮನ ಪರಿಶೀಲಿಸಿ" },
    { en: "Step 2: Prepare your action", kn: "ಹಂತ 2: ಕ್ರಿಯೆ ಸಿದ್ಧಪಡಿಸಿ" },
    { en: "Step 3: Execute the goal", kn: "ಹಂತ 3: ಗುರಿ ಸಾಧಿಸಿ" },
    { en: "Step 4: Celebrate success!", kn: "ಹಂತ 4: ಯಶಸ್ಸು ಆಚರಿಸಿ!" }
  ];

  const [checked, setChecked] = useState([]);

  const toggleStep = (index) => {
    playSynthSound("correct");
    if (!checked.includes(index)) {
      const next = [...checked, index];
      setChecked(next);
      if (next.length === steps.length) {
        setTimeout(() => onComplete && onComplete(5), 600);
      }
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#6366f1", marginBottom: "14px" }}>
        📋 Interactive Routine Checklist
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px", margin: "0 auto" }}>
        {steps.map((step, idx) => {
          const isDone = checked.includes(idx);
          return (
            <div
              key={idx}
              onClick={() => toggleStep(idx)}
              style={{
                background: isDone ? "#dcfce7" : "#ffffff",
                border: isDone ? "2px solid #22c55e" : "2px solid #e2e8f0",
                padding: "12px 16px",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.2s"
              }}
            >
              <div style={{
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                background: isDone ? "#22c55e" : "#f1f5f9",
                color: isDone ? "#fff" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "900",
                fontSize: "0.9rem"
              }}>
                {isDone ? "✓" : idx + 1}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: "800", color: isDone ? "#166534" : "#334155" }}>
                {language === "kn" ? step.kn : step.en}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 22. SOCIAL DILEMMA DECISION GAME
function SocialDilemmaGame({ language, onComplete }) {
  const dilemmas = [
    {
      q: "A friend drops their blocks by accident. What should you do?",
      qKn: "ಸ್ನೇಹಿತನ ಬ್ಲಾಕ್‌ಗಳು ಕೆಳಗೆ ಬಿದ್ದವು. ನೀವೇನು ಮಾಡುವಿರಿ?",
      options: [
        { text: "Help pick them up 🤝", textKn: "ಎತ್ತಲು ಸಹಾಯ ಮಾಡುವೆ", correct: true },
        { text: "Laugh and walk away ❌", textKn: "ನಕ್ಕು ಹೋಗುವೆ", correct: false }
      ]
    },
    {
      q: "You want to play with the toy car your friend is using. What can you say?",
      qKn: "ಸ್ನೇಹಿತ ಆಡುತ್ತಿರುವ ಕಾರು ನಿಮಗೂ ಬೇಕು. ಏನು ಹೇಳುವಿರಿ?",
      options: [
        { text: "Can I have a turn next please? 🚗", textKn: "ನಂತರ ನನಗೂ ಕೊಡುವಿರಾ?", correct: true },
        { text: "Snatch it quickly ❌", textKn: "ಕಸಿದುಕೊಳ್ಳುವೆ", correct: false }
      ]
    }
  ];

  const [idx, setIdx] = useState(0);
  const current = dilemmas[idx];

  const handlePick = (isCorrect) => {
    if (isCorrect) {
      playSynthSound("correct");
      if (idx + 1 >= dilemmas.length) {
        onComplete && onComplete(5);
      } else {
        setIdx(i => i + 1);
      }
    } else {
      playSynthSound("wrong");
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ec4899", marginBottom: "14px" }}>
        🤝 Social Problem Solver!
      </div>

      <div style={{
        background: "linear-gradient(135deg,#fdf2f8,#fce7f3)",
        padding: "16px",
        borderRadius: "20px",
        border: "2px solid #fbcfe8",
        marginBottom: "18px"
      }}>
        <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "#9d174d" }}>
          {language === "kn" ? current.qKn : current.q}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px", margin: "0 auto" }}>
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handlePick(opt.correct)}
            className="bounce-btn"
            style={{
              background: "#ffffff",
              border: "2px solid #f472b6",
              padding: "12px",
              borderRadius: "16px",
              fontWeight: "900",
              fontSize: "0.9rem",
              color: "#831843",
              cursor: "pointer"
            }}
          >
            {language === "kn" ? opt.textKn : opt.text}
          </button>
        ))}
      </div>
    </div>
  );
}

// 23. PECS REQUEST CARD EXCHANGE GAME
function RequestExchangeGame({ language, onComplete }) {
  const items = [
    { id: "apple", icon: "🍎", name: "Apple", nameKn: "ಸೇಬು" },
    { id: "car", icon: "🚗", name: "Toy Car", nameKn: "ಆಟಿಕೆ ಕಾರು" },
    { id: "juice", icon: "🧃", name: "Juice", nameKn: "ಜ್ಯೂಸ್" },
    { id: "ball", icon: "⚽", name: "Ball", nameKn: "ಚೆಂಡು" }
  ];

  const [selected, setSelected] = useState(null);

  const handleExchange = (item) => {
    playSynthSound("pop");
    setSelected(item);
    playSynthSound("correct");
    setTimeout(() => {
      onComplete && onComplete(5);
    }, 900);
  };

  return (
    <div style={{ textAlign: "center", padding: "16px" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#6366f1", marginBottom: "14px" }}>
        🙋 Picture Request Board (PECS)
      </div>
      <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 16px" }}>
        {language === "kn" ? "ನೀವು ವಿನಂತಿಸಲು ಬಯಸುವ ಕಾರ್ಡ್ ಅನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ:" : "Tap a picture card to exchange your request:"}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "300px", margin: "0 auto" }}>
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => handleExchange(item)}
            className="bounce-btn"
            style={{
              background: selected?.id === item.id ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#ffffff",
              color: selected?.id === item.id ? "#fff" : "#1e293b",
              border: "3px solid #c7d2fe",
              padding: "16px 8px",
              borderRadius: "20px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span style={{ fontSize: "2.4rem" }}>{item.icon}</span>
            <span style={{ fontWeight: "900", fontSize: "0.9rem" }}>
              {language === "kn" ? item.nameKn : item.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}


/* ─── CENTRAL ROUTER (100% ONLINE INTERACTIVE GAMES) ─────────────────────────── */
export default function InteractiveGameZone({ activity, language = "en", currentEmotion = "Happy", emotionConfidence = 0, onComplete }) {
  
  const title = (activity?.title || "").toLowerCase();
  const category = (activity?.category || "").toLowerCase();

  const renderGame = () => {
    // 1. Direct Keyword / Title Matching
    if (title.includes("word") || title.includes("letter") || title.includes("spell")) {
      return <WordBuilderGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("breath") || title.includes("calm") || title.includes("star")) {
      return <StarBreathingGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("ball") || title.includes("drop") || title.includes("chute") || title.includes("roll")) {
      return <BallChuteGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("sand") || title.includes("dig") || title.includes("sensory bin") || title.includes("treasure")) {
      return <SensoryDigGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("zone") || title.includes("trigger") || title.includes("detective") || title.includes("clue")) {
      return <ZonesRegulationGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("bubble") || title.includes("pop")) {
      return <BubblePoppingGame onComplete={onComplete} />;
    }
    if (title.includes("mirror") || title.includes("mimic") || title.includes("face")) {
      return <MirrorPlayGame language={language} currentEmotion={currentEmotion} confidence={emotionConfidence} onComplete={onComplete} />;
    }
    if (title.includes("sound") || title.includes("music") || title.includes("audio")) {
      return <NameThatSoundGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("shape") || title.includes("sorting") || title.includes("sort")) {
      return <SortingShapesGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("color") || title.includes("flashcard") || title.includes("match")) {
      return <FlashcardGame activity={activity} language={language} onComplete={onComplete} />;
    }
    if (title.includes("request") || title.includes("pecs") || title.includes("picture exchange")) {
      return <RequestExchangeGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("story") || title.includes("sequence") || title.includes("flow")) {
      return <StorySequencingGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("dilemma") || title.includes("friend") || title.includes("problem") || title.includes("perspective")) {
      return <SocialDilemmaGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("board") || title.includes("turn") || title.includes("game")) {
      return <BoardGameGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("cook") || title.includes("snack") || title.includes("meal") || title.includes("food")) {
      return <CookingGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("helper") || title.includes("interview") || title.includes("community")) {
      return <HelperInterviewGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("obstacle") || title.includes("jump") || title.includes("course") || title.includes("agility")) {
      return <ObstacleCourseGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("journal") || title.includes("feelings")) {
      return <FeelingsJournalGame language={language} onComplete={onComplete} />;
    }
    if (title.includes("balloon") || title.includes("tap")) {
      return <BalloonTappingGame onComplete={onComplete} />;
    }
    if (title.includes("paint") || title.includes("draw") || title.includes("sculpt") || title.includes("clay") || title.includes("doh")) {
      return <PlaydoughSculptingGame language={language} onComplete={onComplete} />;
    }

    // 2. Category Fallbacks
    if (category.includes("communication") || category.includes("talk")) {
      return <FlashcardGame activity={activity} language={language} onComplete={onComplete} />;
    }
    if (category.includes("social") || category.includes("friend")) {
      return <SocialDilemmaGame language={language} onComplete={onComplete} />;
    }
    if (category.includes("sensory") || category.includes("motor") || category.includes("move")) {
      return <SensoryDigGame language={language} onComplete={onComplete} />;
    }
    if (category.includes("cognitive") || category.includes("think")) {
      return <SortingShapesGame language={language} onComplete={onComplete} />;
    }

    // 3. Complete Interactive Task Routine Fallback
    return <TaskRoutineGame activity={activity} language={language} onComplete={onComplete} />;
  };

  return (
    <div style={{
      fontFamily: "'Nunito', system-ui, sans-serif",
      background: "#ffffff",
      borderRadius: "24px",
      padding: "20px",
      border: "3px solid #e0e7ff",
      boxShadow: "0 10px 30px rgba(99,102,241,0.08)"
    }}>
      <style>{`
        @keyframes bounceIn{0%{transform:scale(0.3);opacity:0}60%{transform:scale(1.15)}80%{transform:scale(0.95)}100%{transform:scale(1);opacity:1}}
        @keyframes float {0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes pulse {0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
        @keyframes starPop {0%{transform:scale(0.2);opacity:0}50%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
      `}</style>
      {renderGame()}
    </div>
  );
}
