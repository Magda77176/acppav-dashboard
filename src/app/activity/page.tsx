"use client";
import { useEffect, useState } from "react";

const S = {
  bg: '#000000', font: "'Courier New', 'Consolas', monospace",
  text: '#e0e0e0', dim: '#666', green: '#4ade80', red: '#f87171',
  yellow: '#facc15', blue: '#60a5fa', purple: '#c084fc', border: '#222',
};

const ACTION_COLORS: Record<string, string> = {
  candidature: S.blue, email: S.purple, linkedin: '#0a66c2',
  article: S.green, seo: S.yellow, prospection: '#f97316',
  design: '#ec4899', audit: S.yellow, deploy: S.green,
};

const STATUS_ICONS: Record<string, string> = {
  success: '✅', failed: '🔴', skipped: '⏭️', info: 'ℹ️',
  running: '⏳', warning: '⚠️', unconfirmed: '❓',
};

const AGENT_EMOJIS: Record<string, string> = {
  'agent-sullivan': '🎯', 'prospection': '🔍', 'copywriter-email': '✉️',
  'linkedin-outreach': '💼', 'seo-expert': '📊', 'copywriter': '✍️',
  'acppav': '💊', 'content-machine': '⚡', 'commercial-medical': '🏥',
  'da-uiux': '🎨', 'money-brain': '💰', 'Jarvis': '🤖',
};

