import React from 'react';
import './index.css';

const Navbar = () => {
  return (
    <nav className="glass-panel" style={styles.navbar}>
      <div style={styles.logoContainer}>
        <div style={styles.logoIcon}>🧩</div>
        <h1 style={styles.logoText}>Aura <span style={styles.highlight}>Assist</span></h1>
      </div>
      
      <div style={styles.navLinks}>
        <a href="#dashboard" style={styles.link}>Dashboard</a>
        <a href="#activities" style={styles.link}>Therapy Activities</a>
        <a href="#progress" style={styles.link}>Progress</a>
      </div>

      <div style={styles.profileContainer}>
        <div style={styles.welcomeText}>
          <span style={styles.greeting}>Welcome,</span>
          <span style={styles.parentName}>Parent</span>
        </div>
        <div style={styles.avatar}>
          <img src="https://i.pravatar.cc/150?img=47" alt="Profile" style={styles.avatarImg} />
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    margin: '1rem',
    borderRadius: 'var(--radius-lg)',
    position: 'sticky',
    top: '1rem',
    zIndex: 1000,
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '2rem',
  },
  logoText: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--text-dark)',
  },
  highlight: {
    color: 'var(--primary-color)',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  link: {
    textDecoration: 'none',
    color: 'var(--text-muted)',
    fontWeight: '500',
    fontSize: '1.1rem',
    transition: 'color 0.2s ease, transform 0.2s ease',
    position: 'relative',
  },
  profileContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  welcomeText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  greeting: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  parentName: {
    fontWeight: '600',
    color: 'var(--text-dark)',
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid var(--primary-light)',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  }
};

export default Navbar;
