import React, { useState } from 'react';
import { googleLogin, firebaseSync, registerUser, loginUser } from '../services/api';
import { useLang } from '../context/LanguageContext';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup, updateProfile, signOut } from 'firebase/auth';

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ─── Reusable input ──────────────────────────────────────────────────────── */
const Field = ({ label, id, type = 'text', placeholder, value, onChange, required, minLength, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    <label htmlFor={id} style={{ fontSize: '0.82rem', fontWeight: '600', color: '#374151', letterSpacing: '0.02em' }}>
      {label}
    </label>
    {children || (
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        style={{
          padding: '10px 14px',
          borderRadius: '10px',
          border: '1.5px solid #e5e7eb',
          fontSize: '0.93rem',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.2s',
          background: '#fafafa',
          color: '#111827',
        }}
        onFocus={e => (e.target.style.borderColor = '#7c3aed')}
        onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
      />
    )}
  </div>
);

/* ─── Left panel content per mode ─────────────────────────────────────────── */
const LeftPanel = ({ mode, STATS }) => {
  const { t } = useLang();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '50px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6366f1 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
      <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <span style={{ fontSize: '2rem' }}>🧩</span>
          <span style={{ fontWeight: '800', fontSize: '1.4rem', letterSpacing: '-0.02em' }}>AutismAssist</span>
        </div>

        {/* Dynamic Heading based on mode */}
        {mode === 'login' ? (
          <>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px' }}>
              Welcome back to your therapy hub
            </h2>
            <p style={{ fontSize: '0.98rem', opacity: 0.88, lineHeight: 1.6, marginBottom: '36px' }}>
              Sign in to view today’s tailored activities, track emotion metrics, and review your child’s weekly progress.
            </p>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: 1.2, marginBottom: '16px' }}>
              Start your child’s personalized journey
            </h2>
            <p style={{ fontSize: '0.98rem', opacity: 0.88, lineHeight: 1.6, marginBottom: '36px' }}>
              Create an account to access AI-driven autism assessment, customized therapy activities, and progress reporting.
            </p>
          </>
        )}

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '44px' }}>
          {[
            '90% accurate autism level classification',
            'Real-time emotion detection during sessions',
            'Weekly AI-generated progress reports',
          ].map((item, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', opacity: 0.95 }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800'
              }}>✓</span>
              {item}
            </div>
          ))}
        </div>

        {/* Stats strip */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
          paddingTop: '28px', borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          {STATS.map((s, i) => (
            <div key={i}>
              <div style={{ fontWeight: '800', fontSize: '1.3rem' }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', opacity: 0.78, marginTop: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Role selector card component ────────────────────────────────────────── */
const RoleCard = ({ role, selected, onSelect, title, desc, icon }) => (
  <div
    onClick={() => onSelect(role)}
    style={{
      flex: 1,
      padding: '20px',
      borderRadius: '14px',
      border: `2px solid ${selected ? '#7c3aed' : '#e5e7eb'}`,
      background: selected ? 'rgba(124, 58, 237, 0.04)' : '#fafafa',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}
  >
    <div style={{ fontSize: '1.8rem' }}>{icon}</div>
    <div style={{ fontWeight: '700', fontSize: '1rem', color: '#111827' }}>{title}</div>
    <div style={{ fontSize: '0.82rem', color: '#6b7280', lineHeight: 1.4 }}>{desc}</div>
  </div>
);

export default function AuthPage({ onLogin }) {
  const { lang, setLang, toggleLang, t } = useLang();
  
  // URL query param check (e.g. /login?mode=register)
  const initialMode = new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login';
  
  const [mode, setMode]     = useState(initialMode); // 'login' | 'register'
  const [step, setStep]     = useState(1);          // Step 1: select role (register), Step 2: details
  const [role, setRole]     = useState('');         // 'parent' | 'therapist'
  const [form, setForm]     = useState({ name: '', email: '', password: '', phone: '', specialization: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');

  const STATS = [
    { value: '500+', label: t('hero_stat3_label') },
    { value: '120+', label: t('nav_features') },
    { value: '4.9★', label: t('nav_reviews') },
  ];

  const ROLES = [
    {
      role: 'parent',
      icon: '👨‍👩‍👧',
      title: t('auth_role_parent_title'),
      desc: t('auth_role_parent_desc'),
    },
    {
      role: 'therapist',
      icon: '🩺',
      title: t('auth_role_therapist_title'),
      desc: t('auth_role_therapist_desc'),
    },
  ];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const switchMode = m => {
    setMode(m);
    setStep(1);
    setRole('');
    setError('');
    setSuccess('');
  };

  /* ── Login with Email/Password ─────────────────────────────────────────── */
  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      // Attempt Firebase login if available in background
      try {
        const result = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
        if (result && result.user && !result.user.emailVerified) {
          await signOut(auth);
        }
      } catch (fbErr) {
        console.warn("Firebase Auth notice:", fbErr.message);
      }

      const data = await loginUser(form.email.trim(), form.password);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Register with Email/Password ─────────────────────────────────────────── */
  const handleRegisterSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!form.email || form.password.length < 6) {
      setError('A valid email and a password of at least 6 characters are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role: role || 'parent',
        name: form.name.trim() || form.email.split('@')[0],
        email: form.email.trim(),
        password: form.password,
        phone: form.phone ? form.phone.trim() : '',
        specialization: role === 'therapist' ? (form.specialization || 'General') : ''
      };

      const data = await registerUser(payload);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      setSuccess(lang === 'en' ? 'Account created successfully! Signing you in…' : 'ಖಾತೆಯನ್ನು ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ! ಸೈನ್ ಇನ್ ಮಾಡಲಾಗುತ್ತಿದೆ…');
      setTimeout(() => onLogin(data.user), 800);
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google Sign In ─────────────────────────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      const data = await googleLogin(user.email, user.displayName, mode === 'register' && role ? role : 'parent');
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (error) {
      console.error(error);
      setError(error.message || 'Google sign in failed');
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f3ff 0%, #e0f2fe 100%)',
      padding: '20px',
      position: 'relative',
    }}>
      {/* Absolute Language Switcher */}
      <button
        onClick={toggleLang}
        style={{
          position: 'absolute', top: 20, right: 20, zIndex: 100,
          padding: '8px 18px', borderRadius: 50, fontWeight: 700, fontSize: '.85rem',
          cursor: 'pointer', fontFamily: 'inherit', border: '1.5px solid var(--primary)',
          background: 'white', color: 'var(--primary)', boxShadow: '0 4px 12px rgba(99,102,241,0.1)',
          transition: 'all .3s',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        🌐 {lang === 'en' ? 'ಕನ್ನಡ' : 'EN'}
      </button>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 420px) minmax(0, 480px)',
        width: '100%',
        maxWidth: '900px',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: '0 30px 80px rgba(109, 40, 217, 0.18)',
        minHeight: '600px',
      }}>
        {/* ── Left: graphic / branding ──────────────────────────────────── */}
        <LeftPanel mode={mode} />

        {/* ── Right: form ───────────────────────────────────────────────── */}
        <div style={{
          background: 'white',
          padding: '44px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
          position: 'relative',
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            background: '#f3f4f6',
            borderRadius: '14px',
            padding: '4px',
            marginBottom: '28px',
          }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                style={{
                  flex: 1,
                  padding: '11px',
                  border: 'none',
                  borderRadius: '11px',
                  fontFamily: 'inherit',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? '#6d28d9' : '#9ca3af',
                  boxShadow: mode === m ? '0 2px 10px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m === 'login' ? t('auth_sign_in') : t('auth_create_account')}
              </button>
            ))}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem',
              display: 'flex', alignItems: 'flex-start', gap: '8px',
            }}>
              <span>⚠️</span> {error}
            </div>
          )}
          {success && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534',
              borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span>✅</span> {success}
            </div>
          )}

          {/* ── SIGN IN ─────────────────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                  {t('auth_welcome_back')}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                  {t('auth_signin_desc')}
                </p>
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Field label={t('auth_email')} id="login-email" type="email" placeholder="your@email.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />
                <Field label={t('auth_password')} id="login-password" type="password" placeholder="••••••••"
                  value={form.password} onChange={e => set('password', e.target.value)} required />
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'inherit',
                    transition: 'all 0.2s', marginTop: '4px',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(124,58,237,0.4)',
                  }}
                >
                  {loading ? t('auth_signing_in') : t('auth_signing_btn')}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                <div style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.85rem' }}>or</div>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                type="button"
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb',
                  background: 'white', color: '#374151', fontWeight: '600', fontSize: '0.95rem',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#9ca3af' }}>
                {t('auth_no_account')}{' '}
                <button onClick={() => switchMode('register')} style={{
                  background: 'none', border: 'none', color: '#7c3aed', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                }}>
                  {t('auth_create_one_free')}
                </button>
              </p>
            </>
          )}

          {/* ── REGISTER STEP 1: Pick role ─────────────────────────────── */}
          {mode === 'register' && step === 1 && (
            <>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                  {t('auth_role_title')}
                </h2>
                <p style={{ color: '#6b7280', fontSize: '0.88rem' }}>
                  {t('auth_who_joining')}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => { setRole(r.value); setStep(2); }}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '18px',
                      borderRadius: '14px', border: `2px solid ${role === r.value ? r.color : '#e5e7eb'}`,
                      background: role === r.value ? r.bg : '#fafafa',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = r.bg; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = role === r.value ? r.color : '#e5e7eb'; e.currentTarget.style.background = role === r.value ? r.bg : '#fafafa'; }}
                  >
                    <span style={{
                      fontSize: '2rem', width: '48px', height: '48px', borderRadius: '12px',
                      background: r.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: '700', color: '#111827', fontSize: '0.95rem', marginBottom: '4px' }}>{r.label}</div>
                      <div style={{ fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.5 }}>{r.desc}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', color: '#d1d5db', fontSize: '1.2rem', alignSelf: 'center' }}>›</span>
                  </button>
                ))}
              </div>

              <div style={{
                background: '#f9fafb', borderRadius: '10px', padding: '12px 14px',
                fontSize: '0.8rem', color: '#6b7280', lineHeight: 1.6, borderLeft: '3px solid #7c3aed',
              }}>
                {t('auth_child_notice')}
              </div>

              <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#9ca3af' }}>
                {t('auth_already_registered')}{' '}
                <button onClick={() => switchMode('login')} style={{
                  background: 'none', border: 'none', color: '#7c3aed', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                }}>
                  {t('auth_sign_in')}
                </button>
              </p>
            </>
          )}

          {/* ── REGISTER STEP 2: Form ──────────────────────────────────── */}
          {mode === 'register' && step === 2 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <button
                  type="button" onClick={() => { setStep(1); setError(''); }}
                  style={{
                    background: 'none', border: '1.5px solid #e5e7eb', borderRadius: '8px',
                    padding: '5px 12px', cursor: 'pointer', fontSize: '0.82rem', color: '#6b7280', fontFamily: 'inherit',
                  }}
                >
                  {t('auth_back')}
                </button>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                  background: ROLES.find(r => r.value === role)?.bg,
                  color: ROLES.find(r => r.value === role)?.color,
                  padding: '4px 12px', borderRadius: '20px', fontWeight: '700',
                }}>
                  {ROLES.find(r => r.value === role)?.icon}{' '}
                  {role === 'parent' ? t('auth_role_parent') : t('auth_role_therapist')}
                </span>
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#111827', marginBottom: '4px' }}>
                {t('auth_complete_profile')}
              </h2>
              <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '20px' }}>
                {t('auth_fill_details')}
              </p>

              <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <Field label={t('auth_full_name')} id="reg-name" placeholder="e.g. Sarah Johnson"
                  value={form.name} onChange={e => set('name', e.target.value)} required />

                <Field label={t('auth_email')} id="reg-email" type="email" placeholder="name@example.com"
                  value={form.email} onChange={e => set('email', e.target.value)} required />

                <Field label={t('auth_password')} id="reg-password" type="password" placeholder="Minimum 6 characters"
                  value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />

                {role === 'therapist' && (
                  <Field label={t('auth_specialization')} id="reg-spec">
                    <select
                      id="reg-spec"
                      value={form.specialization}
                      onChange={e => set('specialization', e.target.value)}
                      style={{
                        padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb',
                        fontSize: '0.93rem', fontFamily: 'inherit', outline: 'none', background: '#fafafa', color: '#111827',
                        transition: 'border-color 0.2s', cursor: 'pointer',
                      }}
                      onFocus={e => (e.target.style.borderColor = '#0891b2')}
                      onBlur={e => (e.target.style.borderColor = '#e5e7eb')}
                    >
                      <option value="">{t('auth_select_spec')}</option>
                      <option value="ABA Therapy">ABA Therapy</option>
                      <option value="Speech Therapy">Speech & Language Therapy</option>
                      <option value="Occupational Therapy">Occupational Therapy</option>
                      <option value="Behavioral Therapy">Behavioral Therapy</option>
                      <option value="Play Therapy">Play & Developmental Therapy</option>
                    </select>
                  </Field>
                )}

                <button
                  id="register-submit"
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '13px', borderRadius: '12px', border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                    color: 'white', fontWeight: '700', fontSize: '0.95rem', fontFamily: 'inherit',
                    transition: 'all 0.2s', marginTop: '6px',
                    boxShadow: loading ? 'none' : '0 4px 15px rgba(124,58,237,0.4)',
                  }}
                >
                  {loading ? t('auth_creating_acct') : t('auth_create_btn')}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
                <div style={{ padding: '0 10px', color: '#6b7280', fontSize: '0.85rem' }}>or</div>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }}></div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                type="button"
                style={{
                  width: '100%', padding: '12px', borderRadius: '12px', border: '1.5px solid #e5e7eb',
                  background: 'white', color: '#374151', fontWeight: '600', fontSize: '0.95rem',
                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', cursor: 'pointer', transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px' }} />
                Continue with Google
              </button>

              <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '0.82rem', color: '#9ca3af' }}>
                {t('auth_signup_agree')}
              </p>

              <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.85rem', color: '#9ca3af' }}>
                {t('auth_already_registered')}{' '}
                <button onClick={() => switchMode('login')} style={{
                  background: 'none', border: 'none', color: '#7c3aed', fontWeight: '700',
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit',
                }}>
                  {t('auth_sign_in')}
                </button>
              </p>
            </>
          )}

          {/* ── OTP VERIFICATION MODAL OVERLAY (Removed) ──────────────────────────── */}
        </div>
      </div>
    </div>
  );
};
