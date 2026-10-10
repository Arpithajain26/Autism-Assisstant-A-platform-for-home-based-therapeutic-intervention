import React, { useState } from "react";
import { updateParentAIPreferences } from "../services/api";

export default function ParentAIPreferencesModal({ preferences, onClose, onSaved }) {
  const [form, setForm] = useState({
    preferredLanguage: preferences?.preferredLanguage || "en",
    preferredInteraction: preferences?.preferredInteraction || "text",
    explanationLevel: preferences?.explanationLevel || "standard",
    guidancePreference: preferences?.guidancePreference || "step_by_step",
    assistanceFrequency: preferences?.assistanceFrequency || "medium",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateParentAIPreferences(form);
      if (onSaved) onSaved(res.preferences || form);
      onClose();
    } catch (err) {
      alert("Failed to save AI preferences. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const optionBtnStyle = (active, activeColor = "#7c3aed") => ({
    padding: "10px 14px",
    borderRadius: "12px",
    border: active ? `2px solid ${activeColor}` : "1.5px solid #e2e8f0",
    background: active ? `${activeColor}10` : "#f8fafc",
    color: active ? activeColor : "#475569",
    fontWeight: "700",
    fontSize: "0.85rem",
    cursor: "pointer",
    flex: 1,
    textAlign: "center",
    transition: "all 0.2s ease",
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, 0.7)",
        backdropFilter: "blur(6px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          maxWidth: "520px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          border: "1px solid #e2e8f0",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ fontSize: "1.35rem", fontWeight: "800", margin: 0, color: "#0f172a" }}>
              🤖 Personalized Parent AI Settings
            </h2>
            <p style={{ color: "#64748b", fontSize: "0.88rem", margin: "4px 0 0 0" }}>
              How would you like AutismAssist to help you?
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* 1. Preferred Language */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              🌐 Preferred Language
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                style={optionBtnStyle(form.preferredLanguage === "en", "#4f46e5")}
                onClick={() => setForm({ ...form, preferredLanguage: "en" })}
              >
                🇬🇧 English
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.preferredLanguage === "kn", "#059669")}
                onClick={() => setForm({ ...form, preferredLanguage: "kn" })}
              >
                🇮🇳 ಕನ್ನಡ (Kannada)
              </button>
            </div>
          </div>

          {/* 2. Preferred Interaction */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              💬 Preferred Interaction Style
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={optionBtnStyle(form.preferredInteraction === "text", "#7c3aed")}
                onClick={() => setForm({ ...form, preferredInteraction: "text" })}
              >
                📝 Text
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.preferredInteraction === "voice", "#2563eb")}
                onClick={() => setForm({ ...form, preferredInteraction: "voice" })}
              >
                🎤 Voice
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.preferredInteraction === "both", "#9333ea")}
                onClick={() => setForm({ ...form, preferredInteraction: "both" })}
              >
                ✨ Both
              </button>
            </div>
          </div>

          {/* 3. Explanation Level */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              💡 Explanation Depth & Style
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={optionBtnStyle(form.explanationLevel === "simple", "#16a34a")}
                onClick={() => setForm({ ...form, explanationLevel: "simple" })}
              >
                🌱 Simple
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.explanationLevel === "standard", "#4f46e5")}
                onClick={() => setForm({ ...form, explanationLevel: "standard" })}
              >
                🌿 Standard
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.explanationLevel === "detailed", "#d97706")}
                onClick={() => setForm({ ...form, explanationLevel: "detailed" })}
              >
                📊 Detailed
              </button>
            </div>
          </div>

          {/* 4. Guidance Preference */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              📋 Activity Guidance Preference
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                style={optionBtnStyle(form.guidancePreference === "step_by_step", "#0891b2")}
                onClick={() => setForm({ ...form, guidancePreference: "step_by_step" })}
              >
                🔢 Step-by-Step Instructions
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.guidancePreference === "quick", "#475569")}
                onClick={() => setForm({ ...form, guidancePreference: "quick" })}
              >
                ⚡ Quick Overview
              </button>
            </div>
          </div>

          {/* 5. AI Assistance Frequency */}
          <div>
            <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "#334155", display: "block", marginBottom: "8px" }}>
              ⏰ AI Assistance Frequency
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                style={optionBtnStyle(form.assistanceFrequency === "low", "#64748b")}
                onClick={() => setForm({ ...form, assistanceFrequency: "low" })}
              >
                Low
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.assistanceFrequency === "medium", "#7c3aed")}
                onClick={() => setForm({ ...form, assistanceFrequency: "medium" })}
              >
                Medium
              </button>
              <button
                type="button"
                style={optionBtnStyle(form.assistanceFrequency === "high", "#e11d48")}
                onClick={() => setForm({ ...form, assistanceFrequency: "high" })}
              >
                High
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: "12px",
                border: "1.5px solid #cbd5e1",
                background: "white",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1.5,
                padding: "12px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "white",
                fontWeight: "800",
                cursor: "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Preferences ✨"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
