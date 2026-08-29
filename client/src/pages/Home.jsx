import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useLang } from "../context/LanguageContext";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ─── Scroll Reveal Hook ─────────────────────────────────────────────────── */
function useReveal(threshold = 0.15) {
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

/* ─── Animated Counter ───────────────────────────────────────────────────── */
function Counter({ target, suffix = "", color, label }) {
  const [ref, visible] = useReveal();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!visible) return;
    let v = 0;
    const step = Math.max(1, Math.floor(target / 60));
    const t = setInterval(() => {
      v = Math.min(v + step, target);
      setValue(v);
      if (v >= target) clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, [visible, target]);
  return (
    <div ref={ref} style={{ textAlign: "center" }}>
      <div style={{ fontSize: "2.4rem", fontWeight: 900, color }}>{value}{suffix}</div>
      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ─── HERO SECTION ───────────────────────────────────────────────────────── */
function Hero() {
  const { t } = useLang();
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", minHeight: 600, overflow: "hidden", display: "flex", alignItems: "center" }}>
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        onCanPlay={() => { if (videoRef.current) videoRef.current.play(); }}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
      >
        <source src="/homepagevideo.mp4" type="video/mp4" />
      </video>

      {/* Dark gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(135deg, rgba(10,10,30,0.82) 0%, rgba(30,10,60,0.75) 50%, rgba(10,20,50,0.80) 100%)",
      }} />

      {/* Animated glowing blobs */}
      <div style={{ position: "absolute", top: "-100px", left: "-100px", width: 500, height: 500, borderRadius: "50%", background: "rgba(99,102,241,0.18)", filter: "blur(100px)", zIndex: 1, animation: "blobFloat 8s ease-in-out infinite" }} />
      <div style={{ position: "absolute", bottom: "-80px", right: "-80px", width: 400, height: 400, borderRadius: "50%", background: "rgba(168,85,247,0.15)", filter: "blur(90px)", zIndex: 1, animation: "blobFloat 10s ease-in-out infinite reverse" }} />

      {/* Mute toggle */}
      <button
        onClick={() => { if (videoRef.current) { videoRef.current.muted = !videoRef.current.muted; setMuted(videoRef.current.muted); } }}
        style={{ position: "absolute", bottom: 28, right: 28, zIndex: 10, width: 46, height: 46, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)", color: "#fff", fontSize: "1.3rem", cursor: "pointer", transition: "all .3s" }}
        title={muted ? "Unmute" : "Mute"}
      >{muted ? "🔇" : "🔊"}</button>

      {/* Hero Content */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 1200, margin: "0 auto", padding: "0 28px", width: "100%" }}>
        <div style={{ maxWidth: 700 }}>

          <div style={{
            display: "inline-block", padding: "8px 20px", borderRadius: 50,
            background: "rgba(99,102,241,0.25)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(99,102,241,0.5)", color: "#a5b4fc",
            fontWeight: 700, fontSize: ".85rem", letterSpacing: "1px",
            marginBottom: 28,
            opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(-20px)",
            transition: "all .8s ease",
          }}>
            {t("hero_badge")}
          </div>

          <h1 style={{
            fontSize: "clamp(2.4rem, 5vw, 4rem)", fontWeight: 900, lineHeight: 1.12,
            color: "#fff", marginBottom: 22,
            opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all .9s ease .15s",
          }}>
            {t("hero_h1_line1")}<br />
            <span style={{ background: "linear-gradient(135deg, #a5b4fc, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("hero_h1_line2")}
            </span>
            <br />{t("hero_h1_line3")}
          </h1>

          <p style={{
            fontSize: "1.1rem", lineHeight: 1.8, color: "rgba(255,255,255,0.8)",
            marginBottom: 36, maxWidth: 560,
            opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all .9s ease .3s",
          }}>
            {t("hero_desc")}
          </p>

          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(30px)",
            transition: "all .9s ease .45s",
          }}>
            <button
              onClick={() => navigate("/login")}
              style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", boxShadow: "0 8px 32px rgba(99,102,241,0.45)", transition: "all .3s", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {t("hero_cta_primary")}
            </button>
            <button
              onClick={() => document.getElementById("autism-info")?.scrollIntoView({ behavior: "smooth" })}
              style={{ padding: "14px 32px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", transition: "all .3s", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.transform = "translateY(0)"; }}
            >
              {t("hero_cta_secondary")}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "flex", gap: 48, marginTop: 64, flexWrap: "wrap",
          opacity: loaded ? 1 : 0, transition: "all 1s ease .7s",
        }}>
          <Counter target={90} suffix="%" color="#a5b4fc" label={t("hero_stat1_label")} />
          <Counter target={85} suffix="%" color="#34d399" label={t("hero_stat2_label")} />
          <Counter target={500} suffix="+" color="#f9a8d4" label={t("hero_stat3_label")} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fbbf24" }}>AI</div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: ".85rem", marginTop: 4 }}>{t("hero_stat4_label")}</div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{ position: "absolute", bottom: 30, left: "50%", transform: "translateX(-50%)", zIndex: 5, animation: "bounce 2s infinite", color: "rgba(255,255,255,0.5)", fontSize: "1.5rem" }}>↓</div>
    </section>
  );
}

