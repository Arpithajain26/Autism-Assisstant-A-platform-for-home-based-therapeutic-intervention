import React, { useState } from "react";

/* ── 10 Assessment Questions ───────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 1,
    icon: "👂",
    area: "Response to Name",
    question: "Does your child respond when you call their name?",
    options: [
      { text: "Always responds immediately", score: 0 },
      { text: "Sometimes responds after calling 2-3 times", score: 1 },
      { text: "Rarely responds even after multiple calls", score: 2 },
      { text: "Never responds to their name", score: 3 },
    ],
  },
  {
    id: 2,
    icon: "👀",
    area: "Eye Contact",
    question: "Does your child make eye contact when talking to you?",
    options: [
      { text: "Makes frequent and natural eye contact", score: 0 },
      { text: "Makes occasional eye contact", score: 1 },
      { text: "Rarely makes eye contact", score: 2 },
      { text: "Never makes eye contact", score: 3 },
    ],
  },
  {
    id: 3,
    icon: "👉",
    area: "Pointing",
    question: "Does your child point to things they want or find interesting?",
    options: [
      { text: "Yes points clearly to show and request things", score: 0 },
      { text: "Sometimes points but not consistently", score: 1 },
      { text: "Rarely points — mostly pulls parent by hand", score: 2 },
      { text: "Never points to anything", score: 3 },
    ],
  },
  {
    id: 4,
    icon: "😊",
    area: "Social Smiling",
    question: "Does your child smile back when you smile at them?",
    options: [
      { text: "Always smiles back immediately", score: 0 },
      { text: "Sometimes smiles back", score: 1 },
      { text: "Rarely smiles back", score: 2 },
      { text: "Never smiles back or shows no facial response", score: 3 },
    ],
  },
  {
    id: 5,
    icon: "🗣️",
    area: "Communication",
    question: "How does your child communicate their basic needs?",
    options: [
      { text: "Uses full sentences to express needs clearly", score: 0 },
      { text: "Uses single words or short phrases", score: 1 },
      { text: "Uses gestures, pointing, or crying only", score: 2 },
      { text: "Cannot communicate needs at all", score: 3 },
    ],
  },
  {
    id: 6,
    icon: "🎭",
    area: "Pretend Play",
    question: "Does your child engage in pretend or imaginative play?",
    options: [
      { text: "Yes plays pretend regularly and creatively", score: 0 },
      { text: "Occasionally shows pretend play", score: 1 },
      { text: "Rarely shows any imaginative play", score: 2 },
      { text: "No pretend play at all", score: 3 },
    ],
  },
  {
    id: 7,
    icon: "🧭",
    area: "Following Instructions",
    question: "Does your child follow simple one-step instructions?",
    options: [
      { text: "Follows instructions immediately and correctly", score: 0 },
      { text: "Follows after repeating the instruction 2-3 times", score: 1 },
      { text: "Rarely follows instructions", score: 2 },
      { text: "Does not follow any instructions", score: 3 },
    ],
  },
  {
    id: 8,
    icon: "🔁",
    area: "Repetitive Behaviors",
    question:
      "Does your child show repetitive body movements like hand flapping, rocking, or spinning?",
    options: [
      { text: "No repetitive movements observed", score: 0 },
      { text: "Mild and occasional repetitive movements", score: 1 },
      { text: "Frequent repetitive movements daily", score: 2 },
      { text: "Constant repetitive movements throughout the day", score: 3 },
    ],
  },
  {
    id: 9,
    icon: "🧩",
    area: "Routine Changes",
    question:
      "Does your child get very upset when daily routines or plans are changed?",
    options: [
      { text: "Adjusts to changes easily without distress", score: 0 },
      { text: "Mild distress but settles quickly", score: 1 },
      { text: "Significant distress and takes long to calm down", score: 2 },
      { text: "Extreme distress with any change in routine", score: 3 },
    ],
  },
  {
    id: 10,
    icon: "🎧",
    area: "Sensory Sensitivity",
    question:
      "How does your child react to loud sounds, bright lights, or certain textures?",
    options: [
      { text: "Normal reaction — not bothered by them", score: 0 },
      { text: "Slightly sensitive but manageable", score: 1 },
      { text: "Very sensitive — avoids or cries frequently", score: 2 },
      {
        text: "Extreme distress — covers ears, eyes, or has meltdowns",
        score: 3,
      },
    ],
  },
];

/* ── Category thresholds (score out of 30) ─────────────────────────────── */
const getCategory = (total) => {
  if (total <= 10)
    return {
      level: 1,
      label: "Level 1 — Emerging",
      sublabel: "Requiring Support",
      emoji: "🌱",
      color: "#166534",
      bg: "#dcfce7",
      border: "#86efac",
      desc: "Your child shows strong foundational skills. Activities will focus on building communication, social confidence, and independence.",
      activities: "Communication games, peer play, fine motor tasks",
    };
  if (total <= 20)
    return {
      level: 2,
      label: "Level 2 — Developing",
      sublabel: "Substantial Support",
      emoji: "🌿",
      color: "#854d0e",
      bg: "#fef9c3",
      border: "#fde047",
      desc: "Your child is developing core skills. Activities will focus on social interaction, emotional regulation, and daily routines.",
      activities: "Routine-building, emotion cards, group activities",
    };
  return {
    level: 3,
    label: "Level 3 — Advancing",
    sublabel: "Very Substantial Support",
    emoji: "🌳",
    color: "#991b1b",
    bg: "#fee2e2",
    border: "#fca5a5",
    desc: "Your child benefits from intensive support. Activities will focus on sensory regulation, basic communication, and structured routines.",
    activities: "Sensory play, visual schedules, 1-on-1 tasks",
  };
};

