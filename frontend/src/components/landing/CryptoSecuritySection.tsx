import React from "react";
import { ShieldCheck, Box, EyeOff, KeyRound, Radio, Database } from "lucide-react";
import { AsciiGlitchRipple } from "./AsciiGlitchRipple";
import { AsciiMatrixSectionBackground } from "./AsciiMatrixSectionBackground";
import { TiltCard, TiltCardItem } from "./TiltCard";

function Phase1Visual() {
  return (
    <div className="crypto-card__visual">
      <svg viewBox="0 0 280 84" fill="none" className="crypto-schematic-svg">
        {/* Terminal/Code block */}
        <rect x="12" y="14" width="70" height="56" rx="6" className="schematic-box" />
        <line x1="22" y1="26" x2="45" y2="26" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="36" x2="68" y2="36" className="schematic-code-line" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="46" x2="55" y2="46" className="schematic-code-line" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="56" x2="40" y2="56" className="schematic-code-line" strokeWidth="2" strokeLinecap="round" />

        {/* Wire 1 */}
        <path d="M82 42H118" className="schematic-wire" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="100" cy="42" r="3" fill="#38bdf8" />

        {/* Center: AES-GCM Cipher Lock Shield */}
        <rect x="118" y="16" width="44" height="52" rx="8" className="schematic-shield" />
        <path d="M140 28V33M133 33H147V45H133V33Z" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="140" y="58" textAnchor="middle" className="schematic-tag-text">AES-GCM</text>

        {/* Wire 2 */}
        <path d="M162 42H198" className="schematic-wire" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="180" cy="42" r="3" fill="#34d399" />

        {/* Encrypted ciphertext token */}
        <rect x="198" y="14" width="70" height="56" rx="6" className="schematic-box" />
        <text x="233" y="32" textAnchor="middle" className="schematic-cipher-label">CIPHERTEXT</text>
        <text x="233" y="46" textAnchor="middle" className="schematic-cipher-hex">0x8F4E2A</text>
        <text x="233" y="59" textAnchor="middle" className="schematic-cipher-hex">SHA-256 OK</text>
      </svg>
    </div>
  );
}

function Phase2Visual() {
  return (
    <div className="crypto-card__visual">
      <svg viewBox="0 0 280 84" fill="none" className="crypto-schematic-svg">
        {/* Client envelope */}
        <rect x="12" y="16" width="60" height="52" rx="6" className="schematic-box" />
        <rect x="22" y="26" width="40" height="22" rx="3" className="schematic-envelope" />
        <path d="M22 28L42 40L62 28" stroke="#34d399" strokeWidth="1.5" />
        <text x="42" y="60" textAnchor="middle" className="schematic-tag-text">CLIENT</text>

        {/* Wire into Blind Gateway */}
        <path d="M72 42H110" className="schematic-wire" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* Blind Gateway Node */}
        <circle cx="140" cy="42" r="24" className="schematic-gateway" />
        <path d="M130 42C130 38 135 34 140 34C145 34 150 38 150 42C150 46 145 50 140 50C135 50 130 46 130 42Z" stroke="#38bdf8" strokeWidth="1.6" />
        <line x1="128" y1="48" x2="152" y2="36" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round" />
        <text x="140" y="74" textAnchor="middle" className="schematic-tag-text">BLIND GATEWAY</text>

        {/* Wire into CAS Storage */}
        <path d="M164 42H208" className="schematic-wire" strokeWidth="1.5" strokeDasharray="3 3" />

        {/* CAS Storage Disk */}
        <rect x="208" y="16" width="60" height="52" rx="6" className="schematic-box" />
        <ellipse cx="238" cy="30" rx="18" ry="6" stroke="#38bdf8" strokeWidth="1.5" />
        <path d="M220 30V44C220 47.3 228 50 238 50C248 50 256 47.3 256 44V30" stroke="#38bdf8" strokeWidth="1.5" />
        <text x="238" y="60" textAnchor="middle" className="schematic-tag-text">CAS VAULT</text>
      </svg>
    </div>
  );
}

