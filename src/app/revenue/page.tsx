"use client";
import { useEffect, useState } from "react";

interface RevenueData {
  mrr: {
    current: number;
    previous: number;
    growth: number;
    trend: Array<{ month: string; value: number }>;
  };
  plans: {
    solo: { count: number; price: number };
    team: { count: number; price: number };
    studio: { count: number; price: number };
  };
  clients: {
    total: number;
    newThisMonth: number;
    churn: number;
  };
  costs: {
    infrastructure: number;
    tokens: number;
    total: number;
  };
  projections: {
    "3_months": number;
    "6_months": number;
    "12_months": number;
  };
  clientsList: Array<{
    id: string;
    name: string;
    plan: string;
    joinDate: string;
    tokenUsage: number;
    status: 'active' | 'paused' | 'trial';
  }>;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    // Mock data for OpenClaw France
    const mockData: RevenueData = {
      mrr: {
        current: 169,
        previous: 139,
        growth: 21.6,
        trend: [
          { month: 'Oct', value: 79 },
          { month: 'Nov', value: 109 },
          { month: 'Déc', value: 139 },
          { month: 'Jan', value: 139 },
          { month: 'Fév', value: 149 },
          { month: 'Mar', value: 169 },
        ],
      },
      plans: {
        solo: { count: 3, price: 30 },
        team: { count: 1, price: 79 },
        studio: { count: 0, price: 149 },
      },
      clients: {
        total: 4,
        newThisMonth: 1,
        churn: 0,
      },
      costs: {
        infrastructure: 25, // VPS
        tokens: 20, // Anthropic API
        total: 45,
      },
      projections: {
        "3_months": 350,
        "6_months": 750,
        "12_months": 1500,
      },
      clientsList: [
        {
          id: 'CL001',
          name: 'Laurent Médical',
          plan: 'Team',
          joinDate: '2026-01-15',
          tokenUsage: 8500,
          status: 'active',
        },
        {
          id: 'CL002',
          name: 'Agence BTP Plus',
          plan: 'Solo',
          joinDate: '2026-02-03',
          tokenUsage: 4200,
          status: 'active',
        },
        {
          id: 'CL003',
          name: 'PhotoStudio Marseille',
          plan: 'Solo',
          joinDate: '2026-02-28',
          tokenUsage: 3100,
          status: 'active',
        },
        {
          id: 'CL004',
          name: 'Digital Arts Collective',
          plan: 'Solo',
          joinDate: '2026-03-10',
          tokenUsage: 1800,
          status: 'trial',
        },
      ],
    };

