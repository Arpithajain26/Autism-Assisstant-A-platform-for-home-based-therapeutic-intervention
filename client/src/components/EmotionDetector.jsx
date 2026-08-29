import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { predictEmotion } from "../services/api";

export default function EmotionDetector({ onEmotionDetected, isActive }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [emotion, setEmotion] = useState("Focused");
  const [confidence, setConfidence] = useState(88);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const intervalRef = useRef(null);

  const emotionEmoji = {
    happy:     { emoji: "😊", label: "Happy",     labelKn: "ಸಂತೋಷ",   color: "#22c55e" },
    sad:       { emoji: "😢", label: "Sad",       labelKn: "ದುಃಖ",     color: "#3b82f6" },
    angry:     { emoji: "😠", label: "Frustrated",labelKn: "ಕೋಪ",     color: "#ef4444" },
    fear:      { emoji: "😨", label: "Anxious",   labelKn: "ಭಯ",      color: "#8b5cf6" },
    fearful:   { emoji: "😨", label: "Anxious",   labelKn: "ಭಯ",      color: "#8b5cf6" },
    neutral:   { emoji: "😐", label: "Focused",   labelKn: "ತಟಸ್ಥ",   color: "#6b7280" },
    surprise:  { emoji: "😲", label: "Curious",   labelKn: "ಆಶ್ಚರ್ಯ", color: "#f59e0b" },
    surprised: { emoji: "😲", label: "Curious",   labelKn: "ಆಶ್ಚರ್ಯ", color: "#f59e0b" },
    disgust:   { emoji: "🤢", label: "Discomfort",labelKn: "ಜಿಗುಪ್ಸೆ", color: "#84cc16" },
    disgusted: { emoji: "🤢", label: "Discomfort",labelKn: "ಜಿಗುಪ್ಸೆ", color: "#84cc16" },
  };

  // Load face-api models if present
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        setModelsLoaded(true);
      } catch (err) {
        // Fallback directly to PyTorch CNN server
        setModelsLoaded(true);
      }
    };
    loadModels();

    return () => {
      stopCamera();
    };
  }, []);

  // Start camera when active
  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        startDetection();
      }
    } catch (err) {
      console.warn("Camera access optional or not allowed:", err);
      setEmotion("neutral");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCameraActive(false);
  };

  const captureFrameBase64 = () => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }
    const canvas = canvasRef.current;
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, 48, 48);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const startDetection = () => {
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        // 1. Capture 48x48 frame for PyTorch FER2013 Model
        const frameB64 = captureFrameBase64();
        if (frameB64) {
          const res = await predictEmotion(frameB64);
          if (res && res.emotion) {
            const normEmotion = res.emotion.toLowerCase();
            setEmotion(normEmotion);
            setConfidence(Math.round(res.confidence || 85));
            if (onEmotionDetected) {
              onEmotionDetected(normEmotion, Math.round(res.confidence || 85), res);
            }
            return;
          }
        }

        // 2. Fallback to client-side faceapi if server unreachable
        const detections = await faceapi
          .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections && detections.expressions) {
          const expressions = detections.expressions;
          const topEmotion = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
          const emotionName = topEmotion[0];
          const emotionConf = Math.round(topEmotion[1] * 100);

          setEmotion(emotionName);
          setConfidence(emotionConf);

          if (onEmotionDetected) {
            onEmotionDetected(emotionName, emotionConf);
          }
        }
      } catch (err) {
        // Silently continue tracking
      }
    }, 2000);
  };

  const current = emotionEmoji[emotion.toLowerCase()] || emotionEmoji.neutral;

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      overflow: "hidden",
      position: "relative",
      width: "100%",
      maxWidth: "320px",
      margin: "0 auto",
      boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
    }}>
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "190px",
          objectFit: "cover",
          display: cameraActive ? "block" : "none",
          transform: "scaleX(-1)"
        }}
      />

      {/* Placeholder if camera off */}
      {!cameraActive && (
        <div style={{
          width: "100%", height: "190px",
          background: "#1e293b",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "2.2rem" }}>🎭</span>
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            FER2013 Emotion AI Active
          </span>
        </div>
      )}

      {/* Emotion Overlay */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(15,23,42,0.95), rgba(15,23,42,0.4), transparent)",
        padding: "16px 12px 10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Live Indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{
            width: "8px", height: "8px",
            borderRadius: "50%",
            background: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
          }} />
          <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>
            FER-AI
          </span>
        </div>

        {/* Emotion Pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "6px",
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(8px)",
          borderRadius: "99px",
          padding: "4px 12px",
          border: `1px solid ${current.color}88`
        }}>
          <span style={{ fontSize: "1.1rem" }}>{current.emoji}</span>
          <div>
            <div style={{ color: "white", fontSize: "0.80rem", fontWeight: 700 }}>
              {current.label}
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.65rem" }}>
              {current.labelKn} · {confidence}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
