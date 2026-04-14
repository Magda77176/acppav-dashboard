"use client";
import { useEffect, useState } from "react";

interface Campaign {
  id: string;
  type: "email" | "linkedin";
  name: string;
  date: string;
  status: "planned" | "in_progress" | "done" | "failed";
  target: string;
  details: Record<string, any>;
  result: string | null;
}

const STATUS_POINT: Record<string, string> = {
  planned: "#33ff33",
  in_progress: "#ff3333", 
  done: "#33ff33",
  failed: "#ff3333",
};
const STATUS_LABEL: Record<string, string> = {
  planned: "PLANIFIE",
  in_progress: "EN COURS",
  done: "TERMINE",
  failed: "ECHEC",
};
const STATUS_STYLE: Record<string, string> = {
  planned: "bg-blue-500 text-black",
  in_progress: "bg-amber-500 text-black",
  done: "bg-green-500 text-black",
  failed: "bg-red-500 text-black",
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"email" | "linkedin">("email");
  const [formName, setFormName] = useState("");
  const [formDate, setFormDate] = useState("2026-03-04");
  const [formTarget, setFormTarget] = useState("Photographes — Saphir Noir");
  const [formCities, setFormCities] = useState("");
  const [formCount, setFormCount] = useState(25);
  const [formAction, setFormAction] = useState("message");
  const [formDegree, setFormDegree] = useState("1st");
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/campaigns").then(r => r.json()).then(setCampaigns);
  }, []);

  const handleAdd = async () => {
    const newCamp: any = {
      type: formType,
      name: formName,
      date: formDate,
      status: "planned",
      target: formTarget,
      result: null,
    };
    if (formType === "email") {
      newCamp.details = {
        cities: formCities.split(",").map(c => c.trim()),
        count: formCount,
        sent: 0,
        template: "personnalisé",
      };
    } else {
      newCamp.details = { action: formAction, degree: formDegree, count: formCount };
    }
    await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newCamp) });
    const updated = await fetch("/api/campaigns").then(r => r.json());
    setCampaigns(updated);
    setShowForm(false);
    setFormName("");
    setFormCities("");
  };

  const dates = Array.from(new Set(campaigns.map(c => c.date))).sort().reverse();
  const filtered = filter === "all" ? campaigns : campaigns.filter(c => c.date === filter);

  const todayEmail = campaigns.filter(c => c.date === "2026-03-03" && c.type === "email" && c.status === "done");
  const todayLinkedin = campaigns.filter(c => c.date === "2026-03-03" && c.type === "linkedin" && c.status === "done");
  const plannedCount = campaigns.filter(c => c.status === "planned").length;
  const totalSent = todayEmail.reduce((sum, c) => sum + (c.details?.sent || 0), 0);

  return (
    <div 
      className="max-w-6xl mx-auto space-y-6"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 
            className="text-xl font-bold"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            CAMPAIGNS
          </h1>
          <p 
            className="text-sm"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            PLANIFIER ET SUIVRE EMAILS/LINKEDIN
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-medium"
          style={{ 
            backgroundColor: '#000000',
            color: '#33ff33',
            border: '1px solid #33ff33',
            fontFamily: "'Courier New', 'Consolas', monospace"
          }}
          onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
          onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #33ff33'}
        >
          NOUVELLE CAMPAGNE
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div 
          className="p-4 text-center"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {totalSent}
          </div>
          <p 
            className="text-[10px]"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            EMAILS ENVOYES
          </p>
        </div>
        <div 
          className="p-4 text-center"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {todayLinkedin.length}
          </div>
          <p 
            className="text-[10px]"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            ACTIONS LINKEDIN
          </p>
        </div>
        <div 
          className="p-4 text-center"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {plannedCount}
          </div>
          <p 
            className="text-[10px]"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            PLANIFIEES
          </p>
        </div>
        <div 
          className="p-4 text-center"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <div 
            className="text-2xl font-bold"
            style={{ 
              color: '#e0e0e0',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {campaigns.filter(c => c.status === "done").length}
          </div>
          <p 
            className="text-[10px]"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            TERMINEES
          </p>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <div 
          className="p-5 space-y-4"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <h3 
            className="font-semibold text-sm"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            NOUVELLE CAMPAGNE
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label 
                className="text-xs block mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                TYPE
              </label>
              <select 
                value={formType} 
                onChange={e => setFormType(e.target.value as any)} 
                className="w-full px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #222',
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                <option value="email">EMAIL</option>
                <option value="linkedin">LINKEDIN</option>
              </select>
            </div>
            <div>
              <label 
                className="text-xs block mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                DATE
              </label>
              <input 
                type="date" 
                value={formDate} 
                onChange={e => setFormDate(e.target.value)} 
                className="w-full px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #222',
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              />
            </div>
            <div>
              <label 
                className="text-xs block mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                NOM
              </label>
              <input 
                value={formName} 
                onChange={e => setFormName(e.target.value)} 
                placeholder="PHOTOGRAPHES LYON/MARSEILLE" 
                className="w-full px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #222',
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              />
            </div>
            <div>
              <label 
                className="text-xs block mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                CIBLE
              </label>
              <select 
                value={formTarget} 
                onChange={e => setFormTarget(e.target.value)} 
                className="w-full px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #222',
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                <option>PHOTOGRAPHES SAPHIR NOIR</option>
                <option>MARIAGES SAPHIR NOIR</option>
                <option>INFINITY MEDICAL DENTISTES</option>
                <option>INFINITY MEDICAL CHIRURGIENS</option>
                <option>BTP AGENCE EVE</option>
              </select>
            </div>
            {formType === "email" ? (
              <div>
                <label 
                  className="text-xs block mb-1"
                  style={{ 
                    color: '#666',
                    fontFamily: "'Courier New', 'Consolas', monospace",
                    letterSpacing: '0.1em'
                  }}
                >
                  VILLES SEPAREES PAR VIRGULE
                </label>
                <input 
                  value={formCities} 
                  onChange={e => setFormCities(e.target.value)} 
                  placeholder="LYON, MARSEILLE, MONTPELLIER" 
                  className="w-full px-3 py-2 text-sm"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222',
                    color: '#e0e0e0',
                    fontFamily: "'Courier New', 'Consolas', monospace"
                  }}
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1">
                  <label 
                    className="text-xs block mb-1"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace",
                      letterSpacing: '0.1em'
                    }}
                  >
                    ACTION
                  </label>
                  <select 
                    value={formAction} 
                    onChange={e => setFormAction(e.target.value)} 
                    className="w-full px-3 py-2 text-sm"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '1px solid #222',
                      color: '#e0e0e0',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    <option value="message">MESSAGE</option>
                    <option value="invite">INVITATION</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label 
                    className="text-xs block mb-1"
                    style={{ 
                      color: '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace",
                      letterSpacing: '0.1em'
                    }}
                  >
                    DEGRE
                  </label>
                  <select 
                    value={formDegree} 
                    onChange={e => setFormDegree(e.target.value)} 
                    className="w-full px-3 py-2 text-sm"
                    style={{ 
                      backgroundColor: '#000000',
                      border: '1px solid #222',
                      color: '#e0e0e0',
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    <option value="1st">1ER DEGRE</option>
                    <option value="2nd">2E DEGRE</option>
                  </select>
                </div>
              </div>
            )}
            <div>
              <label 
                className="text-xs block mb-1"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                NOMBRE
              </label>
              <input 
                type="number" 
                value={formCount} 
                onChange={e => setFormCount(Number(e.target.value))} 
                className="w-full px-3 py-2 text-sm"
                style={{ 
                  backgroundColor: '#000000',
                  border: '1px solid #222',
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleAdd} 
              className="px-4 py-2 text-sm font-medium"
              style={{ 
                backgroundColor: '#000000',
                color: '#33ff33',
                border: '1px solid #33ff33',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
              onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
              onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #33ff33'}
            >
              PLANIFIER
            </button>
            <button 
              onClick={() => setShowForm(false)} 
              className="px-4 py-2 text-sm"
              style={{ 
                backgroundColor: '#000000',
                color: '#666',
                border: '1px solid #222',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
              onMouseEnter={(e) => e.currentTarget.style.border = '1px solid #e0e0e0'}
              onMouseLeave={(e) => e.currentTarget.style.border = '1px solid #222'}
            >
              ANNULER
            </button>
          </div>
        </div>
      )}

      {/* Date filter */}
      <div className="flex gap-2 flex-wrap">
        <button 
          onClick={() => setFilter("all")} 
          className="px-3 py-1.5 text-xs font-medium"
          style={{ 
            backgroundColor: '#000000',
            color: filter === "all" ? '#e0e0e0' : '#666',
            border: filter === "all" ? '1px solid #e0e0e0' : '1px solid #222',
            fontFamily: "'Courier New', 'Consolas', monospace",
            letterSpacing: '0.1em'
          }}
        >
          TOUS
        </button>
        {dates.map(d => (
          <button 
            key={d} 
            onClick={() => setFilter(d)} 
            className="px-3 py-1.5 text-xs font-medium"
            style={{ 
              backgroundColor: '#000000',
              color: filter === d ? '#e0e0e0' : '#666',
              border: filter === d ? '1px solid #e0e0e0' : '1px solid #222',
              fontFamily: "'Courier New', 'Consolas', monospace"
            }}
          >
            {new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
          </button>
        ))}
      </div>

      {/* Campaign list grouped by date */}
      {dates.filter(d => filter === "all" || d === filter).map(date => {
        const dayCamps = campaigns.filter(c => c.date === date);
        const dayEmails = dayCamps.filter(c => c.type === "email").reduce((s, c) => s + (c.details?.sent || c.details?.count || 0), 0);
        const dayLinkedin = dayCamps.filter(c => c.type === "linkedin").length;
        return (
          <div key={date} className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 
                className="font-semibold text-sm"
                style={{ 
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace",
                  letterSpacing: '0.1em'
                }}
              >
                {new Date(date + "T00:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase()}
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
                {dayEmails} EMAILS · {dayLinkedin} LINKEDIN
              </span>
            </div>
            <div className="space-y-2">
              {dayCamps.map(c => (
                <div 
                  key={c.id} 
                  className="p-3 sm:p-4 flex items-start gap-3 sm:gap-4"
                  style={{ 
                    backgroundColor: '#000000',
                    border: '1px solid #222'
                  }}
                >
                  <span 
                    className="text-xl mt-0.5"
                    style={{ 
                      color: STATUS_POINT[c.status],
                      fontFamily: "'Courier New', 'Consolas', monospace"
                    }}
                  >
                    ●
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="text-sm font-medium"
                        style={{ 
                          color: '#e0e0e0',
                          fontFamily: "'Courier New', 'Consolas', monospace"
                        }}
                      >
                        {c.name}
                      </span>
                      <span 
                        className="px-2 py-0.5 text-[10px] font-medium"
                        style={{ 
                          color: '#666',
                          fontFamily: "'Courier New', 'Consolas', monospace",
                          letterSpacing: '0.1em'
                        }}
                      >
                        {STATUS_LABEL[c.status]}
                      </span>
                      <span 
                        className="px-2 py-0.5 text-[10px] font-medium"
                        style={{ 
                          color: '#666',
                          fontFamily: "'Courier New', 'Consolas', monospace",
                          letterSpacing: '0.1em'
                        }}
                      >
                        {c.type.toUpperCase()}
                      </span>
                    </div>
                    <p 
                      className="text-xs"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {c.target}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {c.details?.cities && (
                        <span 
                          className="text-[10px] px-2 py-0.5"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#666',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.details.cities.join(", ")}
                        </span>
                      )}
                      {c.details?.count && (
                        <span 
                          className="text-[10px] px-2 py-0.5"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#666',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.details.sent || 0}/{c.details.count}
                        </span>
                      )}
                      {c.details?.action && (
                        <span 
                          className="text-[10px] px-2 py-0.5"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#666',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.details.action} ({c.details.degree})
                        </span>
                      )}
                      {c.details?.profile && (
                        <span 
                          className="text-[10px] px-2 py-0.5"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#666',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.details.profile}
                        </span>
                      )}
                      {c.details?.profiles && (
                        <span 
                          className="text-[10px] px-2 py-0.5"
                          style={{ 
                            backgroundColor: '#000000',
                            color: '#666',
                            border: '1px solid #222',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.details.profiles.length} PROFILS
                        </span>
                      )}
                    </div>
                    {c.result && (
                      <p 
                        className="text-xs mt-2"
                        style={{ 
                          color: '#33ff33',
                          fontFamily: "'Courier New', 'Consolas', monospace"
                        }}
                      >
                        → {c.result}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
