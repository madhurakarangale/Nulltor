import React from "react";
import { NulltorLogo } from "../shared/NulltorLogo";
import { AnimatedButton } from "./AnimatedButton";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function LandingFooter() {
  const navigate = useNavigate();

  return (
    <footer className="landing-footer">
      <div className="landing-container">
        {/* Minimalist Call to Action (Borderless, Clean, Integrated) */}
        <div className="landing-cta-minimal">
          <div className="landing-section__kicker">
            AIR-GAPPED &amp; CLOUDLESS // ZERO TELEMETRY
          </div>

          <h3 className="landing-cta-minimal__title">
            Ready to code with 100% data sovereignty?
          </h3>

          <p className="landing-cta-minimal__desc">
            Launch Nulltor Studio on your local network or workstation. Zero external cloud tracking, zero latency, maximum privacy.
          </p>

          <div style={{ marginTop: "20px" }}>
            <AnimatedButton
              size="md"
              variant="primary"
              onClick={() => navigate("/login")}
            >
              <span>Launch Studio Environment</span>
              <ArrowRight style={{ width: 16, height: 16, marginLeft: 4 }} />
            </AnimatedButton>
          </div>
        </div>

        {/* Footer Meta Details */}
        <div className="landing-footer__bottom">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <NulltorLogo size="sm" />
            <span>&copy; {new Date().getFullYear()} Nulltor Open Source Project</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "24px", color: "var(--text-secondary, #94a3b8)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981" }}>
              <span className="landing-nav__dot" />
              <span>P2P CRDT ENGINE ACTIVE</span>
            </span>
            <span>NODE: LOCALHOST:3330</span>
            <span>VERSION 2.4.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
