'use client';

import { useState } from 'react';

interface Agent {
  id: string;
  name: string;
  role: string;
  icon: string;
  color: string;
  status: 'active' | 'idle' | 'veille' | 'off';
  model?: string;
  children?: Agent[];
}

const orgData: Agent = {
  id: 'sullivan',
  name: 'Sullivan',
  role: 'CEO — Direction & Stratégie',
  icon: '👑',
  color: '#FFD700',
  status: 'active',
  model: 'Human',
  children: [
    {
      id: 'jarvis',
      name: 'Jarvis',
      role: 'COO — Orchestration',
      icon: '🧠',
      color: '#FF6B35',
      status: 'active',
      model: 'Opus 4.6',
      children: [
        {
          id: 'pole-revenue',
          name: 'Pôle Revenue',
          role: 'Acquisition & Conversion',
          icon: '💰',
          color: '#27AE60',
          status: 'active',
          children: [
            { id: 'prospection', name: 'Prospection', role: 'Recherche leads', icon: '📊', color: '#8E44AD', status: 'active', model: 'Sonnet 4' },
            { id: 'copywriter-email', name: 'Copywriter Email', role: 'Emails prospection', icon: '📧', color: '#27AE60', status: 'idle', model: 'Sonnet 4' },
            { id: 'linkedin', name: 'LinkedIn Outreach', role: 'Messages LinkedIn', icon: '💬', color: '#0077B5', status: 'active', model: 'Sonnet 4' },
            { id: 'commercial', name: 'Commercial Médical', role: 'CRM & leads dentistes', icon: '💼', color: '#E74C3C', status: 'active', model: 'Sonnet 4' },
          ]
        },
        {
          id: 'pole-content',
          name: 'Pôle Content',
          role: 'SEO & Contenu',
          icon: '✏️',
          color: '#E67E22',
          status: 'active',
          children: [
            { id: 'seo', name: 'SEO Expert', role: 'Audits & keywords', icon: '🔍', color: '#4A90D9', status: 'active', model: 'Sonnet 4' },
            { id: 'copywriter', name: 'Copywriter', role: 'Articles & scripts', icon: '✏️', color: '#E67E22', status: 'active', model: 'Sonnet 4' },
            { id: 'social', name: 'Social Media', role: 'LinkedIn & Twitter', icon: '📱', color: '#FF5722', status: 'veille', model: 'Sonnet 4' },
          ]
        },
        {
          id: 'pole-clients',
          name: 'Pôle Clients',
          role: 'Production & Delivery',
          icon: '🏗️',
          color: '#3498DB',
          status: 'active',
          children: [
            { id: 'devweb', name: 'Dev Web', role: 'Sites & landing pages', icon: '💻', color: '#00BCD4', status: 'active', model: 'Sonnet 4' },
            { id: 'dauiux', name: 'DA UI/UX', role: 'Design & wireframes', icon: '🎨', color: '#E91E63', status: 'active', model: 'Sonnet 4' },
            { id: 'acppav', name: 'ACPPAV', role: 'Articles pharmacie YMYL', icon: '💊', color: '#E74C3C', status: 'idle', model: 'Sonnet 4' },
          ]
        },
        {
          id: 'pole-support',
          name: 'Pôle Support',
          role: 'Veille & Freelance',
          icon: '🛡️',
          color: '#9C27B0',
          status: 'active',
          children: [
            { id: 'agent-sullivan', name: 'Agent Sullivan', role: 'Chasse missions freelance', icon: '👤', color: '#F39C12', status: 'active', model: 'Sonnet 4' },
            { id: 'veille', name: 'Veille Opportunités', role: 'Scan marché & trends', icon: '👁️', color: '#9C27B0', status: 'veille', model: 'Sonnet 4' },
          ]
        },
        {
          id: 'pole-dev',
          name: 'Pôle Dev (à intégrer)',
          role: 'Développement & Code',
          icon: '⚡',
          color: '#555',
          status: 'off',
          children: [
            { id: 'cursor', name: 'Cursor / Claude Code', role: 'CTO — Dev technique', icon: '🖥️', color: '#555', status: 'off', model: 'À intégrer (ACP)' },
            { id: 'codex', name: 'Codex', role: 'Engineer autonome', icon: '🤖', color: '#555', status: 'off', model: 'À intégrer (ACP)' },
          ]
        },
      ]
    }
  ]
};

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: '#E8F5E9', text: '#2E7D32', label: '● Actif' },
  idle: { bg: '#FFF8E1', text: '#F57F17', label: '● Idle' },
  veille: { bg: '#E3F2FD', text: '#1565C0', label: '● Veille' },
  off: { bg: '#F5F5F5', text: '#999', label: '○ Off' },
};

