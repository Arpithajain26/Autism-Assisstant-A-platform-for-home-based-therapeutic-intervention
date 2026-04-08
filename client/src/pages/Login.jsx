import React, { useState } from 'react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Logging in with', email, password);
    alert('Logged in successfully!');
    window.location.href = '/dashboard';
  };

  return (
    <div className="animate-fade-in" style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '60vh' 
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '400px' }}>
        <h2 style={{ marginBottom: '8px', textAlign: 'center', fontWeight: '700' }}>Welcome Back</h2>
        <p style={{ marginBottom: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
          Log in to your parent dashboard
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Email Address</label>
            <input 
              className="input-glass"
              type="email" 
              placeholder="e.g. parent@example.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Password</label>
            <input 
              className="input-glass"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>
            Sign In
          </button>
        </form>
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don't have an account? <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
