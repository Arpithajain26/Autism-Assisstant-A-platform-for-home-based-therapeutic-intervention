import { useEffect, useState } from "react";
import { useLang } from "../context/LanguageContext";
import Navbar from "../components/Navbar";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ── Section heading helper ─────────────────────────────────────────────────── */
function SectionHeading({ children }) {
  return (
    <h2 style={{
      fontSize: "1.35rem", fontWeight: 800, color: "#1e1b4b",
      borderLeft: "4px solid #6366f1", paddingLeft: 16,
      marginTop: 48, marginBottom: 14,
    }}>
      {children}
    </h2>
  );
}

function SubHeading({ children }) {
  return (
    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#4f46e5", marginTop: 24, marginBottom: 8 }}>
      {children}
    </h3>
  );
}

function Para({ children }) {
  return (
    <p style={{ color: "#374151", lineHeight: 1.85, fontSize: ".95rem", marginBottom: 12 }}>
      {children}
    </p>
  );
}

function Ul({ items }) {
  return (
    <ul style={{ paddingLeft: 20, margin: "0 0 12px" }}>
      {items.map((item, i) => (
        <li key={i} style={{ color: "#374151", lineHeight: 1.85, fontSize: ".95rem", marginBottom: 4 }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

/* ── HERO ─────────────────────────────────────────────────────────────────── */
function PolicyHero({ title, subtitle }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 60); return () => clearTimeout(t); }, []);

  return (
    <section style={{
      background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
      padding: "120px 28px 70px", textAlign: "center",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position:"absolute", top:-80, left:-80, width:400, height:400, borderRadius:"50%", background:"rgba(99,102,241,0.18)", filter:"blur(90px)" }} />
      <div style={{ position:"absolute", bottom:-60, right:-60, width:350, height:350, borderRadius:"50%", background:"rgba(139,92,246,0.15)", filter:"blur(80px)" }} />
      <div style={{ position:"relative", zIndex:1, maxWidth:800, margin:"0 auto" }}>
        <div style={{
          display:"inline-block", padding:"7px 20px", borderRadius:50,
          background:"rgba(99,102,241,0.3)", border:"1px solid rgba(99,102,241,0.5)",
          color:"#a5b4fc", fontWeight:700, fontSize:".78rem", letterSpacing:"1.5px",
          marginBottom:20,
          opacity: loaded ? 1 : 0, transition:"all .7s ease",
        }}>
          LEGAL
        </div>
        <h1 style={{
          fontSize:"clamp(1.8rem,4vw,3rem)", fontWeight:900, color:"#fff",
          marginBottom:16, lineHeight:1.15,
          opacity: loaded ? 1 : 0, transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition:"all .8s ease .1s",
        }}>
          {title}
        </h1>
        <p style={{
          color:"rgba(255,255,255,0.7)", fontSize:"1rem", lineHeight:1.75,
          opacity: loaded ? 1 : 0, transition:"all .8s ease .2s",
        }}>
          {subtitle}
        </p>
        <button
          onClick={() => navigate("/")}
          style={{
            marginTop:28, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.3)",
            color:"#fff", padding:"9px 22px", borderRadius:50, cursor:"pointer",
            fontFamily:"inherit", fontWeight:600, fontSize:".88rem", transition:"all .3s",
            opacity: loaded ? 1 : 0,
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
        >
          ← Back to Home
        </button>
      </div>
    </section>
  );
}

/* ── MAIN CONTENT ─────────────────────────────────────────────────────────── */
function PrivacyContent() {
  return (
    <section style={{ padding: "60px 28px 80px", background: "#f9fafb" }}>
      <div style={{
        maxWidth: 820, margin: "0 auto",
        background: "#fff", borderRadius: 24, padding: "52px 56px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.07)",
        border: "1px solid rgba(209,213,219,0.6)",
      }}>
        {/* Effective date */}
        <div style={{ display:"flex", gap:20, flexWrap:"wrap", marginBottom:36, padding:"16px 20px", background:"rgba(99,102,241,0.06)", borderRadius:12, border:"1px solid rgba(99,102,241,0.15)" }}>
          <span style={{ color:"#6366f1", fontWeight:700, fontSize:".88rem" }}>📅 Effective Date: August 6, 2026</span>
          <span style={{ color:"#6366f1", fontWeight:700, fontSize:".88rem" }}>🔄 Last Updated: August 6, 2026</span>
        </div>

        <Para>
          AutismAssist ("we," "us," or "our") is committed to protecting the privacy of every family and child who uses our platform. This Privacy Policy explains what information we collect, how we use it, and the rights you have over your data. Please read it carefully before using our services.
        </Para>

        {/* 1 */}
        <SectionHeading>1. Who We Are</SectionHeading>
        <Para>
          AutismAssist is an AI-powered home therapy platform designed to support children with Autism Spectrum Disorder (ASD) and their families. We provide assessment tools, personalized activity recommendations, emotion monitoring during sessions, and progress tracking reports. Our platform is built for parents, caregivers, and licensed therapists.
        </Para>

        {/* 2 */}
        <SectionHeading>2. Information We Collect</SectionHeading>

        <SubHeading>2.1 Account Information</SubHeading>
        <Ul items={[
          "Full name, email address, and password (hashed) when you register",
          "User role: Parent, Child, or Therapist",
          "Profile details you voluntarily provide (e.g., child's date of birth, diagnosis status)",
        ]} />

        <SubHeading>2.2 Child Profile Information</SubHeading>
        <Para>
          To personalise therapy activities, we may collect the following about the child in your care:
        </Para>
        <Ul items={[
          "First name and age range (we do not store full date of birth by default)",
          "Autism assessment responses and resulting level classification (Level 1, 2, or 3)",
          "Activity completion history and engagement data",
          "Emotion detection readings (facial landmark data processed locally; only summary scores are stored)",
          "Weekly progress notes and therapist observations",
        ]} />

        <SubHeading>2.3 Technical Data</SubHeading>
        <Ul items={[
          "IP address, browser type, device type, and operating system",
          "Pages visited, session duration, and feature usage patterns",
          "Authentication tokens (stored locally in your browser, not on our servers)",
        ]} />

        <SubHeading>2.4 Communications</SubHeading>
        <Para>
          If you contact us via the contact form or email, we retain your name, email address, and message content to respond to your inquiry.
        </Para>

        {/* 3 */}
        <SectionHeading>3. How We Use Your Information</SectionHeading>
        <Ul items={[
          "To create and manage your account and authenticate sessions",
          "To run our AI assessment model and generate personalised therapy activity plans",
          "To power emotion detection during therapy sessions and adapt activities in real time",
          "To generate weekly progress reports visible to authorised parents and therapists",
          "To improve the accuracy of our AI models through anonymised, aggregated data analysis",
          "To respond to your support inquiries",
          "To send important service notices (not marketing emails without your consent)",
          "To comply with applicable laws and protect the safety of children on the platform",
        ]} />

        {/* 4 */}
        <SectionHeading>4. Special Protections for Children's Data</SectionHeading>
        <Para>
          We recognise that our platform involves sensitive data about minors. We apply the following protections:
        </Para>
        <Ul items={[
          "Children's profiles are always created and managed by a parent or guardian account — children cannot self-register",
          "Facial emotion data (if used) is processed on-device wherever possible; only aggregate emotion scores are transmitted to our servers",
          "We do not sell, rent, or share children's personal data with third-party advertisers",
          "We do not use children's data to train models for commercial advertising purposes",
          "We comply with India's Digital Personal Data Protection Act (DPDP Act) 2023 and applicable child protection regulations",
        ]} />

        {/* 5 */}
        <SectionHeading>5. How We Share Your Information</SectionHeading>
        <Para>We do not sell your personal data. We may share it only in the following limited circumstances:</Para>
        <Ul items={[
          "With your assigned therapist (if you connect one) — limited to child progress data you explicitly share",
          "With trusted cloud service providers (e.g., database hosting, authentication) under strict data processing agreements",
          "With law enforcement or regulatory authorities if required by law or to protect child safety",
          "In anonymised, aggregated form for research and product improvement — no individual can be identified",
        ]} />

        {/* 6 */}
        <SectionHeading>6. Data Storage & Security</SectionHeading>
        <Ul items={[
          "All data is encrypted in transit (TLS 1.2+) and at rest (AES-256)",
          "Passwords are hashed using bcrypt — we cannot retrieve your plain-text password",
          "Access to production databases is restricted to authorised engineers under audit logging",
          "We conduct periodic security reviews and penetration testing",
          "In the event of a data breach affecting your personal data, we will notify you within 72 hours as required by applicable law",
        ]} />

        {/* 7 */}
        <SectionHeading>7. Data Retention</SectionHeading>
        <Para>
          We retain your account data for as long as your account is active. If you delete your account:
        </Para>
        <Ul items={[
          "Personal identifiers are deleted within 30 days",
          "Anonymised assessment and activity data may be retained for up to 3 years for research purposes",
          "Backups containing your data are purged within 90 days of deletion",
        ]} />

        {/* 8 */}
        <SectionHeading>8. Your Rights</SectionHeading>
        <Para>Under applicable law, you have the right to:</Para>
        <Ul items={[
          "Access — request a copy of the personal data we hold about you or your child",
          "Correction — ask us to correct inaccurate information",
          "Deletion — request erasure of your account and associated data",
          "Portability — receive your data in a structured, machine-readable format",
          "Withdraw consent — stop certain processing activities at any time",
          "Lodge a complaint — with India's Data Protection Board or your local supervisory authority",
        ]} />
        <Para>To exercise any of these rights, email us at <strong>contact@autismassist.in</strong>. We will respond within 30 days.</Para>

        {/* 9 */}
        <SectionHeading>9. Cookies</SectionHeading>
        <Para>
          We use only technically necessary cookies (e.g., session tokens). We do not use third-party advertising cookies or tracking pixels. You may disable cookies in your browser, though some features may not function correctly.
        </Para>

        {/* 10 */}
        <SectionHeading>10. Third-Party Links</SectionHeading>
        <Para>
          Our platform may link to external websites (e.g., NIMHANS, Autism Speaks). We are not responsible for the privacy practices of those sites. Please review their policies independently.
        </Para>

        {/* 11 */}
        <SectionHeading>11. Changes to This Policy</SectionHeading>
        <Para>
          We may update this Privacy Policy from time to time. When we make material changes, we will notify you by email or by placing a prominent notice on the platform. Continued use after the effective date of any change constitutes acceptance of the updated policy.
        </Para>

        {/* 12 */}
        <SectionHeading>12. Contact Us</SectionHeading>
        <Para>
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
        </Para>
        <div style={{ padding:"20px 24px", background:"rgba(99,102,241,0.06)", borderRadius:12, border:"1px solid rgba(99,102,241,0.15)" }}>
          <Para><strong>AutismAssist</strong><br />
            Bangalore, Karnataka, India<br />
            Email: <a href="mailto:contact@autismassist.in" style={{ color:"#6366f1", textDecoration:"none", fontWeight:600 }}>contact@autismassist.in</a>
          </Para>
        </div>
      </div>
    </section>
  );
}

function MiniFooter() {
  const { t } = useLang();
  return (
    <footer style={{ background:"#0f0f1a", color:"rgba(255,255,255,0.4)", padding:"28px", textAlign:"center", fontSize:".85rem" }}>
      © 2026 AutismAssist · Empowering every child's journey 🌟
    </footer>
  );
}

export default function PrivacyPolicy() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{ width:"100vw", marginLeft:"calc(-50vw + 50%)" }}>
      <Navbar />
      <PolicyHero
        title="Privacy Policy"
        subtitle="We take the privacy of children and families seriously. Here's exactly how we handle your data."
      />
      <PrivacyContent />
      <MiniFooter />
    </div>
  );
}
