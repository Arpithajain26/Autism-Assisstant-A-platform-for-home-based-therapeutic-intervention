import React, { useState, useEffect } from "react";
import { askParentAIAPI, explainSimplyAPI, learnParentInteractionAPI } from "../services/api";

export default function ParentAIAssistant({ childId, parentPreferences, onPreferencesUpdated }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const lang = parentPreferences?.preferredLanguage || "en";
  const expLevel = parentPreferences?.explanationLevel || "standard";

  const defaultPrompts = lang === "kn"
    ? [
        "ಇಂದು ನನ್ನ ಮಗುವಿನೊಂದಿಗೆ ನಾನು ಏನು ಮಾಡಬೇಕು?",
        "ಮಗುವಿನ ಪ್ರಗತಿಯನ್ನು ಸರಳವಾಗಿ ವಿವರಿಸಿ.",
        "ಈ ಆಟವನ್ನು ಏಕೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ?",
        "ಇಂದಿನ ಆಟವನ್ನು ಹೇಗೆ ಆಡಿಸಬೇಕು?"
      ]
    : [
        "What should I do with my child today?",
        "How is my child progressing?",
        "Why did AI recommend this activity?",
        "Explain my child's progress simply.",
        "How should I perform today's activity?"
      ];

  // Initialize conversation
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: lang === "kn"
          ? "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ವೈಯಕ್ತಿಕಗೊಳಿಸಿದ Parent AI Assistant. ಇಂದು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?"
          : "Hello! I am your Personalized Parent AI Assistant. Ask me anything about your child's activities, therapy recommendations, or progress!",
        id: "msg_init",
      },
    ]);
  }, [lang]);

  // Web Speech API - Voice Input
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = lang === "kn" ? "kn-IN" : "en-US";
      recognition.continuous = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = (e) => {
        setIsListening(false);
        console.warn("Speech recognition error:", e.error);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        handleSendQuestion(transcript, true);
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // Web Speech Synthesis - Text-to-Speech
  const handleTextToSpeech = (text) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported on this browser.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const cleanText = text.replace(/[^\w\s\u0C80-\u0CFF]/gi, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang === "kn" ? "kn-IN" : "en-US";

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit Question Handler
  const handleSendQuestion = async (promptText = null, isVoiceInput = false) => {
    const qText = promptText || question;
    if (!qText || !qText.trim()) return;

    const userMsg = { sender: "user", text: qText, id: "msg_" + Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await askParentAIAPI(qText, childId, isVoiceInput);
      const botMsg = {
        sender: "bot",
        text: res.reply,
        id: "msg_" + Date.now(),
        agentContext: res.agentContext,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "I'm having trouble retrieving details right now. Please try again in a moment.",
          id: "msg_err_" + Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Explain Simply Button Handler
  const handleExplainSimply = async (msgId, originalText) => {
    try {
      const res = await explainSimplyAPI(originalText, lang);
      await learnParentInteractionAPI("explain_simply");

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, text: res.simplified, simplified: true }
            : m
        )
      );

      if (onPreferencesUpdated) {
        onPreferencesUpdated();
      }
    } catch (err) {
      alert("Failed to simplify response.");
    }
  };

  return (
    <div
      className="card"
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f5f3ff 100%)",
        border: "2px solid #c7d2fe",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(124, 58, 237, 0.08)",
        marginBottom: "28px",
      }}
    >
      {/* Assistant Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
              fontWeight: "700",
            }}
          >
            🤖
          </div>
          <div>
            <h3 style={{ margin: 0, fontWeight: "800", fontSize: "1.15rem", color: "#1e1b4b" }}>
              Personalized Parent AI Assistant
            </h3>
            <div style={{ fontSize: "0.78rem", color: "#6d28d9", fontWeight: "700" }}>
              Tailored Mode: {expLevel.toUpperCase()} · {lang === "kn" ? "ಕನ್ನಡ" : "English"}
            </div>
          </div>
        </div>

        {/* Voice & TTS Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              background: "rgba(124, 58, 237, 0.1)",
              color: "#6d28d9",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: "700",
            }}
          >
            🧠 Context Aware
          </span>
        </div>
      </div>

      {/* Recommended Prompt Pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {defaultPrompts.map((p, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendQuestion(p)}
            style={{
              background: "white",
              border: "1px solid #ddd6fe",
              color: "#5b21b6",
              borderRadius: "20px",
              padding: "6px 14px",
              fontSize: "0.8rem",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            💡 {p}
          </button>
        ))}
      </div>

      {/* Messages Window */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          padding: "16px",
          maxHeight: "320px",
          overflowY: "auto",
          marginBottom: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              background: m.sender === "user" ? "linear-gradient(135deg, #7c3aed, #6366f1)" : "#f8fafc",
              color: m.sender === "user" ? "white" : "#1e293b",
              padding: "12px 16px",
              borderRadius: m.sender === "user" ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
              border: m.sender === "user" ? "none" : "1px solid #e2e8f0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ fontSize: "0.92rem", lineHeight: "1.55", whiteSpace: "pre-wrap" }}>
              {m.text}
            </div>

            {/* Action buttons for Bot Messages */}
            {m.sender === "bot" && (
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #cbd5e1" }}>
                {!m.simplified && (
                  <button
                    onClick={() => handleExplainSimply(m.id, m.text)}
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      border: "1px solid #fde047",
                      borderRadius: "8px",
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Explain Simply 💡
                  </button>
                )}
                <button
                  onClick={() => handleTextToSpeech(m.text)}
                  style={{
                    background: isSpeaking ? "#fee2e2" : "#e0e7ff",
                    color: isSpeaking ? "#991b1b" : "#3730a3",
                    border: "1px solid #c7d2fe",
                    borderRadius: "8px",
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {isSpeaking ? "⏹ Stop Voice" : "🔊 Listen Out Loud"}
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start", background: "#f1f5f9", padding: "10px 14px", borderRadius: "12px" }}>
            <span className="spinner" style={{ width: 16, height: 16, display: "inline-block" }} /> Thinking...
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          className="input"
          placeholder={lang === "kn" ? "ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಸಬ್ಮಿಟ್ ಮಾಡಿ..." : "Ask AI anything about your child..."}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendQuestion()}
          style={{ background: "white", borderRadius: "12px" }}
        />

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          title="Speak Question (Voice Input)"
          style={{
            background: isListening ? "#ef4444" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "0 16px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.9rem",
            boxShadow: isListening ? "0 0 15px rgba(239, 68, 68, 0.5)" : "none",
          }}
        >
          {isListening ? "🎙 Listening..." : "🎤 Voice"}
        </button>

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSendQuestion()}
          disabled={loading || !question.trim()}
          className="btn btn-primary"
          style={{ borderRadius: "12px", padding: "0 20px" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
