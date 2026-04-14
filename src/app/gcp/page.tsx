"use client";
import { useEffect, useState } from "react";

interface GCPData {
  timestamp: string;
  project: string;
  infrastructure: {
    cpu: number | null;
    memory: number | null;
    disk: number | null;
  };
  cloudRun: {
    services: Array<{
      name: string;
      region: string;
      url: string;
      ready: boolean;
      lastDeployed: string;
    }>;
    totalServices: number;
    healthyServices: number;
  };
  logs: {
    counts: Record<string, number>;
    recentErrors: Array<{
      timestamp: string;
      severity: string;
      message: string;
      source: string;
    }>;
    recentWarnings: Array<{
      timestamp: string;
      severity: string;
      message: string;
      source: string;
    }>;
  };
  alerts: {
    policies: Array<{
      name: string;
      enabled: boolean;
      state: string;
    }>;
    activeIncidents: number;
  };
  status: string;
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'healthy' ? '#10b981' : status === 'degraded' ? '#f59e0b' : '#ef4444';
  return (
    <span style={{
      display: 'inline-block',
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color,
      marginRight: 8,
      boxShadow: `0 0 8px ${color}60`,
    }} />
  );
}

function MetricGauge({ label, value, unit, max, warn, crit }: { 
  label: string; value: number | null; unit: string; max: number; warn: number; crit: number 
}) {
  const pct = value != null ? Math.min((value / max) * 100, 100) : 0;
  const color = value == null ? '#374151' : value >= crit ? '#ef4444' : value >= warn ? '#f59e0b' : '#10b981';
  
  return (
    <div style={{ flex: 1, minWidth: 200 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#9ca3af' }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 600 }}>{value != null ? `${value}${unit}` : '...'}</span>
      </div>
      <div style={{ height: 8, backgroundColor: '#1f2937', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: 4,
          transition: 'width 0.8s ease, background-color 0.5s ease',
        }} />
      </div>
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  return (
    <div style={{
      padding: '14px 18px',
      backgroundColor: '#111827',
      border: `1px solid ${service.ready ? '#065f4620' : '#7f1d1d40'}`,
      borderRadius: 10,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <StatusDot status={service.ready ? 'healthy' : 'critical'} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#e5e7eb' }}>{service.name}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{service.region}</div>
      </div>
      {service.url && (
        <a href={service.url} target="_blank" style={{ fontSize: 12, color: '#3b82f6', textDecoration: 'none' }}>
          ↗ URL
        </a>
      )}
    </div>
  );
}

function LogEntry({ log }: { log: any }) {
  const color = log.severity === 'ERROR' ? '#ef4444' : log.severity === 'WARNING' ? '#f59e0b' : '#6b7280';
  const time = new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  return (
    <div style={{
      padding: '10px 14px',
      borderLeft: `3px solid ${color}`,
      backgroundColor: '#0d111780',
      marginBottom: 4,
      borderRadius: '0 6px 6px 0',
      fontSize: 13,
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
        <span style={{ color, fontWeight: 600, minWidth: 60 }}>{log.severity}</span>
        <span style={{ color: '#6b7280' }}>{time}</span>
        <span style={{ color: '#4b5563', fontStyle: 'italic' }}>{log.source}</span>
      </div>
      <div style={{ color: '#d1d5db', wordBreak: 'break-all' }}>
        {typeof log.message === 'string' ? log.message.slice(0, 200) : JSON.stringify(log.message).slice(0, 200)}
      </div>
    </div>
  );
}

export default function GCPDashboard() {
  const [data, setData] = useState<GCPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = () => {
    fetch("/api/gcp-metrics")
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); setLastRefresh(new Date()); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0e17', color: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 18, color: '#6b7280' }}>Chargement métriques GCP...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0a0e17', color: '#e5e7eb', padding: 40 }}>
        <h1>❌ Erreur chargement GCP</h1>
        <p style={{ color: '#6b7280' }}>Impossible de récupérer les métriques.</p>
      </div>
    );
  }

  const totalLogs = Object.values(data.logs.counts).reduce((a, b) => a + b, 0);
  const errorCount = data.logs.counts['ERROR'] || 0;
  const warningCount = data.logs.counts['WARNING'] || 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a0e17', color: '#e5e7eb', padding: '30px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
            <StatusDot status={data.status} />
            GCP — Observabilité
          </h1>
          <p style={{ margin: '6px 0 0', color: '#6b7280', fontSize: 14 }}>
            Projet: <span style={{ color: '#9ca3af' }}>{data.project}</span>
            {' · '}
            Dernière maj: {lastRefresh.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/" style={{
            padding: '8px 16px', backgroundColor: '#1f2937', color: '#9ca3af', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, border: '1px solid #374151',
          }}>
            ← Dashboard
          </a>
          <a href={`https://console.cloud.google.com/monitoring/dashboards?project=${data.project}`} target="_blank" style={{
            padding: '8px 16px', backgroundColor: '#1e3a5f', color: '#60a5fa', borderRadius: 8,
            textDecoration: 'none', fontSize: 13, border: '1px solid #2563eb40',
          }}>
            Console GCP ↗
          </a>
        </div>
      </div>

      {/* Infrastructure Gauges */}
      <div style={{
        padding: 24, backgroundColor: '#111827', borderRadius: 12, marginBottom: 20,
        border: '1px solid #1f293780',
      }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
          🖥️ Infrastructure VPS
        </h2>
        <div style={{ display: 'flex', gap: 30 }}>
          <MetricGauge label="CPU" value={data.infrastructure.cpu} unit="%" max={100} warn={70} crit={90} />
          <MetricGauge label="Mémoire" value={data.infrastructure.memory} unit="%" max={100} warn={80} crit={95} />
          <MetricGauge label="Disque" value={data.infrastructure.disk} unit="%" max={100} warn={80} crit={90} />
        </div>
      </div>

      {/* Cloud Run Services */}
      <div style={{
        padding: 24, backgroundColor: '#111827', borderRadius: 12, marginBottom: 20,
        border: '1px solid #1f293780',
      }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
          🚀 MCP Servers (Cloud Run)
          <span style={{ marginLeft: 12, fontSize: 13, fontWeight: 400 }}>
            {data.cloudRun.healthyServices}/{data.cloudRun.totalServices} actifs
          </span>
        </h2>
        {data.cloudRun.services.length === 0 ? (
          <div style={{ color: '#4b5563', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            Aucun MCP server déployé — Phase 2 de la roadmap
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {data.cloudRun.services.map((svc, i) => (
              <ServiceCard key={i} service={svc} />
            ))}
          </div>
        )}
      </div>

      {/* Logs Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Log Counts */}
        <div style={{
          padding: 24, backgroundColor: '#111827', borderRadius: 12,
          border: '1px solid #1f293780',
        }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
            📊 Logs (dernière heure)
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#e5e7eb' }}>{totalLogs}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: errorCount > 0 ? '#ef4444' : '#10b981' }}>{errorCount}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Erreurs</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: warningCount > 0 ? '#f59e0b' : '#10b981' }}>{warningCount}</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Warnings</div>
            </div>
          </div>
          {/* Severity breakdown */}
          <div style={{ marginTop: 18, borderTop: '1px solid #1f2937', paddingTop: 14 }}>
            {Object.entries(data.logs.counts).map(([severity, count]) => {
              const colors: Record<string, string> = { ERROR: '#ef4444', WARNING: '#f59e0b', INFO: '#3b82f6', DEFAULT: '#6b7280', DEBUG: '#4b5563', NOTICE: '#8b5cf6' };
              return (
                <div key={severity} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
                  <span style={{ color: colors[severity] || '#6b7280' }}>{severity}</span>
                  <span style={{ color: '#9ca3af' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alert Policies */}
        <div style={{
          padding: 24, backgroundColor: '#111827', borderRadius: 12,
          border: '1px solid #1f293780',
        }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
            🔔 Alertes
            {data.alerts.activeIncidents > 0 && (
              <span style={{ marginLeft: 10, padding: '2px 10px', backgroundColor: '#7f1d1d', color: '#fca5a5', borderRadius: 12, fontSize: 12 }}>
                {data.alerts.activeIncidents} active{data.alerts.activeIncidents > 1 ? 's' : ''}
              </span>
            )}
          </h2>
          {data.alerts.policies.length === 0 ? (
            <div style={{ color: '#4b5563', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
              Aucune politique d'alerte
            </div>
          ) : (
            data.alerts.policies.map((policy, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                borderBottom: i < data.alerts.policies.length - 1 ? '1px solid #1f2937' : 'none',
              }}>
                <StatusDot status={policy.state === 'OK' ? 'healthy' : 'critical'} />
                <span style={{ color: '#d1d5db', fontSize: 14 }}>{policy.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: policy.enabled ? '#10b981' : '#6b7280' }}>
                  {policy.enabled ? 'Actif' : 'Désactivé'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Errors */}
      <div style={{
        padding: 24, backgroundColor: '#111827', borderRadius: 12, marginBottom: 20,
        border: '1px solid #1f293780',
      }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
          🔴 Erreurs récentes
        </h2>
        {data.logs.recentErrors.length === 0 ? (
          <div style={{ color: '#10b981', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
            ✅ Aucune erreur dans la dernière heure
          </div>
        ) : (
          data.logs.recentErrors.map((log, i) => (
            <LogEntry key={i} log={log} />
          ))
        )}
      </div>

      {/* Warnings */}
      {data.logs.recentWarnings.length > 0 && (
        <div style={{
          padding: 24, backgroundColor: '#111827', borderRadius: 12,
          border: '1px solid #1f293780',
        }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#9ca3af' }}>
            ⚠️ Warnings récents
          </h2>
          {data.logs.recentWarnings.map((log, i) => (
            <LogEntry key={i} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}