export default function ActivityPage() {
  const [data, setData] = useState<any>(null);
  const [filterAgent, setFilterAgent] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const [filterProject, setFilterProject] = useState<string>("");

  const refresh = () => {
    const params = new URLSearchParams();
    if (filterAgent) params.set("agent", filterAgent);
    if (filterAction) params.set("action", filterAction);
    if (filterProject) params.set("project", filterProject);
    params.set("limit", "200");
    fetch(`/api/events?${params}`).then(r => r.json()).then(setData);
  };

  useEffect(() => { refresh(); const i = setInterval(refresh, 15000); return () => clearInterval(i); }, [filterAgent, filterAction, filterProject]);

  if (!data) return (
    <div className="flex items-center justify-center h-96" style={{ backgroundColor: S.bg, fontFamily: S.font }}>
      <div className="animate-spin w-8 h-8" style={{ border: `2px solid ${S.border}`, borderTop: `2px solid ${S.text}`, borderRadius: '50%' }} />
    </div>
  );

  const { events, stats } = data;

  return (
    <div className="max-w-7xl mx-auto p-6" style={{ backgroundColor: S.bg, fontFamily: S.font, minHeight: '100vh' }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: S.text, letterSpacing: '0.1em' }}>
        ACTIVITY FEED
      </h1>
      <p className="mb-6" style={{ color: S.dim, fontSize: '0.75rem' }}>
        Toutes les actions de tous les agents — temps réel (15s refresh)
      </p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3" style={{ border: `1px solid ${S.border}` }}>
          <div style={{ color: S.dim, fontSize: '0.65rem', letterSpacing: '0.1em' }}>TOTAL EVENTS</div>
          <div style={{ color: S.text, fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.total}</div>
        </div>
        <div className="p-3" style={{ border: `1px solid ${S.border}` }}>
          <div style={{ color: S.dim, fontSize: '0.65rem', letterSpacing: '0.1em' }}>AGENTS ACTIFS</div>
          <div style={{ color: S.blue, fontSize: '1.3rem', fontWeight: 'bold' }}>{Object.keys(stats.by_agent || {}).length}</div>
        </div>
        <div className="p-3" style={{ border: `1px solid ${S.border}` }}>
          <div style={{ color: S.dim, fontSize: '0.65rem', letterSpacing: '0.1em' }}>SUCCÈS</div>
          <div style={{ color: S.green, fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.by_status?.success || 0}</div>
        </div>
        <div className="p-3" style={{ border: `1px solid ${S.border}` }}>
          <div style={{ color: S.dim, fontSize: '0.65rem', letterSpacing: '0.1em' }}>ÉCHECS</div>
          <div style={{ color: S.red, fontSize: '1.3rem', fontWeight: 'bold' }}>{stats.by_status?.failed || 0}</div>
        </div>
      </div>

      {/* Agent breakdown */}
      <div className="mb-6 p-4" style={{ border: `1px solid ${S.border}` }}>
        <div style={{ color: S.dim, fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: '8px' }}>PAR AGENT</div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(stats.by_agent || {}).sort((a: any, b: any) => b[1] - a[1]).map(([agent, count]) => (
            <button
              key={agent}
              onClick={() => setFilterAgent(filterAgent === agent ? "" : agent)}
              className="flex items-center gap-1 px-2 py-1"
              style={{
                border: `1px solid ${filterAgent === agent ? S.text : S.border}`,
                backgroundColor: filterAgent === agent ? '#111' : 'transparent',
                color: filterAgent === agent ? S.text : S.dim,
                fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              <span>{AGENT_EMOJIS[agent] || '🔹'}</span>
              <span>{agent}</span>
              <span style={{ color: S.green, fontWeight: 'bold' }}>{count as number}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Action type filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {Object.entries(stats.by_action || {}).sort((a: any, b: any) => b[1] - a[1]).map(([action, count]) => (
          <button
            key={action}
            onClick={() => setFilterAction(filterAction === action ? "" : action)}
            className="px-2 py-1"
            style={{
              border: `1px solid ${filterAction === action ? (ACTION_COLORS[action] || S.text) : S.border}`,
              color: filterAction === action ? (ACTION_COLORS[action] || S.text) : S.dim,
              fontSize: '0.7rem', cursor: 'pointer',
              backgroundColor: filterAction === action ? '#111' : 'transparent',
            }}
          >
            {action.toUpperCase()} ({count as number})
          </button>
        ))}
      </div>

      {/* Event Stream */}
      <div>
        {events.map((evt: any) => {
          const time = new Date(evt.timestamp);
          const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const dateStr = time.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });

          return (
            <div
              key={evt.id}
              className="flex items-start gap-3 py-3 px-3"
              style={{ borderBottom: `1px solid ${S.border}` }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0a0a0a'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {/* Timestamp */}
              <div className="flex-shrink-0 text-right" style={{ width: '70px' }}>
                <div style={{ color: S.dim, fontSize: '0.7rem' }}>{dateStr}</div>
                <div style={{ color: S.dim, fontSize: '0.75rem' }}>{timeStr}</div>
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0" style={{ fontSize: '0.9rem', width: '20px', textAlign: 'center' }}>
                {STATUS_ICONS[evt.status] || '•'}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span style={{ color: ACTION_COLORS[evt.action] || S.text, fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                    {evt.action?.toUpperCase()}
                  </span>
                  <span style={{ color: S.dim, fontSize: '0.7rem' }}>·</span>
                  <span style={{ color: S.dim, fontSize: '0.7rem' }}>
                    {AGENT_EMOJIS[evt.agent] || ''} {evt.agent}
                  </span>
                  {evt.project && evt.project !== '—' && (
                    <>
                      <span style={{ color: S.dim, fontSize: '0.7rem' }}>·</span>
                      <span style={{ color: S.dim, fontSize: '0.7rem' }}>{evt.project}</span>
                    </>
                  )}
                  {evt.verified && (
                    <span style={{ color: S.green, fontSize: '0.65rem' }} title="Vérifié par snapshot">✓ verified</span>
                  )}
                </div>
                <div style={{ color: S.text, fontSize: '0.85rem' }}>{evt.summary}</div>
              </div>
            </div>
          );
        })}

        {events.length === 0 && (
          <div className="py-12 text-center" style={{ color: S.dim }}>
            Aucun événement {filterAgent || filterAction ? 'avec ces filtres' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
