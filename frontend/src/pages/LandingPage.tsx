import React from "react";
import { useNavigate } from "react-router-dom";
import "../landing.css";
import { useTheme } from "../context/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { MagneticSpotlightMarquee } from "../components/landing/MagneticSpotlightMarquee";
import { CryptoSecuritySection } from "../components/landing/CryptoSecuritySection";
import { CylinderCarousel, type CarouselCard } from "../components/landing/CylinderCarousel";
import { ComparisonSection } from "../components/landing/ComparisonSection";
import { LandingFooter } from "../components/landing/LandingFooter";
import { TextAnimation } from "../components/landing/TextAnimation";

const FEATURE_CARDS: CarouselCard[] = [
  {
    title: "Monaco Editor + Language Server",
    category: "DEVELOPER EXPERIENCE",
    badge: "CORE IDE",
    description: "The full VS Code Monaco engine directly in your browser with real-time AST linting, contextual autocomplete, and multi-cursor power.",
  },
  {
    title: "Zero-Latency CRDT Yjs Engine",
    category: "P2P COLLABORATION",
    badge: "REAL-TIME",
    description: "Sub-millisecond multiplayer code editing with live cursor presence, shared selections, and mathematical conflict-free synchronization.",
  },
  {
    title: "Autonomous DevBot AI Engineer",
    category: "INTELLIGENT AGENT",
    badge: "REACT AGENT",
    description: "Autonomous agent capable of reading file trees, applying streaming code edits with diff visualization, and diagnosing syntax errors.",
  },
  {
    title: "Multi-Tab Native Terminal PTY",
    category: "SYSTEM ACCESS",
    badge: "INTERACTIVE PTY",
    description: "Full ANSI tabbed terminals connected directly to local PowerShell or POSIX shells, allowing script execution without leaving the editor.",
  },
  {
    title: "Git-Style Branching & PR Reviews",
    category: "VERSION CONTROL",
    badge: "CONTENT ADDRESSED",
    description: "Decentralized branch workflows, atomic CAS snapshots, pull requests with split/unified diffs, and tri-engine SQLite WAL + PostgreSQL persistence.",
  },
  {
    title: "Peer-to-Peer WebRTC Audio & Video",
    category: "COMMUNICATION",
    badge: "DTLS / SRTP",
    description: "Native mesh calling with high-fidelity voice and video chat built directly into the workspace canvas. No third-party Zoom or Discord servers.",
  },
];

export function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;
    const rootEl = document.getElementById("root");

    const prevHtmlOverflowY = htmlEl.style.overflowY;
    const prevHtmlHeight = htmlEl.style.height;
    const prevBodyOverflowY = bodyEl.style.overflowY;
    const prevBodyHeight = bodyEl.style.height;
    const prevRootOverflowY = rootEl?.style.overflowY;
    const prevRootHeight = rootEl?.style.height;

    htmlEl.style.overflowY = "auto";
    htmlEl.style.overflowX = "hidden";
    htmlEl.style.height = "auto";

    bodyEl.style.overflowY = "auto";
    bodyEl.style.overflowX = "hidden";
    bodyEl.style.height = "auto";

    if (rootEl) {
      rootEl.style.overflowY = "visible";
      rootEl.style.overflowX = "hidden";
      rootEl.style.height = "auto";
    }

    return () => {
      htmlEl.style.overflowY = prevHtmlOverflowY || "";
      htmlEl.style.overflowX = "";
      htmlEl.style.height = prevHtmlHeight || "";

      bodyEl.style.overflowY = prevBodyOverflowY || "";
      bodyEl.style.overflowX = "";
      bodyEl.style.height = prevBodyHeight || "";

      if (rootEl) {
        rootEl.style.overflowY = prevRootOverflowY || "";
        rootEl.style.overflowX = "";
        rootEl.style.height = prevRootHeight || "";
      }
    };
  }, []);

  const handleLaunch = () => {
    navigate("/login");
  };

  const handleExplore = () => {
    const el = document.getElementById("features");
    if (el) {
      const navOffset = 80;
      const targetY = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
  };

  return (
    <div className="landing-page">
      {/* Floating Top-Right Controls (Header completely removed per user request) */}
      <div className="landing-floating-dock">
        <button
          onClick={toggleTheme}
          className="landing-floating-theme-btn"
          aria-label="Toggle Theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
      </div>

      {/* Hero: Magnetic Spotlight Marquee with Fluid Physics Wake */}
      <MagneticSpotlightMarquee onLaunch={handleLaunch} onExplore={handleExplore} />

      {/* Zero-Knowledge Cryptography Deep Dive with ASCII Glitch Ripples */}
      <CryptoSecuritySection />

      {/* 3D Cylindrical Feature Pillar Carousel */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <div className="landing-section__header" style={{ marginBottom: "110px" }}>
            <div className="landing-section__kicker">
              <TextAnimation delay={0.05} divideBy="character">
                3D REVOLVING PLATFORM ARCHITECTURE
              </TextAnimation>
            </div>

            <h2 className="landing-section__title">
              <TextAnimation delay={0.1} divideBy="word">
                Engineered For Sovereign Developers
              </TextAnimation>
            </h2>

            <p className="landing-section__desc">
              Every component of Nulltor has been crafted to deliver zero-compromise developer ergonomics while guaranteeing complete local data control.
            </p>
          </div>

          {/* 3D Cylindrical Carousel */}
          <CylinderCarousel cards={FEATURE_CARDS} animationDuration={32} cardWidth={420} />
        </div>
      </section>

      {/* Sovereign Architecture Comparison Table */}
      <ComparisonSection />

      {/* Footer & Final Call to Action */}
      <LandingFooter />
    </div>
  );
}

export default LandingPage;
