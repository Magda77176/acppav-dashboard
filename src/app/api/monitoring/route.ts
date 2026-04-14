import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. PM2 status
    const pm2Data = await execAsync('pm2 jlist').then(r => JSON.parse(r.stdout)).catch(() => []);
    
    // 2. System stats
    const uptime = await execAsync('uptime -s').then(r => r.stdout.trim()).catch(() => 'unknown');
    const memRaw = await execAsync("free -m | awk 'NR==2{print $2,$3,$4}'").then(r => r.stdout.trim()).catch(() => '0 0 0');
    const [memTotal, memUsed, memFree] = memRaw.split(' ').map(Number);
    const loadAvg = await execAsync("cat /proc/loadavg | awk '{print $1,$2,$3}'").then(r => r.stdout.trim()).catch(() => '0 0 0');
    
    // 3. Docker status
    const docker = await execAsync("docker ps --format '{{.Names}}:{{.Status}}'").then(r => 
      r.stdout.trim().split('\n').filter(Boolean).map(line => {
        const [name, status] = line.split(':');
        return { name, status, online: status?.includes('Up') };
      })
    ).catch(() => []);
    
    // 4. Agents from office-state.json
    const agentsData = await fs.readFile('/root/openclaw/mission-control/data/office-state.json', 'utf-8')
      .then(d => JSON.parse(d))
      .catch(() => ({ agents: [] }));
    
    // 5. Tasks summary
    const tasksData = await fs.readFile('/root/openclaw/mission-control/data/tasks.json', 'utf-8')
      .then(d => {
        const tasks = JSON.parse(d);
        const list = Array.isArray(tasks) ? tasks : tasks.tasks || [];
        const summary: Record<string, number> = {};
        list.forEach((t: any) => { summary[t.status] = (summary[t.status] || 0) + 1; });
        return { total: list.length, ...summary };
      })
      .catch(() => ({ total: 0 }));
    
    // 6. Campaigns summary
    const campaignsData = await fs.readFile('/root/openclaw/mission-control/data/campaigns.json', 'utf-8')
      .then(d => {
        const campaigns = JSON.parse(d);
        const list = Array.isArray(campaigns) ? campaigns : campaigns.campaigns || [];
        return { 
          total: list.length,
          sent: list.filter((c: any) => c.status === 'sent').length,
          planned: list.filter((c: any) => c.status === 'planned').length
        };
      })
      .catch(() => ({ total: 0, sent: 0, planned: 0 }));
    
    // 7. Cost tracking — calculate cost from tokens if not present
    // Anthropic pricing: Opus input=$15/1M, output=$75/1M | Sonnet input=$3/1M, output=$15/1M
    const costData = await fs.readFile('/root/openclaw/memory/cost-tracking.json', 'utf-8')
      .then(d => {
        const entries = JSON.parse(d);
        return entries.map((e: any) => {
          if (e.cost) return e;
          // Estimate cost from tokens (assume mix Opus/Sonnet, weighted Opus-heavy)
          const tokIn = e.tokens_in || 0;
          const tokOut = e.tokens_out || 0;
          const cost = (tokIn / 1_000_000) * 15 + (tokOut / 1_000_000) * 75;
          return { ...e, cost: Math.round(cost * 100) / 100 };
        });
      })
      .catch(() => []);
    
    // Also get live session stats from OpenClaw
    let liveSession: any = null;
    try {
      const sessionInfo = await execAsync("curl -s http://127.0.0.1:58015/api/v1/sessions 2>/dev/null || echo '{}'");
      liveSession = JSON.parse(sessionInfo.stdout);
    } catch { /* ignore */ }
    
    // 8. Scheduler state
    const schedulerState = await fs.readFile('/root/openclaw/tools/scheduler-state.json', 'utf-8')
      .then(d => JSON.parse(d))
      .catch(() => ({}));
    
    // 9. Daily log activity (count files per day for last 14 days)
    const dailyActivity = await execAsync("ls -1 /root/openclaw/memory/2026-03-*.md 2>/dev/null | while read f; do echo \"$(basename $f .md):$(wc -c < $f)\"; done")
      .then(r => r.stdout.trim().split('\n').filter(Boolean).map(line => {
        const [date, bytes] = line.split(':');
        return { date, bytes: parseInt(bytes) || 0 };
      }))
      .catch(() => []);

    // 10. Qdrant stats (main memory system)
    const qdrantStats = await execAsync("curl -s http://localhost:6333/collections/jarvis_memory")
      .then(r => {
        const data = JSON.parse(r.stdout);
        const points = data.result?.points_count || 0;
        const status = points > 0 ? 'green' : (data.result?.status === 'green' ? 'green' : 'red');
        return { 
          points, 
          status, 
          collection: 'jarvis_memory',
          isMainMemory: true
        };
      })
      .catch(() => ({ points: 0, status: 'red', collection: 'jarvis_memory', isMainMemory: true }));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      // RAG Memory en premier (système principal)
      qdrant: qdrantStats,
      system: {
        uptime,
        memory: { total: memTotal, used: memUsed, free: memFree, percent: Math.round((memUsed / memTotal) * 100) },
        loadAvg: loadAvg.split(' ').map(Number),
        pm2: pm2Data.map((p: any) => ({
          name: p.name,
          status: p.pm2_env?.status,
          memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
          cpu: p.monit?.cpu || 0,
          restarts: p.pm2_env?.restart_time || 0
        }))
      },
      docker,
      agents: agentsData.agents || [],
      tasks: tasksData,
      campaigns: campaignsData,
      costTracking: costData,
      liveSession,
      scheduler: schedulerState,
      // Backup logs (secondaire)
      dailyActivity
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to gather monitoring data' }, { status: 500 });
  }
}