import React, { useState, useEffect, useRef, useCallback } from "react";
import { speak } from "../utils/gameAudio";
import { selectHappinessGame } from "../utils/EmotionStateManager";

/* ─── Audio Helpers ─────────────────────────────────────────────────────────── */
const playTone = (freq = 440, type = "sine", duration = 0.3, vol = 0.2) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
  } catch {}
};

const playSuccess = () => { playTone(523, "sine", 0.2); setTimeout(() => playTone(659, "sine", 0.2), 150); setTimeout(() => playTone(784, "sine", 0.3), 300); };
const playPop    = () => { playTone(600, "sine", 0.08); setTimeout(() => playTone(300, "triangle", 0.1), 80); };
const playDrum   = (f = 200) => { playTone(f, "sawtooth", 0.12, 0.3); };
const playStar   = () => { playTone(880, "sine", 0.15, 0.25); };

/* ─── Shared CSS animations ─────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes hg-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
  @keyframes hg-bounce   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.15)} }
  @keyframes hg-sparkle  { 0%{opacity:0;transform:scale(0)} 50%{opacity:1} 100%{opacity:0;transform:scale(1.5)} }
  @keyframes hg-bloom    { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.2) rotate(5deg)} 100%{transform:scale(1);opacity:1} }
  @keyframes hg-rain     { 0%{transform:translateY(-20px);opacity:1} 100%{transform:translateY(100vh);opacity:0} }
  @keyframes hg-pulse    { 0%,100%{transform:scale(1);box-shadow:0 0 0 rgba(255,255,255,0)} 50%{transform:scale(1.04);box-shadow:0 0 20px rgba(255,255,255,0.3)} }
  @keyframes hg-breathe  { 0%,100%{transform:scale(1)} 50%{transform:scale(1.4)} }
  @keyframes hg-wag      { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-15deg)} 75%{transform:rotate(15deg)} }
  @keyframes hg-slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes hg-star-fall { 0%{transform:translateY(-5vh) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
`;

/* ════════════════════════════════════════════════════════════════════════════
   GAME 1 — Rainbow Bubble Garden (Sensory)
════════════════════════════════════════════════════════════════════════════ */
function BubbleGarden({ onCheckEmotion }) {
  const [flowers, setFlowers] = useState([]);
  const [bubbles, setBubbles] = useState(() =>
    Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      y: 20 + Math.random() * 70,
      size: 40 + Math.random() * 30,
      color: ["#ffb3c6","#c8a4f5","#a8d8ea","#ffd6a5","#b5ead7","#cce2ff"][i % 6],
      speed: 0.8 + Math.random() * 0.8,
      popped: false,
    }))
  );
  const animRef = useRef(null);
  const timeRef = useRef(Date.now());

  useEffect(() => {
    speak("Let's take a fun break! Tap the bubbles and watch flowers bloom!", "en");
    const tick = () => {
      setBubbles(prev => prev.map(b => ({
        ...b,
        y: b.popped ? b.y : (b.y - b.speed * 0.02 + 100) % 100,
      })));
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const popBubble = (id) => {
    playPop();
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, popped: true } : b));
    setFlowers(prev => [...prev, { id: Date.now(), x: bubbles.find(b => b.id === id)?.x || 50, color: ["#ff6b9d","#c56ef2","#00b4d8","#f9844a","#52b788"][Math.floor(Math.random()*5)] }]);
    setTimeout(() => setFlowers(prev => prev.filter(f => f.id !== id + 999999)), 3000);
  };

  return (
    <div style={{ width:"100%", height:"100%", background:"linear-gradient(180deg,#1a0533,#0d1b4b)", position:"relative", overflow:"hidden" }}>
      {bubbles.map(b => !b.popped && (
        <button key={b.id} onClick={() => popBubble(b.id)}
          style={{ position:"absolute", left:`${b.x}%`, top:`${b.y}%`, width:b.size, height:b.size,
            borderRadius:"50%", background:b.color, border:"2px solid rgba(255,255,255,0.4)",
            cursor:"pointer", animation:"hg-float 3s ease-in-out infinite",
            boxShadow:`0 0 ${b.size/2}px ${b.color}88`, transition:"transform 0.1s",
            opacity:0.85, transform:"translate(-50%,-50%)" }} />
      ))}
      {flowers.map(f => (
        <div key={f.id} style={{ position:"absolute", left:`${f.x}%`, top:"70%",
          fontSize:"2.5rem", animation:"hg-bloom 0.5s ease forwards",
          transform:"translate(-50%,-50%)" }}>🌸</div>
      ))}
      <div style={{ position:"absolute", bottom:20, left:"50%", transform:"translateX(-50%)",
        color:"rgba(255,255,255,0.7)", fontSize:"0.9rem", textAlign:"center" }}>
        Tap bubbles to grow flowers 🌸<br/>
        <span style={{fontSize:"0.7rem",opacity:0.6}}>ಗುಳ್ಳೆ ಒಡೆದು ಹೂ ಅರಳಿಸಿ</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 2 — Star Collector Easy Win (Achievement Boost)
════════════════════════════════════════════════════════════════════════════ */
function StarCollector({ onCheckEmotion }) {
  const [stars, setStars] = useState([]);
  const [collected, setCollected] = useState(0);
  const [celebrated, setCelebrated] = useState(false);

  useEffect(() => {
    speak("Collect the stars! You are amazing! Every star is yours!", "en");
    const spawn = setInterval(() => {
      setStars(prev => [
        ...prev.slice(-30),
        { id: Date.now(), x: 5 + Math.random() * 90, speed: 1 + Math.random() }
      ]);
    }, 400);
    return () => clearInterval(spawn);
  }, []);

  const collectStar = (id) => {
    playStar();
    setStars(prev => prev.filter(s => s.id !== id));
    setCollected(prev => {
      const next = prev + 1;
      if (next % 5 === 0) speak(["Great! Awesome! Super!", "Keep going! You're on fire!", "Superstar!"][Math.floor(Math.random()*3)]);
      if (next >= 60 && !celebrated) { setCelebrated(true); playSuccess(); speak("You collected 60 stars! You are AMAZING!", "en"); }
      return next;
    });
  };

  return (
    <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#7c3aed,#db2777)", position:"relative", overflow:"hidden" }}>
      {/* Counter */}
      <div style={{ position:"absolute", top:20, left:"50%", transform:"translateX(-50%)",
        background:"rgba(255,255,255,0.15)", borderRadius:20, padding:"8px 24px",
        color:"#fff", fontWeight:900, fontSize:"1.4rem", zIndex:10 }}>
        ⭐ {collected} Stars
      </div>

      {/* Falling stars */}
      {stars.map(s => (
        <button key={s.id} onClick={() => collectStar(s.id)}
          style={{ position:"absolute", left:`${s.x}%`, top:"-5%",
            fontSize:"2.5rem", background:"none", border:"none", cursor:"pointer",
            animation:`hg-star-fall ${3/s.speed}s linear forwards`,
            filter:"drop-shadow(0 0 8px gold)" }}>⭐</button>
      ))}

      {celebrated && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center",
          justifyContent:"center", flexDirection:"column", background:"rgba(0,0,0,0.5)",
          color:"#fff", textAlign:"center", zIndex:20 }}>
          <div style={{fontSize:"4rem",animation:"hg-bounce 0.5s infinite"}}>🏆</div>
          <div style={{fontSize:"1.5rem",fontWeight:900}}>You collected 60 stars!</div>
          <div style={{fontSize:"1rem",opacity:0.8}}>YOU ARE AMAZING! 🌟</div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 3 — Bounce and Jump Movement (Physical)
════════════════════════════════════════════════════════════════════════════ */
const MOVEMENTS_BY_AGE = {
  "2-5":  [{ id:1, en:"Clap your hands 5 times! 👏", kn:"5 ಬಾರಿ ಚಪ್ಪಾಳೆ ತಟ್ಟಿ!", emoji:"👏" },
           { id:2, en:"Wave your arms! 🙌", kn:"ಕೈಗಳನ್ನು ಅಲ್ಲಾಡಿಸಿ!", emoji:"🙌" },
           { id:3, en:"Shake your head! 🤪", kn:"ತಲೆ ಅಲ್ಲಾಡಿಸಿ!", emoji:"🤪" },
           { id:4, en:"Big smile! 😄", kn:"ದೊಡ್ಡ ನಗು!", emoji:"😄" }],
  "5-8":  [{ id:1, en:"Jump 3 times! 🦘", kn:"3 ಬಾರಿ ಜಿಗಿಯಿರಿ!", emoji:"🦘" },
           { id:2, en:"Spin around once! 🌀", kn:"ಒಮ್ಮೆ ತಿರುಗಿ!", emoji:"🌀" },
           { id:3, en:"Touch your toes! 👟", kn:"ಬೆರಳು ಮುಟ್ಟಿ!", emoji:"👟" },
           { id:4, en:"Clap a pattern: clap-clap-JUMP! 👏👏🦘", kn:"ಚಪ್ಪಾಳೆ ಮಾಡಿ ಜಿಗಿಯಿರಿ!", emoji:"👏" }],
  "9-12": [{ id:1, en:"Jump 5 times fast! ⚡", kn:"ಚುರುಕಾಗಿ 5 ಬಾರಿ ಜಿಗಿಯಿರಿ!", emoji:"⚡" },
           { id:2, en:"Do 10 arm circles! 💫", kn:"10 ಬಾರಿ ಕೈ ಗುಂಡಗೆ ತಿರುಗಿಸಿ!", emoji:"💫" },
           { id:3, en:"Spin + clap rhythm! 🌀👏", kn:"ತಿರುಗಿ ಚಪ್ಪಾಳೆ!", emoji:"🌀" },
           { id:4, en:"Do 5 star jumps! ⭐", kn:"5 ನಕ್ಷತ್ರ ಜಿಗಿತ!", emoji:"⭐" },
           { id:5, en:"Shake it out and breathe! 🌬️", kn:"ಅಲ್ಲಾಡಿ ಉಸಿರಾಡಿ!", emoji:"🌬️" }],
};

function BounceJump({ childAge = 6, onCheckEmotion }) {
  const ageGroup = childAge <= 5 ? "2-5" : childAge <= 8 ? "5-8" : "9-12";
  const moves = MOVEMENTS_BY_AGE[ageGroup];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (step < moves.length) {
      speak(moves[step].en, "en");
    } else if (!done) { setDone(true); speak("Amazing! Great job! You did it!", "en"); playSuccess(); }
  }, [step]);

  return (
    <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#ff6b35,#f7c59f)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      {done ? (
        <div style={{ textAlign:"center", color:"#fff" }}>
          <div style={{fontSize:"5rem",animation:"hg-bounce 0.5s infinite"}}>🎉</div>
          <div style={{fontSize:"1.8rem",fontWeight:900}}>AMAZING! You did it!</div>
          <div style={{fontSize:"1rem",opacity:0.9}}>ಅದ್ಭುತ! ನೀವು ಮಾಡಿದಿರಿ!</div>
        </div>
      ) : (
        <>
          <div style={{fontSize:"5rem",animation:"hg-bounce 1s ease-in-out infinite"}}>{moves[step]?.emoji}</div>
          <div style={{fontSize:"1.5rem",fontWeight:900,color:"#fff",textAlign:"center",padding:"0 20px",marginTop:16}}>{moves[step]?.en}</div>
          <div style={{fontSize:"0.9rem",color:"rgba(255,255,255,0.8)",marginTop:8}}>{moves[step]?.kn}</div>
          <button onClick={() => setStep(s => s + 1)}
            style={{ marginTop:32, background:"rgba(255,255,255,0.25)", border:"3px solid rgba(255,255,255,0.8)",
              color:"#fff", fontWeight:900, fontSize:"1.2rem", padding:"16px 40px", borderRadius:32, cursor:"pointer" }}>
            ✅ Done! Next →
          </button>
          <div style={{marginTop:12,color:"rgba(255,255,255,0.7)",fontSize:"0.85rem"}}>{step+1} / {moves.length}</div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 4 — Silly Animal Show (Humor and Surprise)
════════════════════════════════════════════════════════════════════════════ */
const SILLY_ANIMALS = [
  { id:"dog",   emoji:"🐶", name:"Dog",   jokes:["Dog put on sunglasses and slid across the floor! 😎🛝","Dog tried to catch its tail... and fell over! 😂","Dog sneezed so hard it flew backwards! 💨"] },
  { id:"cat",   emoji:"🐱", name:"Cat",   jokes:["Cat sat in a tiny box even though it didn't fit! 📦😹","Cat sneezed and knocked over the fish bowl! 🐠💦","Cat was startled by a cucumber! 🥒😱"] },
  { id:"penguin",emoji:"🐧", name:"Penguin",jokes:["Penguin tried to dance but kept slipping! 💃🧊","Penguin wore a tiny tuxedo to the party! 🎩😂","Penguin tried to fly and belly-flopped! 🤣"] },
  { id:"elephant",emoji:"🐘", name:"Elephant",jokes:["Elephant sat on a tiny chair and it disappeared! 🪑😂","Elephant tried tiptoeing but shook the room! 🦶💥","Elephant used its trunk as a shower — for everyone nearby! 🚿😂"] },
  { id:"giraffe",emoji:"🦒", name:"Giraffe",jokes:["Giraffe tried to use a drinking straw! 🥤😅","Giraffe bumped its head on the moon! 🌙😂","Giraffe played peek-a-boo... no one could hide from them! 🙈"] },
];

function SillyAnimals({ onCheckEmotion }) {
  const [joke, setJoke]     = useState(null);
  const [bounceId, setBounceId] = useState(null);

  useEffect(() => { speak("Watch these silly animals! Tap them for funny surprises!", "en"); }, []);

  const tap = (animal) => {
    const j = animal.jokes[Math.floor(Math.random() * animal.jokes.length)];
    setJoke({ text: j, color: ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#ff922b"][Math.floor(Math.random()*5)] });
    setBounceId(animal.id);
    speak(j, "en");
    playTone(400 + Math.random() * 300, "sine", 0.4, 0.25);
    setTimeout(() => setBounceId(null), 1000);
  };

  return (
    <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#fff3d0,#ffe4e1)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <div style={{fontSize:"1.2rem",fontWeight:900,color:"#374151",marginBottom:8}}>Tap the animals for silly surprises! 😂</div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap", justifyContent:"center" }}>
        {SILLY_ANIMALS.map(a => (
          <button key={a.id} onClick={() => tap(a)}
            style={{ background:"#fff", border:"3px solid #fbbf24", borderRadius:24, padding:"16px 12px",
              fontSize:"3rem", cursor:"pointer",
              animation: bounceId === a.id ? "hg-bounce 0.3s infinite" : "hg-float 3s ease-in-out infinite",
              boxShadow: bounceId === a.id ? "0 0 20px #fbbf24" : "0 4px 12px rgba(0,0,0,0.1)",
              transition:"all 0.2s" }}>
            {a.emoji}
          </button>
        ))}
      </div>
      {joke && (
        <div style={{ background:joke.color, color:"#fff", borderRadius:20, padding:"14px 24px",
          fontWeight:900, fontSize:"1rem", textAlign:"center", maxWidth:400, marginTop:8,
          animation:"hg-slide-up 0.3s ease" }}>
          😂 {joke.text}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 5 — Magic Drawing Canvas (Creative Expression)
════════════════════════════════════════════════════════════════════════════ */
function MagicCanvas({ onCheckEmotion }) {
  const canvasRef = useRef(null);
  const drawing   = useRef(false);
  const lastPos   = useRef({ x: 0, y: 0 });
  const hue       = useRef(0);
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    speak("It's your magic canvas! Draw anything you want! No wrong way to draw!", "en");
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#0d1b2a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    if (e.touches) return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e) => { drawing.current = true; lastPos.current = getPos(e, canvasRef.current); };
  const stopDraw  = () => { drawing.current = false; };
  const draw = (e) => {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvasRef.current);
    hue.current = (hue.current + 2) % 360;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = `hsl(${hue.current}, 100%, 65%)`;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = `hsl(${hue.current}, 100%, 65%)`;
    ctx.stroke();
    // Sparkle effect
    setSparkles(prev => [...prev.slice(-15), { id: Date.now(), x: pos.x, y: pos.y, color: `hsl(${hue.current},100%,75%)` }]);
    lastPos.current = pos;
  };

  return (
    <div style={{ width:"100%", height:"100%", position:"relative", background:"#0d1b2a", overflow:"hidden" }}>
      <canvas ref={canvasRef} style={{ width:"100%", height:"100%", display:"block", cursor:"crosshair", touchAction:"none" }}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
      {sparkles.map(s => (
        <div key={s.id} style={{ position:"absolute", left:s.x-8, top:s.y-8, width:16, height:16,
          borderRadius:"50%", background:s.color, animation:"hg-sparkle 0.6s ease forwards",
          pointerEvents:"none" }} />
      ))}
      <div style={{ position:"absolute", top:10, left:"50%", transform:"translateX(-50%)",
        color:"rgba(255,255,255,0.6)", fontSize:"0.8rem", pointerEvents:"none" }}>
        Draw anything! 🎨 ✨ | ಏನಾದರೂ ಬಿಡಿಸಿ!
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 6 — Drum Beat Rhythm (Music and Sound)
════════════════════════════════════════════════════════════════════════════ */
const DRUM_PADS = [
  { id:"kick",  label:"BOOM",  color:"#ef4444", freq:80,  type:"sawtooth" },
  { id:"snare", label:"SNAP",  color:"#f97316", freq:200, type:"square"   },
  { id:"hihat", label:"TICK",  color:"#eab308", freq:800, type:"square"   },
  { id:"tom",   label:"TOM",   color:"#22c55e", freq:120, type:"triangle" },
  { id:"bell",  label:"DING",  color:"#06b6d4", freq:660, type:"sine"     },
  { id:"clap",  label:"CLAP",  color:"#a855f7", freq:400, type:"square"   },
];

const PATTERN = ["kick","snare","hihat","snare"];

function DrumBeat({ childAge = 6, onCheckEmotion }) {
  const [lit, setLit]           = useState({});
  const [tapCount, setTapCount] = useState(0);
  const [patternStep, setPatternStep] = useState(0);
  const [fireworks, setFireworks]     = useState(false);
  const [showPattern, setShowPattern] = useState(false);

  useEffect(() => {
    speak("Tap the drum pads! Make some music! Every tap sounds great!", "en");
    const t = setTimeout(() => setShowPattern(true), 30000);
    return () => clearTimeout(t);
  }, []);

  const tapPad = (pad) => {
    playDrum(pad.freq);
    setLit(prev => ({ ...prev, [pad.id]: true }));
    setTimeout(() => setLit(prev => ({ ...prev, [pad.id]: false })), 150);
    setTapCount(c => c + 1);

    if (showPattern) {
      if (pad.id === PATTERN[patternStep]) {
        const next = patternStep + 1;
        setPatternStep(next);
        if (next >= PATTERN.length) {
          setFireworks(true);
          playSuccess();
          speak("You completed the rhythm! Amazing!", "en");
          setTimeout(() => { setFireworks(false); setPatternStep(0); }, 2500);
        }
      } else {
        setPatternStep(0);
      }
    }
  };

  const pads = childAge <= 5 ? DRUM_PADS.slice(0, 4) : childAge <= 8 ? DRUM_PADS : DRUM_PADS;

  return (
    <div style={{ width:"100%", height:"100%", background:"#0f0f23", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:20 }}>
      <div style={{color:"#fff",fontWeight:900,fontSize:"1.1rem"}}>🥁 Tap the drums! | ತಬಲಾ ತಟ್ಟಿ!</div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, padding:"0 20px", width:"100%", maxWidth:380 }}>
        {pads.map(p => (
          <button key={p.id} onPointerDown={() => tapPad(p)}
            style={{ height:90, borderRadius:20, background: lit[p.id] ? "#fff" : p.color,
              border:"none", color: lit[p.id] ? p.color : "#fff", fontWeight:900, fontSize:"1rem",
              cursor:"pointer", boxShadow: lit[p.id] ? `0 0 30px ${p.color}` : `0 4px 15px ${p.color}55`,
              transition:"all 0.08s", transform: lit[p.id] ? "scale(0.95)" : "scale(1)" }}>
            {p.label}
          </button>
        ))}
      </div>
      {showPattern && (
        <div style={{ color:"rgba(255,255,255,0.8)", fontSize:"0.85rem", textAlign:"center" }}>
          🎵 Play: {PATTERN.map((id,i) => (
            <span key={i} style={{color: i < patternStep ? "#22c55e" : i === patternStep ? "#ffd93d" : "#555",fontWeight:900,margin:"0 4px"}}>
              {DRUM_PADS.find(p=>p.id===id)?.label}
            </span>
          ))}
        </div>
      )}
      {fireworks && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(0,0,0,0.6)", fontSize:"4rem", animation:"hg-bloom 0.3s ease", zIndex:10 }}>
          🎆🎆🎆
        </div>
      )}
      <div style={{color:"rgba(255,255,255,0.4)",fontSize:"0.75rem"}}>{tapCount} taps!</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 7 — Floating Stars Calm Down (Particle Visual + Breathing)
════════════════════════════════════════════════════════════════════════════ */
function FloatingStars({ onCheckEmotion }) {
  const [stars, setStars]       = useState([]);
  const [breathPhase, setBreath] = useState("in"); // "in" | "out"
  const [showBreath, setShowBreath] = useState(false);

  useEffect(() => {
    speak("Let's breathe together... watch the stars float gently...", "en");
    const addStar = setInterval(() => {
      setStars(prev => [...prev.slice(-40), {
        id: Date.now(), x: Math.random() * 100, size: 8 + Math.random() * 16,
        opacity: 0.3 + Math.random() * 0.5, speed: 0.5 + Math.random() * 0.8
      }]);
    }, 500);
    const showB = setTimeout(() => {
      setShowBreath(true);
      speak("Breathe in... breathe out... slowly...", "en");
    }, 30000);
    return () => { clearInterval(addStar); clearTimeout(showB); };
  }, []);

  useEffect(() => {
    if (!showBreath) return;
    const t = setInterval(() => setBreath(p => p === "in" ? "out" : "in"), 4000);
    return () => clearInterval(t);
  }, [showBreath]);

  return (
    <div style={{ width:"100%", height:"100%", background:"#000", position:"relative", overflow:"hidden" }}
      onClick={() => setStars(prev => [...prev, { id:Date.now(), x:Math.random()*100, size:12+Math.random()*12, opacity:0.6+Math.random()*0.4, speed:0.4 }])}>
      {stars.map(s => (
        <div key={s.id} style={{
          position:"absolute", left:`${s.x}%`, bottom:"-10%",
          width:s.size, height:s.size, borderRadius:"50%",
          background:"rgba(255,255,240,0.9)", boxShadow:`0 0 ${s.size}px rgba(255,255,200,0.5)`,
          opacity:s.opacity,
          animation:`hg-float ${4/s.speed}s ease-in-out infinite`,
          pointerEvents:"none" }} />
      ))}
      {showBreath && (
        <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
          <div style={{ width:100, height:100, borderRadius:"50%",
            border:"3px solid rgba(255,255,255,0.3)",
            background:"rgba(255,255,255,0.05)",
            animation:`hg-breathe ${breathPhase === "in" ? "4s" : "4s"} ease-in-out ${breathPhase === "in" ? "" : "reverse"} infinite` }} />
          <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"1.1rem", fontWeight:700, letterSpacing:2 }}>
            Breathe {breathPhase === "in" ? "in..." : "out..."}
          </div>
          <div style={{color:"rgba(255,255,255,0.3)",fontSize:"0.75rem"}}>
            {breathPhase === "in" ? "ಉಸಿರು ತೆಗೆದುಕೊಳ್ಳಿ..." : "ಉಸಿರು ಬಿಡಿ..."}
          </div>
        </div>
      )}
      {!showBreath && (
        <div style={{position:"absolute",bottom:20,left:"50%",transform:"translateX(-50%)",
          color:"rgba(255,255,255,0.4)",fontSize:"0.8rem",textAlign:"center"}}>
          Tap to add more stars 🌟<br/><span style={{fontSize:"0.65rem"}}>ನಕ್ಷತ್ರ ಸೇರಿಸಲು ತಟ್ಟಿ</span>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   GAME 8 — Virtual Pet Friend (Animal Interaction)
════════════════════════════════════════════════════════════════════════════ */
const PET_TYPES = {
  dog:   { emoji:"🐶", name:"Buddy",  sounds:["Woof! I love you!","You're my best friend!","Pet me more! Woof!"] },
  cat:   { emoji:"🐱", name:"Luna",   sounds:["Purrrr... 😊","Meow! You're amazing!","I'm so happy you're here!"] },
  bunny: { emoji:"🐰", name:"Hoppy",  sounds:["*happy nose twitch*","I love getting pets!","You make me so happy!"] },
};

function VirtualPet({ childAge = 6, childName = "Friend", onCheckEmotion }) {
  const petKey = ["dog","cat","bunny"][Math.floor(childAge / 5)] || "dog";
  const pet    = PET_TYPES[petKey];
  const [mood, setMood]       = useState("happy");
  const [message, setMessage] = useState(`${pet.name} says: Hello ${childName}! 🐾`);
  const [hearts, setHearts]   = useState([]);
  const [wagging, setWagging] = useState(false);

  useEffect(() => {
    speak(`Hi ${childName}! Meet ${pet.name}! Tap ${pet.name} to play!`, "en");
    const t = setInterval(() => {
      setMessage(`${pet.name} says: I love you ${childName}! 💕`);
      speak(`I love you ${childName}!`, "en");
    }, 15000);
    return () => clearInterval(t);
  }, []);

  const petAnimal = () => {
    playTone(523, "sine", 0.2);
    const msg = pet.sounds[Math.floor(Math.random() * pet.sounds.length)];
    setMessage(`${pet.name}: ${msg}`);
    speak(msg, "en");
    setWagging(true);
    setHearts(prev => [...prev.slice(-5), { id: Date.now(), x: 40 + Math.random() * 20 }]);
    setTimeout(() => setWagging(false), 1200);
  };

  const feedPet = () => {
    playTone(440, "sine", 0.15);
    setMessage(`${pet.name} loves the food! Yum! 😋`);
    speak(`Yum! Thank you ${childName}!`, "en");
    setWagging(true);
    setTimeout(() => setWagging(false), 1000);
  };

  return (
    <div style={{ width:"100%", height:"100%", background:"linear-gradient(135deg,#ffecd2,#fcb69f)", position:"relative", overflow:"hidden", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
      {/* Hearts */}
      {hearts.map(h => (
        <div key={h.id} style={{ position:"absolute", left:`${h.x}%`, bottom:"60%",
          fontSize:"1.5rem", animation:"hg-float 1.5s ease forwards", opacity:0, pointerEvents:"none" }}>❤️</div>
      ))}

      {/* Pet */}
      <div onClick={petAnimal} style={{ fontSize:"6rem",
        animation: wagging ? "hg-wag 0.3s ease infinite" : "hg-float 2s ease-in-out infinite",
        cursor:"pointer", userSelect:"none" }}>
        {pet.emoji}
      </div>

      {/* Message bubble */}
      <div style={{ background:"rgba(255,255,255,0.9)", borderRadius:20, padding:"12px 20px",
        fontWeight:900, color:"#374151", fontSize:"1rem", textAlign:"center", margin:"12px 20px",
        boxShadow:"0 4px 12px rgba(0,0,0,0.1)", maxWidth:280 }}>
        {message}
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:12, marginTop:8 }}>
        <button onClick={petAnimal} style={{ background:"#ec4899", color:"#fff", border:"none",
          padding:"12px 20px", borderRadius:20, fontWeight:900, cursor:"pointer", fontSize:"0.9rem" }}>
          🤗 Pet {pet.name}
        </button>
        <button onClick={feedPet} style={{ background:"#22c55e", color:"#fff", border:"none",
          padding:"12px 20px", borderRadius:20, fontWeight:900, cursor:"pointer", fontSize:"0.9rem" }}>
          🍖 Feed
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   HAPPINESS GAMES REGISTRY
════════════════════════════════════════════════════════════════════════════ */
export const HAPPINESS_GAMES = [
  { id:1, name:"Rainbow Bubble Garden",   nameKn:"ಗುಳ್ಳೆ ತೋಟ",          emoji:"🌸", triggers:["angry","fearful"],    duration:90,  component: BubbleGarden  },
  { id:2, name:"Star Collector",          nameKn:"ನಕ್ಷತ್ರ ಸಂಗ್ರಹ",       emoji:"⭐", triggers:["sad","score_drop"],   duration:90,  component: StarCollector },
  { id:3, name:"Bounce and Jump",         nameKn:"ಜಿಗಿ ಮತ್ತು ನೆಗೆ",     emoji:"🦘", triggers:["angry","frustrated"],  duration:90,  component: BounceJump    },
  { id:4, name:"Silly Animal Show",       nameKn:"ತಮಾಷೆ ಪ್ರಾಣಿ ಪ್ರದರ್ಶನ",emoji:"😂", triggers:["sad","low_engage"],   duration:90,  component: SillyAnimals  },
  { id:5, name:"Magic Drawing Canvas",    nameKn:"ಮ್ಯಾಜಿಕ್ ಕ್ಯಾನ್ವಾಸ್",   emoji:"🎨", triggers:["frustrated","sad"],   duration:120, component: MagicCanvas   },
  { id:6, name:"Drum Beat Rhythm",        nameKn:"ತಾಳ ಗಾನ",              emoji:"🥁", triggers:["angry"],               duration:120, component: DrumBeat      },
  { id:7, name:"Floating Stars Calm Down",nameKn:"ನಕ್ಷತ್ರ ಶಾಂತಿ",        emoji:"🌟", triggers:["fearful","overwhelmed"],duration:180, component: FloatingStars },
  { id:8, name:"Virtual Pet Friend",      nameKn:"ವರ್ಚುವಲ್ ಸ್ನೇಹಿತ",     emoji:"🐾", triggers:["sad","withdrawn"],     duration:120, component: VirtualPet    },
];

/* ════════════════════════════════════════════════════════════════════════════
   MAIN OVERLAY COMPONENT — HappinessGames
   Wraps all 8 games with emotion-driven auto-launch logic.
════════════════════════════════════════════════════════════════════════════ */
export default function HappinessGames({
  open,
  onClose,
  triggerEmotion = "sad",
  triggeredByScore = false,
  childAge = 6,
  childName = "Friend",
  language = "en",
  onEmotionCheck, // (gameId, resolved) => void
  gameIdOverride = null, // force a specific game
}) {
  const [gameId, setGameId]         = useState(gameIdOverride || 1);
  const [phase, setPhase]           = useState("playing"); // "playing" | "checking"
  const [timerLeft, setTimerLeft]   = useState(0);
  const [triedGames, setTriedGames] = useState([]);
  const timerRef = useRef(null);

  const selectGameForEmotion = useCallback((emotion, tried = []) => {
    const e = (emotion || "").toLowerCase();
    return selectHappinessGame(e, tried);
  }, []);

  // Pick best game for emotion on open
  useEffect(() => {
    if (!open) return;
    const chosen = gameIdOverride || selectGameForEmotion(triggerEmotion, triedGames);
    setGameId(chosen);
    setPhase("playing");
    const game = HAPPINESS_GAMES.find(g => g.id === chosen);
    setTimerLeft(game?.duration || 90);
  }, [open, triggerEmotion]);

  // Countdown timer
  useEffect(() => {
    if (!open || phase !== "playing") return;
    timerRef.current = setInterval(() => {
      setTimerLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setPhase("checking");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [open, phase, gameId]);

  const handleEmotionResponse = (isHappy) => {
    setTriedGames(prev => [...prev, gameId]);
    if (onEmotionCheck) onEmotionCheck(gameId, isHappy);
    if (isHappy) {
      onClose(true); // resolved
    } else {
      // Try next game
      const next = selectGameForEmotion(triggerEmotion, [...triedGames, gameId]);
      setGameId(next);
      setPhase("playing");
      const game = HAPPINESS_GAMES.find(g => g.id === next);
      setTimerLeft(game?.duration || 90);
    }
  };

  if (!open) return null;

  const game = HAPPINESS_GAMES.find(g => g.id === gameId);
  const GameComponent = game?.component;

  const triggerLabel = triggeredByScore
    ? "You've been working so hard! Let's take a fun break!"
    : {
        angry:    "We noticed you might be frustrated. Let's take a happy break! 💛",
        fearful:  "Let's take a calm, peaceful break 🌟",
        fear:     "Let's take a calm, peaceful break 🌟",
        sad:      "Let's brighten up your day! 🌈",
        frustrated: "You're doing amazing! Time for a quick fun break! 🎉",
      }[triggerEmotion.toLowerCase()] || "Let's take a fun break! 🎉";

  return (
    <div style={{ position:"fixed", inset:0, zIndex:99999, display:"flex", flexDirection:"column" }}>
      <style>{GLOBAL_CSS}</style>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#7c3aed,#ec4899)", padding:"12px 20px",
        display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
        <div style={{ color:"#fff" }}>
          <div style={{ fontWeight:900, fontSize:"1rem" }}>{game?.emoji} {language === "kn" ? game?.nameKn : game?.name}</div>
          <div style={{ fontSize:"0.75rem", opacity:0.85 }}>{triggerLabel}</div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {phase === "playing" && (
            <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:12, padding:"4px 12px",
              color:"#fff", fontWeight:900, fontSize:"0.85rem" }}>
              ⏱ {Math.floor(timerLeft/60)}:{String(timerLeft%60).padStart(2,"0")}
            </div>
          )}
          <button onClick={() => onClose(false)}
            style={{ background:"rgba(255,255,255,0.2)", border:"none", color:"#fff",
              width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:"1rem" }}>✕</button>
        </div>
      </div>

      {/* Game area */}
      <div style={{ flex:1, position:"relative", overflow:"hidden" }}>
        {phase === "playing" && GameComponent && (
          <GameComponent childAge={childAge} childName={childName} />
        )}

        {/* Emotion check overlay */}
        {phase === "checking" && (
          <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg,#1e1b4b,#312e81)",
            display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24, padding:24 }}>
            <div style={{ fontSize:"3rem", animation:"hg-bounce 1s ease-in-out infinite" }}>🌟</div>
            <div style={{ color:"#fff", fontWeight:900, fontSize:"1.3rem", textAlign:"center" }}>
              {language === "kn" ? "ಈಗ ನಿಮಗೆ ಹೇಗನ್ನಿಸುತ್ತಿದೆ?" : "How are you feeling now?"}
            </div>
            <div style={{ display:"flex", gap:20 }}>
              <button onClick={() => handleEmotionResponse(true)}
                style={{ background:"linear-gradient(135deg,#22c55e,#16a34a)", color:"#fff", border:"none",
                  padding:"20px 36px", borderRadius:24, fontWeight:900, fontSize:"1.3rem", cursor:"pointer",
                  boxShadow:"0 8px 24px rgba(34,197,94,0.5)" }}>
                😊 Happy!
              </button>
              <button onClick={() => handleEmotionResponse(false)}
                style={{ background:"linear-gradient(135deg,#3b82f6,#1d4ed8)", color:"#fff", border:"none",
                  padding:"20px 36px", borderRadius:24, fontWeight:900, fontSize:"1.3rem", cursor:"pointer",
                  boxShadow:"0 8px 24px rgba(59,130,246,0.5)" }}>
                😔 Still sad
              </button>
            </div>
            <div style={{ color:"rgba(255,255,255,0.6)", fontSize:"0.8rem", textAlign:"center" }}>
              {language === "kn" ? "ಸಂತೋಷವಾಗಿದ್ದರೆ ಆಟ ಮುಂದುವರಿಸೋಣ!" : "If you're feeling better, let's continue playing!"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
