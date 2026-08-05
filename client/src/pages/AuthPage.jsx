import React, { useState } from 'react';
import { googleLogin, firebaseSync } from '../services/api';
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
const LeftPanel = ({ mode }) => {
  const { t } = useLang();
  
  const STATS = [
    { value: '500+', label: t('hero_stat3_label') },
    { value: '120+', label: t('nav_features') },
    { value: '4.9★', label: t('nav_reviews') },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 36px',
        background: 'linear-gradient(145deg, #6d28d9 0%, #4f46e5 50%, #0891b2 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        minHeight: '100%',
      }}
    >
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
      <div style={{ position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

      {mode === 'register' ? (
        <>
          {/* Autism awareness image */}
          <div style={{
            width: '100%',
            maxWidth: 280,
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            marginBottom: '28px',
            border: '3px solid rgba(255,255,255,0.3)',
          }}>
            <img
              src="/autism_register_banner.jpg"
              alt="Children supported through autism therapy"
              style={{ width: '100%', display: 'block', objectFit: 'cover' }}
            />
          </div>

          {/* Autism awareness ribbon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '50px',
            padding: '8px 20px',
            marginBottom: '18px',
            border: '1px solid rgba(255,255,255,0.25)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>🧩</span>
            <span style={{ fontSize: '0.82rem', fontWeight: '600', letterSpacing: '0.05em' }}>AUTISM ACCEPTANCE & SUPPORT</span>
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', textAlign: 'center', marginBottom: '10px', lineHeight: 1.2 }}>
            {t('topic1_title')}
          </h2>
          <p style={{ fontSize: '0.85rem', textAlign: 'center', opacity: 0.85, lineHeight: 1.6, maxWidth: 260 }}>
            {t('topic1_short')}
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '28px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: '800' }}>{s.value}</div>
                <div style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: '4.5rem', marginBottom: '16px' }}>🧩</div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: '800', textAlign: 'center', marginBottom: '12px', lineHeight: 1.2 }}>
            AutismAssist
          </h2>
          <p style={{ fontSize: '0.9rem', textAlign: 'center', opacity: 0.85, lineHeight: 1.7, maxWidth: 260, marginBottom: '32px' }}>
            {t('footer_tagline')}
          </p>

          {/* Feature list */}
          {[
            '📊 ' + t('feat3_title'),
            '🎯 ' + t('feat1_title'),
            '🤝 ' + t('feat4_title'),
          ].map(f => (
            <div key={f} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.12)',
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '10px',
              width: '100%',
              maxWidth: 280,
              fontSize: '0.85rem',
              backdropFilter: 'blur(6px)',
            }}>
              {f}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

/* ──═══════════════════════════════════════════════════════════════════════════ */
const AuthPage = ({ onLogin }) => {
  const { t, lang, toggleLang } = useLang();
  const [mode, setMode]     = useState('login');   // 'login' | 'register'
  const [role, setRole]     = useState('');
  const [step, setStep]     = useState(1);          // 1 = pick role, 2 = form
  const [form, setForm]     = useState({ name: '', email: '', password: '', phone: '', specialization: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // OTP Verification States
  const [actionType, setActionType]     = useState('login'); // 'login' or 'register'


  const ROLES = [
    {
      value: 'parent',
      label: t('auth_role_parent'),
      icon: '👨‍👩‍👧',
      color: '#7c3aed',
      bg: '#ede9fe',
      desc: t('auth_role_parent_desc'),
    },
    {
      value: 'therapist',
      label: t('auth_role_therapist'),
      icon: '👩‍⚕️',
      color: '#0891b2',
      bg: '#e0f2fe',
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
      const result = await signInWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = result.user;
      
      if (!user.emailVerified) {
        await signOut(auth);
        setError('Please verify your email address before logging in. Check your inbox for the verification link.');
        setLoading(false);
        return;
      }

      // If verified, sync with backend
      const tempRole = localStorage.getItem('temp_role');
      const tempSpec = localStorage.getItem('temp_spec');
      
      
      
      const payload = {
        email: user.email,
        name: user.displayName || form.email.split('@')[0],
        phone: form.phone || '', // Optional now
      };
      
      if (tempRole) payload.role = tempRole;
      if (tempSpec) payload.specialization = tempSpec;

      const data = await firebaseSync(payload);
      
      // Clean up local storage
      localStorage.removeItem('temp_role');
      localStorage.removeItem('temp_spec');
      
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
      const result = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const user = result.user;
      
      await updateProfile(user, { displayName: form.name.trim() });
      await sendEmailVerification(user);
      
      // Store role temporarily so we can send it on first login
      localStorage.setItem('temp_role', role);
      if (role === 'therapist' && form.specialization) {
        localStorage.setItem('temp_spec', form.specialization);
      }
      
      setSuccess('Account created! A verification link has been sent to your email. Please verify your email before signing in.');
      await signOut(auth); // Sign out immediately since they aren't verified yet
      
      // Switch back to login mode so they can sign in after verifying
      setTimeout(() => switchMode('login'), 3000);
      
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

export default AuthPage;
