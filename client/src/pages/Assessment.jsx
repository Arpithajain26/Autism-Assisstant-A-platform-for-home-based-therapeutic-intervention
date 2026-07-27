import React, { useState, useEffect } from 'react';
import { getAssessmentQuestions, submitAssessment } from '../services/api';

const LEVEL_INFO = {
  1: { label: 'Level 1 — Emerging', color: '#166534', bg: '#dcfce7', emoji: '🌱', desc: 'Foundation activities focusing on sensory, motor, and basic communication skills.' },
  2: { label: 'Level 2 — Developing', color: '#854d0e', bg: '#fef9c3', emoji: '🌿', desc: 'Intermediate activities building social interaction, emotional skills, and daily life tasks.' },
  3: { label: 'Level 3 — Advancing', color: '#991b1b', bg: '#fee2e2', emoji: '🌳', desc: 'Advanced activities for complex social scenarios, emotional regulation, and independence.' },
};

const Assessment = ({ child, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    getAssessmentQuestions().then(q => { setQuestions(q); setLoading(false); });
  }, []);

  const total = questions.length;
  const answered = Object.keys(answers).length;
  const progress = total > 0 ? (answered / total) * 100 : 0;

  const handleAnswer = (questionId, score) => {
    setAnswers(a => ({ ...a, [questionId]: score }));
    if (current < total - 1) setTimeout(() => setCurrent(c => c + 1), 300);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const scoreArray = questions.map(q => answers[q.id] || 1);
    const data = await submitAssessment(child._id, scoreArray);
    setResult(data);
    setSubmitting(false);
  };

  if (loading) return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <span className="spinner" style={{ width:36, height:36 }} />
      <p style={{ marginTop:'16px', color:'var(--text-muted)' }}>Loading assessment...</p>
    </div>
  );

  if (result) {
    const lvl = LEVEL_INFO[result.level];
    return (
      <div className="fade-in" style={{ maxWidth:'560px', margin:'0 auto', padding:'20px', textAlign:'center' }}>
        <div style={{ fontSize:'4rem', marginBottom:'16px' }}>{lvl.emoji}</div>
        <h2 style={{ fontSize:'2rem', fontWeight:'800', marginBottom:'8px' }}>Assessment Complete!</h2>
        <div style={{ background: lvl.bg, color: lvl.color, borderRadius:'12px', padding:'20px', margin:'20px 0' }}>
          <div style={{ fontWeight:'800', fontSize:'1.4rem', marginBottom:'6px' }}>{lvl.label}</div>
          <p style={{ fontSize:'0.95rem' }}>{lvl.desc}</p>
        </div>
        <p style={{ color:'var(--text-muted)', marginBottom:'28px', fontSize:'0.95rem' }}>
          {result.assignedTasks.length} personalised activities have been assigned to you.
        </p>
        <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center', padding:'14px' }} onClick={() => onComplete(result.level)}>
          Start My Activities 🚀
        </button>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="fade-in" style={{ maxWidth:'600px', margin:'0 auto', padding:'20px' }}>
      <div style={{ marginBottom:'32px', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>📋</div>
        <h2 style={{ fontSize:'1.8rem', fontWeight:'800', marginBottom:'8px' }}>Child Level Assessment</h2>
        <p style={{ color:'var(--text-muted)' }}>Answer honestly about {child.name}'s current abilities to get the best activity recommendations.</p>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:'32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px', fontSize:'0.85rem', color:'var(--text-muted)' }}>
          <span>Question {Math.min(current + 1, total)} of {total}</span>
          <span>{answered} answered</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Question tabs */}
      <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'24px' }}>
        {questions.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)} style={{
            width:32, height:32, borderRadius:'50%', border:'2px solid',
            borderColor: answers[questions[i].id] ? 'var(--green)' : i===current ? 'var(--primary)' : 'var(--border)',
            background: answers[questions[i].id] ? 'var(--green-light)' : i===current ? 'var(--primary-light)' : 'white',
            color: answers[questions[i].id] ? 'var(--green)' : i===current ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight:'700', fontSize:'0.8rem', cursor:'pointer',
          }}>
            {answers[questions[i].id] ? '✓' : i + 1}
          </button>
        ))}
      </div>

      {/* Current Question Card */}
      {q && (
        <div className="card" key={q.id}>
          <h3 style={{ fontSize:'1.2rem', fontWeight:'700', marginBottom:'24px', lineHeight:'1.5' }}>{q.question}</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {q.options.map((opt, i) => {
              const score = q.scores[i];
              const selected = answers[q.id] === score;
              return (
                <button key={i} onClick={() => handleAnswer(q.id, score)} style={{
                  padding:'14px 18px',
                  borderRadius:'10px',
                  border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                  background: selected ? 'var(--primary-light)' : 'white',
                  color: selected ? 'var(--primary-dark)' : 'var(--text)',
                  fontFamily:'inherit', fontSize:'0.95rem', fontWeight: selected ? '700' : '500',
                  cursor:'pointer', textAlign:'left', transition:'all 0.2s',
                }}>
                  <span style={{ marginRight:'10px', opacity:0.5 }}>{['A','B','C','D'][i]}.</span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'24px', gap:'12px' }}>
        <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current===0}>← Previous</button>
        {current < total - 1
          ? <button className="btn btn-primary" onClick={() => setCurrent(c => Math.min(total-1, c+1))}>Next →</button>
          : <button className="btn btn-success" onClick={handleSubmit}
              disabled={answered < total || submitting} style={{ flex:1, justifyContent:'center' }}>
              {submitting ? <><span className="spinner" style={{width:18,height:18}} /> Analyzing...</> : '✓ Submit Assessment'}
            </button>
        }
      </div>
      {answered < total && current === total - 1 && (
        <p style={{ textAlign:'center', color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'12px' }}>
          Please answer all {total} questions to submit.
        </p>
      )}
    </div>
  );
};

export default Assessment;
