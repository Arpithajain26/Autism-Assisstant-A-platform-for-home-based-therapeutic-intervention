import React from "react";

export default function CertificateModal({ childName, childPhoto, activityTitle, xpEarned, stars = 5, onClose }) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Resolve photo from prop or localStorage
  const resolvedPhoto = childPhoto || (() => {
    try {
      const stored = localStorage.getItem("currentChild");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed?.profilePhoto || parsed?.photo || parsed?.avatar || null;
      }
    } catch {}
    return null;
  })();

  const handlePrint = () => {
    // Open a simple print window with just the certificate
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate of Achievement - ${childName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&family=Great+Vibes&display=swap');
            body {
              margin: 0;
              padding: 40px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              background-color: #faf5ff;
              font-family: 'Nunito', sans-serif;
            }
            .cert-container {
              width: 800px;
              height: 540px;
              background: #fffdf5;
              border: 20px solid #f59e0b;
              border-image: linear-gradient(135deg, #f59e0b, #ec4899, #6366f1) 20;
              box-sizing: border-box;
              padding: 24px 30px;
              text-align: center;
              position: relative;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            .photo-badge-wrapper {
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 8px;
            }
            .child-photo {
              width: 84px;
              height: 84px;
              border-radius: 50%;
              object-fit: cover;
              border: 4px solid #f59e0b;
              box-shadow: 0 4px 14px rgba(245,158,11,0.4);
            }
            .star-badge {
              font-size: 3.5rem;
              line-height: 1;
              margin-bottom: 5px;
            }
            h1 {
              font-family: 'Great Vibes', cursive;
              font-size: 3.5rem;
              color: #d97706;
              margin: 0 0 10px;
              font-weight: normal;
            }
            h2 {
              font-size: 1.3rem;
              color: #4b5563;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 0 0 10px;
            }
            .recipient {
              font-size: 2.2rem;
              font-weight: 900;
              color: #4f46e5;
              border-bottom: 2px solid #e5e7eb;
              display: inline-block;
              padding: 0 30px 5px;
              margin-bottom: 12px;
            }
            .details {
              font-size: 1.05rem;
              color: #374151;
              line-height: 1.5;
              margin-bottom: 20px;
            }
            .footer-row {
              display: flex;
              justify-content: space-around;
              margin-top: 20px;
            }
            .signature {
              border-top: 1px solid #9ca3af;
              width: 180px;
              padding-top: 5px;
              font-size: 0.85rem;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="cert-container">
            <div class="photo-badge-wrapper">
              ${resolvedPhoto 
                ? `<img src="${resolvedPhoto}" alt="${childName}" class="child-photo" />`
                : `<div class="star-badge">🏆</div>`
              }
            </div>
            <h2>Certificate of Achievement</h2>
            <div style="font-size:0.85rem; color:#9ca3af; margin-bottom:8px;">THIS IS PROUDLY PRESENTED TO</div>
            <div class="recipient">${childName}</div>
            <div class="details">
              For successfully playing and mastering the educational game<br/>
              <strong>"${activityTitle}"</strong><br/>
              earning a perfect score of <strong>${stars} / 5 Stars</strong> and claiming <strong>${xpEarned} XP</strong>!
            </div>
            <div class="footer-row">
              <div class="signature">
                <strong>Autism Assistant</strong>
                <div>Therapy Platform</div>
              </div>
              <div class="signature">
                <strong>${dateStr}</strong>
                <div>Date Completed</div>
              </div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000,
      background: "rgba(15,10,40,0.85)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Nunito:wght@700;800;900&display=swap');
        @keyframes certPop {
          0% { transform: scale(0.6) rotate(-4deg); opacity: 0; }
          70% { transform: scale(1.05) rotate(1deg); }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes badgeGlow {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(245,158,11,0.4)); }
          50% { filter: drop-shadow(0 0 25px rgba(245,158,11,0.8)); }
        }
      `}</style>
      
      <div style={{
        background: "#fffdf9",
        border: "14px solid #f59e0b",
        borderImage: "linear-gradient(135deg, #f59e0b, #ec4899, #6366f1) 14",
        borderRadius: "28px",
        width: "90%",
        maxWidth: "680px",
        padding: "32px 28px",
        textAlign: "center",
        boxShadow: "0 30px 70px rgba(0,0,0,0.5)",
        animation: "certPop 0.5s cubic-bezier(.34,1.56,.64,1) both",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Sparkles background */}
        <div style={{ position: "absolute", top: "10%", left: "8%", fontSize: "1.8rem", opacity: 0.2 }}>✨</div>
        <div style={{ position: "absolute", top: "15%", right: "8%", fontSize: "1.8rem", opacity: 0.2 }}>🌟</div>
        <div style={{ position: "absolute", bottom: "15%", left: "10%", fontSize: "1.6rem", opacity: 0.2 }}>🎈</div>
        <div style={{ position: "absolute", bottom: "12%", right: "12%", fontSize: "1.6rem", opacity: 0.2 }}>🎉</div>

        {/* Child Profile Photo or Gold Ribbon Badge */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "12px"
        }}>
          <div style={{
            position: "relative",
            width: "86px",
            height: "86px",
            borderRadius: "50%",
            padding: "3px",
            background: "linear-gradient(135deg, #f59e0b, #ec4899, #6366f1)",
            boxShadow: "0 8px 20px rgba(245,158,11,0.35)",
            animation: "badgeGlow 3s infinite"
          }}>
            {resolvedPhoto ? (
              <img
                src={resolvedPhoto}
                alt={childName}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                  display: "block",
                  background: "#ffffff"
                }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fef3c7, #fffbeb)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.6rem"
              }}>
                🏆
              </div>
            )}
            <div style={{
              position: "absolute",
              bottom: "-2px",
              right: "-2px",
              background: "#f59e0b",
              color: "#fff",
              borderRadius: "50%",
              width: "24px",
              height: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              border: "2px solid #ffffff"
            }}>
              ⭐
            </div>
          </div>
        </div>

        <h2 style={{
          fontSize: "1.45rem",
          fontWeight: "900",
          color: "#d97706",
          textTransform: "uppercase",
          letterSpacing: "3px",
          margin: "0 0 4px 0",
          fontFamily: "'Nunito', sans-serif"
        }}>
          Certificate of Achievement
        </h2>
        <div style={{ fontSize: "0.82rem", color: "#9ca3af", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
          this is proudly presented to
        </div>

        <div style={{
          fontSize: "2.2rem",
          fontWeight: "900",
          color: "#4f46e5",
          margin: "0 0 14px 0",
          display: "inline-block",
          borderBottom: "3px dashed #cbd5e1",
          padding: "0 30px 4px 30px",
          textShadow: "0 2px 4px rgba(79,70,229,0.1)"
        }}>
          {childName}
        </div>

        <p style={{
          fontSize: "1rem",
          lineHeight: "1.5",
          color: "#4b5563",
          margin: "0 auto 24px auto",
          maxWidth: "500px",
          fontWeight: "700"
        }}>
          For successfully playing and mastering the educational game
          <br />
          <strong style={{ color: "#111827", fontSize: "1.15rem" }}>"{activityTitle}"</strong>
          <br />
          earning a perfect score of <strong style={{ color: "#d97706" }}>{stars} / 5 Stars</strong> and claiming <strong style={{ color: "#4f46e5" }}>{xpEarned} XP</strong>!
        </p>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "460px",
          margin: "0 auto 24px auto",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "12px"
        }}>
          <div>
            <div style={{ fontWeight: "900", color: "#111827", fontSize: "0.9rem" }}>Autism Assistant</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: "700" }}>Learning Companion</div>
          </div>
          <div>
            <div style={{ fontWeight: "900", color: "#111827", fontSize: "0.9rem" }}>{dateStr}</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: "700" }}>Date Accomplished</div>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
          <button
            onClick={handlePrint}
            style={{
              background: "linear-gradient(135deg,#f59e0b,#d97706)",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "16px",
              fontWeight: "950",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(245,158,11,0.3)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "transform 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            🖨️ Print Certificate
          </button>
          <button
            onClick={onClose}
            style={{
              background: "linear-gradient(135deg,#6366f1,#4f46e5)",
              color: "#fff",
              border: "none",
              padding: "12px 24px",
              borderRadius: "16px",
              fontWeight: "950",
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 6px 16px rgba(99,102,241,0.3)",
              transition: "transform 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            Awesome! 🌈
          </button>
        </div>
      </div>
    </div>
  );
}
