import { useEffect, useRef, useState } from "react";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ============================================
   Scroll Reveal Hook
============================================ */

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

/* ============================================
   Count Animation
============================================ */

function Counter({
  target,
  suffix = "",
  color,
  label,
}) {
  const [ref, visible] = useReveal();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!visible) return;

    let start = 0;

    const timer = setInterval(() => {
      start++;

      if (start >= target) {
        start = target;
        clearInterval(timer);
      }

      setValue(start);
    }, 20);

    return () => clearInterval(timer);
  }, [visible]);

  return (
    <div ref={ref}>
      <div
        style={{
          fontSize: "2.2rem",
          fontWeight: 800,
          color,
        }}
      >
        {value}
        {suffix}
      </div>

      <div
        style={{
          color: "var(--text-muted)",
          fontSize: ".85rem",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/* ============================================
   Hero Section
============================================ */

function Hero() {
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  const videoRef = useRef(null);

  const [muted, setMuted] = useState(true);

  useEffect(() => {
    [leftRef, rightRef].forEach((ref, i) => {
      if (!ref.current) return;

      ref.current.style.opacity = "0";

      ref.current.style.transform =
        i === 0
          ? "translateX(-40px)"
          : "translateX(40px)";

      setTimeout(() => {
        if (!ref.current) return;

        ref.current.style.transition =
          "all .8s ease";

        ref.current.style.opacity = "1";

        ref.current.style.transform =
          "translateX(0)";
      }, 150);
    });
  }, []);

  function toggleMute() {
    if (!videoRef.current) return;

    videoRef.current.muted =
      !videoRef.current.muted;

    setMuted(videoRef.current.muted);
  }

  return (
    <section style={styles.heroSection}>
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.heroWrapper}>

        {/* =======================
              Hero Content
        ======================== */}

        <div style={styles.heroGrid}>

          {/* LEFT */}

          <div ref={leftRef}>

            <span style={styles.badge}>
              ✨ AI Powered Home Therapy
            </span>

            <h1 style={styles.heading}>
              Helping Every Child
              <br />

              <span
                style={{
                  color:
                    "var(--primary)",
                }}
              >
                Learn, Grow &
              </span>

              <br />

              Communicate Better
            </h1>

            <p style={styles.description}>
              Personalized Autism Therapy
              powered by Artificial
              Intelligence.

              Assess your child,
              monitor emotions,
              receive personalized
              therapy activities,
              and track weekly
              progress from one
              secure platform.
            </p>

            <div style={styles.buttonRow}>
              <button
                style={styles.primaryButton}
                onClick={() =>
                  navigate("/login")
                }
              >
                Start Assessment →
              </button>

              <button
                style={styles.secondaryButton}
              >
                Explore Features
              </button>
            </div>

            {/* Stats */}

            <div style={styles.stats}>

              <Counter
                target={90}
                suffix="%"
                color="#6366f1"
                label="Classification Accuracy"
              />

              <Counter
                target={85}
                suffix="%"
                color="#10b981"
                label="Emotion Detection"
              />

              <div>
                <div
                  style={{
                    fontSize: "2.2rem",
                    fontWeight: 800,
                    color: "#a855f7",
                  }}
                >
                  AI
                </div>

                <div
                  style={{
                    color:
                      "var(--text-muted)",
                    fontSize: ".85rem",
                  }}
                >
                  Personalized Therapy
                </div>
              </div>

            </div>

          </div>
                    {/* ==========================
                RIGHT SIDE
          ========================== */}

          <div ref={rightRef} style={styles.rightContainer}>
            <div className="glass" style={styles.cardWrapper}>

              <div style={styles.featureCards}>

                <div
                  style={{
                    ...styles.featureCard,
                    background: "var(--primary-light)",
                  }}
                >
                  <div
                    style={{
                      ...styles.featureIcon,
                      color: "var(--primary)",
                    }}
                  >
                    🧠
                  </div>

                  <div>
                    <h3 style={styles.featureTitle}>
                      AI Assessment
                    </h3>

                    <p style={styles.featureDesc}>
                      Smart Autism Level Classification
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.featureCard,
                    background: "var(--green-light)",
                  }}
                >
                  <div
                    style={{
                      ...styles.featureIcon,
                      color: "var(--green)",
                    }}
                  >
                    ❤️
                  </div>

                  <div>
                    <h3 style={styles.featureTitle}>
                      Emotion Detection
                    </h3>

                    <p style={styles.featureDesc}>
                      Live emotional monitoring
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    ...styles.featureCard,
                    background: "var(--accent-light)",
                  }}
                >
                  <div
                    style={{
                      ...styles.featureIcon,
                      color: "var(--accent)",
                    }}
                  >
                    📊
                  </div>

                  <div>
                    <h3 style={styles.featureTitle}>
                      Progress Tracking
                    </h3>

                    <p style={styles.featureDesc}>
                      Weekly AI generated reports
                    </p>
                  </div>
                </div>

              </div>

            </div>

            <div style={styles.circle1}></div>
            <div style={styles.circle2}></div>

          </div>

        </div>

        {/* =======================
            Glass Video
        ======================== */}

        <div style={styles.videoContainer}>
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            poster="/images/poster.jpg"
            src="/videos/autism.mp4"
            style={styles.video}
          />

          <div style={styles.videoOverlay} />

          <button
            onClick={toggleMute}
            style={styles.muteButton}
          >
            {muted ? "🔇" : "🔊"}
          </button>

          <div style={styles.videoBadge}>
            Live Therapy Session
          </div>
        </div>

      </div>

    </section>
  );
}

