"use client";
import { useEffect, useState } from "react";

interface CronJob {
  id: string;
  name: string;
  schedule: string;
  tz: string;
  type: string;
  payload: string;
  lastStatus: string;
  lastError: string | null;
  lastRun: string;
  nextRun: string;
  consecutiveErrors: number;
}

function parseCronDays(expr: string): number[] {
  // Parse day-of-week from cron: 0=Sun, 1=Mon...6=Sat
  const parts = expr.split(" ");
  const dow = parts[4] || "*";
  if (dow === "*") return [0, 1, 2, 3, 4, 5, 6];
  if (dow.includes("-")) {
    const [a, b] = dow.split("-").map(Number);
    const days = [];
    for (let i = a; i <= b; i++) days.push(i);
    return days;
  }
  return dow.split(",").map(Number);
}

function getCronHour(expr: string): string {
  const parts = expr.split(" ");
  return `${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`;
}

export default function CalendarPage() {
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [month] = useState(2); // March 2026 (0-indexed)
  const [year] = useState(2026);

  useEffect(() => {
    fetch("/api/crons").then(r => r.json()).then(setCrons);
  }, []);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
  // Monday-first: shift so Mon=0
  const startOffset = (firstDow + 6) % 7;

  const getCronsForDay = (day: number) => {
    const date = new Date(year, month, day);
    const jsDow = date.getDay(); // 0=Sun
    return crons.filter(c => {
      const cronDays = parseCronDays(c.schedule);
      return cronDays.includes(jsDow);
    });
  };

  const dayNames = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const today = new Date().getDate();

  return (
    <div 
      className="max-w-5xl mx-auto space-y-6"
      style={{ 
        backgroundColor: '#000000',
        fontFamily: "'Courier New', 'Consolas', monospace"
      }}
    >
      <h1 
        className="text-xl font-bold"
        style={{ 
          color: '#e0e0e0',
          fontFamily: "'Courier New', 'Consolas', monospace",
          letterSpacing: '0.1em'
        }}
      >
        CALENDAR
      </h1>
      <p 
        className="text-sm"
        style={{ 
          color: '#666',
          fontFamily: "'Courier New', 'Consolas', monospace",
          letterSpacing: '0.1em'
        }}
      >
        CRON JOBS ET TACHES PLANIFIEES — MARS 2026
      </p>

      {/* Cron summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {crons.map(c => (
          <div 
            key={c.id} 
            className="p-3"
            style={{ 
              backgroundColor: '#000000',
              border: '1px solid #222'
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="w-2 h-2"
                style={{ 
                  backgroundColor: c.lastStatus === "ok" ? "#33ff33" : "#ff3333",
                  display: 'inline-block'
                }}
              >
                ●
              </span>
              <span 
                className="text-xs font-medium truncate"
                style={{ 
                  color: '#e0e0e0',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                {c.name}
              </span>
            </div>
            <p 
              className="text-[10px]"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace"
              }}
            >
              {getCronHour(c.schedule)} {c.tz}
            </p>
            {c.lastError && (
              <p 
                className="text-[10px] mt-1"
                style={{ 
                  color: '#ff3333',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                {c.lastError}
              </p>
            )}
            {c.consecutiveErrors > 0 && (
              <p 
                className="text-[10px]"
                style={{ 
                  color: '#ff3333',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                {c.consecutiveErrors} ERREURS CONSECUTIVES
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div 
        className="p-5"
        style={{ 
          backgroundColor: '#000000',
          border: '1px solid #222'
        }}
      >
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
          {dayNames.map(d => (
            <div 
              key={d} 
              className="text-center text-[9px] sm:text-xs font-medium py-1"
              style={{ 
                color: '#666',
                fontFamily: "'Courier New', 'Consolas', monospace",
                letterSpacing: '0.1em'
              }}
            >
              {d.toUpperCase()}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {Array.from({ length: startOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="h-14 sm:h-20"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayCrons = getCronsForDay(day);
            const hasError = dayCrons.some(c => c.lastStatus !== "ok");
            const isToday = day === today;
            const isSelected = day === selectedDay;
            const isPast = day < today;

            return (
              <div
                key={day}
                onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                className="h-14 sm:h-20 p-1 sm:p-1.5 cursor-pointer"
                style={{
                  backgroundColor: '#000000',
                  border: isSelected ? '1px solid #e0e0e0' : isToday ? '1px solid #666' : '1px solid #222',
                  opacity: isPast ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && !isToday) {
                    e.currentTarget.style.border = '1px solid #666';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && !isToday) {
                    e.currentTarget.style.border = '1px solid #222';
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span 
                    className="text-xs"
                    style={{ 
                      color: isToday ? '#e0e0e0' : '#666',
                      fontFamily: "'Courier New', 'Consolas', monospace",
                      fontWeight: isToday ? 'bold' : 'normal'
                    }}
                  >
                    {day}
                  </span>
                  {dayCrons.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayCrons.map(c => (
                        <span 
                          key={c.id} 
                          className="w-1.5 h-1.5"
                          style={{ 
                            backgroundColor: c.lastStatus === "ok" ? "#33ff33" : "#ff3333",
                            display: 'inline-block'
                          }}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-1 space-y-0.5">
                  {dayCrons.slice(0, 3).map(c => (
                    <div 
                      key={c.id} 
                      className="text-[8px] truncate"
                      style={{ 
                        color: '#666',
                        fontFamily: "'Courier New', 'Consolas', monospace"
                      }}
                    >
                      {getCronHour(c.schedule)} {c.name.split(' ')[0]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day detail */}
      {selectedDay && (
        <div 
          className="p-5"
          style={{ 
            backgroundColor: '#000000',
            border: '1px solid #222'
          }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{ 
              color: '#666',
              fontFamily: "'Courier New', 'Consolas', monospace",
              letterSpacing: '0.1em'
            }}
          >
            {selectedDay} MARS 2026
          </h3>
          <div className="space-y-3">
            {getCronsForDay(selectedDay).length === 0 ? (
              <p 
                className="text-sm"
                style={{ 
                  color: '#666',
                  fontFamily: "'Courier New', 'Consolas', monospace"
                }}
              >
                AUCUNE TACHE PLANIFIEE
              </p>
            ) : (
              getCronsForDay(selectedDay).map(c => {
                const dayStr = `2026-03-${String(selectedDay).padStart(2, "0")}`;
                const histEntry = (c as any).history?.find((h: any) => h.date === dayStr);
                return (
                  <div 
                    key={c.id} 
                    className="p-3"
                    style={{ 
                      backgroundColor: '#0a0a0a',
                      border: '1px solid #222'
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className="w-3 h-3 mt-0.5 shrink-0"
                        style={{ 
                          backgroundColor: histEntry ? (histEntry.status === "ok" ? "#33ff33" : "#ff3333") : "#666",
                          display: 'inline-block'
                        }}
                      >
                        ●
                      </span>
                      <div className="flex-1">
                        <p 
                          className="text-sm font-medium"
                          style={{ 
                            color: '#e0e0e0',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.name}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ 
                            color: '#666',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {getCronHour(c.schedule)} ({c.tz}) · {c.type}
                        </p>
                        <p 
                          className="text-xs mt-1"
                          style={{ 
                            color: '#666',
                            fontFamily: "'Courier New', 'Consolas', monospace"
                          }}
                        >
                          {c.payload}
                        </p>
                        {histEntry ? (
                          <div 
                            className="mt-2 p-2"
                            style={{ 
                              backgroundColor: '#000000',
                              border: '1px solid #222'
                            }}
                          >
                            <p 
                              className="text-xs"
                              style={{ 
                                color: '#e0e0e0',
                                fontFamily: "'Courier New', 'Consolas', monospace"
                              }}
                            >
                              {histEntry.status === "ok" ? "EXECUTE" : "ERREUR"} — DUREE: {histEntry.duration}
                              {histEntry.articles && ` · ${histEntry.articles} ARTICLES`}
                              {histEntry.ideas && ` · ${histEntry.ideas} IDEES`}
                            </p>
                            {histEntry.error && (
                              <p 
                                className="text-xs mt-1"
                                style={{ 
                                  color: '#ff3333',
                                  fontFamily: "'Courier New', 'Consolas', monospace"
                                }}
                              >
                                {histEntry.error}
                              </p>
                            )}
                          </div>
                        ) : selectedDay > today ? (
                          <p 
                            className="text-xs mt-2"
                            style={{ 
                              color: '#666',
                              fontFamily: "'Courier New', 'Consolas', monospace"
                            }}
                          >
                            PLANIFIE
                          </p>
                        ) : (
                          <p 
                            className="text-xs mt-2"
                            style={{ 
                              color: '#666',
                              fontFamily: "'Courier New', 'Consolas', monospace"
                            }}
                          >
                            PAS DE DONNEES
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
