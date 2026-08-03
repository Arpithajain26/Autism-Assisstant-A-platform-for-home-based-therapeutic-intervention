import React, { useState } from 'react';
import './index.css';

const ActivityCard = ({ title, description, category, duration, icon, image, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="glass-panel animate-fade-in"
      style={{
        ...styles.card,
        transform: isHovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: isHovered ? 'var(--shadow-hover)' : 'var(--shadow-lg)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div style={styles.imageContainer}>
        {image ? (
          <img src={image} alt={title} style={styles.image} />
        ) : (
          <div style={styles.iconPlaceholder}>{icon || '🎯'}</div>
        )}
        <div style={styles.badge}>{category}</div>
      </div>
      
      <div style={styles.content}>
        <h3 style={styles.title}>{title}</h3>
        <p style={styles.description}>{description}</p>
        
        <div style={styles.footer}>
          <div style={styles.duration}>
            <span style={styles.clockIcon}>⏱️</span>
            {duration} mins
          </div>
          <button 
            style={{
              ...styles.button,
              backgroundColor: isHovered ? 'var(--primary-color)' : 'transparent',
              color: isHovered ? '#fff' : 'var(--primary-color)',
            }}
          >
            Start Now
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    height: '100%',
    border: 'none',
    padding: '0',
  },
  imageContainer: {
    height: '180px',
    position: 'relative',
    backgroundColor: 'var(--primary-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  iconPlaceholder: {
    fontSize: '4rem',
  },
  badge: {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'rgba(255,255,255,0.9)',
    color: 'var(--text-dark)',
    padding: '0.25rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '600',
    boxShadow: 'var(--shadow-sm)',
  },
  content: {
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--text-dark)',
    marginBottom: '0.5rem',
  },
  description: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    lineHeight: '1.5',
    marginBottom: '1.5rem',
    flex: 1,
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  duration: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '500',
  },
  clockIcon: {
    fontSize: '1.1rem',
  },
  button: {
    padding: '0.5rem 1.25rem',
    borderRadius: 'var(--radius-sm)',
    border: '2px solid var(--primary-color)',
    fontWeight: '600',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  }
};

export default ActivityCard;