/* ============================
   Home Page
============================ */

function InfoSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 3;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const slideTitles = [
    { title: "About Autism", icon: "🧩" },
    { title: "How It Works", icon: "⚙️" },
    { title: "What People Say", icon: "💬" }
  ];

  return (
    <div style={styles.sliderContainer}>
      {/* Tab Navigation */}
      <div style={styles.tabNav}>
        {slideTitles.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            style={{
              ...styles.tabButton,
              ...(currentSlide === idx ? styles.activeTabButton : {}),
            }}
          >
            <span style={{ marginRight: '8px' }}>{tab.icon}</span>
            {tab.title}
          </button>
        ))}
      </div>

      {/* Slider Window */}
      <div style={styles.sliderWindow}>
        <div
          style={{
            ...styles.slidesWrapper,
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {/* SLIDE 1: ABOUT AUTISM */}
          <div style={styles.slide}>
            <div style={styles.slideHeader}>
              <span style={styles.slideTag}>ABOUT AUTISM</span>
              <h2 style={styles.slideTitle}>What Autism Is, and How We Help</h2>
              <p style={styles.slideDesc}>
                Autism Spectrum Disorder (ASD) affects how a person communicates, interacts socially, and processes the world around them. No two children experience it the same way — which is exactly why care built around one fixed program rarely fits everyone.
              </p>
            </div>
            <div style={styles.cardsGrid}>
              <div style={styles.featureCardItem}>
                <div style={{ ...styles.iconCircle, background: 'rgba(99,102,241,0.1)' }}>🧩</div>
                <h3 style={styles.cardHeader}>What is Autism?</h3>
                <p style={styles.cardBody}>
                  Autism is a developmental condition present from early childhood, marked by differences in communication, social interaction, and repetitive or focused patterns of behavior. It's a spectrum, meaning strengths and challenges can look very different from one child to the next.
                </p>
              </div>
              <div style={styles.featureCardItem}>
                <div style={{ ...styles.iconCircle, background: 'rgba(16,185,129,0.1)' }}>🌱</div>
                <h3 style={styles.cardHeader}>Why Early, Personalized Therapy</h3>
                <p style={styles.cardBody}>
                  The earlier a child receives support that's tailored to their specific profile, the more effectively they can build communication, social, and coping skills. Generic programs often miss what a specific child actually responds to — ours adapts continuously instead of guessing once.
                </p>
              </div>
              <div style={styles.featureCardItem}>
                <div style={{ ...styles.iconCircle, background: 'rgba(249,115,22,0.1)' }}>🤖</div>
                <h3 style={styles.cardHeader}>Why AI?</h3>
                <p style={styles.cardBody}>
                  AI lets us do at home what usually requires a clinic visit: read subtle emotional and behavioral signals in the moment, then adjust activities on the fly — so therapy keeps pace with your child instead of following a fixed script.
                </p>
              </div>
            </div>
          </div>

          {/* SLIDE 2: HOW IT WORKS */}
          <div style={styles.slide}>
            <div style={styles.slideHeader}>
              <span style={styles.slideTag}>GUIDED PROCESS</span>
              <h2 style={styles.slideTitle}>How It Works</h2>
              <p style={styles.slideDesc}>
                Our platform guides parents, children, and therapists through a unified framework to identify levels and customize progressive developmental activities.
              </p>
            </div>
            <div style={styles.stepsGrid}>
              <div style={styles.stepCard}>
                <div style={styles.stepNum}>01</div>
                <h4 style={styles.stepHeader}>Take the AI Assessment</h4>
                <p style={styles.stepBody}>
                  Answer a short guided questionnaire and let our model classify your child's autism level with 90% accuracy, giving you a clear starting point.
                </p>
              </div>
              <div style={styles.stepCard}>
                <div style={styles.stepNum}>02</div>
                <h4 style={styles.stepHeader}>Get a Personalized Plan</h4>
                <p style={styles.stepBody}>
                  The AI builds a daily set of therapy activities tuned to your child's needs — communication, social, sensory, and behavioral exercises.
                </p>
              </div>
              <div style={styles.stepCard}>
                <div style={styles.stepNum}>03</div>
                <h4 style={styles.stepHeader}>Monitor Engagement</h4>
                <p style={styles.stepBody}>
                  During activities, real-time emotion detection tracks how engaged and comfortable your child is, so sessions adapt instead of staying static.
                </p>
              </div>
              <div style={styles.stepCard}>
                <div style={styles.stepNum}>04</div>
                <h4 style={styles.stepHeader}>Track Weekly Progress</h4>
                <p style={styles.stepBody}>
                  Every week you receive an easy-to-read report showing growth trends, so you and your therapist can see what's working.
                </p>
              </div>
            </div>
          </div>

          {/* SLIDE 3: REVIEWS */}
          <div style={styles.slide}>
            <div style={styles.slideHeader}>
              <span style={styles.slideTag}>TESTIMONIALS</span>
              <h2 style={styles.slideTitle}>What People Are Saying</h2>
              <p style={styles.slideDesc}>
                Real feedback from parents and therapists using the platform week to week.
              </p>
            </div>
            <div style={styles.reviewsGrid}>
              <div style={styles.reviewCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.reviewQuote}>
                  "The daily activities finally felt made for my son, not just generic worksheets. Within two months we could see real changes in how he communicated with us."
                </p>
                <div style={styles.authorSection}>
                  <div style={styles.avatar}>A</div>
                  <div>
                    <h5 style={styles.authorName}>Ananya R.</h5>
                    <span style={styles.authorRole}>Parent of a 6-year-old</span>
                  </div>
                </div>
              </div>
              <div style={styles.reviewCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.reviewQuote}>
                  "The weekly progress reports gave us language to bring to our therapist. It turned guesswork into an actual conversation about what's working."
                </p>
                <div style={styles.authorSection}>
                  <div style={styles.avatar}>M</div>
                  <div>
                    <h5 style={styles.authorName}>Marcus T.</h5>
                    <span style={styles.authorRole}>Parent of a 4-year-old</span>
                  </div>
                </div>
              </div>
              <div style={styles.reviewCard}>
                <div style={styles.stars}>⭐⭐⭐⭐⭐</div>
                <p style={styles.reviewQuote}>
                  "The emotion tracking during sessions was the part that surprised me most. We could finally tell the difference between 'quiet and focused' and 'quiet and overwhelmed.'"
                </p>
                <div style={styles.authorSection}>
                  <div style={styles.avatar}>P</div>
                  <div>
                    <h5 style={styles.authorName}>Priya S.</h5>
                    <span style={styles.authorRole}>Parent of a 8-year-old</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Control Dots & Arrows */}
      <div style={styles.controlsRow}>
        <button
          onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)}
          style={styles.arrowButton}
        >
          ‹
        </button>
        <div style={styles.dotsRow}>
          {[...Array(totalSlides)].map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              style={{
                ...styles.dot,
                background: currentSlide === idx ? 'var(--primary)' : '#cbd5e1',
                width: currentSlide === idx ? '24px' : '8px',
              }}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)}
          style={styles.arrowButton}
        >
          ›
        </button>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <InfoSlider />
      <footer style={styles.footer}>
        <p>© 2026 Autism Assistant · Empowering every journey 🌟</p>
      </footer>
    </>
  );
}

