import React, { useState, useEffect } from 'react';
import { getChildren, assignTask, getActivities } from '../services/api';

const LEVEL_LABEL = { 1: '🌱 Beginner', 2: '🌿 Developing', 3: '🌳 Advanced' };
const LEVEL_COLOR_BG = { 1: '#dcfce7', 2: '#fef9c3', 3: '#fee2e2' };
const LEVEL_COLOR_TEXT = { 1: '#166534', 2: '#854d0e', 3: '#991b1b' };

const ParentDashboard = ({ user, onNavigate }) => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');

  useEffect(() => {
    const load = async () => {
      const [kids, acts] = await Promise.all([getChildren(user._id), getActivities()]);
      setChildren(Array.isArray(kids) ? kids : []);
      setActivities(Array.isArray(acts) ? acts : []);
      if (kids && kids.length > 0) setSelectedChild(kids[0]);
      setLoading(false);
    };
    load();
  }, [user._id]);

  const handleAssign = async (childId, actId) => {
    setAssigning(actId);
    await assignTask(childId, actId);
    const updated = await getChildren(user._id);
    setChildren(updated);
    const refreshed = updated.find(c => c._id === childId);
    if (refreshed) setSelectedChild(refreshed);
    setAssigning('');
  };

  const sc = selectedChild;
  const availableToAssign = sc
    ? activities.filter(a =>
        a.level === sc.level &&
        !sc.assignedActivities?.some(aa => aa._id === a._id) &&
        !sc.completedActivities?.some(ca => ca._id === a._id)
      )
    : [];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:'36px' }}>
        <h1 style={{ fontSize:'2.2rem', fontWeight:'800', marginBottom:'6px' }}>Parent Dashboard 👨‍👩‍👧</h1>
        <p style={{ color:'var(--text-muted)' }}>Welcome back, {user.name}! Track and support your child's therapy journey.</p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px' }}><span className="spinner" style={{ width:36,height:36 }} /></div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'16px' }}>👶</div>
          <h3 style={{ fontWeight:'700', marginBottom:'8px' }}>No children linked yet</h3>
          <p style={{ color:'var(--text-muted)' }}>Ask your child to register with your email address to link their account.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'24px', alignItems:'start' }}>

          {/* Child Selector */}
          <div>
            <h3 style={{ fontWeight:'700', marginBottom:'12px', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>Your Children</h3>
            {children.map(child => (
              <button key={child._id} onClick={() => setSelectedChild(child)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:'12px',
                padding:'14px 16px', borderRadius:'10px', marginBottom:'10px', border:'2px solid',
                borderColor: sc?._id===child._id ? 'var(--primary)' : 'var(--border)',
                background: sc?._id===child._id ? 'var(--primary-light)' : 'white',
                cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'all 0.2s',
              }}>
                <div style={{ width:40,height:40,borderRadius:'50%',background:'var(--primary-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',flexShrink:0 }}>
                  🧒
                </div>
                <div>
                  <div style={{ fontWeight:'700', color:'var(--text)' }}>{child.name}</div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Age {child.age} · {child.level ? LEVEL_LABEL[child.level] : '⏳ Not assessed'}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Child Detail */}
          {sc && (
            <div>
              {/* Stats row */}
              <div className="grid-2" style={{ marginBottom:'24px' }}>
                <div className="stat-card" style={{ borderLeft:`5px solid ${LEVEL_COLOR_TEXT[sc.level] || '#6366f1'}` }}>
                  <div className="stat-label">Current Level</div>
                  <div style={{ fontSize:'1.4rem', fontWeight:'800', color: LEVEL_COLOR_TEXT[sc.level] || 'var(--primary)' }}>
                    {sc.level ? LEVEL_LABEL[sc.level] : '⏳ Pending Assessment'}
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft:'5px solid var(--green)' }}>
                  <div className="stat-label">Tasks Completed</div>
                  <div className="stat-num" style={{ color:'var(--green)' }}>{sc.completedActivities?.length || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft:'5px solid var(--primary)' }}>
                  <div className="stat-label">Assigned Tasks</div>
                  <div className="stat-num" style={{ color:'var(--primary)' }}>{sc.assignedActivities?.length || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft:'5px solid var(--accent)' }}>
                  <div className="stat-label">Completion Rate</div>
                  <div className="stat-num" style={{ color:'var(--accent)' }}>
                    {(() => {
                      const total = (sc.assignedActivities?.length||0) + (sc.completedActivities?.length||0);
                      return total === 0 ? '—' : `${Math.round((sc.completedActivities?.length||0)/total*100)}%`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Assigned tasks */}
              <div className="card" style={{ marginBottom:'20px' }}>
                <h3 style={{ fontWeight:'700', marginBottom:'16px' }}>📋 Current Tasks for {sc.name}</h3>
                {(!sc.assignedActivities || sc.assignedActivities.length === 0) ? (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>No tasks assigned yet. Assign some below!</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {sc.assignedActivities.map(act => (
                      <div key={act._id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'10px', background:'white' }}>
                        <span style={{ fontSize:'1.3rem' }}>
                          {act.category === 'Communication' ? '💬' : act.category === 'Motor Skills' ? '🖐️' : act.category === 'Social' ? '👫' : act.category === 'Sensory' ? '👁️' : act.category === 'Life Skills' ? '🏠' : '📋'}
                        </span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:'700' }}>{act.title}</div>
                          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{act.category} · {act.duration}</div>
                        </div>
                        <span className={`badge badge-${act.difficulty?.toLowerCase()}`}>{act.difficulty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign more */}
              {availableToAssign.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight:'700', marginBottom:'16px' }}>➕ Assign New Activity</h3>
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {availableToAssign.map(act => (
                      <div key={act._id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'10px', background:'white' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:'700' }}>{act.title}</div>
                          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{act.category} · {act.duration}</div>
                        </div>
                        <button className="btn btn-primary" style={{ padding:'7px 14px', fontSize:'0.82rem' }}
                          onClick={() => handleAssign(sc._id, act._id)} disabled={assigning === act._id}>
                          {assigning === act._id ? '...' : '+ Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
