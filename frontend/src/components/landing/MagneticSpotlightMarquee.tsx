import React, { useRef, useState, useEffect } from "react";
import gsap from "gsap";
import { cn } from "../../lib/utils";
import { AnimatedButton } from "./AnimatedButton";
import { TextAnimation } from "./TextAnimation";
import { ArrowRight } from "lucide-react";

export interface TechLogoItem {
  name: string;
  category: string;
  color: string;
  svg: React.ReactNode;
}

export interface MagneticSpotlightMarqueeProps {
  className?: string;
  onLaunch?: () => void;
  onExplore?: () => void;
}

// Authentic SVGs for major programming languages and developer technologies
const TECH_LOGOS: TechLogoItem[] = [
  {
    name: "TypeScript",
    category: "LANGUAGE",
    color: "#3178c6",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#3178C6" />
        <path d="M72 88.5C74.8 90.5 78.4 92 82.5 92C90.2 92 95 87.8 95 81.5C95 76 91.8 73 85 69.8L81.2 68C72 63.8 67 59.2 67 50.8C67 41.5 74.5 35 85.5 35C90.5 35 94.8 36.5 97.8 38.5L94.5 47C92 45.5 88.8 44.2 85.2 44.2C79.8 44.2 76 47.2 76 51.8C76 56.5 79.2 59.2 86.2 62.5L90 64.2C100 68.8 105 73.5 105 82.5C105 92.8 96.8 101 82.8 101C76.8 101 71.2 99.2 67.5 96.8L72 88.5ZM30 45H43V100H53V45H66V36H30V45Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    name: "Python",
    category: "BACKEND",
    color: "#3776ab",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <path d="M63.6 10C36.8 10 38.4 21.6 38.4 21.6L38.5 33.6H64.2V37.2H28.2C14.7 37.2 6.8 48.9 6.8 64C6.8 79.1 14.8 89.2 28.2 89.2H36.3V78.2C36.3 62.5 49.3 62.5 49.3 62.5H74.9C85.5 62.5 93.3 53.6 93.3 43.1V21.6C93.3 21.6 94.6 10 63.6 10ZM52.4 18.2C55.2 18.2 57.5 20.5 57.5 23.3C57.5 26.1 55.2 28.4 52.4 28.4C49.6 28.4 47.3 26.1 47.3 23.3C47.3 20.5 49.6 18.2 52.4 18.2Z" fill="#387EB8" />
        <path d="M64.4 118C91.2 118 89.6 106.4 89.6 106.4L89.5 94.4H63.8V90.8H99.8C113.3 90.8 121.2 79.1 121.2 64C121.2 48.9 113.2 38.8 99.8 38.8H91.7V49.8C91.7 65.5 78.7 65.5 78.7 65.5H53.1C42.5 65.5 34.7 74.4 34.7 84.9V106.4C34.7 106.4 33.4 118 64.4 118ZM75.6 109.8C72.8 109.8 70.5 107.5 70.5 104.7C70.5 101.9 72.8 99.6 75.6 99.6C78.4 99.6 80.7 101.9 80.7 104.7C80.7 107.5 78.4 109.8 75.6 109.8Z" fill="#FFE052" />
      </svg>
    ),
  },
  {
    name: "Rust",
    category: "SYSTEMS",
    color: "#dea584",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <circle cx="64" cy="64" r="56" fill="#000000" stroke="#dea584" strokeWidth="6" />
        <text x="64" y="82" fontSize="56" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="#dea584">R</text>
      </svg>
    ),
  },
  {
    name: "Go",
    category: "CONCURRENCY",
    color: "#00add8",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#00ADD8" />
        <text x="64" y="82" fontSize="54" fontWeight="800" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">GO</text>
      </svg>
    ),
  },
  {
    name: "C++",
    category: "PERFORMANCE",
    color: "#00599c",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <polygon points="64 8, 116 36, 116 92, 64 120, 12 92, 12 36" fill="#00599C" />
        <text x="64" y="78" fontSize="42" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">C++</text>
      </svg>
    ),
  },
  {
    name: "React",
    category: "UI ENGINE",
    color: "#61dafb",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <ellipse cx="64" cy="64" rx="16" ry="50" transform="rotate(30 64 64)" stroke="#61DAFB" strokeWidth="6" />
        <ellipse cx="64" cy="64" rx="16" ry="50" transform="rotate(90 64 64)" stroke="#61DAFB" strokeWidth="6" />
        <ellipse cx="64" cy="64" rx="16" ry="50" transform="rotate(150 64 64)" stroke="#61DAFB" strokeWidth="6" />
        <circle cx="64" cy="64" r="8" fill="#61DAFB" />
      </svg>
    ),
  },
  {
    name: "Docker",
    category: "CONTAINER",
    color: "#2496ed",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#2496ED" />
        <path d="M26 68h12v12H26zm14 0h12v12H40zm14 0h12v12H54zm14 0h12v12H68zm14 0h12v12H82zm-28-14h12v12H54zm14 0h12v12H68zm14 0h12v12H82zm-14-14h12v12H68z" fill="#FFFFFF" />
        <path d="M110 66c-3 0-8 2-11 5-6-3-15-4-23-2-2 1-3 2-4 3H16c-2 8 0 20 6 26 10 11 26 14 44 14 28 0 49-14 56-38 3-1 6-4 8-8h-20z" fill="#FFFFFF" opacity="0.9" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    category: "RUNTIME",
    color: "#5fa04e",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <polygon points="64 8, 116 36, 116 92, 64 120, 12 92, 12 36" fill="#5FA04E" />
        <path d="M64 42v44M44 54l20-12 20 12v24l-20 12-20-12z" stroke="#FFFFFF" strokeWidth="6" fill="none" />
      </svg>
    ),
  },
  {
    name: "WebAssembly",
    category: "SANDBOX",
    color: "#654ff0",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#654FF0" />
        <text x="64" y="80" fontSize="42" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">WASM</text>
      </svg>
    ),
  },
  {
    name: "Git",
    category: "SNAPSHOTS",
    color: "#f05032",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect x="64" y="4" width="76" height="76" rx="12" transform="rotate(45 64 4)" fill="#F05032" />
        <circle cx="64" cy="46" r="10" fill="#FFFFFF" />
        <circle cx="44" cy="66" r="10" fill="#FFFFFF" />
        <circle cx="64" cy="86" r="10" fill="#FFFFFF" />
        <line x1="64" y1="46" x2="64" y2="86" stroke="#FFFFFF" strokeWidth="8" />
        <line x1="64" y1="66" x2="44" y2="66" stroke="#FFFFFF" strokeWidth="8" />
      </svg>
    ),
  },
  {
    name: "Linux",
    category: "PTY SHELL",
    color: "#fcc624",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#1E293B" />
        <path d="M32 42L60 64L32 86" stroke="#FCC624" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="68" y1="86" x2="96" y2="86" stroke="#FCC624" strokeWidth="10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "PostgreSQL",
    category: "TRI-ENGINE",
    color: "#336791",
    svg: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none">
        <rect width="128" height="128" rx="16" fill="#336791" />
        <text x="64" y="80" fontSize="44" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" fill="#FFFFFF">SQL</text>
      </svg>
    ),
  },
];

