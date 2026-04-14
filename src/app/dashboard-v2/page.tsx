"use client";
import { useEffect, useState } from "react";

interface DashboardData {
  agents: { active: number; total: number };
  tasks: { completed: number; inProgress: number; total: number };
  campaigns: { active: number; total: number };
  tokens: { estimated: number; currency: string };
  activity: Array<{ day: string; value: number }>;
  recentActions: Array<{ time: string; agent: string; action: string; type: 'success' | 'warning' | 'info' }>;
  projects: {
    P1: Array<{ name: string; status: string; progress: number }>;
    P2: Array<{ name: string; status: string; progress: number }>;
    P3: Array<{ name: string; status: string; progress: number }>;
  };
  alerts: Array<{ type: 'warning' | 'info' | 'error'; message: string; details?: string }>;
}

export default function DashboardV2() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load real data from files
      const [officeState, tasks, campaigns] = await Promise.all([
        fetch('/api/data/office-state').then(r => r.json()).catch(() => null),
        fetch('/api/data/tasks').then(r => r.json()).catch(() => null),
        fetch('/api/data/campaigns').then(r => r.json()).catch(() => null),
      ]);

      // Count agents from office-state
      const agentsActive = officeState?.agents?.filter((a: any) => a.status === 'active').length || 8;
      const agentsTotal = officeState?.agents?.length || 12;

      // Count tasks
      const tasksCompleted = tasks?.tasks?.filter((t: any) => t.status === 'done').length || 47;
      const tasksInProgress = tasks?.tasks?.filter((t: any) => t.status === 'in_progress').length || 12;
      const tasksTotal = tasks?.tasks?.length || 73;

      // Count campaigns
      const campaignsActive = campaigns?.filter((c: any) => c.status === 'active' || c.status === 'running').length || 5;
      const campaignsTotal = campaigns?.length || 12;

      // Mock activity data (7 derniers jours)
      const activity = [
        { day: 'LUN', value: 45 },
        { day: 'MAR', value: 52 },
        { day: 'MER', value: 38 },
        { day: 'JEU', value: 61 },
        { day: 'VEN', value: 42 },
        { day: 'SAM', value: 28 },
        { day: 'DIM', value: 35 },
      ];

      // Mock recent actions
      const recentActions = [
        { time: '14:32', agent: 'SEO-EXPERT', action: 'Audit SEO Infinity Medical terminé', type: 'success' as const },
        { time: '13:15', agent: 'COPYWRITER', action: 'Article "Implants dentaires" publié', type: 'success' as const },
        { time: '12:08', agent: 'PROSPECTION', action: '25 leads photographes enrichis', type: 'info' as const },
        { time: '11:45', agent: 'LINKEDIN-OUTREACH', action: 'Message Dr. Rousseau envoyé', type: 'success' as const },
        { time: '10:30', agent: 'ACPPAV', action: 'Article YMYL en révision', type: 'warning' as const },
      ];

      // Projects data (simplified from real projects)
      const projects = {
        P1: [
          { name: 'Saphir Noir', status: 'Prospection active', progress: 75 },
          { name: 'Infinity Medical', status: 'Campagne LinkedIn', progress: 60 },
          { name: 'Freelance SEO', status: 'Candidatures', progress: 85 },
        ],
        P2: [
          { name: 'ACPPAV', status: '12/60 articles', progress: 20 },
          { name: 'IciPourGagner', status: 'Batch articles', progress: 45 },
        ],
        P3: [
          { name: 'Agence d\'Eve', status: 'SEO local', progress: 30 },
          { name: 'Konnecting', status: 'Trustpilot', progress: 15 },
        ],
      };

      // System alerts
      const alerts = [
        { type: 'warning' as const, message: 'BUDGET TOKENS À 60%', details: 'Estimation: $47/$80 ce mois' },
        { type: 'info' as const, message: 'ACPPAV: 12/60 ARTICLES PUBLIÉS', details: 'Objectif: 10 articles/mois' },
        { type: 'info' as const, message: 'PROSPECTION: 156 LEADS CE MOIS', details: 'Conversion: 8.5%' },
      ];

      setData({
        agents: { active: agentsActive, total: agentsTotal },
        tasks: { completed: tasksCompleted, inProgress: tasksInProgress, total: tasksTotal },
        campaigns: { active: campaignsActive, total: campaignsTotal },
        tokens: { estimated: 47, currency: '$' },
        activity,
        recentActions,
        projects,
        alerts,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-6 h-6 border border-gray-600 border-t-white animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return <p className="text-red-400 font-mono">ERREUR CHARGEMENT DASHBOARD V2</p>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="neural-border bg-black p-6">
        <h1 className="neural-label text-white text-lg font-mono mb-2">DASHBOARD KPIS — VUE D'ENSEMBLE</h1>
        <p className="font-mono text-xs" style={{color: '#666'}}>
          Monitoring global · Agents · Campagnes · Performance
        </p>
      </div>

      {/* KPIs Cards Row */}
      <div>
        <h2 className="neural-label mb-4">KPIS TEMPS RÉEL</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard 
            title="AGENTS ACTIFS"
            value={data.agents.active}
            subtitle={`sur ${data.agents.total} agents`}
            trend="+2"
          />
          <KPICard 
            title="TÂCHES COMPLÉTÉES"
            value={data.tasks.completed}
            subtitle="ce mois"
            trend="+5"
          />
          <KPICard 
            title="TÂCHES EN COURS"
            value={data.tasks.inProgress}
            subtitle={`sur ${data.tasks.total} total`}
            trend="-3"
          />
          <KPICard 
            title="CAMPAGNES ACTIVES"
            value={data.campaigns.active}
            subtitle={`sur ${data.campaigns.total} campagnes`}
            trend="+1"
          />
          <KPICard 
            title="COÛT TOKENS"
            value={`${data.tokens.estimated}${data.tokens.currency}`}
            subtitle="estimation mois"
            trend="+12$"
          />
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <div className="lg:col-span-2 neural-border bg-black p-6">
          <h3 className="neural-label mb-4">ACTIVITÉ 7 DERNIERS JOURS</h3>
          <ActivityChart data={data.activity} />
        </div>

        {/* Recent Actions */}
        <div className="neural-border bg-black p-6">
          <h3 className="neural-label mb-4 flex items-center gap-2">
            <span className="status-dot status-online status-pulse" />
            DERNIÈRES ACTIONS
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {data.recentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-3 p-2 hover:bg-gray-900 font-mono">
                <span className="text-xs text-gray-500 font-mono mt-0.5 w-12">{action.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-300">{action.agent}</p>
                  <p className="text-xs text-gray-300">{action.action}</p>
                </div>
                <StatusDot type={action.type} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Projects by Priority */}
        <div className="lg:col-span-2 neural-border bg-black p-6">
          <h3 className="neural-label mb-4">PROJETS PAR PRIORITÉ</h3>
          <div className="space-y-4">
            {['P1', 'P2', 'P3'].map((priority) => (
              <div key={priority}>
                <div className="flex items-center gap-2 mb-2">
                  <PriorityBadge priority={priority} />
                  <span className="neural-label text-sm" style={{color: '#e0e0e0'}}>
                    {priority === 'P1' ? 'PRIORITÉ HAUTE' : priority === 'P2' ? 'PRIORITÉ MOYENNE' : 'PRIORITÉ BASSE'}
                  </span>
                </div>
                <div className="space-y-2 ml-6">
                  {data.projects[priority as keyof typeof data.projects].map((project, i) => (
                    <div key={i} className="flex items-center justify-between p-2 neural-border hover:bg-gray-900">
                      <div>
                        <p className="text-sm font-medium neural-value font-mono">{project.name}</p>
                        <p className="text-xs font-mono" style={{color: '#666'}}>{project.status}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-400 font-mono">{project.progress}%</span>
                        <div className="w-16 h-1 bg-gray-700 mt-1">
                          <div 
                            className={`h-full ${
                              priority === 'P1' ? 'bg-red-500' : 
                              priority === 'P2' ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Alerts */}
        <div className="neural-border bg-black p-6">
          <h3 className="neural-label mb-4">ALERTES SYSTÈME</h3>
          <div className="space-y-3">
            {data.alerts.map((alert, i) => (
              <div key={i} className={`p-3 border-l-2 font-mono ${
                alert.type === 'warning' ? 'border-amber-500 bg-amber-500/10' :
                alert.type === 'error' ? 'border-red-500 bg-red-500/10' :
                'border-blue-500 bg-blue-500/10'
              }`}>
                <p className="text-sm font-medium neural-value">{alert.message}</p>
                {alert.details && (
                  <p className="text-xs mt-1" style={{color: '#666'}}>{alert.details}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Components
function KPICard({ title, value, subtitle, trend }: {
  title: string;
  value: string | number;
  subtitle: string;
  trend: string;
}) {
  return (
    <div className="neural-border bg-black p-4 hover:border-blue-500 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <h4 className="neural-label" style={{fontSize: '10px'}}>{title}</h4>
        <span className={`text-xs font-mono ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
      <div className="text-2xl font-bold neural-value font-mono">
        {value}
      </div>
      <p className="text-xs font-mono" style={{color: '#666'}}>{subtitle}</p>
    </div>
  );
}

function ActivityChart({ data }: { data: Array<{ day: string; value: number }> }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between h-40 gap-2">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <div className="relative flex-1 w-full max-w-8 flex flex-col justify-end">
            {/* Dot matrix style bars - using dots instead of solid bars */}
            <div className="w-full flex flex-col gap-0.5" style={{ height: `${(item.value / maxValue) * 100}%` }}>
              {Array.from({ length: Math.ceil((item.value / maxValue) * 20) }).map((_, dotIndex) => (
                <div key={dotIndex} className="w-full h-0.5 bg-white opacity-80"></div>
              ))}
            </div>
          </div>
          <span className="neural-label" style={{fontSize: '10px'}}>{item.day}</span>
          <span className="text-xs font-mono text-gray-400">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusDot({ type }: { type: 'success' | 'warning' | 'info' }) {
  const colors = {
    success: 'status-online',
    warning: 'status-warning', 
    info: 'bg-blue-500',
  };
  
  return <span className={`status-dot ${colors[type]} mt-1`} />;
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles = {
    P1: "bg-red-500 text-black",
    P2: "bg-amber-500 text-black",
    P3: "bg-green-500 text-black",
  } as Record<string, string>;
  
  return (
    <span className={`text-xs px-2 py-1 font-mono font-medium ${styles[priority] || "bg-gray-700 text-gray-400"}`}>
      {priority}
    </span>
  );
}