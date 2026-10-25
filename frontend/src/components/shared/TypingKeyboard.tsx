import React, { useEffect, useRef, useState } from "react";

// ─── Utility ────────────────────────────────────────────────────────────────

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface TypingKeyboardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Text to auto-type */
  autoTypeText?: string;
  /** [min, max] ms delay between keystrokes */
  typingSpeed?: [number, number];
  /** Overall scale factor */
  scale?: number;
  /** Accent color (modifier keys + screen glow) */
  accentColor?: string;
  /** Secondary accent (enter key) */
  secondaryAccent?: string;
}

// ─── Key sub-component ──────────────────────────────────────────────────────

function Key({ size = "", accent = "" }: { size?: string; accent?: string }) {
  const s = size ? `--${size}` : "";
  const a1 = accent === "b" ? " tk-face--b" : accent === "o" ? " tk-face--o" : "";

  return (
    <div className={`tk-key tk-flex${size ? ` tk-key${s}` : ""}`}>
      <div className={`tk-key__front tk-face${size ? ` tk-key__front${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b3" : a1 === " tk-face--o" ? " tk-face--o3" : ""}`} />
      <div className={`tk-key__back tk-face${size ? ` tk-key__back${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b1" : a1 === " tk-face--o" ? " tk-face--o1" : ""}`} />
      <div className={`tk-key__right tk-face${size ? ` tk-key__right${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b1" : a1 === " tk-face--o" ? " tk-face--o1" : ""}`} />
      <div className={`tk-key__left tk-face${size ? ` tk-key__left${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b2" : a1 === " tk-face--o" ? " tk-face--o2" : ""}`} />
      <div className={`tk-key__top tk-face${size ? ` tk-key__top${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b1" : a1 === " tk-face--o" ? " tk-face--o1" : ""}`} />
      <div className={`tk-key__bottom tk-face${size ? ` tk-key__bottom${s}` : ""}${a1 === " tk-face--b" ? " tk-face--b2" : a1 === " tk-face--o" ? " tk-face--o2" : ""}`} />
    </div>
  );
}

// ─── Keycode → DOM index map ────────────────────────────────────────────────

const KC_MAP: Record<number, number> = {
  // Numbers
  49:1, 50:2, 51:3, 52:4, 53:5, 54:6, 55:7, 56:8, 57:9, 48:10,
  // Row 1 Letters
  81:15, 87:16, 69:17, 82:18, 84:19, 89:20, 85:21, 73:22, 79:23, 80:24,
  // Row 2 Letters
  65:29, 83:30, 68:31, 70:32, 71:33, 72:34, 74:35, 75:36, 76:37,
  // Row 3 Letters
  90:41, 88:42, 67:43, 86:44, 66:45, 78:46, 77:47,
  // Punctuation & Space
  32:56, 13:39, 8:27, 46:49, 44:48, 47:50, 59:38, 45:11,
};

// ─── Main Component ─────────────────────────────────────────────────────────

export function TypingKeyboard({
  className,
  autoTypeText = "launching encrypted IDE workspace... ready.",
  typingSpeed = [14, 26],
  scale = 0.82,
  accentColor = "#0f52ba",
  secondaryAccent = "#10b981",
  ...props
}: TypingKeyboardProps) {
  const mainRef = useRef<HTMLDivElement>(null);
  const kbRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const kb = kbRef.current;
    const textEl = textRef.current;
    if (!kb || !textEl) return;

    const allKeys = kb.querySelectorAll<HTMLDivElement>(".tk-key");
    let alive = true;
    let idx = 0;
    let timer: ReturnType<typeof setTimeout>;

    const pressKey = (kc: number) => {
      const domIdx = KC_MAP[kc];
      if (domIdx !== undefined) {
        const el = allKeys[domIdx];
        if (el) {
          el.classList.add("tk-key--down");
          setTimeout(() => el.classList.remove("tk-key--down"), 65);
        }
      }
    };

    const typeNext = () => {
      if (!alive || !textEl) return;
      const char = autoTypeText[idx];
      if (!char) return;

      const kc = char === " " ? 32 : char.toUpperCase().charCodeAt(0);
      pressKey(kc);
      textEl.textContent += char;

      idx++;
      const pct = Math.min(100, Math.round(15 + (idx / autoTypeText.length) * 85));
      setProgress(pct);

      if (idx >= autoTypeText.length) {
        // Kept finished for smooth display until unmount
        setProgress(100);
      } else {
        const delay = typingSpeed[0] + Math.random() * (typingSpeed[1] - typingSpeed[0]);
        timer = setTimeout(typeNext, delay);
      }
    };

    // Instant start: 25ms delay
    timer = setTimeout(typeNext, 25);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [autoTypeText, typingSpeed]);

  return (
    <div className={cn("tk-container", className)} {...props}>
      <style>{`
        .tk-container * { transform-style: preserve-3d; box-sizing: border-box; }
        .tk-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          user-select: none;
        }
        .tk-main {
          width: 720px;
          height: 460px;
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          transform: scale(${scale});
          transform-origin: center center;
          transition: transform 0.3s ease;
        }
        @media (max-width: 820px) {
          .tk-main {
            transform: scale(${scale * 0.72});
          }
        }
        @media (max-width: 520px) {
          .tk-main {
            transform: scale(${scale * 0.52});
          }
        }
        .tk-flex { display: flex; justify-content: center; align-items: center; }
        .tk-face { position: absolute; }

        /* Keyboard body - centered with balanced isometric projection */
        .tk-keyboard {
          width: 500px;
          height: 160px;
          transform: perspective(1200px) rotateX(52deg) rotateZ(-24deg) translateY(45px);
          position: relative;
        }
        .tk-keyboard__front { width: 500px; height: 25px; transform: rotateX(-90deg) translateZ(80px); background-color: #232530; }
        .tk-keyboard__back  { width: 500px; height: 25px; transform: rotateX(90deg) translateZ(80px); background-color: #171821; }
        .tk-keyboard__top   {
          display: flex; flex-direction: column; justify-content: space-around;
          width: 500px; height: 160px;
          transform: rotateY(0deg) translateZ(12.5px);
          background-image: linear-gradient(to bottom, color-mix(in srgb, ${accentColor} 40%, #15161d), #121319);
          border-radius: 8px;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
        }
        .tk-keyboard__bottom {
          width: 500px; height: 160px;
          transform: rotateY(180deg) translateZ(12.5px);
          background-color: #101116;
        }
        .tk-keyboard__right { width: 25px; height: 160px; transform: rotateY(90deg) translateZ(250px); background-color: #1c1d26; }
        .tk-keyboard__left  { width: 25px; height: 160px; transform: rotateY(90deg) translateZ(-250px); background-color: #15161f; }

        /* CRT Screen Display - absolutely positioned and horizontally centered above keyboard */
        .tk-screen {
          position: absolute;
          width: 340px;
          height: 225px;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) translateZ(85px) translateY(-175px) rotateX(270deg);
          background: #080b12;
          border: 1.5px solid rgba(59, 130, 246, 0.45);
          border-radius: 12px;
          padding: 14px 16px;
          font-family: var(--font-mono, monospace);
          box-shadow:
            0 0 15px color-mix(in srgb, ${accentColor} 65%, transparent),
            0 0 35px color-mix(in srgb, ${accentColor} 30%, transparent),
            inset 0 0 30px rgba(0, 0, 0, 0.85);
          display: flex !important;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch !important;
          overflow: hidden;
          backface-visibility: visible;
        }
        
        .tk-screen-scanline {
          position: absolute;
          inset: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%);
          background-size: 100% 4px;
          pointer-events: none;
          opacity: 0.5;
        }

        .tk-screen-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
          padding-bottom: 6px;
          font-size: 10px;
          letter-spacing: 1px;
          color: #60a5fa;
          font-weight: 700;
        }
        .tk-screen-live {
          display: flex;
          align-items: center;
          gap: 5px;
          color: #10b981;
        }
        .tk-screen-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
          animation: tk-dot-pulse 1.2s infinite ease-in-out;
        }
        @keyframes tk-dot-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }

        .tk-screen-body {
          flex: 1;
          padding: 8px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 11.5px;
          line-height: 1.45;
          word-break: break-word;
          overflow: hidden;
        }
        .tk-screen-meta {
          color: #94a3b8;
          font-size: 10.5px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tk-screen-meta-badge {
          color: #10b981;
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 3px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
        }
        .tk-screen-typing {
          color: #38bdf8;
          font-size: 12px;
          font-weight: 600;
          margin-top: 2px;
        }
        .tk-screen-cursor {
          display: inline-block;
          margin-left: 2px;
          color: #38bdf8;
          animation: tk-cursor-blink 0.6s infinite steps(2, start);
        }
        @keyframes tk-cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Progress Bar */
        .tk-screen-prog {
          margin-top: 4px;
          width: 100%;
        }
        .tk-screen-prog-track {
          width: 100%;
          height: 5px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .tk-screen-prog-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #10b981);
          box-shadow: 0 0 8px #3b82f6;
          transition: width 0.08s ease;
        }

        .tk-screen-footer {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid rgba(59, 130, 246, 0.15);
          padding-top: 6px;
          font-size: 9px;
          color: #64748b;
          letter-spacing: 0.5px;
        }

        /* Keys container */
        .tk-keys {
          display: flex; justify-content: space-between;
          width: 100%;
          transform: translateZ(4px);
          padding: 0 4px;
        }

        /* Individual key — depth is 8px */
        .tk-key { width: 30px; height: 27px; transition: .04s ease; }
        .tk-key--w2 { width: 60px; }
        .tk-key--w3 { width: 90px; }
        .tk-key--w6 { width: 195px; }

        .tk-key__front { width: 30px; height: 8px; transform: rotateX(-90deg) translateZ(13.5px); background-color: #272834; }
        .tk-key__front--w2 { width: 60px; }
        .tk-key__front--w3 { width: 90px; }
        .tk-key__front--w6 { width: 195px; }

        .tk-key__back { width: 30px; height: 8px; transform: rotateX(90deg) translateZ(13.5px); background-color: #383a4c; }
        .tk-key__back--w2 { width: 60px; }
        .tk-key__back--w3 { width: 90px; }
        .tk-key__back--w6 { width: 195px; }

        .tk-key__top {
          width: 30px; height: 27px;
          transform: rotateY(0deg) translateZ(4px);
          background-color: #1a1b24;
          background-image: linear-gradient(to bottom, #2a2d3c, #171822);
          box-shadow: inset 0 0 0 0.5px rgba(255,255,255,0.1), 0 -1px 2px rgba(0,0,0,0.35);
          border-radius: 2px;
          transition: background 0.05s ease, box-shadow 0.05s ease;
        }
        .tk-key__top--w2 { width: 60px; }
        .tk-key__top--w3 { width: 90px; }
        .tk-key__top--w6 { width: 195px; }

        .tk-key__bottom { width: 30px; height: 27px; transform: rotateY(180deg) translateZ(4px); background-color: #12131b; }
        .tk-key__bottom--w2 { width: 60px; }
        .tk-key__bottom--w3 { width: 90px; }
        .tk-key__bottom--w6 { width: 195px; }

        .tk-key__right { width: 8px; height: 27px; transform: rotateY(90deg) translateZ(15px); background-color: #1f202b; }
        .tk-key__right--w2 { transform: rotateY(90deg) translateZ(30px); }
        .tk-key__right--w3 { transform: rotateY(90deg) translateZ(45px); }
        .tk-key__right--w6 { transform: rotateY(90deg) translateZ(97.5px); }

        .tk-key__left {
          width: 8px; height: 27px;
          transform: rotateY(90deg) translateZ(-15px);
          background-image: linear-gradient(to bottom, #262736, #1a1b26);
        }
        .tk-key__left--w2 { transform: rotateY(90deg) translateZ(-30px); }
        .tk-key__left--w3 { transform: rotateY(90deg) translateZ(-45px); }
        .tk-key__left--w6 { transform: rotateY(90deg) translateZ(-97.5px); }

        /* Accent colors */
        .tk-face--b1 { background: ${accentColor}; }
        .tk-face--b2 { background-image: linear-gradient(to bottom, color-mix(in srgb, ${accentColor} 80%, black), ${accentColor}); }
        .tk-face--b3 { background-color: color-mix(in srgb, ${accentColor} 60%, black); }

        .tk-face--o1 { background: ${secondaryAccent}; }
        .tk-face--o2 { background-image: linear-gradient(to bottom, color-mix(in srgb, ${secondaryAccent} 80%, black), ${secondaryAccent}); }
        .tk-face--o3 { background-color: color-mix(in srgb, ${secondaryAccent} 60%, black); }

        /* Pressed state with cyber-glow */
        .tk-key--down {
          display: flex; justify-content: center; align-items: center;
          transform: translateZ(-5px);
          transition: .03s ease;
        }
        .tk-key--down > .tk-key__top {
          background: color-mix(in srgb, ${accentColor} 75%, white) !important;
          box-shadow: 0 0 14px color-mix(in srgb, ${accentColor} 95%, transparent) !important;
        }
      `}</style>

      <div className="tk-main tk-flex" ref={mainRef}>
        <div className="tk-keyboard tk-flex" ref={kbRef}>
          {/* CRT Screen Display */}
          <div className="tk-screen">
            <div className="tk-screen-scanline" />
            <div className="tk-screen-header">
              <span>NULLTOR_KERNEL // BOOT_SEQ</span>
              <div className="tk-screen-live">
                <span className="tk-screen-live-dot" />
                <span>ONLINE</span>
              </div>
            </div>

            <div className="tk-screen-body">
              <div className="tk-screen-meta">
                <span className="tk-screen-meta-badge">OK</span>
                <span>CPU: AES-256 CAS INITIALIZED</span>
              </div>
              <div className="tk-screen-meta">
                <span className="tk-screen-meta-badge">OK</span>
                <span>NET: CRDT SUBROOMS ACTIVE</span>
              </div>
              <div className="tk-screen-typing">
                <span style={{ color: '#60a5fa' }}>&gt; BOOT: </span>
                <span ref={textRef} />
                <span className="tk-screen-cursor">▋</span>
              </div>
              <div className="tk-screen-prog">
                <div className="tk-screen-prog-track">
                  <div className="tk-screen-prog-fill" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="tk-screen-footer">
              <span>MEM: 128MB OK</span>
              <span>NODE: LOCALHOST:3330</span>
              <span style={{ color: progress >= 100 ? '#10b981' : '#60a5fa' }}>{progress}%</span>
            </div>
          </div>

          <div className="tk-keyboard__front tk-face" />
          <div className="tk-keyboard__back tk-face" />
          <div className="tk-keyboard__right tk-face" />
          <div className="tk-keyboard__left tk-face" />
          <div className="tk-keyboard__top tk-face">

            {/* Row 1 */}
            <div className="tk-keys">
              <Key accent="b" />
              {Array.from({ length: 12 }).map((_, i) => <Key key={`r1-${i}`} />)}
              <Key size="w2" accent="b" />
            </div>

            {/* Row 2 */}
            <div className="tk-keys">
              <Key size="w2" accent="b" />
              {Array.from({ length: 12 }).map((_, i) => <Key key={`r2-${i}`} />)}
              <Key accent="b" />
            </div>

            {/* Row 3 */}
            <div className="tk-keys">
              <Key size="w3" accent="b" />
              {Array.from({ length: 10 }).map((_, i) => <Key key={`r3-${i}`} />)}
              <Key size="w2" accent="o" />
            </div>

            {/* Row 4 */}
            <div className="tk-keys">
              <Key size="w2" accent="b" />
              {Array.from({ length: 11 }).map((_, i) => <Key key={`r4-${i}`} />)}
              <Key size="w3" accent="b" />
            </div>

            {/* Row 5 */}
            <div className="tk-keys">
              <Key accent="b" />
              <Key accent="o" />
              {Array.from({ length: 2 }).map((_, i) => <Key key={`r5a-${i}`} accent="b" />)}
              <Key size="w6" />
              {Array.from({ length: 5 }).map((_, i) => <Key key={`r5b-${i}`} accent="b" />)}
            </div>

          </div>
          <div className="tk-keyboard__bottom tk-face" />
        </div>
      </div>
    </div>
  );
}

export default TypingKeyboard;
