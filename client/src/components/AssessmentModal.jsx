import React, { useState } from 'react';

/* ── 6 Assessment Questions ─────────────────────────────────────────────── */
const QUESTIONS = [
  {
    id: 1,
    icon: '💬',
    area: 'Communication',
    question: 'How does your child currently communicate their needs?',
    options: [
      { text: 'Uses clear sentences and conversation', score: 4 },
      { text: 'Uses simple words or short phrases', score: 3 },
      { text: 'Points, gestures or uses pictures', score: 2 },
      { text: 'Crying or physical cues only', score: 1 },
    ],
  },
  {
    id: 2,
    icon: '👫',
    area: 'Social Interaction',
    question: 'How does your child interact with other children?',
    options: [
      { text: 'Plays cooperatively and joins group activities', score: 4 },
      { text: 'Plays alongside others with some interaction', score: 3 },
      { text: 'Prefers to play alone but watches others', score: 2 },
      { text: 'Avoids or shows no interest in other children', score: 1 },
    ],
  },
  {
    id: 3,
    icon: '🔄',
    area: 'Routine & Flexibility',
    question: 'How does your child handle changes in their daily routine?',
    options: [
      { text: 'Adapts easily with little distress', score: 4 },
      { text: 'Manages with advance warning or preparation', score: 3 },
      { text: 'Shows significant anxiety but recovers', score: 2 },
      { text: 'Extreme distress or meltdowns with any change', score: 1 },
    ],
  },
  {
    id: 4,
    icon: '✋',
    area: 'Motor & Self-Care',
    question: 'Which best describes your child\'s self-care abilities?',
    options: [
      { text: 'Independent in most self-care tasks (dressing, eating)', score: 4 },
      { text: 'Needs occasional prompting but mostly independent', score: 3 },
      { text: 'Needs regular support for most tasks', score: 2 },
      { text: 'Requires full assistance for all daily tasks', score: 1 },
    ],
  },
  {
    id: 5,
    icon: '👁️',
    area: 'Sensory Processing',
    question: 'How does your child respond to sensory input (sounds, textures, lights)?',
    options: [
      { text: 'Generally comfortable in most environments', score: 4 },
      { text: 'Occasional sensitivity but manages well', score: 3 },
      { text: 'Frequently overwhelmed and seeks sensory input', score: 2 },
      { text: 'Extreme reactions that limit daily participation', score: 1 },
    ],
  },
  {
    id: 6,
    icon: '😊',
    area: 'Emotional Regulation',
    question: 'How well does your child manage their emotions?',
    options: [
      { text: 'Identifies and expresses emotions appropriately', score: 4 },
      { text: 'Needs some support to calm down', score: 3 },
      { text: 'Frequent emotional outbursts, needs strategies', score: 2 },
      { text: 'Very intense reactions, difficult to console', score: 1 },
    ],
  },
];

/* ── Category thresholds (score out of 24) ──────────────────────────────── */
const getCategory = (total) => {
  if (total >= 19) return {
    level: 1,
    label: 'Level 1 — Emerging',
    sublabel: 'Requiring Support',
    emoji: '🌱',
    color: '#166534',
    bg: '#dcfce7',
    border: '#86efac',
    desc: 'Your child shows strong foundational skills. Activities will focus on building communication, social confidence, and independence.',
    activities: 'Communication games, peer play, fine motor tasks',
  };
  if (total >= 12) return {
    level: 2,
    label: 'Level 2 — Developing',
    sublabel: 'Substantial Support',
    emoji: '🌿',
    color: '#854d0e',
    bg: '#fef9c3',
    border: '#fde047',
    desc: 'Your child is developing core skills. Activities will focus on social interaction, emotional regulation, and daily routines.',
    activities: 'Routine-building, emotion cards, group activities',
  };
  return {
    level: 3,
    label: 'Level 3 — Advancing',
    sublabel: 'Very Substantial Support',
    emoji: '🌳',
    color: '#991b1b',
    bg: '#fee2e2',
    border: '#fca5a5',
    desc: 'Your child benefits from intensive support. Activities will focus on sensory regulation, basic communication, and structured routines.',
    activities: 'Sensory play, visual schedules, 1-on-1 tasks',
  };
};