    setTimeout(() => {
      setData(mockData);
      setLoading(false);
    }, 500);
  };

  const formatCurrency = (amount: number) => `${amount}€`;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'trial': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'paused': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      default: return 'bg-zinc-700 text-zinc-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif';
      case 'trial': return 'Essai';
      case 'paused': return 'Pausé';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-red-400">Erreur chargement données revenue</p>;
  }

  const margin = data.mrr.current - data.costs.total;
  const marginPercent = (margin / data.mrr.current) * 100;

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: "'Courier New', 'Consolas', monospace" }}>
      {/* Header */}
      <div className="bg-black border border-gray-600 p-6">
        <h1 className="text-2xl font-bold mb-2 text-white" style={{ letterSpacing: '0.1em' }}>REVENUE</h1>
        <p className="text-gray-600 text-sm" style={{ letterSpacing: '0.05em' }}>
          FINANCIAL TRACKING · MRR · CLIENTS · PROJECTIONS
        </p>
      </div>

      {/* MRR + Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MRR Card */}
        <div className="lg:col-span-2 bg-black border border-gray-600 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>
                MONTHLY RECURRING REVENUE
              </h2>
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-white">
                  {formatCurrency(data.mrr.current)}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-green-400 text-sm font-medium">
                    +{data.mrr.growth.toFixed(1)}%
                  </span>
                  <span className="text-gray-600 text-sm">VS LAST MONTH</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* MRR Trend */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-400 mb-3" style={{ letterSpacing: '0.1em' }}>6 MONTH TREND</h4>
            <MRRTrendChart data={data.mrr.trend} />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <MetricCard
            title="NET MARGIN"
            value={formatCurrency(margin)}
            subtitle={`${marginPercent.toFixed(1)}% MARGIN`}
            color="green"
            trend={`${formatCurrency(data.mrr.current)} - ${formatCurrency(data.costs.total)}`}
          />
          <MetricCard
            title="TOTAL COSTS"
            value={formatCurrency(data.costs.total)}
            subtitle={`VPS ${formatCurrency(data.costs.infrastructure)} + TOKENS ${formatCurrency(data.costs.tokens)}`}
            color="red"
            trend="MONTHLY"
          />
          <MetricCard
            title="ACTIVE CLIENTS"
            value={data.clients.total}
            subtitle={`+${data.clients.newThisMonth} THIS MONTH`}
            color="blue"
            trend={`${data.clients.churn} CHURN`}
          />
        </div>
      </div>

      {/* Plan Distribution + Projections */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Plan Distribution */}
        <div className="bg-black border border-gray-600 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white" style={{ letterSpacing: '0.1em' }}>PLAN DISTRIBUTION</h3>
          
          <div className="space-y-4 mb-6">
            <PlanBarRow plan="SOLO" count={data.plans.solo.count} price={data.plans.solo.price} total={data.clients.total} />
            <PlanBarRow plan="TEAM" count={data.plans.team.count} price={data.plans.team.price} total={data.clients.total} />
            <PlanBarRow plan="STUDIO" count={data.plans.studio.count} price={data.plans.studio.price} total={data.clients.total} />
          </div>
          
          <div className="space-y-3">
            <PlanRow plan="SOLO" count={data.plans.solo.count} price={data.plans.solo.price} color="blue" />
            <PlanRow plan="TEAM" count={data.plans.team.count} price={data.plans.team.price} color="purple" />
            <PlanRow plan="STUDIO" count={data.plans.studio.count} price={data.plans.studio.price} color="amber" />
          </div>
        </div>

        {/* Projections */}
        <div className="bg-black border border-gray-600 p-6">
          <h3 className="text-lg font-semibold mb-4 text-white" style={{ letterSpacing: '0.1em' }}>MRR PROJECTIONS</h3>
          <div className="space-y-4">
            <ProjectionCard 
              period="3 MONTHS"
              value={data.projections["3_months"]}
              assumptions="5 NEW SOLO + 2 TEAM CLIENTS"
              growth={((data.projections["3_months"] / data.mrr.current) - 1) * 100}
            />
            <ProjectionCard 
              period="6 MONTHS"
              value={data.projections["6_months"]}
              assumptions="12 NEW CLIENTS, MIX PLANS"
              growth={((data.projections["6_months"] / data.mrr.current) - 1) * 100}
            />
            <ProjectionCard 
              period="12 MONTHS"
              value={data.projections["12_months"]}
              assumptions="EXPANSION + STUDIO PLANS"
              growth={((data.projections["12_months"] / data.mrr.current) - 1) * 100}
            />
          </div>
          
          <div className="mt-6 p-4 bg-gray-900">
            <p className="text-xs text-gray-600" style={{ letterSpacing: '0.05em' }}>
              <span className="font-medium">ASSUMPTIONS:</span> ORGANIC GROWTH + SEO MARKETING + 
              WORD-OF-MOUTH. 5% MONTHLY CHURN ESTIMATED.
            </p>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-black border border-gray-600 p-6">
        <h3 className="text-lg font-semibold mb-4 text-white" style={{ letterSpacing: '0.1em' }}>CLIENTS ({data.clientsList.length})</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>CLIENT</th>
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>PLAN</th>
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>JOINED</th>
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>TOKENS/MONTH</th>
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>STATUS</th>
                <th className="text-left text-sm font-medium text-gray-400 py-3" style={{ letterSpacing: '0.1em' }}>MRR</th>
              </tr>
            </thead>
            <tbody>
              {data.clientsList.map((client) => {
                const planData = client.plan === 'Team' ? data.plans.team : 
                                client.plan === 'Studio' ? data.plans.studio : data.plans.solo;
                
                return (
                  <tr key={client.id} className="border-b border-gray-600 hover:bg-gray-900">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-white">{client.name}</p>
                        <p className="text-xs text-gray-600">{client.id}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 border ${
                        client.plan === 'Team' ? 'border-white text-white' :
                        client.plan === 'Studio' ? 'border-orange-400 text-orange-400' :
                        'border-white text-white'
                      }`}>
                        {client.plan.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-sm text-white">
                      {formatDate(client.joinDate)}
                    </td>
                    <td className="py-4">
                      <span className="text-sm font-mono text-white">{client.tokenUsage.toLocaleString()}</span>
                    </td>
                    <td className="py-4">
                      <span className={`text-xs px-2 py-1 border ${
                        client.status === 'active' ? 'border-green-400 text-green-400' :
                        client.status === 'trial' ? 'border-white text-white' :
                        'border-orange-400 text-orange-400'
                      }`}>
                        {getStatusLabel(client.status).toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className="font-medium text-white">
                        {formatCurrency(planData.price)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Components
function MetricCard({ title, value, subtitle, color, trend }: {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  trend: string;
}) {
  const colors = {
    blue: 'text-white',
    green: 'text-green-400',
    red: 'text-red-400',
    amber: 'text-orange-400',
    purple: 'text-white',
  } as Record<string, string>;

  return (
    <div className="bg-black border border-gray-600 p-4">
      <h4 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider" style={{ letterSpacing: '0.1em' }}>{title.toUpperCase()}</h4>
      <div className={`text-2xl font-bold ${colors[color] || 'text-white'} mb-1`}>
        {value}
      </div>
      <p className="text-xs text-gray-600">{subtitle}</p>
      <p className="text-[10px] text-gray-600 mt-1">{trend}</p>
    </div>
  );
}

function MRRTrendChart({ data }: { data: Array<{ month: string; value: number }> }) {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between h-20 gap-1">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="relative flex-1 w-full max-w-6">
            <div 
              className="bg-white w-full transition-all"
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.month}: ${item.value}€`}
            />
          </div>
          <span className="text-xs text-gray-600" style={{ letterSpacing: '0.1em' }}>{item.month.toUpperCase()}</span>
        </div>
      ))}
    </div>
  );
}



