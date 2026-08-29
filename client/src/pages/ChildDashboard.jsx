import React, { useState, useEffect } from 'react';
import { getChildTasks, completeTask, getActivities } from '../services/api';
import Assessment from './Assessment';
import gameInstructions from '../gameInstructions';
import { getAgeLevelConfig } from '../utils/ageLevelMapping';
const CATEGORY_ICON = { Communication: '💬', 'Motor Skills': '🖐️', Social: '👫', Sensory: '👁️', 'Life Skills': '🏠', Emotional: '❤️' };

const ChildDashboard = ({ user, childId, onNavigate }) => {
  // Use childId prop if passed, otherwise fall back to user._id or user.id
  const targetChildId = childId || (user ? (user._id || user.id) : null);

  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState('');
  const [activeTask, setActiveTask] = useState(null); // task detail view
  const [allActivities, setAllActivities] = useState([]);

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
      await fetchTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setCompleting('');
      setActiveTask(null);
    }
  };

  const handleAssessmentComplete = async () => {
    await fetchTasks();
  };

  const handleBackToDashboard = () => {
    if (onNavigate) {
      onNavigate('/dashboard');
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

  // Task detail view
  if (activeTask) {
    return (
      <div className="fade-in">
        <button
          className="btn btn-ghost"
          style={{ marginBottom: '24px', fontWeight: '700' }}
          onClick={() => setActiveTask(null)}
        >
          ← Back to All Activities
        </button>

        <div className="card" style={{ padding: '32px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className={`badge badge-${activeTask.difficulty?.toLowerCase()}`}>{activeTask.difficulty}</span>
            <span className="badge badge-category">{activeTask.category}</span>
            <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: '600' }}>
              ⏱ {activeTask.duration}
            </span>
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>{activeTask.title}</h2>
          <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '1.05rem', marginBottom: '28px' }}>
            {activeTask.description}
          </p>

          <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '14px' }}>📋 Step-by-Step Guide</h4>
          <ol style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
            {activeTask.steps?.map((step, i) => (
              <li
                key={i}
                style={{
                  padding: '14px 18px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  fontSize: '0.98rem',
                  lineHeight: '1.6',
                  fontWeight: '500',
                }}
              >
                {step}
              </li>
            ))}
          </ol>

          <h4 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '12px' }}>🎯 Target Skills</h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
            {activeTask.goalSkills?.map((skill) => (
              <span key={skill} className="badge badge-category" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                {skill}
              </span>
            ))}
          </div>

          <button
            className="btn btn-success"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1.05rem', fontWeight: '700', borderRadius: '12px' }}
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
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Back button for parent */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="btn btn-ghost" onClick={handleBackToDashboard} style={{ fontWeight: '700', color: 'var(--primary)' }}>
          ← Back to Parent Dashboard
        </button>
        <span style={{ background: '#e0e7ff', color: '#3730a3', fontSize: '0.8rem', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
          {childIdBadge}
        </span>
      </div>

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          color: 'white',
          padding: '28px 32px',
          borderRadius: '20px',
          boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.4)',
          marginBottom: '32px',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎈</div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 6px 0' }}>Hi, {childName}! 👋</h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1rem' }}>
          {currentTier.emoji} {currentTier.label} (Level {level}) Identified &bull; Welcome to your therapy space! Let's do some fun activities together.
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
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>activities done ⭐</p>
        </div>
        <div className="stat-card" style={{ borderLeft: '5px solid var(--primary)', background: 'white' }}>
          <div className="stat-label">To Do</div>
          <div className="stat-num" style={{ color: 'var(--primary)' }}>{assigned.length}</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>activities waiting 🎯</p>
        </div>
      </div>

      {/* Progress Bar */}
      {assigned.length + completed.length > 0 && (
        <div className="card" style={{ marginBottom: '32px', padding: '20px 24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontWeight: '700' }}>Overall Progress</span>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h2 style={{ fontWeight: '800', fontSize: '1.35rem', margin: 0 }}>🎯 Today's Therapy Activities</h2>
          <button
            className="btn btn-primary"
            onClick={() => {
              localStorage.setItem("currentChild", JSON.stringify({ _id: targetChildId, name: childName, level: level || 2, age: tasks?.age || 6 }));
              if (onNavigate) onNavigate('/activities');
              else window.location.href = '/activities';
            }}
            style={{ fontWeight: '700', padding: '8px 16px', borderRadius: '10px', fontSize: '0.9rem' }}
          >
            📚 Browse All {currentTier.label} (Level {level}) Activities →
          </button>
        </div>

        {assigned.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 24px', borderRadius: '16px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{currentTier.emoji}</div>
            <h3 style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '6px' }}>
              {currentTier.label} (Level {level}) Therapy Plan Ready!
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
              Your child is in <strong>{currentTier.label} (Level {level})</strong>. Click below to open the dedicated activity library with live face detection, session timers, and step-by-step guides!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => {
                localStorage.setItem("currentChild", JSON.stringify({ _id: targetChildId, name: childName, level: level || 2, age: tasks?.age || 6 }));
                if (onNavigate) onNavigate('/activities');
                else window.location.href = '/activities';
              }}
              style={{ fontWeight: '700', padding: '14px 28px', borderRadius: '12px', fontSize: '1rem' }}
            >
              ▶ Start {currentTier.label} Activities Now →
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
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>
                  {CATEGORY_ICON[act.category] || '📋'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${act.difficulty?.toLowerCase()}`}>{act.difficulty}</span>
                  <span className="badge badge-category">{act.category}</span>
                </div>
                <h3 style={{ fontWeight: '800', fontSize: '1.15rem', marginBottom: '8px' }}>{act.title}</h3>
                <p
                  style={{
                    color: 'var(--text-muted)',
                    fontSize: '0.9rem',
                    lineHeight: '1.6',
                    flex: 1,
                    marginBottom: '20px',
                  }}
                >
                  {act.description?.substring(0, 110)}...
                </p>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '16px' }}>
                  ⏱ {act.duration}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontWeight: '700', borderRadius: '10px', padding: '10px' }}
                  onClick={() => setActiveTask(act)}
                >
                  Start Activity →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed Tasks */}
      {completed.length > 0 && (
        <section>
          <h2 style={{ fontWeight: '800', fontSize: '1.35rem', marginBottom: '18px' }}>✅ Completed Activities</h2>
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
                  borderRadius: '12px',
                  background: '#f0fdf4',
                }}
              >
                <span style={{ fontSize: '1.6rem' }}>{CATEGORY_ICON[act.category] || '📋'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '700', fontSize: '1rem', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                    {act.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{act.category}</div>
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
