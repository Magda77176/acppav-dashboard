"use client";
import { useEffect, useState } from "react";

const AGENTS = [
  { name: "JARVIS", model: "CLAUDE OPUS 4", role: "ORCHESTRATEUR PRINCIPAL", level: 0 },
  { name: "COMMERCIAL-MEDICAL", model: "SONNET", role: "LEADS MEDICAUX, PROSPECTION DENTISTES & CHIRURGIENS", level: 1 },
  { name: "PROSPECTION", model: "SONNET", role: "RECHERCHE LEADS, ENRICHISSEMENT, VERIFICATION EMAILS", level: 1 },
  { name: "COPYWRITER-EMAIL", model: "SONNET", role: "EMAILS DE PROSPECTION PERSONNALISES (SAPHIR NOIR, INFINITY MEDICAL)", level: 1 },
  { name: "LINKEDIN-OUTREACH", model: "OPUS", role: "MESSAGES/INVITATIONS LINKEDIN PERSONNALISES", level: 1 },
  { name: "SEO-EXPERT", model: "OPUS", role: "AUDITS SEO, KEYWORDS, RECOMMANDATIONS", level: 1 },
  { name: "DEV-WEB", model: "SONNET", role: "SITES, LANDING PAGES, DASHBOARDS", level: 1 },
  { name: "COPYWRITER", model: "OPUS", role: "ARTICLES, SCRIPTS, CONTENU SEO", level: 1 },
  { name: "DA-UIUX", model: "SONNET", role: "DESIGN UI/UX, MAQUETTES, BRANDING", level: 1 },
  { name: "SOCIAL-MEDIA-MANAGER", model: "SONNET", role: "GESTION RESEAUX SOCIAUX, TWEETS, LINKEDIN", level: 1 },
  { name: "VEILLE-OPPORTUNITES", model: "SONNET", role: "VEILLE MARCHE, TRENDS, OPPORTUNITES", level: 1 },
  { name: "AGENT-SULLIVAN", model: "OPUS", role: "CHASSEUR MISSIONS FREELANCE SEO (TJM 450€)", level: 1 },
];

export default function TeamPage() {
  const [scheduler, setScheduler] = useState<any>(null);

  useEffect(() => {
    fetch("/api/scheduler").then(r => r.json()).then(setScheduler);
  }, []);

  return (
    <div 
      className="max-w-5xl mx-auto space-y-8"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <div 
        className="p-8 text-center"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <h1 
          className="text-2xl font-bold mb-2"
          style={{ 
            color: '#e0e0e0',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          TEAM
        </h1>
        <p 
          style={{ 
            color: '#666',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          ECOSYSTEME AUTONOME AGENTS IA SPECIALISES
        </p>
      </div>

      {/* Jarvis */}
      <div className="flex justify-center">
        <div 
          className="p-4 sm:p-6 w-full max-w-80 text-center"
          style={{ 
            backgroundColor: '#000000',
            border: '2px solid #e0e0e0'
          }}
        >
          <span 
            className="text-4xl block mb-2"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            ●
          </span>
          <h3 
            className="font-bold text-lg"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {AGENTS[0].name}
          </h3>
          <p 
            className="text-xs mb-1"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {AGENTS[0].model}
          </p>
          <p 
            className="text-sm"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {AGENTS[0].role}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div 
          className="w-px h-8"
          style={{ backgroundColor: '#222' }}
        />
      </div>

      {/* Level 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {AGENTS.filter(a => a.level === 1).map(a => (
          <div 
            key={a.name} 
            className="p-4 text-center"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #222'
            }}
          >
            <span 
              className="text-2xl block mb-2"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              ●
            </span>
            <h3 
              className="font-semibold text-sm"
              style={{ 
                color: '#e0e0e0',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {a.name}
            </h3>
            <p 
              className="text-xs mb-1"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {a.model}
            </p>
            <p 
              className="text-xs"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {a.role}
            </p>
          </div>
        ))}
      </div>

      {/* Scheduler */}
      <div 
        className="p-6"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <h2 
          className="text-lg font-semibold mb-4"
          style={{ 
            color: '#666',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          PROCESSUS AUTONOMES (SCHEDULER)
        </h2>
        {scheduler && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(scheduler).map(([key, val]: [string, any]) => (
              <div 
                key={key} 
                className="flex items-center justify-between p-3"
                style={{ 
                  backgroundColor: '#0a0a0a',
                  border: '1px solid #222'
                }}
              >
                <div>
                  <p 
                    className="text-sm font-medium"
                    style={{ 
                      color: '#e0e0e0',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {key}
                  </p>
                  <p 
                    className="text-xs"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {new Date(val.lastRun).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span 
                  className="w-3 h-3"
                  style={{ 
                    backgroundColor: val.lastResult === "ok" ? "#33ff33" : "#ff3333",
                    display: 'inline-block'
                  }}
                >
                  ●
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
