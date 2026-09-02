import React, { useState, useEffect } from 'react';
import {
  getChildren,
  createChild,
  deleteChild,
  linkByCode,
  assignTask,
  getActivities,
  getParentFeedback,
} from '../services/api';

const LEVEL_LABEL = { 1: '🌱 Beginner (L1)', 2: '🌿 Intermediate (L2)', 3: '🌳 Advanced (L3)' };
const LEVEL_COLOR_BG = { 1: '#dcfce7', 2: '#fef9c3', 3: '#fee2e2' };
const LEVEL_COLOR_TEXT = { 1: '#166534', 2: '#854d0e', 3: '#991b1b' };

// FeedbackCard component for parent dashboard
const FeedbackCard = ({ feedback }) => (
  <div
    style={{
      background: feedback.isRead ? '#f8faff' : '#EEF1FF',
      border: `2px solid ${feedback.isRead ? '#e2e8f0' : '#4F6EF7'}`,
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '14px',
    }}
  >
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>
            {feedback.therapist?.name || 'Dr. Therapist'} ({feedback.type ? feedback.type.replace('_', ' ').toUpperCase() : 'GUIDANCE'})
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {new Date(feedback.createdAt || Date.now()).toLocaleDateString()}
          </div>
        </div>
      </div>
      {!feedback.isRead && (
        <span
          style={{
            background: '#4F6EF7',
            color: 'white',
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '0.72rem',
            fontWeight: 700,
          }}
        >
          NEW
        </span>
      )}
    </div>
    <div
      style={{
        fontSize: '0.92rem',
        color: '#1e293b',
        lineHeight: '1.6',
      }}
    >
      {feedback.message}
    </div>
  </div>
);


