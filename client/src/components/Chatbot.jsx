import React, { useState } from 'react';
import './index.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={styles.container}>
      {isOpen && (
        <div className="glass-panel" style={styles.chatWindow}>
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <span style={styles.botIcon}>🤖</span>
              <div>
                <h3 style={styles.headerTitle}>AI Assistant</h3>
                <p style={styles.headerStatus}>Online</p>
              </div>
            </div>
            <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
          </div>
          
          <div style={styles.messagesContainer}>
            <div style={{...styles.messageWrap, justifyContent: 'flex-start'}}>
              <div style={styles.botMessage}>
                Hello! I am your therapy assistant. How can I help you today with your child's progress or activities?
              </div>
            </div>
            <div style={{...styles.messageWrap, justifyContent: 'flex-end'}}>
              <div style={styles.userMessage}>
                What activities do you recommend for today?
              </div>
            </div>
            <div style={{...styles.messageWrap, justifyContent: 'flex-start'}}>
              <div style={styles.botMessage}>
                Based on recent progress, I recommend the "Emotion Matching" or "Block Stacking" games.
              </div>
            </div>
          </div>
          
          <div style={styles.inputArea}>
            <input 
              type="text" 
              placeholder="Ask for recommendations..." 
              style={styles.input}
            />
            <button style={styles.sendBtn}>
              ➤
            </button>
          </div>
        </div>
      )}
      
      {!isOpen && (
        <button 
          style={styles.fab} 
          onClick={() => setIsOpen(true)}
          className="glass-panel"
        >
          🤖 <span style={styles.fabText}>Chat</span>
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '2rem',
    right: '2rem',
    zIndex: 9999,
  },
  fab: {
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    padding: '0.8rem 1.5rem',
    fontSize: '1.2rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: 'var(--shadow-lg)',
    transition: 'transform 0.2s',
  },
  fabText: {
    fontSize: '1rem',
  },
  chatWindow: {
    width: '350px',
    height: '500px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-hover)',
    transformOrigin: 'bottom right',
    animation: 'scaleIn 0.3s ease-out',
  },
  header: {
    padding: '1rem',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  botIcon: {
    fontSize: '2rem',
  },
  headerTitle: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--primary-color)',
  },
  headerStatus: {
    fontSize: '0.8rem',
    color: 'var(--secondary-color)',
    fontWeight: '600',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    lineHeight: '1',
  },
  messagesContainer: {
    flex: 1,
    padding: '1rem',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  messageWrap: {
    display: 'flex',
    width: '100%',
  },
  botMessage: {
    backgroundColor: '#fff',
    color: 'var(--text-dark)',
    padding: '0.75rem 1rem',
    borderRadius: '16px 16px 16px 4px',
    maxWidth: '80%',
    boxShadow: 'var(--shadow-sm)',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  userMessage: {
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    padding: '0.75rem 1rem',
    borderRadius: '16px 16px 4px 16px',
    maxWidth: '80%',
    boxShadow: 'var(--shadow-sm)',
    fontSize: '0.9rem',
    lineHeight: '1.4',
  },
  inputArea: {
    padding: '1rem',
    display: 'flex',
    gap: '0.5rem',
    borderTop: '1px solid rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  input: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    outline: 'none',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary-color)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};

export default Chatbot;
