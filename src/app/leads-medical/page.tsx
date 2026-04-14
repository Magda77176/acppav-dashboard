"use client";
import { useEffect, useState } from "react";

interface VerifiedEmails {
  totalOK: number;
  totalKO: number;
  totalProcessed: number;
  bySpec: Record<string, number>;
  koBySpec: Record<string, number>;
}

interface DashboardData {
  totalAmeli: number;
  totalEmelia: number;
  totalKO: number;
  ameliBySpec: Record<string, number>;
  emeliaBySpec: Record<string, number>;
  ameliTopDepts: Record<string, Record<string, number>>;
  emeliaByDept: Record<string, number>;
  verifiedEmails?: VerifiedEmails;
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      background: "#111",
      borderRadius: 12,
      padding: "20px",
      textAlign: "center",
      border: "1px solid #222",
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function LeadsMedicalPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "verified" | "ameli" | "emelia" | "opportunities">("overview");

  useEffect(() => {
    fetch("/api/leads-medical").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh", color: "#666" }}>
      Chargement...
    </div>
  );

  const potential = data.totalAmeli - data.totalEmelia - data.totalKO;
  const pct = ((data.totalEmelia / data.totalAmeli) * 100).toFixed(1);

  const ameliEntries = Object.entries(data.ameliBySpec).sort((a, b) => b[1] - a[1]);
  const emeliaEntries = Object.entries(data.emeliaBySpec).sort((a, b) => b[1] - a[1]);
  const maxAmeli = ameliEntries[0]?.[1] || 1;

  // Opportunities
  const keySpecs = [
    "Chirurgien-dentiste", "Médecin généraliste", "Cardiologue", "Ophtalmologiste",
    "Gynécologue / Obstétricien", "Chirurgien orthopédiste et traumatologue",
    "Psychiatre", "Anesthésiste réanimateur", "Dermatologue et vénérologue",
    "Gastro-entérologue et hépatologue", "Pédiatre", "Chirurgien urologue",
    "Oto-Rhino-Laryngologue (ORL) et chirurgien cervico-facial"
  ];

  const tabs = [
    { id: "overview" as const, label: "VUE D'ENSEMBLE" },
    { id: "verified" as const, label: "📧 EMAILS VÉRIFIÉS" },
    { id: "ameli" as const, label: "BASE AMELI" },
    { id: "emelia" as const, label: "EN CAMPAGNE" },
    { id: "opportunities" as const, label: "OPPORTUNITÉS" },
  ];

  return (
    <div className="max-w-7xl mx-auto" style={{ fontFamily: "'Courier New', monospace" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e0e0e0", marginBottom: 8 }}>
        🏥 LEADS MÉDICAUX — INFINITY MEDICAL
      </h1>
      <p style={{ color: "#666", fontSize: 12, marginBottom: 24 }}>
        Base de données médicale France · {fmt(data.totalAmeli)} professionnels de santé
      </p>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px",
              fontSize: 11,
              fontFamily: "monospace",
              background: activeTab === t.id ? "#1a1a2e" : "transparent",
              color: activeTab === t.id ? "#38bdf8" : "#666",
              border: activeTab === t.id ? "1px solid #38bdf8" : "1px solid #333",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <KPI label="Base Ameli (total)" value={fmt(data.totalAmeli)} color="#a78bfa" />
        <KPI label="Contacts avec email" value={fmt(data.totalEmelia)} color="#4ade80" />
        <KPI label="À enrichir" value={fmt(potential)} color="#fb923c" />
        <KPI label="Emails invalides" value={fmt(data.totalKO)} color="#f87171" />
      </div>

      {/* Verified Emails KPIs */}
      {data.verifiedEmails && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          <KPI label="✅ Emails vérifiés OK" value={fmt(data.verifiedEmails.totalOK)} color="#22d3ee" />
          <KPI label="❌ Emails vérifiés KO" value={fmt(data.verifiedEmails.totalKO)} color="#f87171" />
          <KPI label="Total traités" value={fmt(data.verifiedEmails.totalProcessed)} color="#a78bfa" />
          <KPI label="Taux de validité" value={`${((data.verifiedEmails.totalOK / data.verifiedEmails.totalProcessed) * 100).toFixed(1)}%`} color="#4ade80" />
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222", marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "#888" }}>Pipeline d'enrichissement</span>
          <span style={{ fontSize: 12, color: "#fff", fontWeight: 600 }}>{pct}%</span>
        </div>
        <div style={{ height: 10, background: "#222", borderRadius: 5, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #4ade80, #38bdf8)",
            borderRadius: 5,
          }} />
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Ameli top */}
          <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
            <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>🩺 Top spécialités (Ameli)</h3>
            {ameliEntries.slice(0, 12).map(([spec, count]) => (
              <div key={spec} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: "#aaa", width: 200, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{spec}</span>
                <div style={{ flex: 1, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / maxAmeli * 100)}%`, background: "#38bdf8", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: "#fff", fontFamily: "monospace", width: 60, textAlign: "right" }}>{fmt(count)}</span>
              </div>
            ))}
          </div>

          {/* Emelia */}
          <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
            <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>📧 En campagne (Emelia)</h3>
            {emeliaEntries.map(([spec, count]) => (
              <div key={spec} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ fontSize: 11, color: "#aaa" }}>{spec}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#fff", fontFamily: "monospace" }}>{fmt(count)}</span>
                  <span style={{
                    padding: "1px 6px",
                    borderRadius: 3,
                    fontSize: 9,
                    fontWeight: 600,
                    background: spec === "Non renseigné" ? "#78350f" : "#065f46",
                    color: spec === "Non renseigné" ? "#fbbf24" : "#4ade80",
                  }}>
                    {spec === "Non renseigné" ? "?" : "ACTIF"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "verified" && data.verifiedEmails && (() => {
        const ve = data.verifiedEmails!;
        const specEntries = Object.entries(ve.bySpec).sort((a, b) => b[1] - a[1]);
        const maxVerified = specEntries[0]?.[1] || 1;
        return (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* By speciality */}
            <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
              <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>📧 Emails vérifiés par spécialité</h3>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>SPÉCIALITÉ</th>
                    <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>✅ OK</th>
                    <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>❌ KO</th>
                    <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>TAUX</th>
                    <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222", width: "25%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {specEntries.map(([spec, okCount]) => {
                    const koCount = ve.koBySpec[spec] || 0;
                    const total = okCount + koCount;
                    const rate = total > 0 ? ((okCount / total) * 100).toFixed(1) : "0";
                    return (
                      <tr key={spec} style={{ borderBottom: "1px solid #1a1a1a" }}>
                        <td style={{ padding: "6px 8px", fontSize: 12, color: "#ccc" }}>{spec}</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, color: "#22d3ee", fontFamily: "monospace", textAlign: "right", fontWeight: 600 }}>{fmt(okCount)}</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, color: "#f87171", fontFamily: "monospace", textAlign: "right" }}>{fmt(koCount)}</td>
                        <td style={{ padding: "6px 8px", fontSize: 12, color: "#4ade80", fontFamily: "monospace", textAlign: "right" }}>{rate}%</td>
                        <td style={{ padding: "6px 8px" }}>
                          <div style={{ height: 8, background: "#222", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${(okCount / maxVerified * 100)}%`, background: "linear-gradient(90deg, #22d3ee, #4ade80)", borderRadius: 4 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary card */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#111", borderRadius: 12, padding: 20, border: "1px solid #222" }}>
                <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 16 }}>📊 Résumé vérification</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {specEntries.map(([spec, okCount]) => {
                    const koCount = ve.koBySpec[spec] || 0;
                    const total = okCount + koCount;
                    const rate = total > 0 ? ((okCount / total) * 100) : 0;
                    const ameliTotal = data.ameliBySpec[spec] || 0;
                    const coverage = ameliTotal > 0 ? ((okCount / ameliTotal) * 100).toFixed(1) : "?";
                    return (
                      <div key={spec} style={{ background: "#0a0a0a", borderRadius: 8, padding: 12, border: "1px solid #1a1a1a" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>{spec}</span>
                          <span style={{ fontSize: 11, color: "#4ade80" }}>{coverage}% de la base Ameli</span>
                        </div>
                        <div style={{ height: 6, background: "#222", borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
                          <div style={{ height: "100%", width: `${rate}%`, background: rate > 70 ? "#4ade80" : "#fb923c", borderRadius: 3 }} />
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#666" }}>
                          <span>{fmt(okCount)} validés / {fmt(total)} traités</span>
                          <span>Taux: {rate.toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #0ea5e9", borderWidth: 2 }}>
                <div style={{ fontSize: 11, color: "#0ea5e9", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>🎯 Prêts pour campagne</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: "#22d3ee", fontFamily: "monospace" }}>{fmt(ve.totalOK)}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>emails vérifiés et délivrables</div>
              </div>
            </div>
          </div>
        );
      })()}

      {activeTab === "ameli" && (
        <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
          <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>🩺 Base Ameli complète — {fmt(data.totalAmeli)} professionnels</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>SPÉCIALITÉ</th>
                <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>TOTAL</th>
                <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222", width: "40%" }}>VOLUME</th>
              </tr>
            </thead>
            <tbody>
              {ameliEntries.map(([spec, count]) => (
                <tr key={spec} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "#ccc" }}>{spec}</td>
                  <td style={{ padding: "6px 8px", fontSize: 12, color: "#fff", fontFamily: "monospace", textAlign: "right" }}>{fmt(count)}</td>
                  <td style={{ padding: "6px 8px" }}>
                    <div style={{ height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(count / maxAmeli * 100)}%`, background: "#a78bfa", borderRadius: 3 }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "emelia" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
            <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>📧 Contacts par spécialité</h3>
            {emeliaEntries.map(([spec, count]) => (
              <div key={spec} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1a1a1a" }}>
                <span style={{ fontSize: 12, color: "#ccc" }}>{spec}</span>
                <span style={{ fontSize: 12, color: "#4ade80", fontFamily: "monospace", fontWeight: 600 }}>{fmt(count)}</span>
              </div>
            ))}
          </div>
          <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
            <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>📍 Top départements</h3>
            {Object.entries(data.emeliaByDept).map(([dept, count]) => (
              <div key={dept} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "#aaa", width: 50 }}>Dept {dept}</span>
                <div style={{ flex: 1, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(count / Object.values(data.emeliaByDept)[0] * 100)}%`, background: "#38bdf8", borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 11, color: "#fff", fontFamily: "monospace", width: 40, textAlign: "right" }}>{fmt(count)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "opportunities" && (
        <div style={{ background: "#111", borderRadius: 12, padding: 16, border: "1px solid #222" }}>
          <h3 style={{ fontSize: 14, color: "#e0e0e0", marginBottom: 12 }}>🎯 Opportunités d'enrichissement</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>SPÉCIALITÉ</th>
                <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>AMELI</th>
                <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>ENRICHI</th>
                <th style={{ textAlign: "right", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222" }}>RESTANT</th>
                <th style={{ textAlign: "left", padding: "8px", color: "#666", fontSize: 11, borderBottom: "1px solid #222", width: "25%" }}>COUVERTURE</th>
              </tr>
            </thead>
            <tbody>
              {keySpecs.map(spec => {
                const ameli = data.ameliBySpec[spec] || 0;
                const enriched = data.emeliaBySpec[spec] || 0;
                const reste = ameli - enriched;
                const coverage = ameli > 0 ? ((enriched / ameli) * 100).toFixed(1) : "0";
                if (ameli === 0) return null;
                return (
                  <tr key={spec} style={{ borderBottom: "1px solid #1a1a1a" }}>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: "#ccc" }}>{spec}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: "#a78bfa", fontFamily: "monospace", textAlign: "right" }}>{fmt(ameli)}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: "#4ade80", fontFamily: "monospace", textAlign: "right" }}>{fmt(enriched)}</td>
                    <td style={{ padding: "6px 8px", fontSize: 12, color: "#fb923c", fontFamily: "monospace", textAlign: "right", fontWeight: 600 }}>{fmt(reste)}</td>
                    <td style={{ padding: "6px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 6, background: "#222", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${coverage}%`, background: parseFloat(coverage) > 20 ? "#4ade80" : "#fb923c", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#888", width: 35 }}>{coverage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
