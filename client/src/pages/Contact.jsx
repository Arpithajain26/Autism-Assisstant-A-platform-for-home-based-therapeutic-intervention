import { useState, useEffect, useRef } from "react";
import { useLang } from "../context/LanguageContext";
import Navbar from "../components/Navbar";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function useReveal(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visible];
}

/* ── HERO ─────────────────────────────────────────────────────────────────── */
function ContactHero() {
  const { t } = useLang();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const ti = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(ti); }, []);

  return (
    <section style={{
      position:"relative", minHeight:420, display:"flex", alignItems:"center",
      background:"linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      overflow:"hidden", padding:"120px 28px 80px",
    }}>
      <div style={{ position:"absolute", top:-80, right:-80, width:450, height:450, borderRadius:"50%", background:"rgba(99,102,241,0.2)", filter:"blur(100px)", zIndex:0 }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:380, height:380, borderRadius:"50%", background:"rgba(236,72,153,0.15)", filter:"blur(90px)", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:800, margin:"0 auto", textAlign:"center" }}>
        <div style={{
          display:"inline-block", padding:"8px 22px", borderRadius:50,
          background:"rgba(99,102,241,0.3)", border:"1px solid rgba(99,102,241,0.6)",
          color:"#a5b4fc", fontWeight:700, fontSize:".8rem", letterSpacing:"1.5px",
          marginBottom:24,
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-20px)",
          transition:"all .7s ease",
        }}>
          {t("contact_hero_badge")}
        </div>

        <h1 style={{
          fontSize:"clamp(2rem,4.5vw,3.4rem)", fontWeight:900, color:"#fff",
          lineHeight:1.15, marginBottom:20,
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(30px)",
          transition:"all .8s ease .1s",
        }}>
          {t("contact_hero_h1")}
        </h1>

        <p style={{
          fontSize:"1.05rem", color:"rgba(255,255,255,0.78)", lineHeight:1.8, maxWidth:640, margin:"0 auto 36px",
          opacity: loaded ? 1 : 0, transition:"all .8s ease .2s",
        }}>
          {t("contact_hero_sub")}
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.3)",
            color:"#fff", padding:"10px 24px", borderRadius:50, cursor:"pointer",
            fontFamily:"inherit", fontWeight:600, fontSize:".9rem",
            opacity: loaded ? 1 : 0, transition:"all .8s ease .3s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.22)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
        >
          {t("back_home")}
        </button>
      </div>
    </section>
  );
}