const ParentDashboard = ({ user, onNavigate }) => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState('');

  // Add Child Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChild, setNewChild] = useState({
    name: '',
    age: '',
    gender: 'male',
    profilePhoto: null,
    supportLevel: 'Level 1 - Requiring Support',
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Link Code State
  const [linkCodeInput, setLinkCodeInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState({ text: '', type: '' });

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
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user._id]);

  useEffect(() => {
    if (selectedChild?._id) {
      getParentFeedback(selectedChild._id)
        .then((res) => setFeedbackList(Array.isArray(res) ? res : []))
        .catch(() => setFeedbackList([]));
    } else {
      setFeedbackList([]);
    }
  }, [selectedChild?._id]);


  // Handle Photo Upload -> Base64 Data URL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setCreateError('Photo size must be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setNewChild((prev) => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Create Child Profile
  const handleCreateChild = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      if (!newChild.name || !newChild.age) {
        throw new Error('Name and age are required.');
      }
      const res = await createChild({
        parentId: user._id,
        name: newChild.name.trim(),
        age: parseInt(newChild.age),
        gender: newChild.gender,
        profilePhoto: newChild.profilePhoto,
        supportLevel: newChild.supportLevel,
      });

      // Reset form & close modal
      setNewChild({ name: '', age: '', gender: 'male', profilePhoto: null, supportLevel: 'Level 1 - Requiring Support' });
      setPhotoPreview(null);
      setShowAddModal(false);

      if (res && res.child && res.child._id) {
        handleStartTherapy(res.child._id);
      } else {
        await loadData();
      }
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Delete Child Profile
  const handleDeleteChild = async (childId, childName) => {
    if (window.confirm(`Are you sure you want to remove ${childName}'s profile?`)) {
      try {
        await deleteChild(childId);
        await loadData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  // Claim child by Link Code
  const handleLinkCodeSubmit = async (e) => {
    e.preventDefault();
    if (!linkCodeInput.trim()) return;
    setLinkMessage({ text: '', type: '' });
    setLinkLoading(true);

    try {
      const res = await linkByCode(user._id, linkCodeInput.trim());
      setLinkMessage({ text: res.message || 'Child linked successfully!', type: 'success' });
      setLinkCodeInput('');
      await loadData();
    } catch (err) {
      setLinkMessage({ text: err.message, type: 'error' });
    } finally {
      setLinkLoading(false);
    }
  };

  // Assign task to selected child
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

  // Start Therapy
  const handleStartTherapy = (childId) => {
    const kid = children.find((k) => k._id === childId) || selectedChild;
    if (kid) {
      localStorage.setItem(
        "currentChild",
        JSON.stringify({
          _id: kid._id,
          name: kid.name || "Child",
          level: Number(kid.level) || 1,
          age: Number(kid.age) || 6,
          profilePhoto: kid.profilePhoto || kid.photo || kid.avatar || null,
        })
      );
    }
    if (onNavigate) {
      onNavigate(`/child/${childId}`);
    }
  };

  const sc = selectedChild;
  const availableToAssign = sc
    ? activities.filter(
        (a) =>
          a.level === sc.level &&
          !sc.assignedActivities?.some((aa) => aa._id === a._id) &&
          !sc.completedActivities?.some((ca) => ca._id === a._id)
      )
    : [];

  return (
    <div className="fade-in" style={{ paddingBottom: '60px' }}>
      {/* Header Bar */}
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
          <h1 style={{ fontSize: '2rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
            Parent Dashboard 👨‍👩‍👧
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '0.95rem' }}>
            Welcome, <strong>{user.name}</strong>! Manage child profiles and launch therapy sessions.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '12px 24px',
            fontSize: '0.98rem',
            fontWeight: '700',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
          }}
        >
          ➕ Add Child Profile
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}>
          <span className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      ) : (
        <>
          {/* Children Overview / Cards */}
          <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                Child Profiles ({children.length})
              </h2>
            </div>

            {children.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '48px 24px', background: '#fafafa' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>🧒</div>
                <h3 style={{ fontWeight: '700', fontSize: '1.2rem', marginBottom: '6px' }}>No Child Profiles Created Yet</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '420px', margin: '0 auto 20px auto' }}>
                  Children do not register with email accounts. Click <strong>"+ Add Child Profile"</strong> above to create a profile for your child.
                </p>
                <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  ➕ Add First Child
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px',
                }}
              >
                {children.map((child) => {
                  const isSelected = sc?._id === child._id;
                  const totalTasks = (child.assignedActivities?.length || 0) + (child.completedActivities?.length || 0);
                  const progressPct = totalTasks > 0 ? Math.round(((child.completedActivities?.length || 0) / totalTasks) * 100) : 0;

                  return (
                    <div
                      key={child._id}
                      className="card child-card-item"
                      style={{
                        position: 'relative',
                        borderRadius: '16px',
                        border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                        background: isSelected ? 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)' : 'white',
                        boxShadow: isSelected ? '0 8px 24px rgba(99, 102, 241, 0.15)' : '0 2px 10px rgba(0,0,0,0.04)',
                        padding: '24px',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {/* Delete button */}
                      <button
                        title="Delete Child Profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChild(child._id, child.name);
                        }}
                        style={{
                          position: 'absolute',
                          top: '14px',
                          right: '14px',
                          background: '#fee2e2',
                          color: '#ef4444',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          cursor: 'pointer',
                          fontWeight: '700',
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>

                      {/* Header info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                        {child.profilePhoto ? (
                          <img
                            src={child.profilePhoto}
                            alt={child.name}
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid var(--primary)',
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '56px',
                              height: '56px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '1.5rem',
                              fontWeight: '700',
                              flexShrink: 0,
                            }}
                          >
                            {child.gender === 'female' ? '👧' : '👦'}
                          </div>
                        )}

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, color: 'var(--text)' }}>
                              {child.name}
                            </h3>
                          </div>

                          <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                background: '#e0e7ff',
                                color: '#3730a3',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontFamily: 'monospace',
                              }}
                            >
                              {child.childId || 'CHD-XXXX'}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Age {child.age}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Level Badge */}
                      <div style={{ marginBottom: '16px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: LEVEL_COLOR_BG[child.level] || '#f3f4f6',
                            color: LEVEL_COLOR_TEXT[child.level] || '#4b5563',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            padding: '4px 12px',
                            borderRadius: '20px',
                          }}
                        >
                          {child.level ? LEVEL_LABEL[child.level] : '⏳ Pending Initial Assessment'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>Therapy Progress</span>
                          <span>{child.completedActivities?.length || 0} completed</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)', transition: 'width 0.4s' }} />
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleStartTherapy(child._id)}
                          style={{
                            width: '100%',
                            justifyContent: 'center',
                            fontWeight: '700',
                            borderRadius: '10px',
                            padding: '10px',
                          }}
                        >
                          🚀 Start Therapy
                        </button>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            className="btn"
                            onClick={() => setSelectedChild(child)}
                            style={{ flex: 1, borderRadius: '10px' }}
                          >
                            Details
                          </button>
                          <button
                            className="btn"
                            onClick={() => onNavigate(`/progress/${child._id}`)}
                            style={{ flex: 1, borderRadius: '10px' }}
                          >
                            📈 View Progress
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Link Code Box for Therapist-created Children */}
          <div
            className="card"
            style={{
              marginBottom: '36px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              border: '1px solid #bfdbfe',
              padding: '24px',
              borderRadius: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.6rem' }}>🔗</span>
              <h3 style={{ margin: 0, fontWeight: '700', fontSize: '1.1rem', color: '#1e40af' }}>
                Have a Link Code from a Therapist?
              </h3>
            </div>
            <p style={{ color: '#3b82f6', fontSize: '0.88rem', margin: '0 0 16px 0' }}>
              If your child's therapist created a profile first, enter the 6-digit code provided by them to link the profile to your dashboard.
            </p>

            <form onSubmit={handleLinkCodeSubmit} style={{ display: 'flex', gap: '12px', maxWidth: '440px' }}>
              <input
                className="input"
                placeholder="e.g. X7KD92"
                value={linkCodeInput}
                onChange={(e) => setLinkCodeInput(e.target.value.toUpperCase())}
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                  fontWeight: '700',
                  fontFamily: 'monospace',
                  background: 'white',
                }}
                maxLength={6}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={linkLoading || !linkCodeInput.trim()}
                style={{ flexShrink: 0, padding: '0 20px' }}
              >
                {linkLoading ? 'Linking...' : 'Link Child'}
              </button>
            </form>

            {linkMessage.text && (
              <div
                style={{
                  marginTop: '12px',
                  fontSize: '0.88rem',
                  fontWeight: '600',
                  color: linkMessage.type === 'error' ? '#dc2626' : '#166534',
                }}
              >
                {linkMessage.type === 'error' ? '❌ ' : '✅ '}
                {linkMessage.text}
              </div>
            )}
          </div>

          {/* Selected Child Detail View */}
          {sc && (
            <div style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', marginBottom: '16px' }}>
                Activity & Task Management — {sc.name} ({sc.childId || 'CHD-XXXX'})
              </h2>

              {/* Therapist Guidance & Feedback Section */}
              {feedbackList.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    💬 Clinical Guidance from Therapist ({feedbackList.length})
                  </h3>
                  <div>
                    {feedbackList.map((fb) => (
                      <FeedbackCard key={fb._id} feedback={fb} />
                    ))}
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="stat-card" style={{ borderLeft: `5px solid ${LEVEL_COLOR_TEXT[sc.level] || '#6366f1'}` }}>
                  <div className="stat-label">Assessment Level</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: LEVEL_COLOR_TEXT[sc.level] || 'var(--primary)', marginTop: '4px' }}>
                    {sc.level ? LEVEL_LABEL[sc.level] : '⏳ Assessment Needed'}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid #ea580c' }}>
                  <div className="stat-label">Daily Streak</div>
                  <div className="stat-num" style={{ color: '#ea580c' }}>
                    🔥 {sc.streak || 0}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--green)' }}>
                  <div className="stat-label">Completed Tasks</div>
                  <div className="stat-num" style={{ color: 'var(--green)' }}>
                    {sc.completedActivities?.length || 0}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--primary)' }}>
                  <div className="stat-label">Active Assigned Tasks</div>
                  <div className="stat-num" style={{ color: 'var(--primary)' }}>
                    {sc.assignedActivities?.length || 0}
                  </div>
                </div>

                <div className="stat-card" style={{ borderLeft: '5px solid var(--accent)' }}>
                  <div className="stat-label">Completion Rate</div>
                  <div className="stat-num" style={{ color: 'var(--accent)' }}>
                    {(() => {
                      const total = (sc.assignedActivities?.length || 0) + (sc.completedActivities?.length || 0);
                      return total === 0 ? '0%' : `${Math.round(((sc.completedActivities?.length || 0) / total) * 100)}%`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Currently Assigned Tasks */}
              <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontWeight: '700', margin: 0 }}>📋 Current Assigned Tasks</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleStartTherapy(sc._id)}
                    style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                  >
                    Open Therapy View
                  </button>
                </div>

                {!sc.assignedActivities || sc.assignedActivities.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>
                    No active tasks assigned yet. Assign new activities from the section below!
                  </p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {sc.assignedActivities.map((act) => {
                      const cardColor = act.color || "#6366f1";
                      return (
                        <div
                          key={act._id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '16px',
                            border: '1.5px solid #e0e7ff',
                            borderRadius: '16px',
                            background: 'white',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.8rem' }}>{act.icon || '🫧'}</span>
                              <span style={{ background: '#fef3c7', color: '#b45309', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                                +{act.xp || 40} XP
                              </span>
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '0.98rem', color: '#1e1b4b', marginBottom: '2px' }}>
                              {act.title}
                            </div>
                            {act.titleKn && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                                {act.titleKn}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: cardColor, fontWeight: '700', marginBottom: '12px' }}>
                              {act.category} · ⏱ {act.duration}
                            </div>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => handleStartTherapy(sc._id)}
                            style={{ width: '100%', padding: '8px', fontSize: '0.85rem', fontWeight: '800', borderRadius: '10px' }}
                          >
                            ▶ Play Now! 🎮
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assign More Activities */}
              {availableToAssign.length > 0 && (
                <div className="card">
                  <h3 style={{ fontWeight: '800', marginBottom: '16px', color: '#1e1b4b' }}>
                    ➕ Recommended {LEVEL_LABEL[sc.level] || `Level ${sc.level}`} Evidence-Based Activities
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {availableToAssign.map((act) => {
                      const cardColor = act.color || "#6366f1";
                      return (
                        <div
                          key={act._id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            padding: '16px',
                            border: '1.5px solid #e2e8f0',
                            borderRadius: '16px',
                            background: '#f8fafc',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.8rem' }}>{act.icon || '🧩'}</span>
                              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: '800' }}>
                                +{act.xp || 45} XP
                              </span>
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '0.98rem', color: '#0f172a', marginBottom: '2px' }}>
                              {act.title}
                            </div>
                            {act.titleKn && (
                              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '700', marginBottom: '6px' }}>
                                {act.titleKn}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: cardColor, fontWeight: '700', marginBottom: '12px' }}>
                              {act.category} · ⏱ {act.duration}
                            </div>
                          </div>
                          <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '8px', fontSize: '0.85rem', fontWeight: '800', borderRadius: '10px' }}
                            onClick={() => handleAssign(sc._id, act._id)}
                            disabled={assigning === act._id}
                          >
                            {assigning === act._id ? 'Assigning...' : '+ Assign Activity'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── ADD CHILD MODAL ────────────────────────────────────────────────── */}
      {showAddModal && (
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
              maxWidth: '520px',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.8rem' }}>👶</span>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Add Child Profile</h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '20px' }}>
              Create a therapy profile for your child. A unique ID (e.g. CHD-1001) will be generated automatically.
            </p>

            {createError && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{createError}</div>}

            <form onSubmit={handleCreateChild} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Profile Photo Upload */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      borderRadius: '50%',
                      background: '#f3f4f6',
                      border: '2px dashed var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    📷
                  </div>
                )}
                <div>
                  <label className="label" style={{ marginBottom: '4px' }}>Child Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ fontSize: '0.82rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="label">Child's Full Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Timmy Johnson"
                  value={newChild.name}
                  onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="label">Age (Years) *</label>
                  <input
                    className="input"
                    type="number"
                    min="1"
                    max="18"
                    placeholder="e.g. 5"
                    value={newChild.age}
                    onChange={(e) => setNewChild({ ...newChild, age: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="label">Gender *</label>
                  <select
                    className="input"
                    value={newChild.gender}
                    onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                  >
                    <option value="male">Male 👦</option>
                    <option value="female">Female 👧</option>
                    <option value="other">Other 🧒</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Autism Support Level (optional)</label>
                <select
                  className="input"
                  value={newChild.supportLevel}
                  onChange={(e) => setNewChild({ ...newChild, supportLevel: e.target.value })}
                >
                  <option value="Level 1 - Requiring Support">Level 1 - Requiring Support</option>
                  <option value="Level 2 - Substantial Support">Level 2 - Substantial Support</option>
                  <option value="Level 3 - Very Substantial Support">Level 3 - Very Substantial Support</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, justifyContent: 'center', background: '#f3f4f6' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {createLoading ? 'Creating...' : 'Create Profile ✨'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentDashboard;
