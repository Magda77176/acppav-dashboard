"use client";
import { useEffect, useState } from "react";

const S = {
  bg: '#000000',
  font: "'Courier New', 'Consolas', monospace",
  text: '#e0e0e0',
  dim: '#666',
  green: '#4ade80',
  red: '#f87171',
  yellow: '#facc15',
  blue: '#60a5fa',
  border: '#222',
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    applied: S.green,
    skipped: S.dim,
    failed: S.red,
    unconfirmed: S.yellow,
    running: S.blue,
    done: S.green,
  };
  const labels: Record<string, string> = {
    applied: '✅ POSTULÉ',
    skipped: '⏭️ SKIP',
    failed: '🔴 ERREUR',
    unconfirmed: '❓ NON CONFIRMÉ',
    running: '⏳ EN COURS',
    done: '✅ TERMINÉ',
  };
  return (
    <span style={{ color: colors[status] || S.dim, fontFamily: S.font, fontSize: '0.8rem' }}>
      {labels[status] || status}
    </span>
  );
}

export default function CandidaturesPage() {
  const [data, setData] = useState<any>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/candidatures").then(r => r.json()).then(setData);
    // Auto-refresh every 30s for live runs
    const interval = setInterval(() => {
      fetch("/api/candidatures").then(r => r.json()).then(setData);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-96" style={{ backgroundColor: S.bg, fontFamily: S.font }}>
      <div className="animate-spin w-8 h-8" style={{ border: `2px solid ${S.border}`, borderTop: `2px solid ${S.text}`, borderRadius: '50%' }} />
    </div>
  );

  const { runs, stats } = data;

  return (
    <div className="max-w-7xl mx-auto p-6" style={{ backgroundColor: S.bg, fontFamily: S.font, minHeight: '100vh' }}>
      {/* Header */}
      <h1 className="text-2xl font-bold mb-6" style={{ color: S.text, letterSpacing: '0.1em' }}>
        CANDIDATURES FREELANCE
      </h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'TOTAL POSTULÉES', value: stats.total_applied, color: S.green },
          { label: 'RUNS', value: stats.total_runs, color: S.text },
          { label: 'MOY/RUN', value: stats.avg_per_run, color: stats.avg_per_run >= 5 ? S.green : S.yellow },
          { label: 'RÉPONSES', value: stats.responses_received, color: stats.responses_received > 0 ? S.green : S.dim },
          { label: 'ENTRETIENS', value: stats.interviews_scheduled, color: stats.interviews_scheduled > 0 ? S.green : S.dim },
        ].map((s) => (
          <div key={s.label} className="p-4" style={{ border: `1px solid ${S.border}` }}>
            <div style={{ color: S.dim, fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: '1.5rem', fontWeight: 'bold' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Platform breakdown */}
      <div className="mb-8 p-4" style={{ border: `1px solid ${S.border}` }}>
        <div style={{ color: S.dim, fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '8px' }}>PAR PLATEFORME</div>
        <div className="flex gap-6">
          {Object.entries(stats.platforms || {}).map(([platform, count]) => (
            <div key={platform} className="flex items-center gap-2">
              <span style={{ color: S.text, fontSize: '0.85rem' }}>{platform.toUpperCase()}</span>
              <span style={{ color: S.green, fontSize: '0.85rem', fontWeight: 'bold' }}>{count as number}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Runs */}
      <div style={{ color: S.dim, fontSize: '0.7rem', letterSpacing: '0.1em', marginBottom: '12px' }}>
        HISTORIQUE DES RUNS ({runs.length})
      </div>

      {runs.map((run: any) => {
        const applied = run.candidatures?.filter((c: any) => c.status === 'applied').length || 0;
        const total = run.candidatures?.length || 0;
        const isExpanded = expandedRun === run.id;

        return (
          <div key={run.id} className="mb-3" style={{ border: `1px solid ${S.border}` }}>
            {/* Run Header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setExpandedRun(isExpanded ? null : run.id)}
              style={{ borderBottom: isExpanded ? `1px solid ${S.border}` : 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#111'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <div className="flex items-center gap-4">
                <span style={{ color: S.dim, fontSize: '0.8rem' }}>{run.date}</span>
                <span style={{ color: S.text, fontSize: '0.9rem' }}>{run.agent}</span>
                <StatusBadge status={run.status} />
              </div>
              <div className="flex items-center gap-4">
                <span style={{ color: applied >= 5 ? S.green : applied > 0 ? S.yellow : S.red, fontWeight: 'bold' }}>
                  {applied}/{total}
                </span>
                <span style={{ color: S.dim, fontSize: '0.8rem' }}>{run.duration_min}min</span>
                <span style={{ color: S.dim }}>{isExpanded ? '▼' : '▶'}</span>
              </div>
            </div>

            {/* Run Details */}
            {isExpanded && (
              <div className="p-4">
                {/* Scan Stats */}
                {run.scan && (
                  <div className="mb-4 flex gap-6" style={{ fontSize: '0.8rem' }}>
                    <span style={{ color: S.dim }}>URLs: <span style={{ color: S.text }}>{run.scan.urls_scanned}</span></span>
                    <span style={{ color: S.dim }}>Pages: <span style={{ color: S.text }}>{run.scan.pages_scanned}</span></span>
                    <span style={{ color: S.dim }}>Offres: <span style={{ color: S.text }}>{run.scan.offers_found}</span></span>
                    <span style={{ color: S.dim }}>Déjà postulé: <span style={{ color: S.yellow }}>{run.scan.already_applied}</span></span>
                  </div>
                )}

                {/* Candidatures Table */}
                <table className="w-full" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${S.border}` }}>
                      {['ENTREPRISE', 'POSTE', 'TJM', 'LIEU', 'STATUT', 'CONFIRMATION'].map(h => (
                        <th key={h} className="text-left py-2 px-2" style={{ color: S.dim, fontSize: '0.7rem', letterSpacing: '0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {run.candidatures?.map((c: any, i: number) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${S.border}` }}>
                        <td className="py-2 px-2" style={{ color: S.text }}>{c.entreprise}</td>
                        <td className="py-2 px-2" style={{ color: S.text }}>{c.poste}</td>
                        <td className="py-2 px-2" style={{ color: S.green }}>{c.tjm || '—'}</td>
                        <td className="py-2 px-2" style={{ color: S.dim }}>{c.lieu}</td>
                        <td className="py-2 px-2"><StatusBadge status={c.status} /></td>
                        <td className="py-2 px-2" style={{ color: S.dim, fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.confirmation || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