export function MagneticSpotlightMarquee({
  className,
  onLaunch,
  onExplore,
}: MagneticSpotlightMarqueeProps) {
  const marqueeTrackRef = useRef<HTMLDivElement>(null);
  const [clonedLogos, setClonedLogos] = useState<TechLogoItem[]>(TECH_LOGOS);

  useEffect(() => {
    if (!marqueeTrackRef.current) return;
    const marqueeTrack = marqueeTrackRef.current;

    const itemWidth = 72;
    const oneSetWidth = TECH_LOGOS.length * itemWidth;
    const setsNeeded = Math.ceil(window.innerWidth / oneSetWidth) + 2;

    const newLogos: TechLogoItem[] = [];
    for (let i = 0; i < setsNeeded; i++) {
      newLogos.push(...TECH_LOGOS);
    }
    setClonedLogos(newLogos);

    const ctx = gsap.context(() => {
      gsap.to(marqueeTrack, {
        x: `-${oneSetWidth}px`,
        duration: oneSetWidth / 65,
        ease: "none",
        repeat: -1,
        modifiers: {
          x: (x) => `${gsap.utils.wrap(-oneSetWidth, 0, parseFloat(x))}px`,
        },
      });
    }, marqueeTrack);

    return () => ctx.revert();
  }, []);

  return (
    <section className={cn("landing-hero", className)}>
      {/* Background ambient lighting */}
      <div className="landing-hero__ambient-glow" />
      <div className="landing-hero__grid" />

      {/* Main Content Layout - Center-clustered with tight gaps & zero cut-off */}
      <div className="landing-hero__content-container">
        {/* Top: Animated Kicker */}
        <div className="landing-hero__kicker">
          <TextAnimation delay={0.05} divideBy="character">
            ZERO-TRUST COLLABORATIVE IDE // AIR-GAPPED &amp; LAN
          </TextAnimation>
        </div>

        {/* Hero Headline with Creative Multiplayer Collaborative IDE Visual */}
        <div className="hero-brand-stage">
          {/* Peer 1: alex.ts floating cursor */}
          <div className="hero-live-cursor hero-live-cursor--alex" aria-hidden="true">
            <svg className="hero-cursor-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1L6 14L8.5 8.5L14 6L1 1Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
            </svg>
            <span className="hero-cursor-badge hero-cursor-badge--alex">
              alex.ts <span className="hero-cursor-dot" />
            </span>
          </div>

          {/* Peer 2: sarah.rs floating cursor */}
          <div className="hero-live-cursor hero-live-cursor--sarah" aria-hidden="true">
            <svg className="hero-cursor-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1L6 14L8.5 8.5L14 6L1 1Z" fill="#10b981" stroke="#059669" strokeWidth="1.2" />
            </svg>
            <span className="hero-cursor-badge hero-cursor-badge--sarah">
              sarah.rs: L42
            </span>
          </div>

          {/* Peer 3: AI Assistant floating cursor */}
          <div className="hero-live-cursor hero-live-cursor--ai" aria-hidden="true">
            <svg className="hero-cursor-svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M1 1L6 14L8.5 8.5L14 6L1 1Z" fill="#34d399" stroke="#059669" strokeWidth="1.2" />
            </svg>
            <span className="hero-cursor-badge hero-cursor-badge--ai">
              devbot (AI)
            </span>
          </div>

          {/* Hero Brand Stage with Animated Official Nulltor Logo & Floating Peer Cursors */}
          <div className="hero-logo-stage" aria-label="Nulltor Studio">
            <div className="hero-logo-halo" />
            <div className="hero-logo-shimmer" />
            <img
              src="/logo-dark.png"
              alt="Nulltor"
              className="hero-logo-img logo-dark-img"
            />
            <img
              src="/logo-light.png"
              alt="Nulltor"
              className="hero-logo-img logo-light-img"
            />
          </div>
        </div>

        {/* Subtitle with pulsing neon dots: STUDIO v5.5 */}
        <div className="landing-hero__subtitle">
          <span className="landing-hero__subtitle-dot" />
          <span>STUDIO v5.5</span>
          <span className="landing-hero__subtitle-dot" />
        </div>

        {/* Real Programming Languages & Technologies Moving Logos (Clean & Minimalist, No Text, No Pills) */}
        <div className="tech-marquee-wrapper">
          <div ref={marqueeTrackRef} className="tech-marquee-track">
            {clonedLogos.map((tech, idx) => (
              <div key={idx} className="tech-logo-minimal" title={tech.name}>
                {tech.svg}
              </div>
            ))}
          </div>
        </div>

        {/* Lead Narrative Description */}
        <p className="landing-hero__desc">
          The next-generation cryptographic developer platform fusing the real-time collaborative editing of{" "}
          <strong style={{ color: "var(--text-primary, #ffffff)" }}>VS Code</strong> with the branch governance of{" "}
          <strong style={{ color: "var(--text-primary, #ffffff)" }}>GitHub</strong>, protected by client-side{" "}
          <span style={{ color: "#10b981", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>AES-256-GCM</span> zero-trust encryption and an autonomous AI engineering agent.
        </p>

        {/* Action Buttons */}
        <div className="landing-hero__actions">
          <AnimatedButton
            size="md"
            variant="primary"
            onClick={onLaunch}
          >
            <span>Launch Studio IDE</span>
            <ArrowRight style={{ width: 15, height: 15, marginLeft: 4 }} />
          </AnimatedButton>

          <AnimatedButton
            size="md"
            variant="secondary"
            onClick={onExplore}
          >
            <span>Explore Architecture</span>
          </AnimatedButton>
        </div>

        {/* Stats Row Fitted Completely within the 100vh Fold */}
        <div className="landing-hero__stats">
          <div>
            <div className="landing-hero__stat-val">0ms</div>
            <div className="landing-hero__stat-lbl">Cloud Leakage</div>
          </div>
          <div>
            <div className="landing-hero__stat-val landing-hero__stat-val--emerald">256-Bit</div>
            <div className="landing-hero__stat-lbl">AES-GCM Cipher</div>
          </div>
          <div>
            <div className="landing-hero__stat-val landing-hero__stat-val--blue">&lt; 1ms</div>
            <div className="landing-hero__stat-lbl">P2P CRDT Latency</div>
          </div>
          <div>
            <div className="landing-hero__stat-val landing-hero__stat-val--purple">100%</div>
            <div className="landing-hero__stat-lbl">Data Sovereignty</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MagneticSpotlightMarquee;
