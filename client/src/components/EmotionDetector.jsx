import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

export default function EmotionDetector({ onEmotionDetected, isActive }) {
  const videoRef = useRef(null);
  const [emotion, setEmotion] = useState("Loading...");
  const [confidence, setConfidence] = useState(0);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const intervalRef = useRef(null);

  const emotionEmoji = {
    happy:     { emoji: "😊", label: "Happy",    labelKn: "ಸಂತೋಷ",  color: "#22c55e" },
    sad:       { emoji: "😢", label: "Sad",      labelKn: "ದುಃಖ",    color: "#3b82f6" },
    angry:     { emoji: "😠", label: "Angry",    labelKn: "ಕೋಪ",     color: "#ef4444" },
    fearful:   { emoji: "😨", label: "Fearful",  labelKn: "ಭಯ",      color: "#8b5cf6" },
    neutral:   { emoji: "😐", label: "Neutral",  labelKn: "ತಟಸ್ಥ",   color: "#6b7280" },
    surprised: { emoji: "😲", label: "Surprised",labelKn: "ಆಶ್ಚರ್ಯ", color: "#f59e0b" },
    disgusted: { emoji: "🤢", label: "Disgusted",labelKn: "ಜಿಗುಪ್ಸೆ", color: "#84cc16" },
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceExpressionNet.loadFromUri("/models");
        setModelsLoaded(true);
        console.log("✅ Face API models loaded");
      } catch (err) {
        console.error("Model load error:", err);
      }
    };
    loadModels();

    return () => {
      // Cleanup camera on unmount
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject
          .getTracks()
          .forEach(track => track.stop());
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Start camera when active
  useEffect(() => {
    if (isActive && modelsLoaded) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isActive, modelsLoaded]);

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
      console.error("Camera error:", err);
      setEmotion("Camera not available");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject
        .getTracks()
        .forEach(track => track.stop());
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCameraActive(false);
  };

  const startDetection = () => {
    // Detect emotion every 2 seconds
    intervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;

      try {
        const detections = await faceapi
          .detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();

        if (detections) {
          // Get highest confidence emotion
          const expressions = detections.expressions;
          const topEmotion = Object.entries(expressions)
            .sort((a, b) => b[1] - a[1])[0];

          const emotionName = topEmotion[0];
          const emotionConf = Math.round(topEmotion[1] * 100);

          setEmotion(emotionName);
          setConfidence(emotionConf);

          // Send to parent component
          if (onEmotionDetected) {
            onEmotionDetected(emotionName, emotionConf);
          }
        } else {
          setEmotion("No face detected");
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 2000);
  };

  const current = emotionEmoji[emotion] || {
    emoji: "📷",
    label: emotion,
    color: "#6b7280"
  };

  return (
    <div style={{
      background: "#0f172a",
      borderRadius: "16px",
      overflow: "hidden",
      position: "relative",
      width: "100%",
      maxWidth: "320px",
      margin: "0 auto"
    }}>

      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "200px",
          objectFit: "cover",
          display: cameraActive ? "block" : "none",
          transform: "scaleX(-1)"  // mirror effect
        }}
      />

      {/* No camera placeholder */}
      {!cameraActive && (
        <div style={{
          width: "100%", height: "200px",
          background: "#1e293b",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "2.5rem" }}>📷</span>
          <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
            {modelsLoaded ? "Starting camera..." : "Loading AI model..."}
          </span>
        </div>
      )}

      {/* Emotion overlay at bottom */}
      {cameraActive && (
        <div style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent)",
          padding: "20px 12px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "8px", height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
              boxShadow: "0 0 8px #22c55e",
              animation: "pulse 1.5s infinite"
            }} />
            <span style={{ color: "white", fontSize: "0.75rem", fontWeight: 700 }}>
              LIVE
            </span>
          </div>

          {/* Emotion result */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(10px)",
            borderRadius: "99px",
            padding: "4px 12px",
            border: `1px solid ${current.color}55`
          }}>
            <span style={{ fontSize: "1.2rem" }}>{current.emoji}</span>
            <div>
              <div style={{
                color: "white",
                fontSize: "0.80rem",
                fontWeight: 700
              }}>
                {current.label}
              </div>
              <div style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.65rem"
              }}>
                {current.labelKn} · {confidence}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}