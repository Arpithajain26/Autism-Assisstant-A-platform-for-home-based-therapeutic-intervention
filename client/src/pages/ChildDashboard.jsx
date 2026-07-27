import React, { useState, useEffect } from 'react';
import { getChildTasks, completeTask, getActivities } from '../services/api';
import Assessment from './Assessment';

const LEVEL_LABEL = { 1: '🌱 Emerging', 2: '🌿 Developing', 3: '🌳 Advancing' };
const CATEGORY_ICON = { Communication:'💬', 'Motor Skills':'🖐️', Social:'👫', Sensory:'👁️', 'Life Skills':'🏠', Emotional:'❤️' };

const ChildDashboard = ({ user }) => {
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState('');
  const [activeTask, setActiveTask] = useState(null);  // task detail view
  const [allActivities, setAllActivities] = useState([]);

  const fetchTasks = async () => {
    setLoading(true);
    const data = await getChildTasks(user._id);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, [user._id]);

  useEffect(() => {
    if (tasks?.level) {
      getActivities(tasks.level).then(a => setAllActivities(Array.isArray(a) ? a : []));
    }
  }, [tasks?.level]);

  const handleComplete = async (actId) => {
    setCompleting(actId);
    await completeTask(user._id, actId);
    await fetchTasks();
    setCompleting('');
    setActiveTask(null);
  };

  const handleAssessmentComplete = async (level) => {
    await fetchTasks();
  };

  if (loading) return <div style={{ textAlign:'center', padding:'80px' }}><span className="spinner" style={{ width:36,height:36 }} /></div>;

  // Show assessment if not done
  if (tasks && !tasks.assessmentDone) {
    return <Assessment child={user} onComplete={handleAssessmentComplete} />;
  }

  // Task detail view
  if (activeTask) {
    return (
      <div className="fade-in">
        <button className="btn btn-ghost" style={{ marginBottom:'24px' }} onClick={() => setActiveTask(null)}>← Back to My Tasks</button>
        <div className="card">
          <div style={{ display:'flex', gap:'12px', marginBottom:'20px', flexWrap:'wrap' }}>
            <span className={`badge badge-${activeTask.difficulty?.toLowerCase()}`}>{activeTask.difficulty}</span>
            <span className="badge badge-category">{activeTask.category}</span>
            <span style={{ marginLeft:'auto', color:'var(--text-muted)', fontSize:'0.9rem' }}>⏱ {activeTask.duration}</span>
          </div>
          <h2 style={{ fontSize:'1.8rem', fontWeight:'800', marginBottom:'12px' }}>{activeTask.title}</h2>
          <p style={{ color:'var(--text-muted)', lineHeight:'1.7', marginBottom:'28px' }}>{activeTask.description}</p>

          <h4 style={{ fontWeight:'700', marginBottom:'14px' }}>📋 Step-by-Step Guide</h4>
          <ol style={{ paddingLeft:'20px', display:'flex', flexDirection:'column', gap:'12px', marginBottom:'28px' }}>
            {activeTask.steps?.map((step, i) => (
              <li key={i} style={{ padding:'12px 16px', background:'#f9fafb', borderRadius:'8px', fontSize:'0.95rem', lineHeight:'1.6' }}>{step}</li>
            ))}
          </ol>

          <h4 style={{ fontWeight:'700', marginBottom:'12px' }}>🎯 Skills You'll Build</h4>
          <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'32px' }}>
            {activeTask.goalSkills?.map(skill => (
              <span key={skill} className="badge badge-category">{skill}</span>
            ))}
          </div>

          <button className="btn btn-success" style={{ width:'100%', justifyContent:'center', padding:'14px', fontSize:'1rem' }}
            onClick={() => handleComplete(activeTask._id)} disabled={completing === activeTask._id}>
            {completing === activeTask._id ? <><span className="spinner" style={{width:18,height:18}}/> Marking done...</> : '✅ Mark as Completed!'}
          </button>
        </div>
      </div>
    );
  }

  const level = tasks?.level;
  const assigned = tasks?.assigned || [];
  const completed = tasks?.completed || [];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:'32px' }}>
        <h1 style={{ fontSize:'2.2rem', fontWeight:'800', marginBottom:'6px' }}>Hi, {user.name}! 👋</h1>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', flexWrap:'wrap' }}>
          <span style={{ color:'var(--text-muted)' }}>Your level:</span>
          <span style={{ fontWeight:'700', fontSize:'1.1rem' }}>{LEVEL_LABEL[level] || 'Unknown'}</span>
        </div>
      </div>

      {/* Progress overview */}
      <div className="grid-2" style={{ marginBottom:'32px' }}>
        <div className="stat-card" style={{ borderLeft:'5px solid var(--green)' }}>
          <div className="stat-label">Completed</div>
          <div className="stat-num" style={{ color:'var(--green)' }}>{completed.length}</div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'4px' }}>activities done ⭐</p>
        </div>
        <div className="stat-card" style={{ borderLeft:'5px solid var(--primary)' }}>
          <div className="stat-label">To Do Today</div>
          <div className="stat-num" style={{ color:'var(--primary)' }}>{assigned.length}</div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'4px' }}>activities waiting 🎯</p>
        </div>
      </div>

      {/* Progress bar */}
      {(assigned.length + completed.length) > 0 && (
        <div className="card" style={{ marginBottom:'28px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'10px' }}>
            <span style={{ fontWeight:'700' }}>Overall Progress</span>
            <span style={{ color:'var(--primary)', fontWeight:'700' }}>
              {Math.round(completed.length / (assigned.length + completed.length) * 100)}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width:`${completed.length / (assigned.length + completed.length) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Assigned Tasks */}
      <section style={{ marginBottom:'36px' }}>
        <h2 style={{ fontWeight:'700', fontSize:'1.3rem', marginBottom:'16px' }}>🎯 My Activities</h2>
        {assigned.length === 0 ? (
          <div className="card" style={{ textAlign:'center', padding:'40px' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>🎉</div>
            <h3 style={{ fontWeight:'700', marginBottom:'6px' }}>All done for now!</h3>
            <p style={{ color:'var(--text-muted)' }}>Ask your parent or therapist to assign more activities.</p>
          </div>
        ) : (
          <div className="grid-3">
            {assigned.map(act => (
              <div key={act._id} className="card" style={{ display:'flex', flexDirection:'column' }}>
                <div style={{ fontSize:'2rem', marginBottom:'12px' }}>
                  {CATEGORY_ICON[act.category] || '📋'}
                </div>
                <div style={{ display:'flex', gap:'8px', marginBottom:'12px', flexWrap:'wrap' }}>
                  <span className={`badge badge-${act.difficulty?.toLowerCase()}`}>{act.difficulty}</span>
                  <span className="badge badge-category">{act.category}</span>
                </div>
                <h3 style={{ fontWeight:'700', fontSize:'1.1rem', marginBottom:'8px' }}>{act.title}</h3>
                <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:'1.6', flex:1, marginBottom:'20px' }}>
                  {act.description?.substring(0, 100)}...
                </p>
                <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginBottom:'12px' }}>⏱ {act.duration}</div>
                <button className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }}
                  onClick={() => setActiveTask(act)}>
                  Start Activity →
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 style={{ fontWeight:'700', fontSize:'1.3rem', marginBottom:'16px' }}>✅ Completed Activities</h2>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {completed.map(act => (
              <div key={act._id} style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 18px', border:'1px solid #d1fae5', borderRadius:'10px', background:'#f0fdf4' }}>
                <span style={{ fontSize:'1.4rem' }}>{CATEGORY_ICON[act.category] || '📋'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'700', textDecoration:'line-through', color:'var(--text-muted)' }}>{act.title}</div>
                  <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{act.category}</div>
                </div>
                <span style={{ color:'var(--green)', fontWeight:'700', fontSize:'1.3rem' }}>✅</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ChildDashboard;
