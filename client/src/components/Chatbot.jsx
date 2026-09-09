import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../services/api';
import { speak } from '../utils/speechHelper';

const QUICK_CHIPS = [
  "🧘 How to handle sensory meltdowns?",
  "💬 Tips for non-verbal communication",
  "🧩 Best therapy games for Level 2",
  "🌙 Bedtime calming routine",
  "🍎 Helping with sensory picky eating",
  "🌿 Understanding stimming behavior"
];

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: "init_1",
      sender: "bot",
      text: "👋 **Hello! I am your AI Autism Clinical Assistant.**\n\nI can help you with evidence-based sensory strategies, ABA routines, communication techniques, and therapy game recommendations.\n\nWhat would you like support with today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (userText) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || loading) return;

    const userMsg = { id: `u_${Date.now()}`, sender: "user", text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!userText) setInput("");
    setLoading(true);

    try {
      const res = await sendChatMessage(textToSend);
      const botMsg = {
        id: `b_${Date.now()}`,
        sender: "bot",
        text: res.reply || "I am here to support your child's therapy journey. Please try asking about sensory diets or games!",
        source: res.source
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `b_err_${Date.now()}`,
          sender: "bot",
          text: "I'm having a brief connection delay, but remember: during sensory meltdowns, reduce bright lights and offer deep pressure hugs."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeakText = (id, text) => {
    if (speakingId === id) {
      window.speechSynthesis?.cancel();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    const cleanText = text.replace(/[*_#•]/g, "");
    speak(cleanText, "en", {
      rate: 0.9,
      pitch: 1.1,
      onEnd: () => setSpeakingId(null)
    });
  };

  return (
    <div style={styles.container}>
      {isOpen && (
        <div style={styles.chatWindow}>
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerLeft}>
              <div style={styles.avatarWrap}>
                <span style={{ fontSize: '1.4rem' }}>🤖</span>
                <span style={styles.onlineDot} />
              </div>
              <div>
                <h3 style={styles.headerTitle}>AI Autism Companion</h3>
                <p style={styles.headerStatus}>Clinical Behavioral AI &bull; Active</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setMessages([messages[0]])}
                title="Clear Chat"
                style={styles.actionBtn}
              >
                🗑️
              </button>
              <button style={styles.closeBtn} onClick={() => setIsOpen(false)}>×</button>
            </div>
          </div>

          {/* Quick Suggestion Chips */}
          <div style={styles.chipsRow}>
            {QUICK_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip)}
                style={styles.chipBtn}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div style={styles.messagesContainer}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  ...styles.messageWrap,
                  justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={m.sender === 'user' ? styles.userMessage : styles.botMessage}
                >
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.5', fontSize: '0.88rem' }}>
                    {m.text}
                  </div>
                  {m.sender === 'bot' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        onClick={() => handleSpeakText(m.id, m.text)}
                        style={styles.speakBtn}
                        title="Read aloud"
                      >
                        {speakingId === m.id ? '🔊 Speaking...' : '🗣️ Listen'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ ...styles.messageWrap, justifyContent: 'flex-start' }}>
                <div style={styles.botMessage}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
                    <span style={{ fontSize: '0.8rem', color: '#4F6EF7', fontWeight: '700' }}>AI is analyzing clinical guidance...</span>
                    <span style={styles.typingDot} />
                    <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                    <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={styles.inputArea}
          >
            <input
              type="text"
              placeholder="Ask about meltdowns, speech, games..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={styles.input}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                ...styles.sendBtn,
                opacity: !input.trim() || loading ? 0.6 : 1,
              }}
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          style={styles.fab}
          onClick={() => setIsOpen(true)}
          title="Open AI Autism Therapy Assistant"
        >
          <span style={{ fontSize: '1.4rem' }}>🤖</span>
          <span style={styles.fabText}>AI Clinical Chat</span>
        </button>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    zIndex: 99999,
  },
  fab: {
    background: 'linear-gradient(135deg, #4F6EF7, #3b82f6)',
    color: '#fff',
    border: 'none',
    borderRadius: '30px',
    padding: '0.8rem 1.4rem',
    fontSize: '1rem',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 8px 24px rgba(79, 110, 247, 0.4)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  fabText: {
    fontSize: '0.92rem',
    letterSpacing: '0.3px',
  },
  chatWindow: {
    width: '380px',
    maxWidth: 'calc(100vw - 32px)',
    height: '560px',
    maxHeight: 'calc(100vh - 80px)',
    background: '#ffffff',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: {
    padding: '16px 18px',
    background: 'linear-gradient(135deg, #0f172a, #1e293b)',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatarWrap: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: '#334155',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid #0f172a',
  },
  headerTitle: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '800',
    color: '#ffffff',
  },
  headerStatus: {
    margin: 0,
    fontSize: '0.72rem',
    color: '#94a3b8',
    fontWeight: '600',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '4px',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.6rem',
    color: '#94a3b8',
    cursor: 'pointer',
    lineHeight: '1',
  },
  chipsRow: {
    display: 'flex',
    gap: '6px',
    padding: '10px 14px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'none',
  },
  chipBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '16px',
    padding: '5px 10px',
    fontSize: '0.74rem',
    fontWeight: '700',
    color: '#475569',
    cursor: 'pointer',
    flexShrink: 0,
  },
  messagesContainer: {
    flex: 1,
    padding: '14px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    background: '#f8fafc',
  },
  messageWrap: {
    display: 'flex',
    width: '100%',
  },
  botMessage: {
    backgroundColor: '#ffffff',
    color: '#1e293b',
    padding: '12px 14px',
    borderRadius: '18px 18px 18px 4px',
    maxWidth: '85%',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #e2e8f0',
  },
  userMessage: {
    backgroundColor: '#4F6EF7',
    color: '#ffffff',
    padding: '10px 14px',
    borderRadius: '18px 18px 4px 18px',
    maxWidth: '82%',
    boxShadow: '0 4px 12px rgba(79, 110, 247, 0.25)',
  },
  speakBtn: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    padding: '3px 8px',
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#475569',
    cursor: 'pointer',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4F6EF7',
    display: 'inline-block',
  },
  inputArea: {
    padding: '12px 14px',
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '20px',
    border: '1.5px solid #cbd5e1',
    outline: 'none',
    fontSize: '0.88rem',
    fontFamily: 'inherit',
  },
  sendBtn: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#4F6EF7',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    flexShrink: 0,
  }
};

export default Chatbot;

