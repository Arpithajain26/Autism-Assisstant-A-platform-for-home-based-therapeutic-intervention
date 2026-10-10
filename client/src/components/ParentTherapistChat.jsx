import React, { useState, useEffect, useRef } from "react";
import { sendDirectMessage, getDirectMessages, markAllMessagesRead } from "../services/api";

export default function ParentTherapistChat({ child, user, therapistInfo }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const bottomRef = useRef(null);

  const childId = child?._id || child?.id;
  const therapistName =
    therapistInfo?.name ||
    (child?.age <= 5 ? "Dr. Ananya Sharma (Toddler Specialist)" : child?.age <= 8 ? "Dr. Rajesh Kulkarni (Early School)" : "Dr. Meera Nambiar (Older Children)");

  const loadMessages = async () => {
    if (!childId) return;
    try {
      const data = await getDirectMessages(childId);
      const list = Array.isArray(data) ? data : [];
      setMessages(list);
      // Mark therapist messages as read
      markAllMessagesRead(childId, "parent").catch(() => {});
    } catch (err) {
      console.warn("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // Poll every 10s if open
    const timer = setInterval(() => {
      if (isOpen) {
        getDirectMessages(childId)
          .then((data) => {
            if (Array.isArray(data)) setMessages(data);
          })
          .catch(() => {});
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [childId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend) => {
    const msgText = (textToSend || input).trim();
    if (!msgText || sending || !childId) return;

    setSending(true);
    setInput("");
    try {
      await sendDirectMessage(childId, user?._id || user?.id, "parent", msgText);
      await loadMessages();
    } catch (err) {
      console.warn("Failed to send message", err);
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter((m) => m.senderRole === "therapist" && !m.isRead).length;

  const quickPrompts = [
    "💡 How to handle sensory distress during tasks?",
    "⏰ Can we shorten the daily session duration?",
    "🌟 Child loved today's game! What should we do next?",
    "❓ Advice for upcoming mastery exam?",
  ];

  return (
    <div
      style={{
        background: "#ffffff",
        border: "2px solid #e0e7ff",
        borderRadius: "20px",
        marginBottom: "24px",
        boxShadow: "0 4px 20px rgba(79, 70, 229, 0.06)",
        overflow: "hidden",
      }}
    >
      {/* Header bar / accordion toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 22px",
          background: isOpen ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)" : "#f8faff",
          color: isOpen ? "#ffffff" : "#1e293b",
          cursor: "pointer",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: isOpen ? "rgba(255,255,255,0.2)" : "#e0e7ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}
          >
            🩺
          </div>
          <div>
            <div style={{ fontWeight: "800", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>Chat with Therapist — {therapistName}</span>
              <span
                style={{
                  background: isOpen ? "#22c55e" : "#16a34a",
                  color: "white",
                  fontSize: "0.68rem",
                  padding: "2px 8px",
                  borderRadius: "99px",
                  fontWeight: "800",
                }}
              >
                ● Online
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: isOpen ? "#c7d2fe" : "#64748b", marginTop: "2px" }}>
              Ask questions, request task changes, or get clinical feedback for {child?.name || "your child"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {unreadCount > 0 && !isOpen && (
            <span
              style={{
                background: "#ef4444",
                color: "white",
                padding: "3px 10px",
                borderRadius: "99px",
                fontWeight: "900",
                fontSize: "0.78rem",
                animation: "pulse 1s infinite",
              }}
            >
              {unreadCount} new
            </span>
          )}
          <span style={{ fontSize: "1.2rem", fontWeight: "700" }}>{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Accordion Chat Body */}
      {isOpen && (
        <div style={{ display: "flex", flexDirection: "column", height: "460px", background: "#f8fafc" }}>
          {/* Messages list */}
          <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading messages...</div>
            ) : messages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>💬</div>
                <div style={{ fontWeight: "800", color: "#1e293b", fontSize: "1rem" }}>No messages yet</div>
                <p style={{ fontSize: "0.86rem", margin: "6px 0 0" }}>
                  Start a direct conversation with {therapistName}. Ask questions or share your child's home observations!
                </p>
              </div>
            ) : (
              messages.map((m, idx) => {
                const isParent = m.senderRole === "parent";
                return (
                  <div
                    key={m._id || idx}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isParent ? "flex-end" : "flex-start",
                      maxWidth: "100%",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "#64748b",
                        fontWeight: "700",
                        marginBottom: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{isParent ? "You (Parent)" : `👩‍⚕️ ${m.sender?.name || therapistName}`}</span>
                      <span>•</span>
                      <span>
                        {m.createdAt
                          ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Just now"}
                      </span>
                    </div>

                    <div
                      style={{
                        maxWidth: "75%",
                        padding: "12px 16px",
                        borderRadius: isParent ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isParent ? "linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)" : "#ffffff",
                        color: isParent ? "#ffffff" : "#0f172a",
                        boxShadow: isParent ? "0 4px 14px rgba(79, 70, 229, 0.25)" : "0 2px 8px rgba(0,0,0,0.05)",
                        border: isParent ? "none" : "1px solid #e2e8f0",
                        fontSize: "0.92rem",
                        lineHeight: "1.5",
                        wordBreak: "break-word",
                      }}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts chips */}
          <div
            style={{
              padding: "8px 16px",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSend(qp)}
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "99px",
                  padding: "5px 12px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  color: "#334155",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.15s",
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Message input bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              display: "flex",
              gap: "10px",
              padding: "12px 16px",
              background: "#ffffff",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <input
              type="text"
              placeholder={`Send clinical inquiry or question to ${therapistName}...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={sending}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: "14px",
                border: "1.5px solid #cbd5e1",
                fontSize: "0.9rem",
                outline: "none",
                fontFamily: "inherit",
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              style={{
                padding: "12px 24px",
                borderRadius: "14px",
                border: "none",
                background: !input.trim() || sending ? "#cbd5e1" : "#4f46e5",
                color: "#ffffff",
                fontWeight: "800",
                fontSize: "0.92rem",
                cursor: !input.trim() || sending ? "not-allowed" : "pointer",
                boxShadow: !input.trim() || sending ? "none" : "0 4px 12px rgba(79, 70, 229, 0.3)",
                transition: "all 0.15s",
              }}
            >
              {sending ? "Sending..." : "Send ➤"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
