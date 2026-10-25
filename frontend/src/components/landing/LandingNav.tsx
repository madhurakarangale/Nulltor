import React from "react";
import { NulltorLogo } from "../shared/NulltorLogo";
import { useTheme } from "../../context/ThemeContext";
import { AnimatedButton } from "./AnimatedButton";
import { Moon, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";

export interface LandingNavProps {
  onLaunch?: () => void;
}

export function LandingNav({ onLaunch }: LandingNavProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLaunch = () => {
    if (onLaunch) onLaunch();
    else navigate("/login");
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 80;
      const targetY = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
    }
  };

  return (
    <header className="landing-nav">
      {/* Left: Brand Logo */}
      <div
        className="landing-nav__left"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        style={{ cursor: "pointer" }}
      >
        <NulltorLogo size="sm" />
      </div>

      {/* Center: Navigation Anchors */}
      <nav className="landing-nav__links">
        <button
          onClick={() => scrollTo("security")}
          className="landing-nav__link"
        >
          Zero-Trust Security
        </button>
        <button
          onClick={() => scrollTo("features")}
          className="landing-nav__link"
        >
          3D Feature Engine
        </button>
        <button
          onClick={() => scrollTo("comparison")}
          className="landing-nav__link"
        >
          Comparison
        </button>
      </nav>

      {/* Right: Theme toggle & Action Button */}
      <div className="landing-nav__right">
        <button
          onClick={toggleTheme}
          className="landing-nav__theme-btn"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun style={{ width: 16, height: 16, color: "#f59e0b" }} />
          ) : (
            <Moon style={{ width: 16, height: 16, color: "#60a5fa" }} />
          )}
        </button>

        <AnimatedButton
          size="sm"
          variant="primary"
          onClick={handleLaunch}
        >
          <span>Launch Studio</span>
        </AnimatedButton>
      </div>
    </header>
  );
}

export default LandingNav;
