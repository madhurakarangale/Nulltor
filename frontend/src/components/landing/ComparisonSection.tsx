import React from "react";
import { Check, X, Shield } from "lucide-react";
import { TextAnimation } from "./TextAnimation";

export interface ComparisonFeature {
  name: string;
  desc: string;
  nulltor: boolean | string;
  codespaces: boolean | string;
  replit: boolean | string;
  vscode: boolean | string;
}

export function ComparisonSection() {
  const features: ComparisonFeature[] = [
    {
      name: "100% Local LAN & Air-Gapped Operation",
      desc: "Operate with zero internet connection or third-party cloud dependence.",
      nulltor: true,
      codespaces: false,
      replit: false,
      vscode: "Partial (Single user)",
    },
    {
      name: "Client-Side Zero-Knowledge Encryption",
      desc: "AES-256-GCM encryption before leaving workstation. Server is blind to source code.",
      nulltor: true,
      codespaces: false,
      replit: false,
      vscode: false,
    },
    {
      name: "Real-Time P2P Collaborative Editing",
      desc: "Multiplayer editing powered by conflict-free replicated data types (Yjs).",
      nulltor: true,
      codespaces: "Requires Live Share",
      replit: true,
      vscode: "Requires Live Share",
    },
    {
      name: "Autonomous AI Engineering Agent",
      desc: "Integrated ReAct agent (DevBot) able to inspect workspace, fix bugs, and execute code.",
      nulltor: true,
      codespaces: "Paid Add-on",
      replit: "Paid Add-on",
      vscode: "Requires Extension",
    },
    {
      name: "Tri-Engine CAS Persistence",
      desc: "Dual PostgreSQL and SQLite WAL sync for instant branch switches and atomic rollbacks.",
      nulltor: true,
      codespaces: false,
      replit: false,
      vscode: false,
    },
    {
      name: "Built-In P2P Voice & Video Mesh",
      desc: "Hardware-accelerated WebRTC conference built directly into the editor canvas.",
      nulltor: true,
      codespaces: false,
      replit: false,
      vscode: false,
    },
    {
      name: "Zero Subscription Cloud Lock-In",
      desc: "Self-host on your own hardware, home lab, or private intranet with zero recurring fees.",
      nulltor: true,
      codespaces: false,
      replit: false,
      vscode: true,
    },
  ];

  return (
    <section id="comparison" className="landing-section">
      <div className="landing-container">
        {/* Section Header with Animated Kicker (No Boxy Badges) */}
        <div className="landing-section__header">
          <div className="landing-section__kicker">
            <TextAnimation delay={0.05} divideBy="character">
              SOVEREIGN ARCHITECTURAL COMPARISON
            </TextAnimation>
          </div>

          <h2 className="landing-section__title">
            <TextAnimation delay={0.1} divideBy="word">
              Why Engineers Choose Nulltor
            </TextAnimation>
          </h2>

          <p className="landing-section__desc">
            See how Nulltor&apos;s cryptographic local-first architecture outperforms traditional cloud IDEs in privacy, security, latency, and operational cost.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="comp-table-wrap">
          <table className="comp-table">
            <thead>
              <tr>
                <th>Platform Capability</th>
                <th className="comp-table__highlight-head">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                    <Shield style={{ width: 15, height: 15, color: "#3b82f6" }} />
                    <span>NULLTOR STUDIO</span>
                  </div>
                </th>
                <th style={{ textAlign: "center" }}>GitHub Codespaces</th>
                <th style={{ textAlign: "center" }}>Replit</th>
                <th style={{ textAlign: "center" }}>VS Code Desktop</th>
              </tr>
            </thead>
            <tbody>
              {features.map((f, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="comp-feature-name">{f.name}</div>
                    <div className="comp-feature-desc">{f.desc}</div>
                  </td>

                  {/* Nulltor Column */}
                  <td className="comp-table__highlight-col" style={{ textAlign: "center" }}>
                    {typeof f.nulltor === "boolean" ? (
                      f.nulltor ? (
                        <div className="comp-check-circle">
                          <Check style={{ width: 14, height: 14, color: "#10b981", strokeWidth: 3 }} />
                        </div>
                      ) : (
                        <X style={{ width: 16, height: 16, color: "#64748b", margin: "0 auto" }} />
                      )
                    ) : (
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#10b981" }}>{f.nulltor}</span>
                    )}
                  </td>

                  {/* Competitor Columns */}
                  <td style={{ textAlign: "center" }}>
                    {typeof f.codespaces === "boolean" ? (
                      f.codespaces ? (
                        <Check style={{ width: 16, height: 16, color: "#10b981", margin: "0 auto" }} />
                      ) : (
                        <X style={{ width: 15, height: 15, color: "#64748b", margin: "0 auto", opacity: 0.6 }} />
                      )
                    ) : (
                      <span className="comp-subtext">{f.codespaces}</span>
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {typeof f.replit === "boolean" ? (
                      f.replit ? (
                        <Check style={{ width: 16, height: 16, color: "#10b981", margin: "0 auto" }} />
                      ) : (
                        <X style={{ width: 15, height: 15, color: "#64748b", margin: "0 auto", opacity: 0.6 }} />
                      )
                    ) : (
                      <span className="comp-subtext">{f.replit}</span>
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {typeof f.vscode === "boolean" ? (
                      f.vscode ? (
                        <Check style={{ width: 16, height: 16, color: "#10b981", margin: "0 auto" }} />
                      ) : (
                        <X style={{ width: 15, height: 15, color: "#64748b", margin: "0 auto", opacity: 0.6 }} />
                      )
                    ) : (
                      <span className="comp-subtext">{f.vscode}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default ComparisonSection;
