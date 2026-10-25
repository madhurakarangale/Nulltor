import React, { useEffect, useRef } from "react";
import { cn } from "../../lib/utils";

// Constants for smooth wave animation behavior
const ANIM_STEP = 60; // Smooth 60ms cipher flip rate
const CIPHER_CHARS_DEFAULT = '01ABCDEF0x*#+~·=<>_%$@/\\:;';

export interface AsciiGlitchRippleProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * The text to display and animate.
   */
  children: string;
  /**
   * The HTML element or component to render as.
   * @default "span"
   */
  as?: any;
  /**
   * Additional CSS classes.
   */
  className?: string;
  /**
   * Duration of each ripple wave in milliseconds.
   * @default 1200
   */
  dur?: number;
  /**
   * Character set to scramble through during the ripple wave.
   */
  chars?: string;
  /**
   * Whether to preserve space characters or scramble them too.
   * @default true
   */
  preserveSpaces?: boolean;
  /**
   * The spread factor of the ripple wave.
   * @default 1.2
   */
  spread?: number;
  /**
   * Whether to periodically trigger a subtle auto-ripple sweep.
   * @default true
   */
  autoPlay?: boolean;
  /**
   * Interval for auto-ripple sweep in ms.
   * @default 6500
   */
  autoPlayInterval?: number;
  [key: string]: any;
}

export function AsciiGlitchRipple({
  children,
  as = "span",
  className,
  dur = 1200,
  chars = CIPHER_CHARS_DEFAULT,
  preserveSpaces = true,
  spread = 1.2,
  autoPlay = true,
  autoPlayInterval = 6500,
  ...props
}: AsciiGlitchRippleProps) {
  const Component = as;
  const elRef = useRef<any>(null);

  const stateRef = useRef({
    origTxt: children,
    origChars: children.split(""),
    isAnim: false,
    cursorPos: 0,
    lastWaveTime: 0,
    waves: [] as Array<{ startPos: number; startTime: number; id: number }>,
    animId: null as number | null,
    isHover: false,
    dur,
    chars,
    preserveSpaces,
    spread,
  });

  // Keep state updated when props change
  useEffect(() => {
    stateRef.current.origTxt = children;
    stateRef.current.origChars = children.split("");
    stateRef.current.dur = dur;
    stateRef.current.chars = chars;
    stateRef.current.preserveSpaces = preserveSpaces;
    stateRef.current.spread = spread;

    if (!stateRef.current.isAnim && elRef.current) {
      elRef.current.textContent = children;
    }
  }, [children, dur, chars, preserveSpaces, spread]);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    el.textContent = children;

    const updateCursorPos = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const len = stateRef.current.origTxt.length;
      const pos = Math.round((x / Math.max(1, rect.width)) * len);
      stateRef.current.cursorPos = Math.max(0, Math.min(pos, len - 1));
    };

    const stop = () => {
      el.textContent = stateRef.current.origTxt;
      el.classList.remove("as");
      stateRef.current.isAnim = false;
      stateRef.current.waves = [];
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
        stateRef.current.animId = null;
      }
    };

    const calcWaveEffect = (charIdx: number, t: number) => {
      let shouldAnim = false;
      let resultChar = stateRef.current.origChars[charIdx];

      const waveWidth = Math.max(3, Math.round(5 * stateRef.current.spread));

      for (const w of stateRef.current.waves) {
        const age = t - w.startTime;
        const prog = Math.min(age / stateRef.current.dur, 1);
        const dist = Math.abs(charIdx - w.startPos);
        const maxDist = Math.max(w.startPos, stateRef.current.origChars.length - w.startPos - 1);
        const rad = prog * (maxDist + waveWidth + 4);

        if (dist <= rad && dist >= rad - waveWidth) {
          shouldAnim = true;
          const index =
            (dist * 3 + Math.floor(age / ANIM_STEP)) % stateRef.current.chars.length;
          resultChar = stateRef.current.chars[index];
        }
      }

      return { shouldAnim, char: resultChar };
    };

    const genScrambledTxt = (t: number) =>
      stateRef.current.origChars
        .map((char, i) => {
          if (stateRef.current.preserveSpaces && (char === " " || char === "\n")) return char;
          const res = calcWaveEffect(i, t);
          return res.shouldAnim ? res.char : char;
        })
        .join("");

    const start = () => {
      if (stateRef.current.isAnim) return;
      stateRef.current.isAnim = true;
      el.classList.add("as");

      const animate = () => {
        const t = Date.now();

        // Evict finished waves
        stateRef.current.waves = stateRef.current.waves.filter(
          (w) => t - w.startTime < stateRef.current.dur
        );

        if (stateRef.current.waves.length === 0) {
          stop();
          return;
        }

        el.textContent = genScrambledTxt(t);
        stateRef.current.animId = requestAnimationFrame(animate);
      };

      stateRef.current.animId = requestAnimationFrame(animate);
    };

    const triggerWaveAt = (pos: number) => {
      const now = Date.now();
      if (now - stateRef.current.lastWaveTime < 280) return; // Throttle wave frequency
      if (stateRef.current.waves.length >= 2) return; // Maximum 2 active waves

      stateRef.current.lastWaveTime = now;
      stateRef.current.waves.push({
        startPos: pos,
        startTime: now,
        id: Math.random(),
      });

      start();
    };

    const handleEnter = (e: MouseEvent) => {
      stateRef.current.isHover = true;
      updateCursorPos(e);
      triggerWaveAt(stateRef.current.cursorPos);
    };

    const handleMove = (e: MouseEvent) => {
      if (!stateRef.current.isHover) return;
      updateCursorPos(e);
      triggerWaveAt(stateRef.current.cursorPos);
    };

    const handleLeave = () => {
      stateRef.current.isHover = false;
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);

    // Subtle ambient auto-ripple timer
    let timerId: any = null;
    if (autoPlay) {
      // Trigger once shortly after mount (staggered slightly)
      const initialTimer = setTimeout(() => {
        triggerWaveAt(0);
      }, 800 + Math.random() * 600);

      timerId = setInterval(() => {
        // Only trigger auto-play if not hovered and not already animating
        if (!stateRef.current.isHover && !stateRef.current.isAnim) {
          triggerWaveAt(0);
        }
      }, autoPlayInterval);

      return () => {
        clearTimeout(initialTimer);
        clearInterval(timerId);
        el.removeEventListener("mouseenter", handleEnter);
        el.removeEventListener("mousemove", handleMove);
        el.removeEventListener("mouseleave", handleLeave);
        if (stateRef.current.animId) {
          cancelAnimationFrame(stateRef.current.animId);
        }
      };
    }

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
    };
  }, [children, autoPlay, autoPlayInterval]);

  return (
    <Component
      ref={elRef}
      className={cn(
        "cursor-pointer select-none transition-colors duration-200 font-mono",
        className
      )}
      {...props}
    />
  );
}

export default AsciiGlitchRipple;