function Phase3Visual() {
  return (
    <div className="crypto-card__visual">
      <svg viewBox="0 0 280 84" fill="none" className="crypto-schematic-svg">
        {/* Peer A Node */}
        <rect x="12" y="16" width="58" height="52" rx="6" className="schematic-box" />
        <circle cx="41" cy="34" r="8" stroke="#38bdf8" strokeWidth="1.8" />
        <text x="41" y="58" textAnchor="middle" className="schematic-tag-text">PEER A</text>

        {/* Bidirectional sync mesh wires */}
        <path d="M70 35H110" className="schematic-wire" strokeWidth="1.5" />
        <polygon points="106,32 112,35 106,38" fill="#38bdf8" />
        <path d="M110 49H70" className="schematic-wire" strokeWidth="1.5" />
        <polygon points="74,46 68,49 74,52" fill="#34d399" />

        {/* Central Convergence Engine */}
        <rect x="112" y="18" width="56" height="48" rx="8" className="schematic-shield" />
        <text x="140" y="38" textAnchor="middle" className="schematic-crdt-title">CRDT Yjs</text>
        <text x="140" y="52" textAnchor="middle" className="schematic-crdt-sub">&lt; 1ms SYNC</text>

        {/* Bidirectional sync to Peer B */}
        <path d="M168 35H208" className="schematic-wire" strokeWidth="1.5" />
        <polygon points="204,32 210,35 204,38" fill="#38bdf8" />
        <path d="M208 49H168" className="schematic-wire" strokeWidth="1.5" />
        <polygon points="172,46 166,49 172,52" fill="#34d399" />

        {/* Peer B Node */}
        <rect x="210" y="16" width="58" height="52" rx="6" className="schematic-box" />
        <circle cx="239" cy="34" r="8" stroke="#34d399" strokeWidth="1.8" />
        <text x="239" y="58" textAnchor="middle" className="schematic-tag-text">PEER B</text>
      </svg>
    </div>
  );
}

