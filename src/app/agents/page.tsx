"use client";
import { useEffect, useState } from "react";

export default function AgentsPage() {
  const [data, setData] = useState<any>(null);
  const [tab, setTab] = useState<"agents" | "skills">("agents");

  useEffect(() => {
    fetch("/api/agents").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div 
      className="flex items-center justify-center h-96"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <div 
        className="animate-spin w-8 h-8"
        style={{ 
          border: '2px solid #222',
          borderTop: '2px solid #e0e0e0',
          borderRadius: '50%'
        }}
      />
    </div>
  );

  return (
    <div 
      className="max-w-7xl mx-auto"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <h1 
        className="text-2xl font-bold mb-6"
        style={{ 
          color: '#e0e0e0',
          fontFamily: "'Courier New', 'Consolas', monospace",
          letterSpacing: '0.1em'
        }}
      >
        AGENTS
      </h1>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setTab("agents")} 
          className="px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: '#000000',
            color: tab === "agents" ? '#e0e0e0' : '#666',
            border: tab === "agents" ? '1px solid #e0e0e0' : '1px solid #222',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
          onMouseEnter={(e) => {
            if (tab !== "agents") {
              e.currentTarget.style.color = '#e0e0e0';
              e.currentTarget.style.border = '1px solid #666';
            }
          }}
          onMouseLeave={(e) => {
            if (tab !== "agents") {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.border = '1px solid #222';
            }
          }}
        >
          AGENTS ({data.agents.length})
        </button>
        <button 
          onClick={() => setTab("skills")} 
          className="px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: '#000000',
            color: tab === "skills" ? '#e0e0e0' : '#666',
            border: tab === "skills" ? '1px solid #e0e0e0' : '1px solid #222',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
          onMouseEnter={(e) => {
            if (tab !== "skills") {
              e.currentTarget.style.color = '#e0e0e0';
              e.currentTarget.style.border = '1px solid #666';
            }
          }}
          onMouseLeave={(e) => {
            if (tab !== "skills") {
              e.currentTarget.style.color = '#666';
              e.currentTarget.style.border = '1px solid #222';
            }
          }}
        >
          SKILLS ({data.skills.length})
        </button>
      </div>

      {tab === "agents" && (
        <div className="space-y-3">
          {data.agents.map((a: any) => (
            <div 
              key={a.name} 
              className="p-5"
              style={{ 
                backgroundColor: '#000000',
                border: a.hasAgent ? '1px solid #222' : '1px solid #ff3333'
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span 
                      className="w-2 h-2"
                      style={{ 
                        backgroundColor: a.hasAgent ? "#33ff33" : "#ff3333",
                        display: 'inline-block'
                      }}
                    >
                      ●
                    </span>
                    <h3 
                      className="font-semibold"
                      style={{ 
                        color: '#e0e0e0',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {a.title}
                    </h3>
                    <span 
                      className="text-[10px] px-2 py-0.5"
                      style={{ 
                        backgroundColor: '#000000',
                        color: '#666',
                        border: '1px solid #222',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {a.version}
                    </span>
                    {!a.hasAgent && (
                      <span 
                        className="text-[10px] px-2 py-0.5"
                        style={{ 
                          backgroundColor: '#000000',
                          color: '#ff3333',
                          border: '1px solid #ff3333',
                          fontFamily: "'Courier New', 'Consolas', monospace",
                          letterSpacing: '0.1em'
                        }}
                      >
                        PAS D'AGENT.MD
                      </span>
                    )}
                  </div>
                  <p 
                    className="text-xs mb-2"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {a.name}
                  </p>
                  {a.mission && (
                    <p 
                      className="text-sm mb-3"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {a.mission}
                    </p>
                  )}
                  {a.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.skills.map((s: string) => (
                        <span 
                          key={s} 
                          className="text-[10px] px-2 py-1"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#e0e0e0',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p 
                    className="text-2xl font-bold"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {a.lines}
                  </p>
                  <p 
                    className="text-[10px]"
                    style={{ 
                      color: '#333',
                      fontFamily: "'Courier New', 'Consolas', monospace",
                      letterSpacing: '0.1em'
                    }}
                  >
                    LIGNES
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "skills" && (
        <div className="grid lg:grid-cols-2 gap-3">
          {data.skills.map((s: any) => (
            <div 
              key={s.name} 
              className="p-4"
              style={{ 
                backgroundColor: '#000000',
                border: '1px solid #222'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 
                    className="font-medium text-sm"
                    style={{ 
                      color: '#e0e0e0',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {s.title}
                  </h3>
                  <p 
                    className="text-[10px]"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    {s.name}
                  </p>
                </div>
                <span 
                  className="text-xs"
                  style={{ 
                    color: '#666',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                >
                  {s.lines}L
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
