import React, { useState, useEffect } from 'react';
import {
  getChildren,
  assignTask,
  getActivities,
  createChild,
  generateLinkCode,
} from '../services/api';

const LEVEL_LABEL = { 1: '🌱 Beginner (L1)', 2: '🌿 Intermediate (L2)', 3: '🌳 Advanced (L3)' };
const LEVEL_COLOR_TEXT = { 1: '#166534', 2: '#854d0e', 3: '#991b1b' };

const TherapistDashboard = ({ user, onNavigate }) => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  // Add Patient Modal
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', age: '', gender: 'male', supportLevel: 'Level 1 - Requiring Support' });
  const [modalLoading, setModalLoading] = useState(false);
  const [createdLinkCode, setCreatedLinkCode] = useState('');

  const loadData = async () => {
    try {
      const [kids, acts] = await Promise.all([getChildren(user._id), getActivities()]);
      const validKids = Array.isArray(kids) ? kids : [];
      setChildren(validKids);
      setActivities(Array.isArray(acts) ? acts : []);
      if (validKids.length > 0) {
        setSelectedChild((prev) => {
          if (!prev) return validKids[0];
          const found = validKids.find((k) => k._id === prev._id);
          return found || validKids[0];
        });
      } else {
        setSelectedChild(null);
      }
    } catch (err) {
      console.error('Failed to load therapist data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user._id]);

  const handleAssign = async (childId, actId) => {
    setAssigning(actId);
    try {
      await assignTask(childId, actId);
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning('');
    }
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    try {
      const res = await createChild({
        therapistId: user._id,
        name: newPatient.name.trim(),
        age: parseInt(newPatient.age),
        gender: newPatient.gender,
        supportLevel: newPatient.supportLevel,
      });

      if (res.child?.linkCode) {
        setCreatedLinkCode(res.child.linkCode);
      } else {
        setShowModal(false);
      }
      await loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setModalLoading(false);
    }
  };

  const handleGenCode = async (childId) => {
    try {
      const res = await generateLinkCode(childId);
      alert(`Generated Link Code: ${res.linkCode}\nGive this 6-digit code to the parent.`);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const sc = selectedChild;
  const filteredActivities = activities.filter((a) => {
    if (filterLevel === 'all') return true;
    return a.level === parseInt(filterLevel);
  });

  const availableToAssign = sc
    ? filteredActivities.filter(
        (a) =>
          a.level === sc.level &&
          !sc.assignedActivities?.some((aa) => aa._id === a._id) &&
          !sc.completedActivities?.some((ca) => ca._id === a._id)
      )
    : [];

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '32px',
          background: 'white',
          padding: '24px 28px',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          border: '1px solid var(--border)',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}>Therapist Dashboard 👩‍⚕️</h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Welcome, <strong>{user.name}</strong> ({user.specialization || 'Clinical Specialist'})!
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setCreatedLinkCode('');
            setNewPatient({ name: '', age: '', gender: 'male', supportLevel: 'Level 1 - Requiring Support' });
            setShowModal(true);
          }}
          style={{ padding: '12px 24px', fontWeight: '700', borderRadius: '12px' }}
        >
          ➕ Register New Patient
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : children.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
          <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>No Patients Assigned Yet</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 20px auto' }}>
            Click <strong>"+ Register New Patient"</strong> to create a clinical profile and generate a parent link code.
          </p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            ➕ Register First Patient
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Patient Selector */}
          <div>
            <h3
              style={{
                fontWeight: '700',
                marginBottom: '14px',
                fontSize: '0.85rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              Patient Roster ({children.length})
            </h3>

            {children.map((child) => {
              const isSelected = sc?._id === child._id;
              return (
                <button
                  key={child._id}
                  onClick={() => setSelectedChild(child)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      flexShrink: 0,
                    }}
                  >
                    🧒
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.98rem' }}>{child.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <span style={{ fontWeight: '700', color: '#4f46e5' }}>{child.childId || 'CHD-XXXX'}</span> · Age {child.age}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Patient Details */}
          {sc && (
            <div>
              {/* Header Box */}
              <div className="card" style={{ marginBottom: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', margin: 0 }}>{sc.name}</h2>
                    <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Child ID: <strong style={{ color: 'var(--primary)' }}>{sc.childId || 'CHD-XXXX'}</strong> · Age {sc.age} ({sc.gender})
                    </div>
                  </div>

                  {sc.linkCode ? (
                    <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem' }}>
                      Link Code for Parent: <strong style={{ letterSpacing: '1px', fontSize: '1rem', color: '#b45309' }}>{sc.linkCode}</strong>
                    </div>
                  ) : (
                    <button
                      className="btn"
                      onClick={() => handleGenCode(sc._id)}
                      style={{ fontSize: '0.82rem', background: '#f3f4f6', border: '1px solid var(--border)' }}
                    >
                      🔑 Generate Parent Link Code
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid-2" style={{ marginBottom: '24px' }}>
                <div className="stat-card" style={{ borderLeft: `5px solid ${LEVEL_COLOR_TEXT[sc.level] || '#6366f1'}` }}>
                  <div className="stat-label">Assessment Level</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '800', color: LEVEL_COLOR_TEXT[sc.level] || 'var(--primary)', marginTop: '4px' }}>
                    {sc.level ? LEVEL_LABEL[sc.level] : '⏳ Pending'}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--primary)' }}>
                  <div className="stat-label">Active Tasks</div>
                  <div className="stat-num" style={{ color: 'var(--primary)' }}>
                    {sc.assignedActivities?.length || 0}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--green)' }}>
                  <div className="stat-label">Total Completed</div>
                  <div className="stat-num" style={{ color: 'var(--green)' }}>
                    {sc.completedActivities?.length || 0}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--accent)' }}>
                  <div className="stat-label">Goal Completion</div>
                  <div className="stat-num" style={{ color: 'var(--accent)' }}>
                    {(() => {
                      const total = (sc.assignedActivities?.length || 0) + (sc.completedActivities?.length || 0);
                      return total === 0 ? '0%' : `${Math.round(((sc.completedActivities?.length || 0) / total) * 100)}%`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Current Active Tasks */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontWeight: '700', marginBottom: '16px' }}>🎯 Current Active Goals for {sc.name}</h3>
                {!sc.assignedActivities || sc.assignedActivities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No active tasks assigned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {sc.assignedActivities.map((act) => (
                      <div
                        key={act._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          background: 'white',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700' }}>{act.title}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {act.category} · {act.duration}
                          </div>
                        </div>
                        <span className={`badge badge-${act.difficulty?.toLowerCase()}`}>{act.difficulty}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assign New Activities */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ fontWeight: '700', margin: 0 }}>📚 Assign Targeted Clinical Activities</h3>
                  <select
                    className="input"
                    style={{ width: '150px', padding: '6px 12px' }}
                    value={filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value)}
                  >
                    <option value="all">All Levels</option>
                    <option value="1">Level 1</option>
                    <option value="2">Level 2</option>
                    <option value="3">Level 3</option>
                  </select>
                </div>

                {availableToAssign.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No unassigned activities for the selected level filter.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {availableToAssign.map((act) => (
                      <div
                        key={act._id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px 16px',
                          border: '1px solid var(--border)',
                          borderRadius: '10px',
                          background: 'white',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700' }}>{act.title}</div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {act.category} · {act.duration} · Level {act.level}
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '7px 14px', fontSize: '0.82rem' }}
                          onClick={() => handleAssign(sc._id, act._id)}
                          disabled={assigning === act._id}
                        >
                          {assigning === act._id ? '...' : '+ Assign'}
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

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="fade-in"
            style={{
              background: 'white',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Register New Patient</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', fontWeight: '700', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {createdLinkCode ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h3 style={{ fontWeight: '800', marginBottom: '8px' }}>Patient Profile Created!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                  Share this 6-digit Link Code with the child's parent so they can claim the profile from their Parent Dashboard:
                </p>
                <div
                  style={{
                    background: '#fef3c7',
                    border: '2px dashed #f59e0b',
                    padding: '16px',
                    borderRadius: '12px',
                    fontSize: '1.8rem',
                    fontWeight: '800',
                    letterSpacing: '4px',
                    color: '#b45309',
                    fontFamily: 'monospace',
                    marginBottom: '24px',
                  }}
                >
                  {createdLinkCode}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowModal(false)}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="label">Patient Full Name *</label>
                  <input
                    className="input"
                    placeholder="e.g. Leo Smith"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="label">Age *</label>
                    <input
                      className="input"
                      type="number"
                      min="1"
                      max="18"
                      value={newPatient.age}
                      onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Gender *</label>
                    <select
                      className="input"
                      value={newPatient.gender}
                      onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Support Level</label>
                  <select
                    className="input"
                    value={newPatient.supportLevel}
                    onChange={(e) => setNewPatient({ ...newPatient, supportLevel: e.target.value })}
                  >
                    <option value="Level 1 - Requiring Support">Level 1 - Requiring Support</option>
                    <option value="Level 2 - Substantial Support">Level 2 - Substantial Support</option>
                    <option value="Level 3 - Very Substantial Support">Level 3 - Very Substantial Support</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button type="button" className="btn" style={{ flex: 1, justifyContent: 'center', background: '#f3f4f6' }} onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={modalLoading}>
                    {modalLoading ? 'Creating...' : 'Create & Get Code'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TherapistDashboard;
