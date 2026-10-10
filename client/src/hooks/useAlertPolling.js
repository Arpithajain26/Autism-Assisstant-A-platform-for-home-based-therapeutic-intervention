import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export default function useAlertPolling(therapistId, intervalMs = 20000) {
  const [newAlerts, setNewAlerts] = useState([]);
  const lastCheckedRef = useRef(new Date(Date.now() - 10 * 60 * 1000).toISOString());
  const intervalRef = useRef(null);

  const checkForAlerts = async () => {
    if (!therapistId) return;
    try {
      const cleanBase = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
      const url = `${cleanBase}/api/therapist/alerts/unread?therapistId=${therapistId}&since=${encodeURIComponent(lastCheckedRef.current)}`;
      
      const token = localStorage.getItem("auth_token");
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(url, { headers });
      if (!res.ok) return;
      const data = await res.json();

      if (data.alerts && data.alerts.length > 0) {
        setNewAlerts((prev) => {
          const existingIds = new Set(prev.map((a) => String(a.id)));
          const fresh = data.alerts.filter((a) => !existingIds.has(String(a.id)));
          if (fresh.length > 0) {
            // Optional gentle chime for real-time awareness
            try {
              const ctx = new (window.AudioContext || window.webkitAudioContext)();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.type = "sine";
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25); // A5
              gain.gain.setValueAtTime(0.15, ctx.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.36);
            } catch (e) {
              // audio context not allowed without interaction, ignore
            }
          }
          return [...fresh, ...prev];
        });
      }

      if (data.checkedAt) {
        lastCheckedRef.current = data.checkedAt;
      }
    } catch (err) {
      // polling failure should be silent
    }
  };

  useEffect(() => {
    if (!therapistId) return;
    checkForAlerts();
    intervalRef.current = setInterval(checkForAlerts, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [therapistId, intervalMs]);

  const dismissAlert = (alertId) => {
    setNewAlerts((prev) => prev.filter((a) => String(a.id) !== String(alertId)));
  };

  const dismissAll = () => setNewAlerts([]);

  return { newAlerts, dismissAlert, dismissAll };
}
