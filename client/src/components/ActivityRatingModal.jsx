import React, { useState } from 'react';
import { logActivityCompletion } from '../services/api';

export default function ActivityRatingModal({
  childId,
  childName = 'Child',
  activityId,
  activityTitle = 'Activity',
  initialScore = 80,
  onComplete,
  onCancel,
}) {
  const [performanceScore, setPerformanceScore] = useState(initialScore);
  const [engagement, setEngagement] = useState('High');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getScoreBadge = (val) => {
    if (val >= 80) return { label: '🌟 Excellent', color: '#16a34a', bg: '#dcfce7' };
    if (val >= 50) return { label: '👍 Good Progress', color: '#d97706', bg: '#fef3c7' };
    return { label: '💪 Needs Support', color: '#dc2626', bg: '#fee2e2' };
  };

  const badge = getScoreBadge(performanceScore);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await logActivityCompletion({
        childId,
        activityId,
        performanceScore: Number(performanceScore),
        engagement,
        notes: notes.trim(),
      });
    } catch (err) {
      console.warn('Failed to log activity progress:', err);
    } finally {
      setSubmitting(false);
      if (onComplete) onComplete({ performanceScore, engagement, notes });
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
          maxWidth: '480px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '6px' }}>🎉</div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', fontWeight: '800', color: '#0f172a' }}>
            Rate Session Performance
          </h2>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
            for <strong style={{ color: '#4f46e5' }}>{childName}</strong> on <em>&quot;{activityTitle}&quot;</em>
          </p>
        </div>

        {/* 0-100 Performance Score Slider */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.9rem', fontWeight: '700', color: '#334155' }}>
              Performance Score (0 - 100):
            </label>
            <span
              style={{
                background: badge.bg,
                color: badge.color,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '0.85rem',
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
            onChange={(e) => setPerformanceScore(Number(e.target.value))}
            style={{
              width: '100%',
              height: '8px',
              borderRadius: '6px',
              background: `linear-gradient(to right, #4f46e5 0%, #06b6d4 ${performanceScore}%, #e2e8f0 ${performanceScore}%, #e2e8f0 100%)`,
              outline: 'none',
              cursor: 'pointer',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
            <span>0 (Low Accuracy)</span>
            <span>50 (Moderate)</span>
            <span>100 (Mastered)</span>
          </div>
        </div>

        {/* Engagement Level Buttons */}
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '8px' }}>
            Engagement Level:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
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
                  onClick={() => setEngagement(item.key)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '14px',
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
                  <span style={{ fontSize: '1.3rem' }}>{item.emoji}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: '800' }}>{item.label}</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{item.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes (Optional) */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
            Parent / Therapist Notes (Optional):
          </label>
          <textarea
            rows="2"
            placeholder="e.g., Needed prompts on step 2, showed great enthusiasm..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
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
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              flex: 2,
              padding: '12px',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '0.95rem',
              cursor: submitting ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)',
            }}
          >
            {submitting ? 'Saving Progress...' : '💾 Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