/* ─── FEATURES STRIP ─────────────────────────────────────────────────────── */
function FeaturesStrip() {
  const { t } = useLang();
  const [ref, visible] = useReveal();
  const features = [
    { icon: "🧠", title: t("feat1_title"), desc: t("feat1_desc") },
    { icon: "❤️", title: t("feat2_title"), desc: t("feat2_desc") },
    { icon: "📊", title: t("feat3_title"), desc: t("feat3_desc") },
    { icon: "👨‍👩‍👧", title: t("feat4_title"), desc: t("feat4_desc") },
  ];
  return (
    <section id="features" ref={ref} style={{ padding: "80px 28px", background: "#f8f9ff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "6px 16px", borderRadius: 50, fontWeight: 700, fontSize: ".8rem", letterSpacing: "1px" }}>{t("features_badge")}</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", marginTop: 14 }}>{t("features_h2")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 32, textAlign: "center", cursor: "default",
                opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
                transition: `all .7s ease ${i * 0.12}s`,
              }}
            >
              <div style={{ fontSize: "2.6rem", marginBottom: 14 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10, fontSize: "1.1rem" }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.65, fontSize: ".9rem" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AutismInfoSection() {
  const { t } = useLang();
  const [openIdx, setOpenIdx] = useState(null);
  const [ref, visible] = useReveal();

  const autismTopics = [
    {
      icon: "🧩",
      title: t("topic1_title"),
      short: t("topic1_short"),
      full: t("topic1_full"),
    },
    {
      icon: "🌱",
      title: t("topic2_title"),
      short: t("topic2_short"),
      full: t("topic2_full"),
    },
    {
      icon: "🤖",
      title: t("topic3_title"),
      short: t("topic3_short"),
      full: t("topic3_full"),
    },
    {
      icon: "👨‍👩‍👧",
      title: t("topic4_title"),
      short: t("topic4_short"),
      full: t("topic4_full"),
    },
  ];

  return (
    <section id="autism-info" ref={ref} style={{ padding: "90px 28px", background: "#fff" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "6px 16px", borderRadius: 50, fontWeight: 700, fontSize: ".8rem", letterSpacing: "1px" }}>{t("autism_badge")}</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", marginTop: 14, marginBottom: 14 }}>{t("autism_h2")}</h2>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 600, margin: "0 auto" }}>
            {t("autism_subtitle")}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {autismTopics.map((topic, i) => {
            const isOpen = openIdx === i;
            return (
              <div
                key={i}
                style={{
                  borderRadius: 16, border: `2px solid ${isOpen ? "var(--primary)" : "var(--border)"}`,
                  background: isOpen ? "var(--primary-light)" : "var(--glass-bg)",
                  overflow: "hidden",
                  opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(30px)",
                  transition: `opacity .6s ease ${i * 0.1}s, transform .6s ease ${i * 0.1}s, border .3s`,
                  boxShadow: isOpen ? "0 8px 32px rgba(99,102,241,0.15)" : "0 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Header button */}
                <button
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 16,
                    padding: "20px 24px", background: "transparent", border: "none",
                    cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  }}
                >
                  <span style={{ fontSize: "2rem", flexShrink: 0 }}>{topic.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text)", marginBottom: 4 }}>{topic.title}</div>
                    <div style={{ color: "var(--text-muted)", fontSize: ".9rem", lineHeight: 1.5 }}>{topic.short}</div>
                  </div>
                  <span style={{
                    flexShrink: 0, width: 32, height: 32, borderRadius: "50%",
                    background: isOpen ? "var(--primary)" : "var(--primary-light)",
                    color: isOpen ? "#fff" : "var(--primary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: "1.1rem",
                    transition: "all .35s",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}>↓</span>
                </button>

                {/* Expandable body */}
                <div style={{
                  maxHeight: isOpen ? 600 : 0,
                  overflow: "hidden",
                  transition: "max-height .5s cubic-bezier(0.4,0,0.2,1)",
                }}>
                  <div style={{ padding: "0 24px 24px 24px", paddingLeft: 72 }}>
                    <div style={{ width: "100%", height: 1, background: "var(--border)", marginBottom: 20 }} />
                    {topic.full.split("\n").map((line, li) => (
                      <p key={li} style={{ color: "var(--text)", lineHeight: 1.75, fontSize: ".95rem", marginBottom: line === "" ? 12 : 0 }}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── HOW IT WORKS ───────────────────────────────────────────────────────── */
function HowItWorks() {
  const [ref, visible] = useReveal();
  const steps = [
    { num: "01", icon: "📝", title: "Take the AI Assessment", desc: "Answer a short guided questionnaire. Our model classifies your child's level with 90% accuracy." },
    { num: "02", icon: "🎯", title: "Get a Personalized Plan", desc: "The AI builds a daily set of therapy activities tuned to your child's specific needs and level." },
    { num: "03", icon: "📡", title: "Monitor Engagement", desc: "Real-time emotion detection tracks how engaged and comfortable your child is during sessions." },
    { num: "04", icon: "📈", title: "Track Weekly Progress", desc: "Every week you receive an easy-to-read report showing growth trends and what's working." },
  ];
  return (
    <section id="how-it-works" ref={ref} style={{ padding: "90px 28px", background: "linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "6px 16px", borderRadius: 50, fontWeight: 700, fontSize: ".8rem", letterSpacing: "1px" }}>GUIDED PROCESS</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", marginTop: 14 }}>How It Works</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24 }}>
          {steps.map((s, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: "32px 28px", position: "relative", overflow: "hidden",
                opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
                transition: `all .7s ease ${i * 0.12}s`,
              }}
            >
              <div style={{ position: "absolute", top: -10, right: 14, fontSize: "4rem", fontWeight: 900, color: "rgba(99,102,241,0.08)" }}>{s.num}</div>
              <div style={{ fontSize: "2.4rem", marginBottom: 14, position: "relative", zIndex: 1 }}>{s.icon}</div>
              <h4 style={{ fontWeight: 700, color: "var(--text)", marginBottom: 10, fontSize: "1.05rem", position: "relative", zIndex: 1 }}>{s.title}</h4>
              <p style={{ color: "var(--text-muted)", lineHeight: 1.65, fontSize: ".9rem", position: "relative", zIndex: 1 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── REVIEWS SECTION ────────────────────────────────────────────────────── */
const reviews = [
  { name: "Ananya R.", role: "Parent of a 6-year-old", avatar: "A", color: "#6366f1", quote: "The daily activities finally felt made for my son, not generic worksheets. Within two months we could see real changes in how he communicated with us.", stars: 5 },
  { name: "Marcus T.", role: "Parent of a 4-year-old", avatar: "M", color: "#8b5cf6", quote: "The weekly progress reports gave us language to bring to our therapist. It turned guesswork into an actual conversation about what's working.", stars: 5 },
  { name: "Priya S.", role: "Parent of an 8-year-old", avatar: "P", color: "#10b981", quote: "The emotion tracking was the part that surprised me most. We could finally tell 'quiet and focused' from 'quiet and overwhelmed.'", stars: 5 },
  { name: "Dr. Linda K.", role: "Behavioral Therapist", avatar: "L", color: "#f97316", quote: "I recommend this to every family I work with. The data from home sessions has completely transformed how I plan clinical interventions.", stars: 5 },
  { name: "Rohan M.", role: "Parent of a 5-year-old", avatar: "R", color: "#ec4899", quote: "We used to feel so lost. Now I log in every morning, see today's activities, and feel like I actually know what I'm doing for my daughter.", stars: 5 },
  { name: "Sophie W.", role: "Occupational Therapist", avatar: "S", color: "#0ea5e9", quote: "The activity library is incredibly well-designed. Each task is evidence-informed and explained clearly enough that parents can implement it confidently.", stars: 5 },
];

function ReviewCard({ r, visible, delay }) {
  return (
    <div
      style={{
        background: "var(--glass-bg)", backdropFilter: "blur(12px)",
        border: "1px solid var(--border)", borderRadius: 20, padding: "28px 26px",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: `all .7s ease ${delay}s`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
      }}
    >
      <div>
        <div style={{ color: "#f59e0b", fontSize: "1.1rem", marginBottom: 14 }}>{"⭐".repeat(r.stars)}</div>
        <p style={{ color: "var(--text)", lineHeight: 1.7, fontStyle: "italic", fontSize: ".95rem", marginBottom: 22 }}>"{r.quote}"</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: r.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "1.1rem", flexShrink: 0 }}>
          {r.avatar}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: "var(--text)", fontSize: ".95rem" }}>{r.name}</div>
          <div style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>{r.role}</div>
        </div>
      </div>
    </div>
  );
}

function Reviews() {
  const [ref, visible] = useReveal();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Group reviews into pairs (3 slides total)
  const slides = [];
  for (let i = 0; i < reviews.length; i += 2) {
    slides.push(reviews.slice(i, i + 2));
  }

  const totalSlides = slides.length;

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 4500);
    return () => clearInterval(interval);
  }, [currentIndex, isPaused, totalSlides]);

  return (
    <section id="reviews" ref={ref} style={{ padding: "90px 28px", background: "#fff" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <span style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "6px 16px", borderRadius: 50, fontWeight: 700, fontSize: ".8rem", letterSpacing: "1px" }}>TESTIMONIALS</span>
          <h2 style={{ fontSize: "2.2rem", fontWeight: 800, color: "var(--text)", marginTop: 14 }}>What Families & Therapists Say</h2>
          <p style={{ color: "var(--text-muted)", marginTop: 12, lineHeight: 1.7 }}>Real feedback from people using the platform week to week.</p>
        </div>

        {/* Carousel Container */}
        <div
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{ position: "relative", overflow: "hidden", padding: "10px 4px 30px" }}
        >
          {/* Slide Track */}
          <div
            style={{
              display: "flex",
              transform: `translateX(-${currentIndex * 100}%)`,
              transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              width: "100%",
            }}
          >
            {slides.map((pair, slideIdx) => (
              <div
                key={slideIdx}
                style={{
                  minWidth: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 24,
                  padding: "0 8px",
                  boxSizing: "border-box",
                }}
              >
                {pair.map((r, cardIdx) => (
                  <ReviewCard key={cardIdx} r={r} visible={visible} delay={cardIdx * 0.1} />
                ))}
              </div>
            ))}
          </div>

          {/* Nav Controls & Indicators */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginTop: 36 }}>
            <button
              onClick={prevSlide}
              aria-label="Previous Reviews"
              style={{
                width: 44, height: 44, borderRadius: "50%", border: "2px solid #6366f1",
                background: "#fff", color: "#6366f1", fontSize: "1.4rem", fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .3s ease", boxShadow: "0 4px 14px rgba(99,102,241,0.15)"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6366f1"; }}
            >
              ‹
            </button>

            {/* Pagination Dots */}
            <div style={{ display: "flex", gap: 10 }}>
              {slides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  style={{
                    width: idx === currentIndex ? 28 : 10,
                    height: 10,
                    borderRadius: 10,
                    border: "none",
                    background: idx === currentIndex ? "#6366f1" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              aria-label="Next Reviews"
              style={{
                width: 44, height: 44, borderRadius: "50%", border: "2px solid #6366f1",
                background: "#fff", color: "#6366f1", fontSize: "1.4rem", fontWeight: 800,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all .3s ease", boxShadow: "0 4px 14px rgba(99,102,241,0.15)"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "#6366f1"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#6366f1"; }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA SECTION ────────────────────────────────────────────────────────── */
function CTA() {
  const [ref, visible] = useReveal();
  return (
    <section ref={ref} style={{
      padding: "90px 28px",
      background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: -60, left: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: -40, right: -40, width: 250, height: 250, borderRadius: "50%", background: "rgba(255,255,255,0.06)", filter: "blur(60px)" }} />
      <div style={{
        maxWidth: 700, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1,
        opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(40px)",
        transition: "all .8s ease",
      }}>
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🧩</div>
        <h2 style={{ fontSize: "2.4rem", fontWeight: 900, color: "#fff", marginBottom: 18, lineHeight: 1.2 }}>
          Ready to Start Your Child's Journey?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.85)", lineHeight: 1.7, fontSize: "1.05rem", marginBottom: 36 }}>
          Join hundreds of families who have found clarity, confidence, and measurable progress through AI-powered home therapy.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/login")}
            style={{ padding: "15px 36px", borderRadius: 12, border: "none", background: "#fff", color: "#4f46e5", fontWeight: 800, fontSize: "1rem", cursor: "pointer", transition: "all .3s", fontFamily: "inherit", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            Start Free Assessment →
          </button>
          <button
            onClick={() => navigate("/about")}
            style={{ padding: "15px 36px", borderRadius: 12, border: "2px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: "1rem", cursor: "pointer", transition: "all .3s", fontFamily: "inherit" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            Learn About Autism
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─────────────────────────────────────────────────────────────── */
function Footer() {
  const handleFooterLink = (item) => {
    switch (item) {
      case "About Us":
      case "What is Autism?":
        navigate("/about");
        break;
      case "Contact":
        navigate("/contact");
        break;
      case "Privacy Policy":
        navigate("/privacy");
        break;
      case "Terms of Service":
        navigate("/terms");
        break;
      case "Assessment":
      case "Activities":
      case "Therapist Portal":
      case "Progress Reports":
        navigate("/login");
        break;
      default:
        document.getElementById("autism-info")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const links = {
    Platform: ["Assessment", "Activities", "Progress Reports", "Therapist Portal"],
    Resources: ["What is Autism?", "Parent Guides", "Therapy FAQ", "Research"],
    Company: ["About Us", "Privacy Policy", "Terms of Service", "Contact"],
  };

  return (
    <footer style={{ background: "#0f0f1a", color: "rgba(255,255,255,0.85)", padding: "60px 28px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 40, marginBottom: 48, flexWrap: "wrap" }}>

          {/* Brand */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: "1.8rem" }}>🧩</span>
              <span style={{ fontWeight: 800, fontSize: "1.4rem", color: "#fff" }}>AutismAssist</span>
            </div>
            <p style={{ color: "rgba(255,255,255,0.55)", lineHeight: 1.7, fontSize: ".9rem", maxWidth: 280 }}>
              AI-powered home therapy platform empowering families of children with autism to access personalized, evidence-informed support every day.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              {["🐦", "💼", "📘", "📸"].map((icon, i) => (
                <button key={i} style={{ width: 38, height: 38, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.07)", color: "#fff", cursor: "pointer", fontSize: "1rem", transition: "all .3s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(99,102,241,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                >{icon}</button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 style={{ fontWeight: 700, color: "#fff", marginBottom: 16, fontSize: ".95rem", letterSpacing: ".5px" }}>{category}</h4>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <li key={item}>
                    <span
                      onClick={() => handleFooterLink(item)}
                      style={{ color: "rgba(255,255,255,0.5)", fontSize: ".88rem", cursor: "pointer", transition: "color .2s" }}
                      onMouseEnter={e => e.currentTarget.style.color = "#a5b4fc"}
                      onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.5)"}
                    >{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".85rem" }}>
            © 2026 AutismAssist · Empowering every child's journey 🌟
          </p>
          <p style={{ color: "rgba(255,255,255,0.35)", fontSize: ".8rem" }}>
            Built with ❤️ for families everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── GLOBAL KEYFRAMES ───────────────────────────────────────────────────── */
const styleTag = `
  @keyframes blobFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-30px) scale(1.05); }
  }
  @keyframes bounce {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    50% { transform: translateX(-50%) translateY(10px); }
  }
`;

/* ─── HOME PAGE ──────────────────────────────────────────────────────────── */
export default function Home() {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = styleTag;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{ width: "100%", overflowX: "hidden" }}>
      <Navbar />
      <Hero />
      <AutismInfoSection />
      <FeaturesStrip />
      <HowItWorks />
      <Reviews />
      <CTA />
      <Footer />
    </div>
  );
}