function PlanBarRow({ plan, count, price, total }: { 
  plan: string; count: number; price: number; total: number; 
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-white" style={{ letterSpacing: '0.1em' }}>{plan}</span>
        <span className="text-gray-400">{count} CLIENTS</span>
      </div>
      <div className="w-full bg-gray-800 h-2">
        <div 
          className="bg-white h-2 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

function PlanRow({ plan, count, price, color }: { 
  plan: string; count: number; price: number; color: string; 
}) {
  const colors = {
    blue: 'text-white',
    purple: 'text-white', 
    amber: 'text-orange-400',
  } as Record<string, string>;

  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-white" />
        <span className="font-medium text-white" style={{ letterSpacing: '0.05em' }}>{plan}</span>
        <span className="text-sm text-gray-600">{price}€/MONTH</span>
      </div>
      <div className="text-right">
        <span className={`font-bold ${colors[color]}`}>{count}</span>
        <span className="text-gray-600 text-sm"> CLIENTS</span>
      </div>
    </div>
  );
}

function ProjectionCard({ period, value, assumptions, growth }: {
  period: string; value: number; assumptions: string; growth: number;
}) {
  return (
    <div className="border border-gray-600 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white" style={{ letterSpacing: '0.1em' }}>{period}</span>
        <div className="text-right">
          <div className="text-lg font-bold text-white">{value}€</div>
          <div className="text-xs text-green-400">+{growth.toFixed(0)}%</div>
        </div>
      </div>
      <p className="text-xs text-gray-600" style={{ letterSpacing: '0.05em' }}>{assumptions}</p>
    </div>
  );
}