/* ── CONTACT BODY ──────────────────────────────────────────────────────────── */
function ContactBody() {
  const { t } = useLang();
  const [ref, visible] = useReveal();
  const [form, setForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [status, setStatus] = useState("idle"); // idle | sending | sent

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");
    // Simulate form submission (replace with real API call when email is provided)
    setTimeout(() => setStatus("sent"), 1500);
  };

  const inputStyle = {
    width:"100%", padding:"13px 16px", borderRadius:10,
    border:"1.5px solid var(--border)", background:"rgba(255,255,255,0.7)",
    fontFamily:"inherit", fontSize:".95rem", color:"var(--text)",
    outline:"none", transition:"border-color .2s, box-shadow .2s",
  };

  const labelStyle = { display:"block", fontWeight:600, fontSize:".85rem", color:"var(--text)", marginBottom:6 };

  return (
    <section ref={ref} style={{ padding:"90px 28px", background:"#f8f9ff" }}>
      <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:40, alignItems:"start" }}>

        {/* ── LEFT: Form ── */}
        <div style={{
          background:"#fff", borderRadius:24, padding:40,
          boxShadow:"0 8px 40px rgba(0,0,0,0.08)", border:"1px solid var(--border)",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
          transition:"all .7s ease",
        }}>
          <h2 style={{ fontSize:"1.6rem", fontWeight:800, color:"var(--text)", marginBottom:28 }}>
            {t("contact_form_h")}
          </h2>

          {status === "sent" ? (
            <div style={{
              padding:"28px", borderRadius:14, background:"#d1fae5",
              border:"1px solid #6ee7b7", color:"#065f46", fontSize:".95rem",
              lineHeight:1.7, fontWeight:600, textAlign:"center",
            }}>
              ✅ {t("contact_sent")}
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:20 }}>
              <div>
                <label style={labelStyle}>{t("contact_name")}</label>
                <input
                  required type="text" placeholder={t("contact_name_ph")}
                  value={form.name} onChange={update("name")}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-light)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("contact_email")}</label>
                <input
                  required type="email" placeholder={t("contact_email_ph")}
                  value={form.email} onChange={update("email")}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-light)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("contact_subject")}</label>
                <input
                  required type="text" placeholder={t("contact_subject_ph")}
                  value={form.subject} onChange={update("subject")}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-light)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>{t("contact_message")}</label>
                <textarea
                  required rows={5} placeholder={t("contact_message_ph")}
                  value={form.message} onChange={update("message")}
                  style={{ ...inputStyle, resize:"vertical", minHeight:120 }}
                  onFocus={e => { e.target.style.borderColor = "var(--primary)"; e.target.style.boxShadow = "0 0 0 3px var(--primary-light)"; }}
                  onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  padding:"14px", borderRadius:12, border:"none",
                  background:"linear-gradient(135deg, #6366f1, #8b5cf6)",
                  color:"#fff", fontWeight:700, fontSize:"1rem",
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                  fontFamily:"inherit", transition:"all .3s",
                  boxShadow:"0 6px 20px rgba(99,102,241,0.4)",
                  opacity: status === "sending" ? 0.75 : 1,
                }}
                onMouseEnter={e => { if (status !== "sending") e.currentTarget.style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >
                {status === "sending" ? t("contact_sending") : t("contact_send")}
              </button>
            </form>
          )}
        </div>

        {/* ── RIGHT: Info ── */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

          {/* Contact info card */}
          <div style={{
            background:"#fff", borderRadius:24, padding:36,
            boxShadow:"0 8px 40px rgba(0,0,0,0.07)", border:"1px solid var(--border)",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
            transition:"all .7s ease .1s",
          }}>
            <h3 style={{ fontSize:"1.25rem", fontWeight:800, color:"var(--text)", marginBottom:24 }}>
              {t("contact_info_h")}
            </h3>

            <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
              {[
                { icon:"✉️", label: t("contact_email_label"), value:"autismassistant0@gmail.com" },
                { icon:"⏰", label: t("contact_hours_label"), value: t("contact_hours_val") },
                { icon:"📍", label:"Location", value:"Bangalore, Karnataka, India" },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", gap:14, alignItems:"flex-start" }}>
                  <div style={{
                    width:42, height:42, borderRadius:10,
                    background:"var(--primary-light)", display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:"1.1rem", flexShrink:0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize:".78rem", fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:".8px", marginBottom:3 }}>
                      {item.label}
                    </div>
                    <div style={{ fontWeight:600, color:"var(--text)", fontSize:".95rem" }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Support topics card */}
          <div style={{
            borderRadius:24, padding:36,
            background:"linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))",
            border:"1px solid rgba(99,102,241,0.2)",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
            transition:"all .7s ease .2s",
          }}>
            <h3 style={{ fontSize:"1.15rem", fontWeight:800, color:"var(--text)", marginBottom:20 }}>
              {t("contact_support_h")}
            </h3>
            <ul style={{ listStyle:"none", padding:0, display:"flex", flexDirection:"column", gap:12 }}>
              {[
                t("contact_topic1"), t("contact_topic2"),
                t("contact_topic3"), t("contact_topic4"),
              ].map((topic, i) => (
                <li key={i} style={{ display:"flex", alignItems:"center", gap:10, color:"var(--text)", fontSize:".9rem" }}>
                  <span style={{ color:"var(--primary)", fontWeight:800 }}>✓</span>
                  {topic}
                </li>
              ))}
            </ul>
          </div>

          {/* Quick action */}
          <div style={{
            borderRadius:24, padding:28,
            background:"linear-gradient(135deg, #4f46e5, #7c3aed)",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
            transition:"all .7s ease .3s",
          }}>
            <div style={{ color:"rgba(255,255,255,0.85)", fontSize:".9rem", lineHeight:1.65, marginBottom:16 }}>
              🧩 Want to try the platform first?
            </div>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding:"11px 24px", borderRadius:10, border:"2px solid rgba(255,255,255,0.5)",
                background:"rgba(255,255,255,0.15)", color:"#fff", fontWeight:700,
                cursor:"pointer", fontFamily:"inherit", fontSize:".9rem", transition:"all .3s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
            >
              {t("nav_get_started")} →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── RESPONSIVE STYLES ────────────────────────────────────────────────────── */
const responsiveCSS = `
  @media (max-width: 768px) {
    .contact-grid { grid-template-columns: 1fr !important; }
  }
`;

/* ── MINI FOOTER ──────────────────────────────────────────────────────────── */
function MiniFooter() {
  const { t } = useLang();
  return (
    <footer style={{ background:"#0f0f1a", color:"rgba(255,255,255,0.4)", padding:"28px", textAlign:"center", fontSize:".85rem" }}>
      {t("footer_copyright")}
    </footer>
  );
}

/* ── PAGE EXPORT ──────────────────────────────────────────────────────────── */
export default function Contact() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = responsiveCSS;
    document.head.appendChild(s);
    window.scrollTo(0, 0);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{ width:"100vw", marginLeft:"calc(-50vw + 50%)" }}>
      <Navbar />
      <ContactHero />
      <ContactBody />
      <MiniFooter />
    </div>
  );
}
