"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [emelia, setEmelia] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then(r => r.json())
      .then(d => setData(d))
      .catch(e => setError(e.message));
    fetch("/api/emelia")
      .then(r => r.json())
      .then(d => setEmelia(d))
      .catch(() => {}); // non-blocking
  }, []);

  if (error) return (
    <div style={{padding: 40, color: '#f85149', fontFamily: 'monospace'}}>
      <h2>❌ ERROR: {error}</h2>
    </div>
  );

  if (!data) return (
    <div style={{padding: 40, color: '#8b949e', fontFamily: 'monospace'}}>
      ⏳ Loading dashboard...
    </div>
  );

  const s = data.stats;

  return (
    <div style={{padding: 20, fontFamily: "'Courier New', monospace", maxWidth: 900, margin: '0 auto'}}>
      <h1 style={{color: '#e6edf3', fontSize: 18, letterSpacing: 3, marginBottom: 20}}>
        JARVIS COMMAND CENTER <span style={{color: '#3fb950'}}>● ONLINE</span>
      </h1>

      {/* Stats grid */}
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 24}}>
        {[
          {label: 'AGENTS', value: s.agentsCount, color: '#58a6ff'},
          {label: 'SKILLS', value: s.skillsCount, color: '#bc8cff'},
          {label: 'EMAILS SENT', value: emelia?.stats?.sent || s.emailsSent, color: '#3fb950'},
          {label: 'TASKS DONE', value: s.tasksDone, color: '#d29922'},
          {label: 'TASKS BACKLOG', value: s.tasksBacklog, color: '#8b949e'},
          {label: 'CAMPAIGNS', value: s.campaignsDone, color: '#f97316'},
        ].map((stat, i) => (
          <div key={i} style={{border: '1px solid #30363d', background: '#161b22', padding: 16}}>
            <div style={{fontSize: 9, color: '#8b949e', letterSpacing: 2, marginBottom: 6}}>{stat.label}</div>
            <div style={{fontSize: 24, color: stat.color, fontWeight: 700}}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Emelia Campaign Stats */}
      {emelia && emelia.stats && (
        <div style={{border: '1px solid #30363d', background: '#161b22', padding: 16, marginBottom: 16}}>
          {/* Header */}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14}}>
            <div style={{fontSize: 11, color: '#e6edf3', letterSpacing: 1, fontWeight: 700}}>
              📧 {emelia.campaign?.name || 'Campaign'}
            </div>
            <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
              <span style={{fontSize: 9, color: '#8b949e'}}>
                {emelia.campaign?.totalContacts?.toLocaleString()} contacts • {emelia.campaign?.dailyContact}/jour
              </span>
              <span style={{fontSize: 9, color: emelia.campaign?.status === 'RUNNING' ? '#3fb950' : '#8b949e'}}>
                ● {emelia.campaign?.status}
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 8, marginBottom: 14}}>
            {[
              {label: 'ENVOYÉS', value: emelia.stats.sent?.toLocaleString(), color: '#58a6ff'},
              {label: 'OUVERTS', value: emelia.stats.opened?.toLocaleString(), color: '#3fb950'},
              {label: 'TAUX OUVERTURE', value: emelia.stats.openRate + '%', color: '#3fb950'},
              {label: 'RÉPONSES', value: emelia.stats.replied, color: '#f0883e'},
              {label: 'TAUX RÉPONSE', value: emelia.stats.replyRate + '%', color: '#f0883e'},
              {label: 'BOUNCES', value: emelia.stats.bounced, color: '#f85149'},
            ].map((stat, i) => (
              <div key={i} style={{padding: 10, border: '1px solid #21262d', background: '#0d1117', textAlign: 'center'}}>
                <div style={{fontSize: 8, color: '#8b949e', letterSpacing: 1, marginBottom: 4}}>{stat.label}</div>
                <div style={{fontSize: 20, color: stat.color, fontWeight: 700}}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {emelia.campaign?.totalContacts > 0 && (
            <div style={{marginBottom: 14}}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 4}}>
                <span style={{fontSize: 8, color: '#8b949e', letterSpacing: 1}}>PROGRESSION CAMPAGNE</span>
                <span style={{fontSize: 8, color: '#58a6ff'}}>
                  {emelia.stats.sent} / {emelia.campaign.totalContacts?.toLocaleString()} ({Math.round((emelia.stats.sent / emelia.campaign.totalContacts) * 100)}%)
                </span>
              </div>
              <div style={{height: 6, background: '#21262d', borderRadius: 3, overflow: 'hidden'}}>
                <div style={{
                  height: '100%',
                  width: Math.min(100, (emelia.stats.sent / emelia.campaign.totalContacts) * 100) + '%',
                  background: 'linear-gradient(90deg, #1f6feb, #58a6ff)',
                  borderRadius: 3,
                  transition: 'width 0.5s ease',
                }} />
              </div>
            </div>
          )}

          {/* Sent by day chart */}
          {emelia.sentByDay && Object.keys(emelia.sentByDay).length > 0 && (
            <div style={{marginBottom: 14}}>
              <div style={{fontSize: 9, color: '#8b949e', letterSpacing: 1, marginBottom: 6}}>ENVOIS PAR JOUR</div>
              <div style={{display: 'flex', gap: 4, alignItems: 'end', height: 60}}>
                {Object.entries(emelia.sentByDay).sort().map(([day, count]: [string, any]) => {
                  const maxSent = Math.max(...Object.values(emelia.sentByDay).map(Number));
                  const height = maxSent > 0 ? Math.max(4, (count / maxSent) * 50) : 4;
                  const opens = emelia.opensByDay?.[day] || 0;
                  const replies = emelia.repliesByDay?.[day] || 0;
                  return (
                    <div key={day} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}} title={`${day}\n${count} envoyés\n${opens} ouverts\n${replies} réponses`}>
                      <div style={{fontSize: 8, color: '#58a6ff', marginBottom: 2}}>{count}</div>
                      <div style={{width: '100%', maxWidth: 50, height, background: 'linear-gradient(180deg, #1f6feb, #0d419d)', borderRadius: 2}} />
                      <div style={{fontSize: 8, color: '#6e7681', marginTop: 3}}>{day.slice(5)}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Replies section */}
          {emelia.replies && emelia.replies.length > 0 && (
            <div style={{borderTop: '1px solid #21262d', paddingTop: 10}}>
              <div style={{fontSize: 10, color: '#f0883e', letterSpacing: 1, marginBottom: 8, fontWeight: 700}}>
                🔥 RÉPONSES REÇUES ({emelia.replies.length})
              </div>
              <div style={{display: 'grid', gap: 6}}>
                {emelia.replies.map((r: any, i: number) => {
                  const d = new Date(Number(r.date));
                  const isToday = new Date().toDateString() === d.toDateString();
                  return (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '8px 12px', background: '#0d1117', border: '1px solid #30363d', borderRadius: 4,
                      borderLeft: '3px solid #f0883e',
                    }}>
                      <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                        <span style={{fontSize: 14}}>💬</span>
                        <div>
                          <div style={{fontSize: 11, color: '#e6edf3'}}>
                            Réponse #{i + 1} — Étape {r.step + 1}
                          </div>
                          <div style={{fontSize: 9, color: '#8b949e', marginTop: 2}}>
                            {isNaN(d.getTime()) ? r.date : d.toLocaleString('fr-FR', {
                              weekday: 'short', day: '2-digit', month: '2-digit',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      {isToday && (
                        <span style={{fontSize: 8, color: '#3fb950', background: '#0d2818', padding: '2px 6px', borderRadius: 8, fontWeight: 700}}>
                          AUJOURD&apos;HUI
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{fontSize: 8, color: '#484f58', marginTop: 10, textAlign: 'right'}}>
            Dernière mise à jour : {emelia.fetchedAt ? new Date(emelia.fetchedAt).toLocaleString('fr-FR', {hour: '2-digit', minute: '2-digit', second: '2-digit'}) : '—'} • Cache 5min
          </div>
        </div>
      )}

      {/* Projects */}
      <div style={{border: '1px solid #30363d', background: '#161b22', padding: 16, marginBottom: 16}}>
        <div style={{fontSize: 10, color: '#8b949e', letterSpacing: 2, marginBottom: 12}}>ACTIVE PROJECTS</div>
        {data.projects?.map((p: any, i: number) => (
          <div key={i} style={{display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #21262d'}}>
            <span style={{color: '#e6edf3', fontSize: 12}}>{p.name}</span>
            <span style={{color: '#8b949e', fontSize: 11}}>{p.status}</span>
          </div>
        ))}
      </div>

      {/* Agents */}
      <div style={{border: '1px solid #30363d', background: '#161b22', padding: 16, marginBottom: 16}}>
        <div style={{fontSize: 10, color: '#8b949e', letterSpacing: 2, marginBottom: 12}}>AGENTS ({data.agents?.length})</div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8}}>
          {data.agents?.map((a: any, i: number) => (
            <div key={i} style={{fontSize: 11, color: '#58a6ff', padding: '4px 8px', border: '1px solid #30363d'}}>
              {a.name}
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 20}}>
        {['projets','tasks','campaigns','pipeline','candidatures','monitoring','training','agents','office'].map(p => (
          <Link key={p} href={`/${p}`} style={{padding: '6px 12px', border: '1px solid #30363d', color: '#8b949e', fontSize: 11, textDecoration: 'none', fontFamily: 'monospace', letterSpacing: 1}}>
            {p.toUpperCase()}
          </Link>
        ))}
      </div>
    </div>
  );
}
