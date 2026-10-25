import React, { useEffect, useRef } from "react";

const CIPHER_CHARS = "01ABCDEF0x*#+~·=<>_%$@/\\:;.,~-+=!&|{}[]";

interface RippleWave {
  x: number;
  y: number;
  startTime: number;
  maxRadius: number;
}

interface RainColumn {
  col: number;
  y: number;
  speed: number;
  chars: string[];
  nextMutate: number;
}

export function AsciiMatrixSectionBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesRef = useRef<RippleWave[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 750);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    const charSize = 16;
    const cols = Math.ceil(width / charSize);
    const rows = Math.ceil(height / charSize);

    // Rain columns state
    const columns: RainColumn[] = [];
    for (let c = 0; c < cols; c++) {
      const colChars: string[] = [];
      for (let r = 0; r < rows; r++) {
        colChars.push(CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)]);
      }
      columns.push({
        col: c,
        y: Math.random() * rows,
        speed: 0.15 + Math.random() * 0.3, // Gentle drift speed
        chars: colChars,
        nextMutate: performance.now() + Math.random() * 200,
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      wavesRef.current.push({
        x,
        y,
        startTime: performance.now(),
        maxRadius: 260,
      });

      if (wavesRef.current.length > 3) {
        wavesRef.current.shift();
      }
    };

    const parent = canvas.parentElement;
    parent?.addEventListener("mousemove", handleMouseMove);

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx.clearRect(0, 0, width, height);
      ctx.font = '11px "JetBrains Mono", Consolas, monospace';
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";

      // Filter expired waves
      wavesRef.current = wavesRef.current.filter((w) => now - w.startTime < 1400);

      const isLight = document.documentElement.getAttribute("data-theme") === "light";
      const baseAlpha = isLight ? 0.08 : 0.12;

      // Update rain columns
      for (let c = 0; c < cols; c++) {
        const col = columns[c];
        if (!col) continue;

        col.y = (col.y + col.speed * 60 * dt) % rows;

        if (now > col.nextMutate) {
          const randR = Math.floor(Math.random() * rows);
          col.chars[randR] = CIPHER_CHARS[Math.floor(Math.random() * CIPHER_CHARS.length)];
          col.nextMutate = now + 120 + Math.random() * 300;
        }

        const headRow = Math.floor(col.y);
        const posX = c * charSize + charSize / 2;

        for (let r = 0; r < rows; r++) {
          const posY = r * charSize + charSize / 2;
          const char = col.chars[r] || "*";

          // Calculate distance from rain head
          let distFromHead = (headRow - r + rows) % rows;
          let rainGlow = 0;
          if (distFromHead === 0) {
            rainGlow = 0.55; // Head of rain stream
          } else if (distFromHead < 6) {
            rainGlow = (1 - distFromHead / 6) * 0.25; // Stream tail
          }

          // Interactive ripples
          let waveStrength = 0;
          for (const w of wavesRef.current) {
            const age = now - w.startTime;
            const progress = age / 1400;
            const currentRadius = progress * w.maxRadius;
            const dist = Math.hypot(posX - w.x, posY - w.y);
            const delta = Math.abs(dist - currentRadius);

            if (delta < 50) {
              waveStrength = Math.max(waveStrength, (1 - delta / 50) * (1 - progress));
            }
          }

          let alpha = baseAlpha + rainGlow * 0.4 + waveStrength * 0.6;
          alpha = Math.min(0.9, Math.max(0.04, alpha));

          if (waveStrength > 0.05) {
            // Mouse wave active: electric cyan / emerald
            ctx.fillStyle = isLight
              ? `rgba(2, 132, 199, ${alpha.toFixed(3)})`
              : `rgba(56, 189, 248, ${alpha.toFixed(3)})`;
          } else if (rainGlow > 0.3) {
            // Rain head: vibrant accent
            ctx.fillStyle = isLight
              ? `rgba(5, 150, 105, ${alpha.toFixed(3)})`
              : `rgba(52, 211, 153, ${alpha.toFixed(3)})`;
          } else {
            // Ambient matrix character
            ctx.fillStyle = isLight
              ? `rgba(15, 82, 186, ${alpha.toFixed(3)})`
              : `rgba(148, 163, 184, ${alpha.toFixed(3)})`;
          }

          ctx.fillText(char, posX, posY);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      parent?.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 0.9,
      }}
      aria-hidden="true"
    />
  );
}

export default AsciiMatrixSectionBackground;
