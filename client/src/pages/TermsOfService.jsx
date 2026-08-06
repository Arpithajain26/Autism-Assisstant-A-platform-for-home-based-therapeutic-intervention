import { useEffect, useState } from "react";
import { useLang } from "../context/LanguageContext";
import Navbar from "../components/Navbar";

function navigate(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/* ── Shared layout helpers ─────────────────────────────────────────────────── */
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
      <div style={{ position:"absolute", top:-80, right:-80, width:400, height:400, borderRadius:"50%", background:"rgba(99,102,241,0.18)", filter:"blur(90px)" }} />
      <div style={{ position:"absolute", bottom:-60, left:-60, width:350, height:350, borderRadius:"50%", background:"rgba(139,92,246,0.15)", filter:"blur(80px)" }} />
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

/* ── CONTENT ──────────────────────────────────────────────────────────────── */
function TermsContent() {
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
          Welcome to AutismAssist. By accessing or using our platform — including the website, assessment tools, therapy activity library, progress tracking features, and any associated services — you ("User," "Parent," "Guardian," or "Therapist") agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree, do not use our services.
        </Para>

        {/* 1 */}
        <SectionHeading>1. About AutismAssist</SectionHeading>
        <Para>
          AutismAssist is an AI-powered home therapy support platform designed to assist families and licensed therapists in supporting children with Autism Spectrum Disorder (ASD). Our platform provides:
        </Para>
        <Ul items={[
          "AI-driven autism level classification based on guided questionnaires",
          "Personalised daily therapy activity recommendations",
          "Emotion detection and engagement monitoring during sessions",
          "Weekly progress reports and data sharing tools for therapists",
        ]} />

        <div style={{ padding:"16px 20px", background:"#fff7ed", borderRadius:12, border:"1px solid #fed7aa", marginTop:8, marginBottom:12 }}>
          <Para style={{ margin:0 }}>
            <strong>⚠️ Medical Disclaimer:</strong> AutismAssist is an educational and supportive tool. It is <strong>not a medical device</strong> and does not provide clinical diagnosis, medical advice, or treatment. Our AI assessments are screening tools only. Always consult a licensed medical professional or developmental paediatrician for diagnosis and clinical care.
          </Para>
        </div>

        {/* 2 */}
        <SectionHeading>2. Eligibility & Account Registration</SectionHeading>
        <Ul items={[
          "You must be at least 18 years old to create an account as a Parent/Guardian or Therapist",
          "Child accounts may only be created by a parent or guardian — children may not self-register",
          "Therapist accounts require you to confirm that you are a licensed or qualified mental health or behavioural professional",
          "You must provide accurate, current, and complete registration information",
          "You are responsible for maintaining the confidentiality of your account credentials",
          "You may not share your account with others or create accounts on behalf of third parties without their consent",
        ]} />

        {/* 3 */}
        <SectionHeading>3. Permitted Use</SectionHeading>
        <Para>You may use AutismAssist only for lawful purposes and in accordance with these Terms. Specifically, you agree to:</Para>
        <Ul items={[
          "Use the platform only to support the care of children for whom you are a parent, legal guardian, or assigned therapist",
          "Provide honest and accurate information in all assessments",
          "Not upload, transmit, or share any content that is false, harmful, abusive, or unlawful",
          "Not attempt to reverse-engineer, scrape, or extract our AI models, activity library, or proprietary data",
          "Not use automated scripts, bots, or tools to access the platform",
          "Comply with all applicable Indian and international laws",
        ]} />

        {/* 4 */}
        <SectionHeading>4. Therapist Accounts</SectionHeading>
        <Para>Therapists using AutismAssist acknowledge that:</Para>
        <Ul items={[
          "The platform is a supplementary tool and does not replace clinical judgment",
          "You remain fully responsible for the clinical care, safety, and wellbeing of your patients",
          "Data shared with you through the platform is governed by applicable patient confidentiality obligations (including professional codes of conduct)",
          "You will not access child data beyond what is necessary for the child's care",
          "Misuse of access may result in immediate account termination and referral to regulatory bodies",
        ]} />

        {/* 5 */}
        <SectionHeading>5. AI Features — Limitations & Accuracy</SectionHeading>
        <Para>
          Our platform uses machine learning models trained on behavioural and therapy datasets. You acknowledge the following:
        </Para>
        <Ul items={[
          "Our autism classification model achieves ~90% accuracy — this means approximately 1 in 10 assessments may be misclassified",
          "Assessment results are screening indicators only and must not be used as a substitute for formal clinical evaluation",
          "Emotion detection is an approximation based on facial landmark analysis and may be affected by lighting, camera quality, and child cooperation",
          "AI-generated activity recommendations are evidence-informed but not tailored by a licensed clinician",
          "We continuously update our models; results may vary over time",
        ]} />

        {/* 6 */}
        <SectionHeading>6. Intellectual Property</SectionHeading>
        <Para>
          All content on the platform — including but not limited to the therapy activity library, AI models, assessment questionnaires, reports, branding, and software — is owned by or licensed to AutismAssist and is protected by applicable intellectual property laws.
        </Para>
        <Para>You may not:</Para>
        <Ul items={[
          "Copy, reproduce, distribute, or create derivative works from our content without written permission",
          "Use our trademarks, logos, or brand elements without authorisation",
          "Claim ownership of AI-generated reports or recommendations",
        ]} />
        <Para>
          You retain ownership of any personal data you provide. By using the platform, you grant us a limited, non-exclusive licence to process your data for the purpose of providing our services.
        </Para>

        {/* 7 */}
        <SectionHeading>7. Privacy</SectionHeading>
        <Para>
          Your use of AutismAssist is also governed by our <button onClick={() => navigate("/privacy")} style={{ background:"none", border:"none", color:"#6366f1", fontWeight:700, cursor:"pointer", fontFamily:"inherit", padding:0, fontSize:".95rem" }}>Privacy Policy</button>, which is incorporated into these Terms by reference. You consent to our collection and use of your data as described in that Policy.
        </Para>

        {/* 8 */}
        <SectionHeading>8. Subscription & Payments</SectionHeading>
        <Para>
          AutismAssist currently offers a free tier with full access to core features. If paid plans are introduced in the future:
        </Para>
        <Ul items={[
          "Pricing will be clearly disclosed before any payment is required",
          "Subscriptions will auto-renew unless cancelled before the renewal date",
          "Refunds will be offered within 7 days of payment if no paid features have been used",
          "We reserve the right to modify pricing with 30 days' notice to existing subscribers",
        ]} />

        {/* 9 */}
        <SectionHeading>9. Termination</SectionHeading>
        <Para>We may suspend or terminate your account immediately if you:</Para>
        <Ul items={[
          "Violate any provision of these Terms",
          "Provide false information during registration or assessment",
          "Use the platform to harm a child or other user",
          "Engage in fraudulent, abusive, or illegal behaviour",
        ]} />
        <Para>
          You may delete your account at any time from your account settings. Upon termination, your access to the platform ceases immediately. Data retention following termination is governed by our Privacy Policy.
        </Para>

        {/* 10 */}
        <SectionHeading>10. Limitation of Liability</SectionHeading>
        <Para>
          To the maximum extent permitted by applicable law, AutismAssist shall not be liable for:
        </Para>
        <Ul items={[
          "Any harm arising from reliance on AI assessment results or activity recommendations without professional clinical oversight",
          "Indirect, incidental, special, consequential, or punitive damages",
          "Loss of data, profits, or goodwill",
          "Service interruptions due to maintenance, technical issues, or events outside our reasonable control",
        ]} />
        <Para>
          Our total liability to you for any claim arising out of these Terms shall not exceed the amount you paid us in the 3 months prior to the event giving rise to the claim (or ₹500 if you are on the free tier).
        </Para>

        {/* 11 */}
        <SectionHeading>11. Indemnification</SectionHeading>
        <Para>
          You agree to indemnify and hold AutismAssist, its founders, employees, and partners harmless from any claim, loss, liability, or expense (including legal fees) arising out of your use of the platform, violation of these Terms, or infringement of any third-party rights.
        </Para>

        {/* 12 */}
        <SectionHeading>12. Governing Law & Dispute Resolution</SectionHeading>
        <Para>
          These Terms are governed by the laws of India. Any disputes shall first be attempted to be resolved amicably. If unresolved within 30 days, disputes shall be submitted to arbitration under the Arbitration and Conciliation Act, 1996, with the seat of arbitration in Bangalore, Karnataka, India. Proceedings shall be conducted in English.
        </Para>

        {/* 13 */}
        <SectionHeading>13. Changes to These Terms</SectionHeading>
        <Para>
          We may revise these Terms from time to time. When we make material changes, we will notify you by email or prominent notice on the platform at least 14 days before the changes take effect. Continued use of the platform after that date constitutes acceptance of the revised Terms.
        </Para>

        {/* 14 */}
        <SectionHeading>14. Contact Us</SectionHeading>
        <Para>For questions about these Terms, contact us at:</Para>
        <div style={{ padding:"20px 24px", background:"rgba(99,102,241,0.06)", borderRadius:12, border:"1px solid rgba(99,102,241,0.15)" }}>
          <Para>
            <strong>AutismAssist</strong><br />
            Bangalore, Karnataka, India<br />
            Email: <a href="mailto:contact@autismassist.in" style={{ color:"#6366f1", textDecoration:"none", fontWeight:600 }}>contact@autismassist.in</a>
          </Para>
        </div>
      </div>
    </section>
  );
}

function MiniFooter() {
  return (
    <footer style={{ background:"#0f0f1a", color:"rgba(255,255,255,0.4)", padding:"28px", textAlign:"center", fontSize:".85rem" }}>
      © 2026 AutismAssist · Empowering every child's journey 🌟
    </footer>
  );
}

export default function TermsOfService() {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  return (
    <div style={{ width:"100vw", marginLeft:"calc(-50vw + 50%)" }}>
      <Navbar />
      <PolicyHero
        title="Terms of Service"
        subtitle="Please read these terms carefully before using AutismAssist. They govern your use of the platform and our AI-powered features."
      />
      <TermsContent />
      <MiniFooter />
    </div>
  );
}
