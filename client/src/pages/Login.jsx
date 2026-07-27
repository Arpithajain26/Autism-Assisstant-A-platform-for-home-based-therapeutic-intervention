import React, { useState } from 'react';
import { loginUser } from '../services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      // Store token and user info
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '70vh',
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo / Icon */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            fontSize: '2.5rem',
            marginBottom: '8px',
          }}>🧩</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '4px' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>
            Log in to your parent dashboard
          </p>
        </div>

        {/* Demo hint */}
        <div style={{
          background: '#e0e7ff',
          borderRadius: '8px',
          padding: '10px 14px',
          marginBottom: '20px',
          fontSize: '0.82rem',
          color: '#3730a3',
        }}>
          <strong>Demo account:</strong> parent@example.com / password123
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            background: '#fee2e2',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            color: '#991b1b',
            fontSize: '0.9rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              Email Address
            </label>
            <input
              id="login-email"
              className="input-glass"
              type="email"
              placeholder="e.g. parent@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
              Password
            </label>
            <input
              id="login-password"
              className="input-glass"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            id="login-submit"
            type="submit"
            className="btn-primary"
            style={{ marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-light)' }}>
          Don't have an account?{' '}
          <a href="#" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
            Contact your therapist
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
