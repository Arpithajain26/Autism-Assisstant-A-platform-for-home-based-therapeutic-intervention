import React, { useState } from 'react';

export default function SymptomCheckModal({ onClose, onContinueToPlatform }) {
  const [currentStep, setCurrentStep] = useState(0); // 0: Questions, 1: Result
  const [answers, setAnswers] = useState({
    eyeContact: null,
    repetitiveBehavior: null,
    speechDelay: null,
    sensoryMeltdowns: null,
  });

  const questions = [
    {
      id: 'eyeContact',
      icon: '👀',
      title: 'Eye Contact & Name Response',
      question: 'Does your child frequently avoid eye contact or fail to respond when their name is called?',
    },
    {
      id: 'repetitiveBehavior',
      icon: '🔄',
      title: 'Repetitive Behaviors & Routines',
      question: 'Does your child show repetitive body movements (hand flapping, spinning) or get extremely upset by minor routine changes?',
    },
    {
      id: 'speechDelay',
      icon: '🗣️',
      title: 'Communication & Gestures',
      question: 'Does your child have speech delays, rarely point to express needs, or struggle with social interaction?',
    },
    {
      id: 'sensoryMeltdowns',
      icon: '🎧',
      title: 'Sensory Sensitivity',
      question: 'Does your child experience intense distress or meltdowns with loud sounds, bright lights, or specific textures?',
    },
  ];

  const handleAnswer = (questionId, value) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);

    // If more questions exist, go to next
    const answeredCount = Object.values(updated).filter((v) => v !== null).length;
    if (answeredCount < questions.length) {
      setCurrentStep(answeredCount);
    } else {
      setCurrentStep(questions.length); // Finished all questions
    }
  };

  const hasSymptoms = Object.values(answers).some((v) => v === true);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '24px',
          padding: '32px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.6rem' }}>🩺</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                Early Symptoms Screening
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                Quick 4-Question Parent Self-Check
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              cursor: 'pointer',
              color: '#64748b',
              fontWeight: 800,
            }}
          >
            ✕
          </button>
        </div>

        {/* QUESTIONS STAGE */}
        {currentStep < questions.length ? (
          <div>
            {/* Step Progress Dots */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  style={{
                    height: 6,
                    flex: 1,
                    borderRadius: 3,
                    background: idx <= currentStep ? '#6366f1' : '#e2e8f0',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>

            {/* Question Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                marginBottom: '24px',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                {questions[currentStep].icon}
              </div>
              <div
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: '#6366f1',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '6px',
                }}
              >
                Question {currentStep + 1} of {questions.length} &bull; {questions[currentStep].title}
              </div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.5 }}>
                {questions[currentStep].question}
              </h4>
            </div>

            {/* Answer Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <button
                onClick={() => handleAnswer(questions[currentStep].id, true)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '2px solid #fca5a5',
                  background: '#fef2f2',
                  color: '#991b1b',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ⚠️ Yes, Observed
              </button>

              <button
                onClick={() => handleAnswer(questions[currentStep].id, false)}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  border: '2px solid #86efac',
                  background: '#f0fdf4',
                  color: '#166534',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                ✅ No / Not Observed
              </button>
            </div>
          </div>
        ) : (
          /* RESULT STAGE */
          <div>
            {hasSymptoms ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #fef2f2 0%, #fff1f2 100%)',
                  borderRadius: '18px',
                  padding: '24px',
                  border: '2px solid #fca5a5',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🚨</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800, color: '#991b1b' }}>
                  Early Symptoms Identified
                </h3>
                <p style={{ color: '#7f1d1d', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                  Based on your responses, early developmental markers have been identified. We strongly recommend continuing to our platform to complete the full clinical Q-CHAT-10 assessment and auto-assign a specialized age-group therapist.
                </p>

                <div
                  style={{
                    background: 'white',
                    borderRadius: '12px',
                    padding: '12px',
                    fontSize: '0.85rem',
                    color: '#475569',
                    textAlign: 'left',
                    marginBottom: '16px',
                    border: '1px solid #fecdd3',
                  }}
                >
                  <strong>Summary of Flagged Indicators:</strong>
                  <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px' }}>
                    {answers.eyeContact && <li>Difficulty with eye contact / name response</li>}
                    {answers.repetitiveBehavior && <li>Repetitive body movements or routine rigidity</li>}
                    {answers.speechDelay && <li>Communication delay / difficulty expressing needs</li>}
                    {answers.sensoryMeltdowns && <li>Sensory distress / hypersensitivity</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                  borderRadius: '18px',
                  padding: '24px',
                  border: '2px solid #86efac',
                  textAlign: 'center',
                  marginBottom: '24px',
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🎉</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: 800, color: '#166534' }}>
                  No Early Symptoms Detected!
                </h3>
                <p style={{ color: '#14532d', fontSize: '0.92rem', lineHeight: 1.6, margin: 0 }}>
                  Based on your responses, no typical early autism symptoms were flagged at this stage. You can explore our awareness articles, try developmental games, or exit the screening.
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
              {hasSymptoms ? (
                <button
                  onClick={onContinueToPlatform}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  🚀 Continue to Platform & Take Full Q-CHAT-10 →
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      onClose();
                      document.getElementById('autism-info')?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: '1px solid #cbd5e1',
                      background: 'white',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                    }}
                  >
                    📚 Read Autism Awareness
                  </button>

                  <button
                    onClick={onClose}
                    style={{
                      flex: 1,
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      background: '#475569',
                      color: 'white',
                      fontWeight: 800,
                      cursor: 'pointer',
                      fontSize: '0.88rem',
                    }}
                  >
                    ✕ Exit Screening
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