/* ══════════════════════════════════════════════════════════════════════════ */
const AssessmentModal = ({ childName, onComplete, onSkip }) => {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: score }
  const [result, setResult] = useState(null);
  const [animating, setAnimating] = useState(false);

  const q = QUESTIONS[current];
  const total = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const progress = (current / total) * 100;

  const handleAnswer = (score) => {
    if (animating) return;
    const updated = { ...answers, [q.id]: score };
    setAnswers(updated);

    if (current < total - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((c) => c + 1);
        setAnimating(false);
      }, 350);
    } else {
      // All answered — calculate result
      const sum = Object.values(updated).reduce((a, b) => a + b, 0);
      setResult(getCategory(sum));
    }
  };

  /* ── Result screen ─────────────────────────────────────────────────────── */
  if (result) {
    return (
      <div style={{ textAlign: "center" }}>
        {/* Animated checkmark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: result.bg,
            border: `3px solid ${result.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "2.5rem",
            margin: "0 auto 20px",
            animation: "popIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)",
          }}
        >
          {result.emoji}
        </div>

        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "800",
            marginBottom: "4px",
            color: "#111827",
          }}
        >
          Assessment Complete!
        </h3>
        <p
          style={{
            color: "#6b7280",
            fontSize: "0.88rem",
            marginBottom: "24px",
          }}
        >
          Based on {answered} questions about {childName}
        </p>

        {/* Category card */}
        <div
          style={{
            background: result.bg,
            border: `2px solid ${result.border}`,
            borderRadius: "16px",
            padding: "24px",
            marginBottom: "20px",
            textAlign: "left",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "2rem" }}>{result.emoji}</span>
            <div>
              <div
                style={{
                  fontWeight: "800",
                  fontSize: "1.2rem",
                  color: result.color,
                }}
              >
                {result.label}
              </div>
              <div
                style={{
                  fontSize: "0.8rem",
                  color: result.color,
                  opacity: 0.8,
                }}
              >
                {result.sublabel}
              </div>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.88rem",
              color: result.color,
              lineHeight: 1.6,
              margin: "0 0 12px",
            }}
          >
            {result.desc}
          </p>
          <div
            style={{ fontSize: "0.8rem", color: result.color, opacity: 0.85 }}
          >
            <strong>Recommended activities:</strong> {result.activities}
          </div>
        </div>

        {/* Score breakdown */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          {QUESTIONS.map((q2) => (
            <div
              key={q2.id}
              style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "8px 12px",
                textAlign: "center",
                minWidth: "70px",
              }}
            >
              <div style={{ fontSize: "1.1rem" }}>{q2.icon}</div>
              <div
                style={{
                  fontSize: "0.68rem",
                  color: "#6b7280",
                  marginTop: "2px",
                }}
              >
                {q2.area}
              </div>
              <div
                style={{
                  fontWeight: "700",
                  color: "#111827",
                  fontSize: "0.9rem",
                }}
              >
                {answers[q2.id]}/4
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onComplete(result.level, result.label)}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            color: "white",
            fontWeight: "700",
            fontSize: "1rem",
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 4px 15px rgba(124,58,237,0.4)",
          }}
        >
          ✨ Save & Go to Dashboard
        </button>
      </div>
    );
  }

  /* ── Question screen ────────────────────────────────────────────────────── */
  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>{q.icon}</div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "#f3f4f6",
            borderRadius: "20px",
            padding: "4px 14px",
            fontSize: "0.78rem",
            fontWeight: "600",
            color: "#6b7280",
            marginBottom: "12px",
          }}
        >
          Question {current + 1} of {total} · {q.area}
        </div>

        {/* Progress bar */}
        <div
          style={{
            width: "100%",
            height: "6px",
            background: "#e5e7eb",
            borderRadius: "3px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: "100%",
              background: "linear-gradient(90deg, #7c3aed, #4f46e5)",
              borderRadius: "3px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Question bubble dots */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        {QUESTIONS.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: "4px",
              background: answers[QUESTIONS[i].id]
                ? "#7c3aed"
                : i === current
                  ? "#a78bfa"
                  : "#e5e7eb",
              transition: "all 0.3s ease",
            }}
          />
        ))}
      </div>

      {/* Question text */}
      <h3
        style={{
          fontSize: "1.15rem",
          fontWeight: "700",
          color: "#111827",
          lineHeight: 1.5,
          marginBottom: "20px",
          textAlign: "center",
          opacity: animating ? 0 : 1,
          transform: animating ? "translateY(-8px)" : "translateY(0)",
          transition: "all 0.3s ease",
        }}
      >
        {q.question}
      </h3>

      {/* Answer options */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          opacity: animating ? 0 : 1,
          transition: "opacity 0.3s ease",
        }}
      >
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === opt.score;
          const letters = ["A", "B", "C", "D"];
          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt.score)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 18px",
                borderRadius: "12px",
                border: "none",
                background: selected
                  ? "linear-gradient(135deg, #ede9fe, #ddd6fe)"
                  : "#f9fafb",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "all 0.2s",
                boxShadow: selected
                  ? "0 0 0 2px #7c3aed"
                  : "0 1px 3px rgba(0,0,0,0.06)",
                transform: selected ? "scale(1.01)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!selected) e.currentTarget.style.background = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                if (!selected) e.currentTarget.style.background = "#f9fafb";
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "8px",
                  flexShrink: 0,
                  background: selected ? "#7c3aed" : "#e5e7eb",
                  color: selected ? "white" : "#6b7280",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.8rem",
                }}
              >
                {selected ? "✓" : letters[i]}
              </span>
              <span
                style={{
                  fontSize: "0.9rem",
                  fontWeight: selected ? "700" : "500",
                  color: selected ? "#4c1d95" : "#374151",
                  lineHeight: 1.4,
                }}
              >
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Skip option */}
      <button
        onClick={onSkip}
        style={{
          display: "block",
          margin: "20px auto 0",
          background: "none",
          border: "none",
          color: "#9ca3af",
          fontSize: "0.82rem",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        Skip assessment, I'll do it later →
      </button>
    </div>
  );
};

export default AssessmentModal;
