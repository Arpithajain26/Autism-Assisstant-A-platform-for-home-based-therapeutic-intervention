import React, { useState, useEffect } from 'react';
import { getChildTasks, completeTask, getActivities } from '../services/api';
import Assessment from './Assessment';
import gameInstructions from '../gameInstructions';
import { getAgeLevelConfig } from '../utils/ageLevelMapping';
import InteractiveGameZone from '../components/InteractiveGameZone';
import EmotionDetector from '../components/EmotionDetector';

const CATEGORY_ICON = {
  Communication: '💬',
  'Motor Skills': '🖐️',
  Social: '👫',
  Sensory: '👁️',
  'Life Skills': '🏠',
  Emotional: '❤️',
  'Sensory and Motor': '🎨',
  Cognitive: '🧩'
};

const ChildDashboard = ({ user, childId, onNavigate }) => {
  // Use childId prop if passed, otherwise fall back to user._id or user.id
  const targetChildId = childId || (user ? (user._id || user.id) : null);

  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState('');
  const [activeTask, setActiveTask] = useState(null); // task detail view
  const [taskViewMode, setTaskViewMode] = useState('game'); // 'game' or 'guide'
  const [allActivities, setAllActivities] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState('Happy');
  const [emotionConfidence, setEmotionConfidence] = useState(85);
  const [showWebcam, setShowWebcam] = useState(false);
  const [gameCompletedReward, setGameCompletedReward] = useState(false);

  const fetchTasks = async () => {
    if (!targetChildId) return;
    setLoading(true);
    try {
      const data = await getChildTasks(targetChildId);
      setTasks(data);
    } catch (err) {
      console.error('Failed to fetch child tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [targetChildId]);

  useEffect(() => {
    if (tasks?._id) {
      localStorage.setItem("currentChild", JSON.stringify({
        _id: tasks._id,
        name: tasks.name || 'Child',
        level: Number(tasks.level) || 2,
        age: tasks.age || 6,
        profilePhoto: tasks.profilePhoto || tasks.photo || tasks.avatar || null
      }));
    }
  }, [tasks]);

  useEffect(() => {
    if (tasks?.level) {
      getActivities(tasks.level).then((a) => setAllActivities(Array.isArray(a) ? a : []));
    }
  }, [tasks?.level]);

  const handleComplete = async (actId) => {
    setCompleting(actId);
    try {
      await completeTask(targetChildId, actId);
      setGameCompletedReward(true);
      await fetchTasks();
      setTimeout(() => {
        setGameCompletedReward(false);
        setActiveTask(null);
      }, 2500);
    } catch (err) {
      alert(err.message || 'Failed to complete task');
    } finally {
      setCompleting('');
    }
  };

  const handleAssessmentComplete = async () => {
    await fetchTasks();
  };

  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('/dashboard');
    } else {
      window.location.href = '/dashboard';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px' }}>
        <span className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  // If child has not completed assessment yet
  if (tasks && !tasks.assessmentDone) {
    return (
      <div>
        <div style={{ marginBottom: '20px' }}>
          <button className="btn btn-ghost" onClick={handleBackToDashboard} style={{ fontWeight: '700' }}>
            ← Back to Parent Dashboard
          </button>
        </div>
        <Assessment child={{ _id: targetChildId, name: tasks.name || 'Child' }} onComplete={handleAssessmentComplete} />
      </div>
    );
  }

  // 🎮 INTERACTIVE ANIMATED GAME ARENA VIEW
  if (activeTask) {
    return (
      <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto', paddingBottom: '60px' }}>
        {/* Top Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <button
            className="btn btn-ghost"
            style={{ fontWeight: '700', fontSize: '0.95rem' }}
            onClick={() => {
              setActiveTask(null);
              setGameCompletedReward(false);
            }}
          >
            ← Back to Activities
          </button>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#e0e7ff', padding: '4px', borderRadius: '14px', gap: '4px' }}>
            <button
              onClick={() => setTaskViewMode('game')}
              style={{
                border: 'none',
                background: taskViewMode === 'game' ? '#4f46e5' : 'transparent',
                color: taskViewMode === 'game' ? 'white' : '#4338ca',
                fontWeight: '800',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              🎮 Interactive Animated Game
            </button>
            <button
              onClick={() => setTaskViewMode('guide')}
              style={{
                border: 'none',
                background: taskViewMode === 'guide' ? '#4f46e5' : 'transparent',
                color: taskViewMode === 'guide' ? 'white' : '#4338ca',
                fontWeight: '800',
                padding: '8px 18px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              📋 Step-by-Step Guide
            </button>
          </div>
        </div>

        {/* Celebration Banner upon game completion */}
        {gameCompletedReward && (
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '20px',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '24px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)',
              animation: 'bounceIn 0.5s ease',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🎉 ⭐ 🏆</div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 6px 0' }}>
              Awesome Job, {tasks?.name || 'Champ'}!
            </h2>
            <p style={{ fontSize: '1.1rem', margin: 0, opacity: 0.95 }}>
              Activity completed! +50 XP Earned & Daily Streak Increased! 🔥
            </p>
          </div>
        )}

        {/* Main Card Container */}
        <div className="card" style={{ padding: '28px 32px', borderRadius: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)' }}>
          {/* Header Badges */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${activeTask.difficulty?.toLowerCase() || 'easy'}`}>
              Level {activeTask.level || tasks?.level || 1}
            </span>
            <span className="badge badge-category">{activeTask.category || 'Therapy Activity'}</span>
            <span style={{ background: '#fef3c7', color: '#b45309', padding: '4px 12px', borderRadius: '12px', fontWeight: '800', fontSize: '0.82rem' }}>
              ⭐ +50 XP
            </span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '700' }}>
              ⏱ {activeTask.duration || '10 min'}
            </span>
          </div>

          <h1 style={{ fontSize: '1.9rem', fontWeight: '900', color: '#1e1b4b', marginBottom: '8px' }}>
            {activeTask.title}
          </h1>
          <p style={{ color: '#4b5563', lineHeight: '1.6', fontSize: '1rem', marginBottom: '24px' }}>
            {activeTask.description}
          </p>

          {/* VIEW MODE 1: INTERACTIVE ANIMATED GAME */}
          {taskViewMode === 'game' ? (
            <div>
              {/* Optional Camera Detection Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.3rem' }}>📷</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '800', color: '#1e293b' }}>
                      AI Facial Expression Feedback
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Detected Emotion: <strong>{currentEmotion}</strong> ({emotionConfidence}% confidence)
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowWebcam(!showWebcam)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                    background: showWebcam ? '#e0e7ff' : '#ffffff',
                    color: showWebcam ? '#4338ca' : '#475569',
                    fontWeight: '700',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {showWebcam ? 'Hide Camera' : 'Turn On Camera'}
                </button>
              </div>

              {showWebcam && (
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                  <EmotionDetector
                    isActive={showWebcam}
                    onEmotionDetected={(data) => {
                      if (data?.emotion) setCurrentEmotion(data.emotion);
                      if (data?.confidence) setEmotionConfidence(data.confidence);
                    }}
                  />
                </div>
              )}

              {/* Central Interactive Game Zone */}
              <div style={{ background: '#fdf4ff', border: '2px solid #f0abfc', borderRadius: '24px', padding: '24px', marginBottom: '24px' }}>
                <InteractiveGameZone
                  activity={activeTask}
                  language="en"
                  currentEmotion={currentEmotion}
                  emotionConfidence={emotionConfidence}
                  onComplete={() => handleComplete(activeTask._id)}
                />
              </div>

              {/* Manual Complete Button */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                <button
                  className="btn btn-success"
                  style={{ padding: '14px 28px', fontSize: '1.05rem', fontWeight: '800', borderRadius: '14px', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)' }}
                  onClick={() => handleComplete(activeTask._id)}
                  disabled={completing === activeTask._id}
                >
                  {completing === activeTask._id ? (
                    <>
                      <span className="spinner" style={{ width: 18, height: 18 }} /> Completing Activity...
                    </>
                  ) : (
                    '⭐ Finish Game & Claim XP'
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* VIEW MODE 2: STEP BY STEP OFFLINE GUIDE */
            <div>
              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '14px', color: '#1e1b4b' }}>
                📋 Step-by-Step Parent Coaching Guide
              </h4>
              <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {(activeTask.steps || activeTask.instructions || [
                  "1. Introduce the interactive game visually to the child.",
                  "2. Encourage them to tap the colorful objects on the screen.",
                  "3. Provide verbal praise for every correct match and prompt.",
                  "4. Celebrate completion with high-fives and star rewards!"
                ]).map((step, i) => (
                  <li
                    key={i}
                    style={{
                      padding: '14px 18px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '0.96rem',
                      lineHeight: '1.6',
                      fontWeight: '600',
                      color: '#334155',
                    }}
                  >
                    {typeof step === 'string' ? step : step.en || step.kn}
                  </li>
                ))}
              </ol>

              <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '12px', color: '#1e1b4b' }}>
                🎯 Target Skills & Development
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
                {(activeTask.goalSkills || ['Joint Attention', 'Fine Motor Skills', 'Visual Recognition']).map((skill) => (
                  <span key={skill} className="badge badge-category" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                    {skill}
                  </span>
                ))}
              </div>

              <button
                className="btn btn-success"
                style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', fontWeight: '800', borderRadius: '12px' }}
                onClick={() => handleComplete(activeTask._id)}
                disabled={completing === activeTask._id}
              >
                {completing === activeTask._id ? (
                  <>
                    <span className="spinner" style={{ width: 18, height: 18 }} /> Marking as complete...
                  </>
                ) : (
                  '🎉 Mark Activity as Completed!'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const level = tasks?.level || 2;
  const childAge = tasks?.age || 6;
  const currentTier = getAgeLevelConfig(childAge, level);
  const assigned = tasks?.assigned || [];
  const completed = tasks?.completed || [];
  const childName = tasks?.name || 'Child';
  const childIdBadge = tasks?.childId || '';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #9333ea 100%)',
          color: 'white',
          marginBottom: '28px',
          borderRadius: '20px',
          padding: '28px 32px',
          boxShadow: '0 10px 25px rgba(79, 70, 229, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.85 }}>
              Active Therapy Portal
            </span>
            <h1 style={{ fontSize: '2.2rem', fontWeight: '900', margin: '4px 0 0 0', letterSpacing: '-0.5px' }}>
              Welcome, {childName}! 🌟
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(4px)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              Age {childAge} yrs
            </span>
            <span
              style={{
                background: 'rgba(255,255,255,0.25)',
                backdropFilter: 'blur(4px)',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '800',
              }}
            >
              {currentTier.emoji} Level {level} ({currentTier.label})
            </span>
            {childIdBadge && (
              <span
                style={{
                  background: 'rgba(0,0,0,0.25)',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                }}
              >
                ID: {childIdBadge}
              </span>
            )}
          </div>
        </div>

        <p style={{ margin: 0, opacity: 0.92, fontSize: '1.02rem', lineHeight: '1.5', maxWidth: '750px' }}>
          Play interactive animated games specifically calibrated for your age ({childAge} yrs) and level ({currentTier.label}). Complete games to earn XP and build your daily streak!
        </p>
      </div>

      {/* Progress Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ borderLeft: '5px solid #ea580c', background: 'white' }}>
          <div className="stat-label">Daily Streak</div>
          <div className="stat-num" style={{ color: '#ea580c' }}>
            🔥 {tasks?.streak || 0}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>days active in a row 🏆</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '5px solid var(--green)', background: 'white' }}>
          <div className="stat-label">Completed Tasks</div>
          <div className="stat-num" style={{ color: 'var(--green)' }}>{completed.length}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>games finished ⭐</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '5px solid var(--primary)', background: 'white' }}>
          <div className="stat-label">To Do</div>
          <div className="stat-num" style={{ color: 'var(--primary)' }}>{assigned.length}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>games waiting 🎯</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      {assigned.length + completed.length > 0 && (
        <div className="card" style={{ marginBottom: '32px', padding: '20px 24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '700' }}>Overall Therapy Progress</span>
            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>
              {Math.round((completed.length / (assigned.length + completed.length)) * 100)}%
            </span>
          </div>
          <div className="progress-bar" style={{ height: '12px', borderRadius: '6px' }}>
            <div
              className="progress-fill"
              style={{
                width: `${(completed.length / (assigned.length + completed.length)) * 100}%`,
                borderRadius: '6px',
              }}
            />
          </div>
        </div>
      )}

      {/* Assigned Tasks Grid */}
      <section style={{ marginBottom: '36px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontWeight: '800', fontSize: '1.35rem', margin: 0, color: '#1e1b4b' }}>
            🎯 Today's Interactive Therapy Games
          </h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              localStorage.setItem("currentChild", JSON.stringify({ _id: targetChildId, name: childName, level: level || 2, age: tasks?.age || 6 }));
              if (onNavigate) onNavigate('/activities');
              else window.location.href = '/activities';
            }}
            style={{ fontWeight: '700', padding: '8px 16px', borderRadius: '10px', fontSize: '0.88rem' }}
          >
            📚 Browse All {currentTier.label} (Level {level}) Activities →
          </button>
        </div>

        {assigned.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{currentTier.emoji}</div>
            <h3 style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '6px' }}>
              {currentTier.label} (Level {level}) Games Ready!
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
              Your child is in <strong>{currentTier.label} (Level {level})</strong>. Explore all animated therapy games with live sound effects, emoji matching, and star rewards!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem("currentChild", JSON.stringify({ _id: targetChildId, name: childName, level: level || 2, age: tasks?.age || 6 }));
                if (onNavigate) onNavigate('/activities');
                else window.location.href = '/activities';
              }}
              style={{ fontWeight: '800', padding: '14px 28px', borderRadius: '12px', fontSize: '1rem' }}
            >
              🎮 Open Animated Games Library →
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {assigned.map((act) => (
              <div
                key={act._id}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  padding: '24px',
                  border: '1.5px solid #e0e7ff',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.06)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '2.4rem' }}>
                    {CATEGORY_ICON[act.category] || '🎮'}
                  </span>
                  <span style={{ background: '#fdf4ff', color: '#c026d3', border: '1px solid #f5d0fe', padding: '3px 10px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                    ✨ Animated Game
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${act.difficulty?.toLowerCase() || 'easy'}`}>{act.difficulty || `Level ${act.level || 1}`}</span>
                  <span className="badge badge-category">{act.category}</span>
                </div>

                <h3 style={{ fontWeight: '800', fontSize: '1.15rem', marginBottom: '8px', color: '#1e1b4b' }}>
                  {act.title}
                </h3>
                <p
                  style={{
                    color: '#64748b',
                    fontSize: '0.88rem',
                    lineHeight: '1.5',
                    flex: 1,
                    marginBottom: '16px',
                  }}
                >
                  {act.description?.substring(0, 100)}...
                </p>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '16px' }}>
                  ⏱ {act.duration} · ⭐ +50 XP
                </div>
                <button
                  onClick={() => {
                    setActiveTask(act);
                    setTaskViewMode('game');
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
                    transition: 'transform 0.1s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  🎮 Play Animated Game →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <section>
          <h2 style={{ fontWeight: '800', fontSize: '1.35rem', marginBottom: '18px', color: '#1e1b4b' }}>
            ✅ Completed Therapy Games
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completed.map((act) => (
              <div
                key={act._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px 20px',
                  border: '1px solid #d1fae5',
                  borderRadius: '16px',
                  background: '#f0fdf4',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{CATEGORY_ICON[act.category] || '🎮'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', textDecoration: 'line-through', color: '#065f46' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#047857' }}>{act.category} · Completed ⭐</div>
                </div>
                <span style={{ color: 'var(--green)', fontWeight: '800', fontSize: '1.4rem' }}>✅</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ChildDashboard;