export function CryptoSecuritySection() {
  return (
    <section id="security" className="landing-section" style={{ position: "relative", overflow: "hidden" }}>
      {/* Full-Section Real-Time Animated ASCII Matrix Rain & Ripple Canvas */}
      <AsciiMatrixSectionBackground />

      <div className="landing-container" style={{ position: "relative", zIndex: 10 }}>
        {/* Clean, Minimal Section Header with ASCII Glitch Ripple across Kicker, Heading, and Paragraph */}
        <div className="landing-section__header">
          <div className="landing-section__kicker">
            <AsciiGlitchRipple dur={1000} spread={1.2}>
              MILITARY-GRADE AIR-GAPPED CRYPTOGRAPHY
            </AsciiGlitchRipple>
          </div>

          <h2 className="landing-section__title" style={{ cursor: "pointer" }}>
            <AsciiGlitchRipple dur={1300} spread={1.4}>
              Zero-Knowledge Client Architecture
            </AsciiGlitchRipple>
          </h2>

          <p className="landing-section__desc" style={{ cursor: "pointer", maxWidth: "780px", margin: "0 auto" }}>
            <AsciiGlitchRipple as="span" dur={1700} spread={2.2}>
              Unlike cloud-hosted IDEs where servers inspect your proprietary code in plaintext, Nulltor encrypts all source files, branch manifests, and real-time CRDT updates client-side before transmission. The central gateway remains completely blind.
            </AsciiGlitchRipple>
          </p>
        </div>

        {/* Minimal Interactive Cipher Tags with Smooth Hover Ripple */}
        <div className="crypto-pills">
          {[
            { label: "AES-256-GCM Authenticated Cipher", icon: <ShieldCheck size={14} color="#38bdf8" /> },
            { label: "SHA-256 Content-Addressed Storage", icon: <Box size={14} color="#f59e0b" /> },
            { label: "Zero-Knowledge Blind Gateway", icon: <EyeOff size={14} color="#a855f7" /> },
            { label: "Client-Side Argon2id Key Derivation", icon: <KeyRound size={14} color="#eab308" /> },
            { label: "WebRTC DTLS/SRTP P2P Mesh", icon: <Radio size={14} color="#38bdf8" /> },
            { label: "Tri-Engine SQLite WAL + PostgreSQL", icon: <Database size={14} color="#10b981" /> },
          ].map((item, idx) => (
            <div key={idx} className="crypto-pill">
              <span className="crypto-pill-icon">{item.icon}</span>
              <AsciiGlitchRipple
                dur={800}
                spread={1.0}
                autoPlay={false}
                className="crypto-pill-text"
              >
                {item.label}
              </AsciiGlitchRipple>
            </div>
          ))}
        </div>

        {/* 3-Column Zero-Knowledge Phase Cards with 3D Tilt Parallax (components.md line 864) */}
        <div className="crypto-grid">
          {/* Phase 01 Card */}
          <TiltCard className="crypto-tilt-card">
            <TiltCardItem depth={35} className="crypto-card__step crypto-card__step--01">
              PHASE 01 // LOCAL WORKSTATION
            </TiltCardItem>

            <TiltCardItem depth={55}>
              <h3 className="crypto-card__title">
                Local AES-256-GCM Vault
              </h3>
            </TiltCardItem>

            <TiltCardItem depth={30}>
              <p className="crypto-card__desc">
                Source files and keystrokes are transformed into authenticated ciphertext chunks directly in browser memory before network transmission. Cryptographic keys never leave your workstation.
              </p>
            </TiltCardItem>

            <TiltCardItem depth={70}>
              <Phase1Visual />
            </TiltCardItem>

            <TiltCardItem depth={40} className="crypto-card__tag-row">
              <span className="crypto-card__tag">Argon2id KDF</span>
              <span className="crypto-card__tag">Ephemeral Nonces</span>
              <span className="crypto-card__tag">Zero Leakage</span>
            </TiltCardItem>
          </TiltCard>

          {/* Phase 02 Card */}
          <TiltCard className="crypto-tilt-card">
            <TiltCardItem depth={35} className="crypto-card__step crypto-card__step--02">
              PHASE 02 // ZERO-KNOWLEDGE RELAY
            </TiltCardItem>

            <TiltCardItem depth={55}>
              <h3 className="crypto-card__title">
                Cryptographic Blind Sync
              </h3>
            </TiltCardItem>

            <TiltCardItem depth={30}>
              <p className="crypto-card__desc">
                The Node.js gateway and WebSocket relay operate strictly on opaque byte envelopes. The backend synchronizes snapshots and CRDT vectors without ever being able to read or inspect your code.
              </p>
            </TiltCardItem>

            <TiltCardItem depth={70}>
              <Phase2Visual />
            </TiltCardItem>

            <TiltCardItem depth={40} className="crypto-card__tag-row">
              <span className="crypto-card__tag">Opaque Envelopes</span>
              <span className="crypto-card__tag">CAS SHA-256</span>
              <span className="crypto-card__tag">Zero Telemetry</span>
            </TiltCardItem>
          </TiltCard>

          {/* Phase 03 Card */}
          <TiltCard className="crypto-tilt-card">
            <TiltCardItem depth={35} className="crypto-card__step crypto-card__step--03">
              PHASE 03 // PEER CONVERGENCE
            </TiltCardItem>

            <TiltCardItem depth={55}>
              <h3 className="crypto-card__title">
                Verified Peer Convergence
              </h3>
            </TiltCardItem>

            <TiltCardItem depth={30}>
              <p className="crypto-card__desc">
                Authorized collaborators holding the project passphrase verify authentication tags and decrypt CRDT states in real time. Remote cursors and AST changes merge with deterministic precision.
              </p>
            </TiltCardItem>

            <TiltCardItem depth={70}>
              <Phase3Visual />
            </TiltCardItem>

            <TiltCardItem depth={40} className="crypto-card__tag-row">
              <span className="crypto-card__tag">Yjs CRDT</span>
              <span className="crypto-card__tag">DTLS SRTP Mesh</span>
              <span className="crypto-card__tag">P2P Audio/Video</span>
            </TiltCardItem>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}

export default CryptoSecuritySection;