/* ============================
      Styles
============================ */

const styles = {

heroSection:{
minHeight:"100vh",
paddingTop:"90px",
paddingBottom:"80px",
position:"relative",
overflow:"hidden"
},

heroWrapper:{
maxWidth:"1200px",
margin:"auto",
padding:"0 25px"
},

heroGrid:{
display:"grid",
gridTemplateColumns:"1fr 1fr",
gap:"60px",
alignItems:"center",
marginTop:"60px"
},

videoContainer:{
position:"relative",
height:"430px",
borderRadius:"28px",
overflow:"hidden",
marginBottom:"70px",
boxShadow:"0 30px 70px rgba(0,0,0,.18)"
},

video:{
width:"100%",
height:"100%",
objectFit:"cover"
},

videoOverlay:{
position:"absolute",
inset:0,
background:
"linear-gradient(rgba(255,255,255,.08),rgba(0,0,0,.35))",
backdropFilter:"blur(2px)"
},

videoBadge:{
position:"absolute",
left:"25px",
bottom:"25px",
background:"rgba(255,255,255,.15)",
backdropFilter:"blur(18px)",
padding:"10px 18px",
borderRadius:"50px",
color:"#fff",
fontWeight:600
},

muteButton:{
position:"absolute",
right:"20px",
bottom:"20px",
width:"45px",
height:"45px",
borderRadius:"50%",
border:"none",
cursor:"pointer",
fontSize:"20px",
background:"rgba(255,255,255,.2)",
backdropFilter:"blur(15px)",
color:"#fff"
},

badge:{
display:"inline-block",
padding:"8px 18px",
background:"var(--primary-light)",
borderRadius:"50px",
fontWeight:700,
color:"var(--primary)",
marginBottom:"25px"
},

heading:{
fontSize:"3.6rem",
fontWeight:800,
lineHeight:1.15,
marginBottom:"25px",
color:"var(--text)"
},

description:{
fontSize:"1.05rem",
lineHeight:1.8,
color:"var(--text-muted)",
marginBottom:"35px"
},

buttonRow:{
display:"flex",
gap:"15px",
marginBottom:"40px"
},

primaryButton:{
padding:"15px 28px",
border:"none",
borderRadius:"15px",
background:"var(--primary)",
color:"#fff",
fontWeight:700,
cursor:"pointer",
fontSize:"1rem"
},

secondaryButton:{
padding:"15px 28px",
borderRadius:"15px",
border:"2px solid var(--primary)",
background:"transparent",
cursor:"pointer",
fontWeight:700,
color:"var(--primary)"
},

stats:{
display:"grid",
gridTemplateColumns:"repeat(3,1fr)",
gap:"20px"
},

rightContainer:{
position:"relative"
},

cardWrapper:{
padding:"35px",
borderRadius:"25px"
},

featureCards:{
display:"flex",
flexDirection:"column",
gap:"20px"
},

featureCard:{
display:"flex",
gap:"18px",
padding:"22px",
borderRadius:"18px",
transition:".35s",
cursor:"pointer"
},

featureIcon:{
fontSize:"2.3rem"
},

featureTitle:{
fontSize:"1.1rem",
fontWeight:700,
marginBottom:"5px"
},

featureDesc:{
color:"var(--text-muted)",
fontSize:".9rem"
},

circle1:{
position:"absolute",
top:"-50px",
right:"-50px",
width:"260px",
height:"260px",
borderRadius:"50%",
background:"rgba(99,102,241,.12)",
filter:"blur(70px)",
zIndex:-1
},

circle2:{
position:"absolute",
bottom:"-50px",
left:"-40px",
width:"220px",
height:"220px",
borderRadius:"50%",
background:"rgba(168,85,247,.12)",
filter:"blur(70px)",
zIndex:-1
},

blob1:{
position:"absolute",
top:"-120px",
right:"-120px",
width:"400px",
height:"400px",
borderRadius:"50%",
background:"rgba(99,102,241,.08)",
filter:"blur(100px)"
},

blob2:{
position:"absolute",
bottom:"-100px",
left:"-100px",
width:"350px",
height:"350px",
borderRadius:"50%",
background:"rgba(168,85,247,.08)",
filter:"blur(100px)"
},

  sliderContainer: {
    maxWidth: "1200px",
    margin: "80px auto",
    padding: "0 25px",
    position: "relative",
  },
  tabNav: {
    display: "flex",
    justifyContent: "center",
    gap: "15px",
    marginBottom: "40px",
    flexWrap: "wrap",
  },
  tabButton: {
    padding: "12px 24px",
    borderRadius: "30px",
    border: "1px solid var(--border)",
    background: "var(--glass-bg)",
    backdropFilter: "blur(10px)",
    color: "var(--text-muted)",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.02)",
    fontFamily: "inherit",
  },
  activeTabButton: {
    background: "var(--primary)",
    color: "#ffffff",
    borderColor: "var(--primary)",
    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.25)",
  },
  sliderWindow: {
    overflow: "hidden",
    borderRadius: "24px",
    border: "1px solid var(--border)",
    background: "var(--glass-bg)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 10px 40px rgba(99, 102, 241, 0.05)",
  },
  slidesWrapper: {
    display: "flex",
    transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
    width: "100%",
  },
  slide: {
    minWidth: "100%",
    width: "100%",
    padding: "50px 40px",
    boxSizing: "border-box",
  },
  slideHeader: {
    textAlign: "center",
    maxWidth: "700px",
    margin: "0 auto 40px auto",
  },
  slideTag: {
    display: "inline-block",
    padding: "6px 14px",
    background: "var(--primary-light)",
    color: "var(--primary)",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "700",
    letterSpacing: "1px",
    marginBottom: "14px",
  },
  slideTitle: {
    fontSize: "2.2rem",
    fontWeight: "800",
    marginBottom: "16px",
    color: "var(--text)",
  },
  slideDesc: {
    fontSize: "1rem",
    lineHeight: "1.7",
    color: "var(--text-muted)",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  featureCardItem: {
    padding: "30px",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "rgba(255, 255, 255, 0.4)",
    transition: "all 0.3s ease",
  },
  iconCircle: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.8rem",
    marginBottom: "20px",
  },
  cardHeader: {
    fontSize: "1.25rem",
    fontWeight: "700",
    marginBottom: "12px",
    color: "var(--text)",
  },
  cardBody: {
    fontSize: "0.92rem",
    lineHeight: "1.6",
    color: "var(--text-muted)",
  },
  stepsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "24px",
  },
  stepCard: {
    padding: "24px",
    borderRadius: "16px",
    background: "rgba(255, 255, 255, 0.4)",
    border: "1px solid var(--border)",
    position: "relative",
    overflow: "hidden",
  },
  stepNum: {
    fontSize: "3.5rem",
    fontWeight: "900",
    color: "rgba(99, 102, 241, 0.12)",
    position: "absolute",
    top: "-10px",
    right: "10px",
  },
  stepHeader: {
    fontSize: "1.1rem",
    fontWeight: "700",
    marginBottom: "10px",
    color: "var(--text)",
    position: "relative",
    zIndex: 1,
  },
  stepBody: {
    fontSize: "0.88rem",
    lineHeight: "1.55",
    color: "var(--text-muted)",
    position: "relative",
    zIndex: 1,
  },
  reviewsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "24px",
  },
  reviewCard: {
    padding: "30px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.4)",
    border: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  },
  stars: {
    fontSize: "1.2rem",
    marginBottom: "15px",
  },
  reviewQuote: {
    fontSize: "0.98rem",
    lineHeight: "1.65",
    color: "var(--text)",
    fontStyle: "italic",
    marginBottom: "24px",
  },
  authorSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "var(--primary-light)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "1.1rem",
  },
  authorName: {
    fontSize: "0.95rem",
    fontWeight: "700",
    color: "var(--text)",
    margin: 0,
  },
  authorRole: {
    fontSize: "0.8rem",
    color: "var(--text-muted)",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "30px",
  },
  arrowButton: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "1px solid var(--border)",
    background: "white",
    color: "var(--text)",
    fontSize: "1.4rem",
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
    transition: "all 0.2s ease",
  },
  dotsRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center",
  },
  dot: {
    height: "8px",
    borderRadius: "4px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  footer: {
    textAlign: "center",
    padding: "40px 0",
    color: "var(--text-muted)",
    fontSize: "0.85rem",
    borderTop: "1px solid var(--border)",
    marginTop: "60px",
  }
};