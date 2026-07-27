import React, { useState, useEffect } from 'react';
import { getChildren, assignTask, getActivities } from '../services/api';

const LEVEL_LABEL = { 1: '🌱 Beginner', 2: '🌿 Developing', 3: '🌳 Advanced' };
const LEVEL_COLOR_TEXT = { 1: '#166534', 2: '#854d0e', 3: '#991b1b' };

const TherapistDashboard = ({ user, onNavigate }) => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

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
  const filteredActivities = activities.filter(a => {
    if (filterLevel === 'all') return true;
    return a.level === parseInt(filterLevel);
  });

  const availableToAssign = sc
    ? filteredActivities.filter(a =>
        a.level === sc.level &&
        !sc.assignedActivities?.some(aa => aa._id === a._id) &&
        !sc.completedActivities?.some(ca => ca._id === a._id)
      )
    : [];

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom:'36px' }}>
        <h1 style={{ fontSize:'2.2rem', fontWeight:'800', marginBottom:'6px' }}>Therapist Dashboard 👩‍⚕️</h1>
        <p style={{ color:'var(--text-muted)' }}>Welcome, {user.name}! Manage your patients and assign targeted therapy goals.</p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'60px' }}><span className="spinner" style={{ width:36,height:36 }} /></div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'16px' }}>📋</div>
          <h3 style={{ fontWeight:'700', marginBottom:'8px' }}>No patients assigned yet</h3>
          <p style={{ color:'var(--text-muted)' }}>As children register, you can manage their therapeutic progress here.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'24px', alignItems:'start' }}>

          {/* Patient Selector */}
          <div>
            <h3 style={{ fontWeight:'700', marginBottom:'12px', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>Patient List</h3>
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
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{child.level ? LEVEL_LABEL[child.level] : '⏳ Not assessed'}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Patient Detail */}
          {sc && (
            <div>
              {/* Stats row */}
              <div className="grid-2" style={{ marginBottom:'24px' }}>
                <div className="stat-card" style={{ borderLeft:`5px solid ${LEVEL_COLOR_TEXT[sc.level] || '#6366f1'}` }}>
                  <div className="stat-label">Assessment Level</div>
                  <div style={{ fontSize:'1.4rem', fontWeight:'800', color: LEVEL_COLOR_TEXT[sc.level] || 'var(--primary)' }}>
                    {sc.level ? LEVEL_LABEL[sc.level] : '⏳ Pending'}
                  </div>
                </div>
                <div className="stat-card" style={{ borderLeft:'5px solid var(--primary)' }}>
                  <div className="stat-label">Active Tasks</div>
                  <div className="stat-num" style={{ color:'var(--primary)' }}>{sc.assignedActivities?.length || 0}</div>
                </div>
                 <div className="stat-card" style={{ borderLeft:'5px solid var(--green)' }}>
                  <div className="stat-label">Total Completed</div>
                  <div className="stat-num" style={{ color:'var(--green)' }}>{sc.completedActivities?.length || 0}</div>
                </div>
                <div className="stat-card" style={{ borderLeft:'5px solid var(--accent)' }}>
                  <div className="stat-label">Progress</div>
                   <div className="stat-num" style={{ color:'var(--accent)' }}>
                    {(() => {
                      const total = (sc.assignedActivities?.length||0) + (sc.completedActivities?.length||0);
                      return total === 0 ? '0%' : `${Math.round((sc.completedActivities?.length||0)/total*100)}%`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Patient Tasks */}
              <div className="card" style={{ marginBottom:'20px' }}>
                <h3 style={{ fontWeight:'700', marginBottom:'16px' }}>🎯 Current Objectives for {sc.name}</h3>
                {(!sc.assignedActivities || sc.assignedActivities.length === 0) ? (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>No active tasks at this level.</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {sc.assignedActivities.map(act => (
                      <div key={act._id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'10px', background:'white' }}>
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

              {/* Task Library */}
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                  <h3 style={{ fontWeight:'700' }}>📚 Assign Targeted Therapy</h3>
                  <select className="input" style={{ width:'150px', padding:'6px 12px' }} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
                    <option value="all">All Levels</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>
                
                {availableToAssign.length === 0 ? (
                  <p style={{ color:'var(--text-muted)', fontSize:'0.9rem' }}>No new activities found for {sc.name}'s current level ({sc.level}).</p>
                ) : (
                  <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                    {availableToAssign.map(act => (
                      <div key={act._id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px', border:'1px solid var(--border)', borderRadius:'10px', background:'white' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:'700' }}>{act.title}</div>
                          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{act.category} · {act.duration}</div>
                        </div>
                        <button className="btn btn-primary" style={{ padding:'7px 14px', fontSize:'0.82rem' }}
                          onClick={() => handleAssign(sc._id, act._id)} disabled={assigning === act._id}>
                          {assigning === act._id ? '...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;