/* ══════════════════════════════════════════════════════════════════════════ */
const AssessmentModal = ({ childName, onComplete, onSkip }) => {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState({}); // { questionId: score }
  const [result, setResult]     = useState(null);
  const [animating, setAnimating] = useState(false);

  const q      = QUESTIONS[current];
  const total  = QUESTIONS.length;
  const answered = Object.keys(answers).length;
  const progress = ((current) / total) * 100;

  const handleAnswer = (score) => {
    if (animating) return;
    const updated = { ...answers, [q.id]: score };
    setAnswers(updated);

    if (current < total - 1) {
      setAnimating(true);
      setTimeout(() => {
        setCurrent(c => c + 1);
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
      <div style={{ textAlign: 'center' }}>
        {/* Animated checkmark */}
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: result.bg, border: `3px solid ${result.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2.5rem', margin: '0 auto 20px',
          animation: 'popIn 0.4s cubic-bezier(0.68,-0.55,0.265,1.55)',
        }}>
          {result.emoji}
        </div>

        <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '4px', color: '#111827' }}>
          Assessment Complete!
        </h3>
        <p style={{ color: '#6b7280', fontSize: '0.88rem', marginBottom: '24px' }}>
          Based on {answered} questions about {childName}
        </p>

        {/* Category card */}
        <div style={{
          background: result.bg, border: `2px solid ${result.border}`,
          borderRadius: '16px', padding: '24px', marginBottom: '20px', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <span style={{ fontSize: '2rem' }}>{result.emoji}</span>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.2rem', color: result.color }}>{result.label}</div>
              <div style={{ fontSize: '0.8rem', color: result.color, opacity: 0.8 }}>{result.sublabel}</div>
            </div>
          </div>
          <p style={{ fontSize: '0.88rem', color: result.color, lineHeight: 1.6, margin: '0 0 12px' }}>
            {result.desc}
          </p>
          <div style={{ fontSize: '0.8rem', color: result.color, opacity: 0.85 }}>
            <strong>Recommended activities:</strong> {result.activities}
          </div>
        </div>

        {/* Score breakdown */}
        <div style={{
          display: 'flex', gap: '8px', justifyContent: 'center',
          marginBottom: '24px', flexWrap: 'wrap',
        }}>
          {QUESTIONS.map(q2 => (
            <div key={q2.id} style={{
              background: '#f9fafb', border: '1px solid #e5e7eb',
              borderRadius: '10px', padding: '8px 12px', textAlign: 'center', minWidth: '70px',
            }}>
              <div style={{ fontSize: '1.1rem' }}>{q2.icon}</div>
              <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '2px' }}>{q2.area}</div>
              <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.9rem' }}>
                {answers[q2.id]}/4
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onComplete(result.level, result.label)}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            color: 'white', fontWeight: '700', fontSize: '1rem',
            cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
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
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{q.icon}</div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: '#f3f4f6', borderRadius: '20px', padding: '4px 14px',
          fontSize: '0.78rem', fontWeight: '600', color: '#6b7280', marginBottom: '12px',
        }}>
          Question {current + 1} of {total} · {q.area}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '6px', background: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
            borderRadius: '3px', transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Question bubble dots */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '20px' }}>
        {QUESTIONS.map((_, i) => (
          <div key={i} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: '4px',
            background: answers[QUESTIONS[i].id] ? '#7c3aed' : i === current ? '#a78bfa' : '#e5e7eb',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Question text */}
      <h3 style={{
        fontSize: '1.15rem', fontWeight: '700', color: '#111827',
        lineHeight: 1.5, marginBottom: '20px', textAlign: 'center',
        opacity: animating ? 0 : 1, transform: animating ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.3s ease',
      }}>
        {q.question}
      </h3>

      {/* Answer options */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '10px',
        opacity: animating ? 0 : 1, transition: 'opacity 0.3s ease',
      }}>
        {q.options.map((opt, i) => {
          const selected = answers[q.id] === opt.score;
          const letters  = ['A', 'B', 'C', 'D'];
          return (
            <button
              key={i}
              onClick={() => handleAnswer(opt.score)}
              style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px', borderRadius: '12px', border: 'none',
                background: selected
                  ? 'linear-gradient(135deg, #ede9fe, #ddd6fe)'
                  : '#f9fafb',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                transition: 'all 0.2s',
                boxShadow: selected ? '0 0 0 2px #7c3aed' : '0 1px 3px rgba(0,0,0,0.06)',
                transform: selected ? 'scale(1.01)' : 'scale(1)',
              }}
              onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f3f4f6'; }}
              onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#f9fafb'; }}
            >
              <span style={{
                width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                background: selected ? '#7c3aed' : '#e5e7eb',
                color: selected ? 'white' : '#6b7280',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '700', fontSize: '0.8rem',
              }}>
                {selected ? '✓' : letters[i]}
              </span>
              <span style={{
                fontSize: '0.9rem', fontWeight: selected ? '700' : '500',
                color: selected ? '#4c1d95' : '#374151', lineHeight: 1.4,
              }}>
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
          display: 'block', margin: '20px auto 0', background: 'none', border: 'none',
          color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Skip assessment, I'll do it later →
      </button>
    </div>
  );
};

export default AssessmentModal;
