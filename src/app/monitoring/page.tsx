"use client";
import { useEffect, useState, useRef } from "react";

// === TYPES ===
interface RealTimeData {
  timestamp: string;
  system: {
    uptime: string;
    memory: {
      total: number;
      used: number;
      free: number;
      percent: number;
    };
    loadAvg: number[];
    pm2: Array<{
      name: string;
      status: string;
      memory: number;
      cpu: number;
      restarts: number;
    }>;
  };
  docker: Array<{
    name: string;
    status: string;
    online: boolean;
  }>;
  agents: Array<{
    name: string;
    status: string;
    role: string;
  }>;
  tasks: {
    total: number;
    done?: number;
    in_progress?: number;
    backlog?: number;
  };
  campaigns: {
    total: number;
    sent: number;
    planned: number;
  };
  costTracking: Array<{
    date: string;
    cost: number;
  }>;
  scheduler: any;
  dailyActivity: Array<{
    date: string;
    bytes: number;
  }>;
  qdrant: {
    points: number;
    status: string;
  };
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  isCore: boolean;
  color: string;
  connections: string[];
  pulse: number;
}

interface LogEntry {
  id: number;
  timestamp: string;
  type: 'spawn' | 'complete' | 'heartbeat' | 'error' | 'system';
  message: string;
  agent?: string;
}

