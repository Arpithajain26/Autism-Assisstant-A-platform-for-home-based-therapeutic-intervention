import React, { useState } from 'react';
import { registerUser, loginUser } from '../services/api';

const ROLES = [
  { value: 'parent',    label: 'Parent',    icon: '👨‍👩‍👧', desc: 'Monitor your child\'s progress and manage activities' },
  { value: 'therapist', label: 'Therapist', icon: '👩‍⚕️', desc: 'Manage multiple children and assign therapy tasks' },
  { value: 'child',     label: 'Child',     icon: '🧒',   desc: 'Complete fun activities and track your achievements' },
];

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState('login');        // 'login' | 'register'
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1);             // register step 1=role, 2=form
  const [form, setForm] = useState({ name: '', email: '', password: '', age: '', parentEmail: '', specialization: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const data = await loginUser(form.email, form.password);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const payload = { role, name: form.name, email: form.email, password: form.password };
      if (role === 'child') { payload.age = form.age; payload.parentEmail = form.parentEmail; }
      if (role === 'therapist') { payload.specialization = form.specialization; }
      const data = await registerUser(payload);
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const resetToLogin = () => { setMode('login'); setStep(1); setRole(''); setError(''); setForm({ name:'',email:'',password:'',age:'',parentEmail:'',specialization:'' }); };

  return (
    <div className="fade-in" style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'80vh', padding:'20px' }}>
      <div style={{ width:'100%', maxWidth:'460px' }}>

        {/* Brand */}
        <div style={{ textAlign:'center', marginBottom:'32px' }}>
          <div style={{ fontSize:'3rem', marginBottom:'8px' }}>🧩</div>
          <h1 style={{ fontSize:'2rem', fontWeight:'800', color:'var(--primary)' }}>AutismAssist</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.95rem', marginTop:'4px' }}>Home-based therapy, powered by care</p>
        </div>

        <div className="card">
          {/* Tabs */}
          <div style={{ display:'flex', background:'#f3f4f6', borderRadius:'10px', padding:'4px', marginBottom:'24px' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setStep(1); setError(''); }} style={{
                flex:1, padding:'9px', border:'none', borderRadius:'8px', fontFamily:'inherit',
                fontWeight:'600', fontSize:'0.9rem', cursor:'pointer', transition:'all 0.2s',
                background: mode===m ? 'white' : 'transparent',
                color: mode===m ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: mode===m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
              }}>
                {m === 'login' ? '🔑 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom:'16px' }}>{error}</div>}

          {/* ── LOGIN ─────────────────────────────────────────── */}
          {mode === 'login' && (
            <>
              <div className="alert alert-info" style={{ marginBottom:'20px', fontSize:'0.82rem' }}>
                <strong>Demo accounts:</strong><br/>
                👨‍👩‍👧 parent@example.com &nbsp;|&nbsp; 👩‍⚕️ therapist@example.com &nbsp;|&nbsp; 🧒 child@example.com<br/>
                <em>Password: password123 (all accounts)</em>
              </div>
              <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                <div>
                  <label className="label">Email Address</label>
                  <input id="login-email" className="input" type="email" placeholder="your@email.com"
                    value={form.email} onChange={e => set('email', e.target.value)} required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input id="login-password" className="input" type="password" placeholder="••••••••"
                    value={form.password} onChange={e => set('password', e.target.value)} required />
                </div>
                <button id="login-submit" type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
                  {loading ? <><span className="spinner" style={{ width:18,height:18 }} /> Signing in...</> : 'Sign In →'}
                </button>
              </form>
            </>
          )}

          {/* ── REGISTER Step 1: Role ──────────────────────────── */}
          {mode === 'register' && step === 1 && (
            <div>
              <h3 style={{ fontWeight:'700', marginBottom:'4px' }}>I am a...</h3>
              <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'20px' }}>Choose your account type</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {ROLES.map(r => (
                  <button key={r.value} onClick={() => { setRole(r.value); setStep(2); }}
                    style={{
                      display:'flex', alignItems:'center', gap:'16px', padding:'16px',
                      borderRadius:'10px', border: `2px solid ${role===r.value ? 'var(--primary)' : 'var(--border)'}`,
                      background: role===r.value ? 'var(--primary-light)' : 'white',
                      cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.2s',
                    }}>
                    <span style={{ fontSize:'2rem' }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight:'700', color:'var(--text)' }}>{r.label}</div>
                      <div style={{ fontSize:'0.82rem', color:'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── REGISTER Step 2: Form ──────────────────────────── */}
          {mode === 'register' && step === 2 && (
            <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                <button type="button" onClick={() => setStep(1)} style={{ background:'none', border:'1px solid var(--border)', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'0.85rem', color:'var(--text-muted)' }}>← Back</button>
                <span className={`badge badge-${role}`}>{ROLES.find(r=>r.value===role)?.icon} {role}</span>
              </div>

              <div>
                <label className="label">Full Name</label>
                <input className="input" placeholder="Your full name" value={form.name} onChange={e=>set('name',e.target.value)} required />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e=>set('email',e.target.value)} required />
              </div>
              <div>
                <label className="label">Password</label>
                <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e=>set('password',e.target.value)} required minLength={6} />
              </div>

              {role === 'child' && <>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" min="2" max="18" placeholder="Child's age" value={form.age} onChange={e=>set('age',e.target.value)} required />
                </div>
                <div>
                  <label className="label">Parent's Email (optional)</label>
                  <input className="input" type="email" placeholder="Parent account email to link" value={form.parentEmail} onChange={e=>set('parentEmail',e.target.value)} />
                </div>
              </>}

              {role === 'therapist' && (
                <div>
                  <label className="label">Specialization</label>
                  <select className="input" value={form.specialization} onChange={e=>set('specialization',e.target.value)}>
                    <option value="">Select specialization</option>
                    <option>ABA Therapy</option>
                    <option>Speech Therapy</option>
                    <option>Occupational Therapy</option>
                    <option>Behavioral Therapy</option>
                    <option>Play Therapy</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width:'100%', justifyContent:'center' }} disabled={loading}>
                {loading ? <><span className="spinner" style={{ width:18,height:18 }} /> Creating account...</> : 'Create Account ✨'}
              </button>
            </form>
          )}

          {mode === 'register' && step === 2 && (
            <p style={{ marginTop:'16px', textAlign:'center', fontSize:'0.85rem', color:'var(--text-muted)' }}>
              Already have an account?{' '}
              <button onClick={resetToLogin} style={{ background:'none', border:'none', color:'var(--primary)', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Sign In</button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
