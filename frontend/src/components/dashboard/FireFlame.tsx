import React from 'react';

interface FireFlameProps {
  size?: 'sm' | 'md' | 'lg';
  streakCount?: number;
}

export function FireFlame({ size = 'md', streakCount }: FireFlameProps) {
  const pixelSize = size === 'sm' ? 28 : size === 'lg' ? 68 : 46;

  return (
    <div className={`fire-flame-container fire-flame-${size}`}>
      {/* Outer ambient glow halo */}
      <div className="fire-glow-halo" />

      {/* Floating ember particles */}
      <div className="fire-ember ember-1" />
      <div className="fire-ember ember-2" />
      <div className="fire-ember ember-3" />
      <div className="fire-ember ember-4" />

      {/* SVG Layered Flame */}
      <svg
        width={pixelSize}
        height={pixelSize * 1.25}
        viewBox="0 0 64 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="fire-svg"
      >
        <defs>
          <linearGradient id="flameOuterGrad" x1="32" y1="80" x2="32" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="35%" stopColor="#ea580c" />
            <stop offset="75%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          <linearGradient id="flameMidGrad" x1="32" y1="80" x2="32" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ea580c" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="90%" stopColor="#fde047" />
          </linearGradient>

          <linearGradient id="flameCoreGrad" x1="32" y1="80" x2="32" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <filter id="flameBlur" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Outer Flame Base */}
        <path
          className="flame-layer-outer"
          d="M32 4C24 16 12 28 12 48C12 65.673 20.954 80 32 80C43.046 80 52 65.673 52 48C52 32 42 20 38 12C36 20 32 23 28 20C27 15 30 8 32 4Z"
          fill="url(#flameOuterGrad)"
        />

        {/* 2. Mid Warm Flame */}
        <path
          className="flame-layer-mid"
          d="M32 20C26 30 20 40 20 54C20 66.15 25.373 76 32 76C38.627 76 44 66.15 44 54C44 42 36 34 35 28C34 32 31 34 29 32C28 28 30 23 32 20Z"
          fill="url(#flameMidGrad)"
          filter="url(#flameBlur)"
        />

        {/* 3. Inner White-Hot Flame Core */}
        <path
          className="flame-layer-core"
          d="M32 40C28 48 25 55 25 62C25 69.732 28.134 76 32 76C35.866 76 39 69.732 39 62C39 55 35 48 32 40Z"
          fill="url(#flameCoreGrad)"
        />
      </svg>
    </div>
  );
}