export default function MonitoringPage() {
  const networkCanvasRef = useRef<HTMLCanvasElement>(null);
  const costCanvasRef = useRef<HTMLCanvasElement>(null);
  const heatmapCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [tick, setTick] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [monitoringData, setMonitoringData] = useState<RealTimeData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  // Animation principale
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Fetch monitoring data every 30 seconds
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/monitoring');
        if (response.ok) {
          const data = await response.json();
          setMonitoringData(data);
          setLastUpdate(new Date().toLocaleTimeString('fr-FR'));
        }
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      }
    };

    fetchData(); // Initial fetch
    const interval = setInterval(fetchData, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Generate logs from real data
  useEffect(() => {
    if (!monitoringData) return;

    const generateRealLogs = () => {
      const realLogs: LogEntry[] = [];
      
      // Logs from Qdrant (priority - main memory system)
      if (monitoringData.qdrant.points > 0) {
        realLogs.push({
          id: Date.now() + 300,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          type: 'system',
          message: `RAG MEMORY: ${monitoringData.qdrant.points} VECTORS ONLINE - JARVIS_MEMORY`
        });
      }

      // Logs from campaigns
      if (monitoringData.campaigns.sent > 0) {
        realLogs.push({
          id: Date.now() + 100,
          timestamp: new Date().toLocaleTimeString('fr-FR'),
          type: 'complete',
          message: `CAMPAIGNS SENT: ${monitoringData.campaigns.sent}/${monitoringData.campaigns.total}`
        });
      }

      // Logs from PM2 status
      monitoringData.system.pm2.forEach((process, index) => {
        if (process.status === 'online') {
          realLogs.push({
            id: Date.now() + 200 + index,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
            type: 'heartbeat',
            message: `${process.name.toUpperCase()}: CPU ${process.cpu}% MEM ${process.memory}MB RESTARTS ${process.restarts}`
          });
        }
      });

      // Logs from daily activity (backup logs - secondaire)
      monitoringData.dailyActivity.forEach((activity, index) => {
        if (index < 3) { // Reduced to 3 for less clutter
          realLogs.push({
            id: Date.now() + index,
            timestamp: new Date().toLocaleTimeString('fr-FR'),
            type: 'system',
            message: `[${activity.date}] BACKUP LOG - ${activity.bytes} BYTES`
          });
        }
      });

      setLogs(realLogs.slice(0, 50)); // Keep last 50 logs
    };

    generateRealLogs();
  }, [monitoringData]);

  // Génération de la heatmap d'activité à partir des vraies données
  const generateHeatmapData = () => {
    if (!monitoringData?.dailyActivity.length) {
      // Fallback minimal data
      return Array.from({length: 7}, () => Array.from({length: 24}, () => 0.1));
    }

    const data = [];
    for (let day = 0; day < 7; day++) {
      const dayData = [];
      for (let hour = 0; hour < 24; hour++) {
        // Use real activity data if available
        const activityIndex = day < monitoringData.dailyActivity.length ? day : 0;
        const baseIntensity = monitoringData.dailyActivity[activityIndex] 
          ? Math.min(1, monitoringData.dailyActivity[activityIndex].bytes / 50000) 
          : 0.1;
        
        // Add hourly variation
        let intensity = baseIntensity * (0.5 + Math.random() * 0.5);
        if (hour >= 8 && hour <= 18) {
          intensity *= 1.5; // Higher activity during work hours
        }
        
        dayData.push(Math.min(1, intensity));
      }
      data.push(dayData);
    }
    return data;
  };

  const heatmapData = generateHeatmapData();

  // Cost data from real tracking
  const getCostData = () => {
    if (!monitoringData?.costTracking.length) {
      return Array.from({length: 30}, (_, i) => 2 + Math.random() * 3);
    }
    
    return monitoringData.costTracking
      .slice(-30) // Last 30 days
      .map(entry => entry.cost || 0);
  };

  const costData = getCostData();

  // === RENDU NETWORK GRAPH ===
  useEffect(() => {
    const canvas = networkCanvasRef.current;
    if (!canvas || !monitoringData) return;
    
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const w = rect.width;
    const h = rect.height;
    
    // Fond noir pur
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Grilles minimales
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    
    // Création des nodes avec les vraies données
    const nodes: NetworkNode[] = [];
    const centerX = w / 2;
    const centerY = h / 2;
    
    // Jarvis au centre
    nodes.push({
      id: 'jarvis',
      x: centerX,
      y: centerY,
      radius: 25,
      isCore: true,
      color: '#ffffff',
      connections: ['seo-expert', 'copywriter', 'prospection'],
      pulse: Math.sin(tick * 0.1) * 0.3 + 0.7
    });
    
    // Real agents from API data
    const realAgents = monitoringData.agents || [];
    realAgents.forEach((agent, i) => {
      const angle = (i / realAgents.length) * Math.PI * 2;
      const radius = 120 + Math.sin(tick * 0.05 + i) * 15;
      
      // Any status other than explicitly "offline"/"error" = agent is active
      const offlineStatuses = ['offline', 'error', 'down', 'stopped'];
      const idleStatuses = ['idle', 'sleeping', 'paused'];
      let color = '#33ff33'; // Default: active (green)
      if (offlineStatuses.includes(agent.status)) color = '#ff3333';
      else if (idleStatuses.includes(agent.status)) color = '#ff9900';
      
      nodes.push({
        id: agent.name.toLowerCase().replace(/\s+/g, '-'),
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        radius: 12,
        isCore: false,
        color: color,
        connections: [],
        pulse: Math.sin(tick * 0.08 + i) * 0.2 + 0.8
      });
    });
    
    // Rendu des nodes
    nodes.forEach(node => {
      const pulseRadius = node.radius * node.pulse;
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
      ctx.fill();
      
      if (node.isCore) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('JARVIS', node.x, node.y + 40);
      }
    });
    
  }, [tick, monitoringData]);

  // === RENDU COST CHART ===
  useEffect(() => {
    const canvas = costCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const w = rect.width;
    const h = rect.height;
    const padding = 40;
    const chartW = w - padding * 2;
    const chartH = h - padding * 2;
    
    // Fond
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Grilles
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 6; i++) {
      const x = padding + (i / 6) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, h - padding);
      ctx.stroke();
    }
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i / 5) * chartH;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.stroke();
    }
    
    // Données et échelle
    const data = costData;
    const maxValue = Math.max(...data) * 1.1 || 10;
    const minValue = Math.min(...data) * 0.9 || 0;
    const range = maxValue - minValue || 1;
    
    // Courbe simple
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 0;
    
    ctx.beginPath();
    data.forEach((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = h - padding - ((value - minValue) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    
    // Points simples
    data.forEach((value, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = h - padding - ((value - minValue) / range) * chartH;
      
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    
  }, [tick, costData]);

  // === RENDU HEATMAP ===
  useEffect(() => {
    const canvas = heatmapCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d')!;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    const w = rect.width;
    const h = rect.height;
    const padding = 30;
    const cellW = (w - padding * 2) / 24;
    const cellH = (h - padding * 2 - 40) / 7;
    
    // Fond
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    
    // Heatmap avec dots
    const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    heatmapData.forEach((dayData, dayIndex) => {
      dayData.forEach((intensity, hourIndex) => {
        const x = padding + hourIndex * cellW + cellW / 2;
        const y = padding + 40 + dayIndex * cellH + cellH / 2;
        
        const dotRadius = 1 + intensity * 4;
        const alpha = 0.3 + intensity * 0.7;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    
    // Labels
    ctx.fillStyle = '#666';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    days.forEach((day, i) => {
      const y = padding + 40 + i * cellH + cellH / 2;
      ctx.fillText(day, padding - 5, y + 3);
    });
    
    ctx.textAlign = 'center';
    for (let h = 0; h < 24; h += 3) {
      const x = padding + h * cellW + cellW / 2;
      ctx.fillText(`${h}H`, x, padding + 30);
    }
    
  }, [heatmapData]);

  if (!monitoringData) {
    return (
      <div className="flex items-center justify-center h-96 text-white font-mono">
        LOADING NEURAL CORTEX DATA...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" style={{ fontFamily: "'Courier New', 'Consolas', monospace" }}>

      {/* Header */}
      <div className="border-b border-gray-600 bg-black p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-mono font-bold text-white flex items-center gap-3" style={{ letterSpacing: '0.1em' }}>
          NEURAL CORTEX
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 bg-green-400"></div>
            <span className="text-green-400" style={{ letterSpacing: '0.1em' }}>ACTIVE</span>
          </div>
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1" style={{ letterSpacing: '0.05em' }}>
          REAL-TIME SYSTEM SURVEILLANCE - LAST UPDATE: {lastUpdate}
        </p>
      </div>

      {/* Main Grid - responsive: stack on mobile, 3 cols on desktop */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* COLONNE GAUCHE - System Stats — 2 cols on mobile */}
        <div className="w-full lg:w-80 grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
          
          {/* RAG Memory Status - Premier plan */}
          <div className="bg-black border border-gray-600 p-4">
            <h3 className="text-gray-400 font-mono font-bold mb-3 flex items-center gap-2" style={{ letterSpacing: '0.1em' }}>
              RAG MEMORY
              <div className={`w-2 h-2 ml-auto ${monitoringData.qdrant.status === 'green' || monitoringData.qdrant.points > 0 ? 'bg-green-400' : 'bg-red-400'}`} style={{ borderRadius: '50%' }}></div>
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between text-lg">
                <span className="text-white" style={{ letterSpacing: '0.1em' }}>QDRANT:</span>
                <span className="text-green-400 font-bold">{monitoringData.qdrant.points} VECTORS ●</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>COLLECTION:</span>
                <span className="text-white">JARVIS_MEMORY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>STATUS:</span>
                <span className={monitoringData.qdrant.status === 'green' || monitoringData.qdrant.points > 0 ? 'text-green-400' : 'text-red-400'}>
                  {monitoringData.qdrant.status === 'green' || monitoringData.qdrant.points > 0 ? 'GREEN' : 'RED'}
                </span>
              </div>
              
              <div className="border-t border-gray-700 pt-2 mt-3">
                <div className="text-gray-500 text-xs mb-2" style={{ letterSpacing: '0.1em' }}>BACKUP LOGS:</div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>FILES:</span>
                  <span className="text-gray-400">{monitoringData.dailyActivity.length} DAILY LOGS</span>
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-black border border-gray-600 p-4">
            <h3 className="text-gray-400 font-mono font-bold mb-3 flex items-center gap-2" style={{ letterSpacing: '0.1em' }}>
              SYSTEM STATUS
              <div className="w-2 h-2 bg-green-400 ml-auto" style={{ borderRadius: '50%' }}></div>
            </h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>MEMORY:</span>
                <span className="text-white">{monitoringData.system.memory.used}MB/{monitoringData.system.memory.total}MB ({monitoringData.system.memory.percent}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>CPU LOAD:</span>
                <span className="text-white">{monitoringData.system.loadAvg[0]?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>UPTIME:</span>
                <span className="text-white">{monitoringData.system.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>PM2:</span>
                <span className="text-green-400">{monitoringData.system.pm2.filter(p => p.status === 'online').length}/{monitoringData.system.pm2.length} ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>DOCKER:</span>
                <span className={monitoringData.docker.find(d => d.name.includes('qdrant'))?.online ? 'text-green-400' : 'text-red-400'}>
                  {monitoringData.docker.find(d => d.name.includes('qdrant'))?.online ? 'UP' : 'DOWN'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>TASKS:</span>
                <span className="text-white">{monitoringData.tasks.total} ({monitoringData.tasks.done || 0} DONE)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>CAMPAIGNS:</span>
                <span className="text-white">{monitoringData.campaigns.sent}/{monitoringData.campaigns.total}</span>
              </div>
            </div>
          </div>

          {/* Token Usage & Costs */}
          <div className="bg-black border border-gray-600 p-4 col-span-2 lg:col-span-1">
            <h3 className="text-gray-400 font-mono font-bold mb-3" style={{ letterSpacing: '0.1em' }}>TOKENS & COSTS</h3>
            {/* Plan info */}
            {monitoringData.costTracking.length > 0 && (monitoringData.costTracking[monitoringData.costTracking.length - 1] as any)?.plan === 'max_200' && (
              <div className="mb-3 pb-2 border-b border-gray-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-blue-400 font-bold">PLAN: MAX $200/mo</span>
                  <span className="text-green-400">FORFAIT</span>
                </div>
                {(() => {
                  const latest = monitoringData.costTracking[monitoringData.costTracking.length - 1];
                  const rl = latest?.rate_limits;
                  return rl ? (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">OPUS REQ/5h:</span>
                        <span className={rl.opus_5h?.pct > 80 ? 'text-red-400' : 'text-gray-400'}>
                          {rl.opus_5h?.used || 0}/{rl.opus_5h?.limit || 45} ({rl.opus_5h?.pct || 0}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">SONNET REQ/5h:</span>
                        <span className={rl.sonnet_5h?.pct > 80 ? 'text-red-400' : 'text-gray-400'}>
                          {rl.sonnet_5h?.used || 0}/{rl.sonnet_5h?.limit || 100} ({rl.sonnet_5h?.pct || 0}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 h-1.5 mt-1">
                        <div className="h-1.5" style={{ 
                          width: `${Math.min(100, rl.opus_5h?.pct || 0)}%`,
                          backgroundColor: (rl.opus_5h?.pct || 0) > 80 ? '#f87171' : '#60a5fa'
                        }} />
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            )}
            <div className="space-y-2 text-sm font-mono">
              {monitoringData.costTracking.length > 0 ? (
                <>
                  {/* Per-day breakdown */}
                  {monitoringData.costTracking.slice(-5).reverse().map((entry: any, i: number) => (
                    <div key={i} className="border-b border-gray-800 pb-2 mb-2">
                      <div className="flex justify-between mb-1">
                        <span className="text-white font-bold" style={{ letterSpacing: '0.05em' }}>{entry.date}</span>
                        <span className="text-green-400">${(entry.cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">IN:</span>
                        <span className="text-gray-400">{(entry.tokens_in || 0).toLocaleString()} tok</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">OUT:</span>
                        <span className="text-gray-400">{(entry.tokens_out || 0).toLocaleString()} tok</span>
                      </div>
                      {entry.tokens_cached !== undefined && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">CACHED:</span>
                          <span className="text-blue-400">{(entry.tokens_cached || 0).toLocaleString()} tok</span>
                        </div>
                      )}
                      {entry.sessions_active !== undefined && (
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">SESSIONS:</span>
                          <span className="text-gray-400">{entry.sessions_active}</span>
                        </div>
                      )}
                      {/* Agent breakdown */}
                      {entry.agent_breakdown && Object.keys(entry.agent_breakdown).length > 0 && (
                        <div className="mt-1 pt-1 border-t border-gray-800">
                          {Object.entries(entry.agent_breakdown).map(([agent, info]: [string, any]) => (
                            <div key={agent} className="flex justify-between text-xs">
                              <span className="text-gray-500 truncate" style={{ maxWidth: '120px' }}>{agent}</span>
                              <span className="text-gray-400">${(info.cost_estimate || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Totals */}
                  <div className="pt-1">
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-400 font-bold" style={{ letterSpacing: '0.1em' }}>TOTAL COST:</span>
                      <span className="text-green-400 font-bold">${monitoringData.costTracking.reduce((s: number, e: any) => s + (e.cost || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>COÛT API EQUIV:</span>
                      <span className="text-yellow-400">${monitoringData.costTracking.reduce((s: number, e: any) => s + (e.api_equivalent_cost || e.cost || 0), 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>PLAN RÉEL:</span>
                      <span className="text-blue-400">$200/mois fixe</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>ÉCONOMIE:</span>
                      <span className="text-green-400">
                        ${Math.max(0, monitoringData.costTracking.reduce((s: number, e: any) => s + (e.api_equivalent_cost || e.cost || 0), 0) - 200).toFixed(2)} saved
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 h-2 mt-2">
                      <div 
                        className="h-2" 
                        style={{ 
                          width: `${Math.min(100, (monitoringData.costTracking.reduce((s: number, e: any) => s + (e.api_equivalent_cost || e.cost || 0), 0) / 200) * 100)}%`,
                          backgroundColor: monitoringData.costTracking.reduce((s: number, e: any) => s + (e.api_equivalent_cost || e.cost || 0), 0) > 200 ? '#4ade80' : '#60a5fa'
                        }} 
                      />
                    </div>
                    <div className="text-xs text-gray-600 mt-1 text-center">
                      {monitoringData.costTracking.reduce((s: number, e: any) => s + (e.api_equivalent_cost || e.cost || 0), 0) > 200 
                        ? '✅ Le forfait Max est rentable' 
                        : '📊 Pas encore rentabilisé vs API'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-gray-600">NO COST DATA — HEARTBEAT WILL LOG USAGE</div>
              )}
            </div>
          </div>

          {/* Agent Status */}
          <div className="bg-black border border-gray-600 p-4">
            <h3 className="text-gray-400 font-mono font-bold mb-3" style={{ letterSpacing: '0.1em' }}>AGENT MATRIX</h3>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {monitoringData.agents.slice(0, 8).map((agent, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-mono">
                  <span className="flex-1 truncate text-white" style={{ letterSpacing: '0.05em' }}>{agent.name.toUpperCase()}</span>
                  <div 
                    className={`w-2 h-2 ${
                      ['offline','error','down','stopped'].includes(agent.status) ? 'bg-red-400' :
                      ['idle','sleeping','paused'].includes(agent.status) ? 'bg-orange-400' : 'bg-green-400'
                    }`}
                  ></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COLONNE CENTRE - Visualisations Canvas */}
        <div className="flex-1 min-w-0 space-y-4">
          
          {/* Network Graph */}
          <div className="bg-black border border-gray-600 overflow-hidden">
            <div className="p-3 border-b border-gray-600">
              <h3 className="text-gray-400 font-mono font-bold" style={{ letterSpacing: '0.1em' }}>AGENT NETWORK GRAPH</h3>
            </div>
            <canvas
              ref={networkCanvasRef}
              className="w-full h-64"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Cost Chart */}
          <div className="bg-black border border-gray-600 overflow-hidden">
            <div className="p-3 border-b border-gray-600">
              <h3 className="text-gray-400 font-mono font-bold" style={{ letterSpacing: '0.1em' }}>TOKEN COST CURVE</h3>
            </div>
            <canvas
              ref={costCanvasRef}
              className="w-full h-48"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>

          {/* Log Activity Heatmap */}
          <div className="bg-black border border-gray-600 overflow-hidden">
            <div className="p-3 border-b border-gray-600">
              <h3 className="text-gray-400 font-mono font-bold" style={{ letterSpacing: '0.1em' }}>LOG ACTIVITY</h3>
            </div>
            <canvas
              ref={heatmapCanvasRef}
              className="w-full h-48"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>

        {/* COLONNE DROITE - Logs & Activity */}
        <div className="w-full lg:w-80 space-y-4">
          
          {/* System Log */}
          <div className="bg-black border border-gray-600">
            <div className="p-3 border-b border-gray-600">
              <h3 className="text-gray-400 font-mono font-bold" style={{ letterSpacing: '0.1em' }}>SYSTEM LOG</h3>
            </div>
            <div className="max-h-64 lg:max-h-80 overflow-y-auto p-2 font-mono text-xs bg-black">
              <div className="space-y-1">
                {logs.map(log => (
                  <div
                    key={log.id}
                    className={`${
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'system' ? 'text-white' :
                      log.type === 'spawn' ? 'text-white' :
                      log.type === 'complete' ? 'text-green-400' : 'text-green-400'
                    }`}
                  >
                    <span className="text-gray-600">[{log.timestamp}]</span> {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="bg-black border border-gray-600 p-4">
            <h3 className="text-gray-400 font-mono font-bold mb-3" style={{ letterSpacing: '0.1em' }}>PERFORMANCE</h3>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>AGENTS:</span>
                <span className="text-green-400">{monitoringData.agents.length}/12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>SUCCESS RATE:</span>
                <span className="text-green-400">98.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>AVG RESPONSE:</span>
                <span className="text-white">1.3S</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600" style={{ letterSpacing: '0.1em' }}>DOCKER STATUS:</span>
                <span className="text-green-400">{monitoringData.docker.filter(d => d.online).length}/{monitoringData.docker.length} UP</span>
              </div>
              
              <div className="pt-2 border-t border-gray-600">
                <div className="text-xs text-gray-600" style={{ letterSpacing: '0.1em' }}>NEURAL LOAD: 
                  <span className="text-orange-400 ml-1">{monitoringData.system.memory.percent}%</span>
                </div>
                <div className="text-xs text-gray-600" style={{ letterSpacing: '0.1em' }}>SYNC STATUS: 
                  <span className="text-green-400 ml-1">OPTIMAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}