import { useEffect, useRef, useState } from "react";
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
function AboutHero() {
  const { t } = useLang();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const ti = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(ti); }, []);

  return (
    <section style={{
      position: "relative", minHeight: 480, display: "flex", alignItems: "center",
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      overflow: "hidden", padding: "120px 28px 80px",
    }}>
      {/* Blobs */}
      <div style={{ position:"absolute", top:-80, left:-80, width:500, height:500, borderRadius:"50%", background:"rgba(99,102,241,0.2)", filter:"blur(100px)", zIndex:0 }} />
      <div style={{ position:"absolute", bottom:-60, right:-60, width:400, height:400, borderRadius:"50%", background:"rgba(168,85,247,0.18)", filter:"blur(90px)", zIndex:0 }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:900, margin:"0 auto", textAlign:"center" }}>
        <div style={{
          display:"inline-block", padding:"8px 22px", borderRadius:50,
          background:"rgba(99,102,241,0.3)", border:"1px solid rgba(99,102,241,0.6)",
          color:"#a5b4fc", fontWeight:700, fontSize:".8rem", letterSpacing:"1.5px",
          marginBottom:24,
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-20px)",
          transition: "all .7s ease",
        }}>
          {t("about_hero_badge")}
        </div>

        <h1 style={{
          fontSize:"clamp(2rem,4.5vw,3.6rem)", fontWeight:900, color:"#fff",
          lineHeight:1.15, marginBottom:20,
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(30px)",
          transition: "all .8s ease .1s",
        }}>
          {t("about_hero_h1")}
        </h1>

        <p style={{
          fontSize:"1.1rem", color:"rgba(255,255,255,0.78)", lineHeight:1.8, maxWidth:680, margin:"0 auto 36px",
          opacity: loaded ? 1 : 0, transition: "all .8s ease .2s",
        }}>
          {t("about_hero_sub")}
        </p>

        <button
          onClick={() => navigate("/")}
          style={{
            background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.3)",
            color:"#fff", padding:"10px 24px", borderRadius:50, cursor:"pointer",
            fontFamily:"inherit", fontWeight:600, fontSize:".9rem",
            opacity: loaded ? 1 : 0, transition: "all .8s ease .3s",
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

/* ── SIGNS SECTION ────────────────────────────────────────────────────────── */
function SignsSection() {
  const { t } = useLang();
  const [ref, visible] = useReveal();

  const categories = [
    {
      icon: "👁️",
      heading: t("about_social_h"),
      color: "#6366f1",
      bg: "rgba(99,102,241,0.08)",
      border: "rgba(99,102,241,0.25)",
      items: [t("about_social_1"), t("about_social_2"), t("about_social_3"), t("about_social_4")],
    },
    {
      icon: "🔄",
      heading: t("about_behavior_h"),
      color: "#8b5cf6",
      bg: "rgba(139,92,246,0.08)",
      border: "rgba(139,92,246,0.25)",
      items: [t("about_behavior_1"), t("about_behavior_2"), t("about_behavior_3"), t("about_behavior_4")],
    },
    {
      icon: "✋",
      heading: t("about_sensory_h"),
      color: "#10b981",
      bg: "rgba(16,185,129,0.08)",
      border: "rgba(16,185,129,0.25)",
      items: [t("about_sensory_1"), t("about_sensory_2"), t("about_sensory_3"), t("about_sensory_4")],
    },
  ];

  return (
    <section id="signs" ref={ref} style={{ padding: "90px 28px", background: "#fff" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <span style={{ background:"var(--primary-light)", color:"var(--primary)", padding:"6px 18px", borderRadius:50, fontWeight:700, fontSize:".8rem", letterSpacing:"1px" }}>
            SIGNS & SYMPTOMS
          </span>
          <h2 style={{ fontSize:"2.2rem", fontWeight:800, color:"var(--text)", marginTop:14, marginBottom:12 }}>
            {t("about_signs_h2")}
          </h2>
          <p style={{ color:"var(--text-muted)", lineHeight:1.7, maxWidth:600, margin:"0 auto" }}>
            {t("about_signs_sub")}
          </p>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))", gap:24 }}>
          {categories.map((cat, i) => (
            <div key={i} style={{
              borderRadius:20, padding:32,
              background: cat.bg, border: `1px solid ${cat.border}`,
              opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
              transition: `all .7s ease ${i * 0.15}s`,
            }}>
              <div style={{ fontSize:"2.2rem", marginBottom:14 }}>{cat.icon}</div>
              <h3 style={{ fontWeight:800, color: cat.color, marginBottom:20, fontSize:"1.1rem" }}>{cat.heading}</h3>
              <ul style={{ listStyle:"none", padding:0, display:"flex", flexDirection:"column", gap:12 }}>
                {cat.items.map((item, j) => (
                  <li key={j} style={{ display:"flex", alignItems:"flex-start", gap:10, color:"var(--text)", fontSize:".9rem", lineHeight:1.55 }}>
                    <span style={{ color: cat.color, fontWeight:800, flexShrink:0, marginTop:1 }}>•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── LEVELS SECTION ───────────────────────────────────────────────────────── */
function LevelsSection() {
  const { t } = useLang();
  const [ref, visible] = useReveal();

  const levels = [
    { num:"1", heading: t("level1_h"), desc: t("level1_desc"), color:"#10b981", bg:"#d1fae5", light:"rgba(16,185,129,0.1)" },
    { num:"2", heading: t("level2_h"), desc: t("level2_desc"), color:"#f59e0b", bg:"#fef3c7", light:"rgba(245,158,11,0.1)" },
    { num:"3", heading: t("level3_h"), desc: t("level3_desc"), color:"#ef4444", bg:"#fee2e2", light:"rgba(239,68,68,0.1)" },
  ];

  return (
    <section ref={ref} style={{ padding:"90px 28px", background:"linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:56 }}>
          <span style={{ background:"var(--primary-light)", color:"var(--primary)", padding:"6px 18px", borderRadius:50, fontWeight:700, fontSize:".8rem", letterSpacing:"1px" }}>
            DSM-5
          </span>
          <h2 style={{ fontSize:"2.2rem", fontWeight:800, color:"var(--text)", marginTop:14, marginBottom:12 }}>
            {t("about_levels_h2")}
          </h2>
          <p style={{ color:"var(--text-muted)", lineHeight:1.7, maxWidth:620, margin:"0 auto" }}>
            {t("about_levels_sub")}
          </p>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          {levels.map((lv, i) => (
            <div key={i} style={{
              borderRadius:20, padding:"32px 36px",
              background: lv.light, border:`2px solid ${lv.color}22`,
              display:"flex", gap:28, alignItems:"flex-start",
              opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : "translateX(-40px)",
              transition: `all .7s ease ${i * 0.2}s`,
            }}>
              <div style={{
                width:60, height:60, borderRadius:"50%", background: lv.bg,
                color: lv.color, fontWeight:900, fontSize:"1.6rem",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
              }}>
                {lv.num}
              </div>
              <div>
                <h3 style={{ fontWeight:800, color: lv.color, marginBottom:10, fontSize:"1.1rem" }}>{lv.heading}</h3>
                <p style={{ color:"var(--text)", lineHeight:1.75, fontSize:".95rem" }}>{lv.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── RESOURCES SECTION ────────────────────────────────────────────────────── */
function ResourcesSection() {
  const { t } = useLang();
  const [ref, visible] = useReveal();

  const resources = [
    { icon:"🏥", title:"NIMHANS Bangalore", desc:"National Institute of Mental Health & Neurosciences — India's premier centre for autism evaluation and research.", link:"https://nimhans.ac.in", color:"#6366f1" },
    { icon:"🎗️", title:"Autism Society of India", desc:"Advocacy, awareness, and support networks for families across India.", link:"https://autismsocietyindia.com", color:"#8b5cf6" },
    { icon:"🌐", title:"Autism Speaks", desc:"Global resources, research updates, tool kits, and family support guides.", link:"https://autismspeaks.org", color:"#10b981" },
    { icon:"📖", title:"CDC — Learn the Signs", desc:"U.S. CDC's milestone tracker and free developmental resources for parents.", link:"https://cdc.gov/ncbddd/autism", color:"#f59e0b" },
  ];

  return (
    <section ref={ref} style={{ padding:"90px 28px", background:"#fff" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:52 }}>
          <span style={{ background:"var(--primary-light)", color:"var(--primary)", padding:"6px 18px", borderRadius:50, fontWeight:700, fontSize:".8rem", letterSpacing:"1px" }}>
            RESOURCES
          </span>
          <h2 style={{ fontSize:"2.2rem", fontWeight:800, color:"var(--text)", marginTop:14 }}>
            {t("about_resources_h2")}
          </h2>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px, 1fr))", gap:20 }}>
          {resources.map((r, i) => (
            <a key={i} href={r.link} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
              <div style={{
                borderRadius:16, padding:28, border:`1px solid ${r.color}33`,
                background:`${r.color}08`, cursor:"pointer",
                opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
                transition: `all .7s ease ${i * 0.1}s`,
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${r.color}22`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ fontSize:"2rem", marginBottom:12 }}>{r.icon}</div>
                <h4 style={{ fontWeight:700, color: r.color, marginBottom:8, fontSize:"1rem" }}>{r.title}</h4>
                <p style={{ color:"var(--text-muted)", lineHeight:1.65, fontSize:".88rem" }}>{r.desc}</p>
                <span style={{ display:"inline-block", marginTop:14, color: r.color, fontWeight:700, fontSize:".85rem" }}>Visit →</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA SECTION ──────────────────────────────────────────────────────────── */
function AboutCTA() {
  const { t } = useLang();
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} style={{
      padding:"90px 28px",
      background:"linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #db2777 100%)",
      position:"relative", overflow:"hidden",
    }}>
      <div style={{ position:"absolute", top:-60, left:-60, width:300, height:300, borderRadius:"50%", background:"rgba(255,255,255,0.07)", filter:"blur(60px)" }} />
      <div style={{ position:"absolute", bottom:-40, right:-40, width:250, height:250, borderRadius:"50%", background:"rgba(255,255,255,0.07)", filter:"blur(60px)" }} />
      <div style={{
        maxWidth:700, margin:"0 auto", textAlign:"center", position:"relative", zIndex:1,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
        transition:"all .8s ease",
      }}>
        <div style={{ fontSize:"3rem", marginBottom:16 }}>🧩</div>
        <h2 style={{ fontSize:"clamp(1.8rem,3.5vw,2.4rem)", fontWeight:900, color:"#fff", marginBottom:16, lineHeight:1.2 }}>
          {t("about_cta_h2")}
        </h2>
        <p style={{ color:"rgba(255,255,255,0.82)", lineHeight:1.75, fontSize:"1.05rem", marginBottom:36 }}>
          {t("about_cta_desc")}
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{ padding:"15px 38px", borderRadius:12, border:"none", background:"#fff", color:"#4f46e5", fontWeight:800, fontSize:"1rem", cursor:"pointer", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", transition:"all .3s", fontFamily:"inherit" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
          onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
        >
          {t("about_cta_btn")}
        </button>
      </div>
    </section>
  );
}

/* ── MINI FOOTER ──────────────────────────────────────────────────────────── */
function MiniFooter() {
  const { t } = useLang();
  return (
    <footer style={{ background:"#0f0f1a", color:"rgba(255,255,255,0.4)", padding:"28px", textAlign:"center", fontSize:".85rem" }}>
      {t("footer_copyright")}
    </footer>
  );
}

/* ── KEYFRAMES ────────────────────────────────────────────────────────────── */
const kf = `
  @keyframes blobFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50%       { transform: translateY(-28px) scale(1.04); }
  }
`;

/* ── PAGE EXPORT ──────────────────────────────────────────────────────────── */
export default function AboutAutism() {
  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = kf;
    document.head.appendChild(s);
    window.scrollTo(0, 0);
    return () => document.head.removeChild(s);
  }, []);

  return (
    <div style={{ width:"100vw", marginLeft:"calc(-50vw + 50%)" }}>
      <Navbar />
      <AboutHero />
      <SignsSection />
      <LevelsSection />
      <ResourcesSection />
      <AboutCTA />
      <MiniFooter />
    </div>
  );
}