function AgentCard({ agent, depth = 0 }: { agent: Agent; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const [hovered, setHovered] = useState(false);
  const s = statusColors[agent.status];
  const hasChildren = agent.children && agent.children.length > 0;
  const isPole = agent.id.startsWith('pole-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Card */}
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => hasChildren && setExpanded(!expanded)}
        style={{
          background: isPole 
            ? `linear-gradient(135deg, ${agent.color}15, ${agent.color}08)` 
            : hovered ? '#fff' : '#fafafa',
          border: `2px solid ${hovered ? agent.color : isPole ? agent.color + '40' : '#e0e0e0'}`,
          borderRadius: isPole ? 16 : 12,
          padding: isPole ? '10px 20px' : '12px 16px',
          minWidth: isPole ? 160 : 140,
          maxWidth: 200,
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 0.2s',
          boxShadow: hovered ? `0 4px 16px ${agent.color}25` : '0 2px 8px rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: isPole ? 18 : 22 }}>{agent.icon}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: isPole ? 11 : 13, color: '#222' }}>
              {agent.name}
            </div>
            <div style={{ fontSize: 9, color: '#888', lineHeight: 1.3 }}>{agent.role}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
          <span style={{
            fontSize: 8, padding: '2px 6px', borderRadius: 4,
            background: s.bg, color: s.text, fontWeight: 'bold',
          }}>
            {s.label}
          </span>
          {agent.model && (
            <span style={{ fontSize: 8, color: '#aaa' }}>{agent.model}</span>
          )}
        </div>
        {hasChildren && (
          <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50)',
            fontSize: 10, color: '#ccc', background: '#fff', padding: '0 4px', borderRadius: 4 }}>
            {expanded ? '▼' : '▶'} {agent.children!.length}
          </div>
        )}
      </div>

      {/* Connector line down */}
      {hasChildren && expanded && (
        <>
          <div style={{ width: 2, height: 20, background: `${agent.color}30` }} />
          {/* Children row */}
          <div style={{
            display: 'flex', gap: depth < 2 ? 16 : 10,
            flexWrap: 'wrap', justifyContent: 'center',
            position: 'relative', paddingTop: 0,
          }}>
            {/* Horizontal line connecting children */}
            {agent.children!.length > 1 && (
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%',
                height: 2, background: `${agent.color}20`,
              }} />
            )}
            {agent.children!.map(child => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 2, height: 12, background: `${agent.color}20` }} />
                <AgentCard agent={child} depth={depth + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const countAgents = (a: Agent): number => {
    let c = a.children ? 0 : 1;
    if (a.children) a.children.forEach(ch => c += countAgents(ch));
    return c;
  };
  const total = countAgents(orgData);
  const activeCount = (() => {
    let c = 0;
    const walk = (a: Agent) => {
      if (a.status === 'active' && !a.id.startsWith('pole-') && a.id !== 'sullivan') c++;
      a.children?.forEach(walk);
    };
    walk(orgData);
    return c;
  })();

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #f8f9fa, #fff)',
      fontFamily: 'system-ui', padding: 24,
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#222', margin: 0 }}>
          🏛️ Organisation — Jarvis HQ
        </h1>
        <p style={{ color: '#888', fontSize: 13, margin: '8px 0' }}>
          {total} agents • {activeCount} actifs • Cliquer pour expand/collapse
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
          {Object.entries(statusColors).map(([k, v]) => (
            <span key={k} style={{ fontSize: 11, color: v.text, background: v.bg, padding: '3px 10px', borderRadius: 6 }}>
              {v.label}
            </span>
          ))}
        </div>
      </div>

      {/* Org chart */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        overflowX: 'auto', padding: '20px 0',
      }}>
        <AgentCard agent={orgData} />
      </div>

      {/* Footer note */}
      <div style={{ textAlign: 'center', marginTop: 40, color: '#bbb', fontSize: 11 }}>
        💡 Le Pôle Dev (Cursor / Codex) est prévu — intégration via ACP runtime
      </div>
      <p style={{ textAlign: "center", color: "#ccc", fontSize: 10, marginTop: 8 }}>Dernière MAJ: {new Date().toLocaleString("fr-FR")}</p>
    </div>
  );
}
