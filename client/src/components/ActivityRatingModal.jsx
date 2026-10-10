import React, { useState, useEffect } from 'react';
import { logActivityCompletion } from '../services/api';
import { getHappyBoosterActivity } from '../data/curatedActivities';

export default function ActivityRatingModal({
  childId,
  childName = 'Child',
  childAge = 4,
  childLevel = 1,
  activityId,
  activityTitle = 'Activity',
  initialScore = 80,
  detectedEmotion = 'Happy',
  emotionConfidence = 88,
  onComplete,
  onCancel,
}) {
  // Automatically derive initial engagement from facial reaction and problem score
  const deriveAutoEngagement = (score, emotion) => {
    const emo = (emotion || '').toLowerCase();
    if ((emo.includes('happy') || emo.includes('joy') || emo.includes('surprise') || emo.includes('curious')) && score >= 60) {
      return 'High';
    }
    if ((emo.includes('neutral') || emo.includes('calm') || emo.includes('focus')) && score >= 40) {
      return 'Medium';
    }
    if (emo.includes('frustrat') || emo.includes('sad') || emo.includes('angry') || emo.includes('fear') || score < 40) {
      return 'Low';
    }
    return score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Low';
  };

  const autoEngagement = deriveAutoEngagement(initialScore, detectedEmotion);

  const emoLower = (detectedEmotion || '').toLowerCase();
  const isSad = emoLower.includes('sad') || emoLower.includes('frustrat') || emoLower.includes('angry') || emoLower.includes('fear');
  const happyActivity = getHappyBoosterActivity(childAge, childLevel);

  const [performanceScore, setPerformanceScore] = useState(initialScore);
  const [engagement, setEngagement] = useState(autoEngagement);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [autoSaveActive, setAutoSaveActive] = useState(true);

  // Auto-save countdown timer (can be paused if parent interacts)
  useEffect(() => {
    if (!autoSaveActive || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoSaveActive, countdown]);

  const pauseAutoSave = () => {
    setAutoSaveActive(false);
  };

  const getScoreBadge = (val) => {
    if (val >= 80) return { label: '🌟 Mastered / High Accuracy', color: '#16a34a', bg: '#dcfce7' };
    if (val >= 50) return { label: '👍 Good Progress', color: '#d97706', bg: '#fef3c7' };
    return { label: '💪 Emerging / Needs Support', color: '#dc2626', bg: '#fee2e2' };
  };

  const badge = getScoreBadge(performanceScore);

  const handleSubmit = async (isAuto = false, happyToLaunch = null) => {
    setSubmitting(true);
    try {
      const autoNote = isAuto && !notes.trim() ? `Auto-tracked via facial emotion (${detectedEmotion}) & task score (${performanceScore}%)` : notes.trim();
      await logActivityCompletion({
        childId,
        activityId,
        performanceScore: Number(performanceScore),
        engagement,
        notes: autoNote,
      });

      // Update local storage for DailyReminder and Streak/Milestones
      if (childId) {
        localStorage.setItem(`last_session_${childId}`, new Date().toDateString());
        const curCount = parseInt(localStorage.getItem(`session_count_${childId}`) || "0", 10) + 1;
        localStorage.setItem(`session_count_${childId}`, String(curCount));
      }
    } catch (err) {
      console.warn('Failed to log activity progress:', err);
    } finally {
      setSubmitting(false);
      if (onComplete) onComplete({ performanceScore, engagement, notes, launchHappyActivity: happyToLaunch });
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          padding: '28px 32px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          animation: 'fadeInUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>🎉</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
            Session Performance & Engagement
          </h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
            for <strong style={{ color: '#4f46e5' }}>{childName}</strong> on <em>&quot;{activityTitle}&quot;</em>
          </p>
        </div>

        {/* AI Auto-Computed Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #eef2ff, #f0fdf4)',
            border: '1.5px solid #c7d2fe',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4338ca', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ✨ AI Auto-Derived Metrics
            </span>
            {autoSaveActive && countdown > 0 && (
              <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '99px' }}>
                Auto-saving in {countdown}s ⏱️
              </span>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem' }}>
            <div style={{ background: 'white', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>🎯 Task Accuracy Score</span>
              <strong style={{ color: '#1e293b', fontSize: '0.95rem' }}>{initialScore}%</strong>
            </div>
            <div style={{ background: 'white', padding: '8px 10px', borderRadius: '10px', border: '1px solid #e0e7ff' }}>
              <span style={{ color: '#64748b', display: 'block', fontSize: '0.72rem' }}>😊 Facial Reaction</span>
              <strong style={{ color: isSad ? '#dc2626' : '#1e293b', fontSize: '0.95rem' }}>{detectedEmotion} ({emotionConfidence}%)</strong>
            </div>
          </div>
        </div>

        {/* 💛 MOOD BOOST TRIGGERED BANNER (WHEN CHILD GETS SAD/FRUSTRATED) */}
        {isSad && happyActivity && (
          <div
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fff7ed 100%)',
              border: '2px solid #fca5a5',
              borderRadius: '18px',
              padding: '16px',
              marginBottom: '18px',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <span style={{ fontSize: '1.8rem' }}>💛</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#991b1b' }}>
                  Mood Boost Triggered!
                </h4>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#7f1d1d', lineHeight: '1.4' }}>
                  We detected <strong>{childName}</strong> felt <em>&quot;{detectedEmotion}&quot;</em> during this session. Here is a happy recovery activity tailored for their age &amp; level:
                </p>
              </div>
            </div>

            <div style={{ background: '#ffffff', borderRadius: '14px', padding: '12px 14px', border: '1.5px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.6rem' }}>{happyActivity.icon}</span>
                <div>
                  <strong style={{ fontSize: '0.92rem', color: '#1e293b', display: 'block' }}>{happyActivity.title}</strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{happyActivity.category} &bull; {happyActivity.duration}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  pauseAutoSave();
                  handleSubmit(false, happyActivity);
                }}
                style={{
                  background: 'linear-gradient(135deg, #ec4899, #d946ef)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '9px 16px',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  boxShadow: '0 3px 10px rgba(236, 72, 153, 0.3)',
                }}
              >
                🎉 Play Happy Activity Now →
              </button>
            </div>
          </div>
        )}

        {/* 0-100 Performance Score Slider */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label style={{ fontSize: '0.86rem', fontWeight: '700', color: '#334155' }}>
              Accuracy Score (0 - 100):
            </label>
            <span
              style={{
                background: badge.bg,
                color: badge.color,
                padding: '3px 8px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '800',
              }}
            >
              {performanceScore}/100 &bull; {badge.label}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={performanceScore}
            onChange={(e) => {
              pauseAutoSave();
              setPerformanceScore(Number(e.target.value));
            }}
            style={{
              width: '100%',
              height: '7px',
              borderRadius: '6px',
              background: `linear-gradient(to right, #4f46e5 0%, #06b6d4 ${performanceScore}%, #e2e8f0 ${performanceScore}%, #e2e8f0 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Engagement Level Buttons */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
            Engagement Level (Derived from Camera & Game):
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {[
              { key: 'Low', label: 'Low', emoji: '😴', desc: 'Distracted' },
              { key: 'Medium', label: 'Medium', emoji: '🙂', desc: 'Attentive' },
              { key: 'High', label: 'High', emoji: '🤩', desc: 'Enthusiastic' },
            ].map((item) => {
              const isSelected = engagement === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    pauseAutoSave();
                    setEngagement(item.key);
                  }}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #4f46e5' : '1px solid #e2e8f0',
                    background: isSelected ? '#eff6ff' : '#f8fafc',
                    color: isSelected ? '#1e40af' : '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{item.emoji}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800' }}>{item.label}</span>
                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#334155', marginBottom: '4px' }}>
            Parent / Therapist Notes (Optional):
          </label>
          <textarea
            rows="2"
            placeholder="e.g., Solved independently, high enthusiasm..."
            value={notes}
            onChange={(e) => {
              pauseAutoSave();
              setNotes(e.target.value);
            }}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '0.82rem',
              boxSizing: 'border-box',
              resize: 'none',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: '700',
                fontSize: '0.88rem',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            style={{
              flex: 2,
              padding: '11px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #4338ca)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.92rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {submitting ? 'Saving...' : autoSaveActive && countdown > 0 ? `💾 Save Now (${countdown}s)` : '💾 Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}

