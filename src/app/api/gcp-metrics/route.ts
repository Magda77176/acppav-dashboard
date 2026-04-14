import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const GCLOUD = "/opt/google-cloud-sdk/bin/gcloud";
const PROJECT = "jarvis-v2-488311";

export const dynamic = 'force-dynamic';

async function getMetric(metricType: string, alignerPeriod = "600s", aligner = "ALIGN_MEAN", reducer = "REDUCE_MEAN"): Promise<number | null> {
  try {
    const cmd = `${GCLOUD} monitoring metrics read "${metricType}" --project=${PROJECT} --interval-start-time=$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%SZ) --format=json 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const data = JSON.parse(stdout || '[]');
    if (data.length > 0 && data[0].points?.length > 0) {
      const val = data[0].points[0].value?.doubleValue ?? data[0].points[0].value?.int64Value ?? null;
      return val;
    }
    return null;
  } catch {
    return null;
  }
}

async function getRecentLogs(severity: string, limit = 10): Promise<any[]> {
  try {
    const cmd = `${GCLOUD} logging read "severity>=${severity}" --project=${PROJECT} --limit=${limit} --format=json --freshness=1h 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const logs = JSON.parse(stdout || '[]');
    return logs.map((log: any) => ({
      timestamp: log.timestamp,
      severity: log.severity,
      message: log.textPayload || log.jsonPayload?.message || log.protoPayload?.status?.message || 'N/A',
      source: log.resource?.labels?.service_name || log.resource?.labels?.instance_id || log.logName?.split('/').pop() || 'unknown',
    }));
  } catch {
    return [];
  }
}

async function getCloudRunServices(): Promise<any[]> {
  try {
    const cmd = `${GCLOUD} run services list --project=${PROJECT} --format=json 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const services = JSON.parse(stdout || '[]');
    return services.map((svc: any) => ({
      name: svc.metadata?.name,
      region: svc.metadata?.labels?.['cloud.googleapis.com/location'] || 'unknown',
      url: svc.status?.url,
      ready: svc.status?.conditions?.find((c: any) => c.type === 'Ready')?.status === 'True',
      lastDeployed: svc.metadata?.creationTimestamp,
    }));
  } catch {
    return [];
  }
}

async function getAlertIncidents(): Promise<any[]> {
  try {
    const cmd = `${GCLOUD} alpha monitoring policies list --project=${PROJECT} --format=json 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 15000 });
    const policies = JSON.parse(stdout || '[]');
    return policies.map((p: any) => ({
      name: p.displayName,
      enabled: p.enabled,
      state: p.currentState || 'OK',
    }));
  } catch {
    return [];
  }
}

async function getBillingEstimate(): Promise<any> {
  try {
    // Estimate based on service usage — real billing requires Billing API
    const cmd = `${GCLOUD} logging read "resource.type=cloud_run_revision" --project=${PROJECT} --limit=1 --freshness=24h --format=json 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 10000 });
    const logs = JSON.parse(stdout || '[]');
    return {
      hasActivity: logs.length > 0,
      note: "Estimation basée sur l'activité Cloud Run",
    };
  } catch {
    return { hasActivity: false, note: "Pas de données billing" };
  }
}

export async function GET() {
  try {
    const [recentErrors, recentWarnings, cloudRunServices, alertPolicies, billing] = await Promise.all([
      getRecentLogs("ERROR", 10),
      getRecentLogs("WARNING", 5),
      getCloudRunServices(),
      getAlertIncidents(),
      getBillingEstimate(),
    ]);

    // Get agent ops metrics via local commands (faster than Cloud Monitoring API)
    const [cpuUsage, memUsage, diskUsage] = await Promise.all([
      execAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'").then(r => parseFloat(r.stdout.trim())).catch(() => null),
      execAsync("free | awk 'NR==2{printf \"%.1f\", $3/$2*100}'").then(r => parseFloat(r.stdout.trim())).catch(() => null),
      execAsync("df -h / | awk 'NR==2{print $5}' | tr -d '%'").then(r => parseInt(r.stdout.trim())).catch(() => null),
    ]);

    // Count logs by severity in last hour
    const logCounts = await execAsync(
      `${GCLOUD} logging read "" --project=${PROJECT} --freshness=1h --format=json --limit=500 2>/dev/null | python3 -c "
import json, sys
logs = json.load(sys.stdin)
counts = {}
for l in logs:
    s = l.get('severity', 'DEFAULT')
    counts[s] = counts.get(s, 0) + 1
print(json.dumps(counts))
" 2>/dev/null`
    ).then(r => JSON.parse(r.stdout.trim())).catch(() => ({}));

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      project: PROJECT,
      
      // Infrastructure temps réel
      infrastructure: {
        cpu: cpuUsage,
        memory: memUsage,
        disk: diskUsage,
      },

      // Cloud Run MCP servers
      cloudRun: {
        services: cloudRunServices,
        totalServices: cloudRunServices.length,
        healthyServices: cloudRunServices.filter((s: any) => s.ready).length,
      },

      // Logs
      logs: {
        counts: logCounts,
        recentErrors,
        recentWarnings,
      },

      // Alertes
      alerts: {
        policies: alertPolicies,
        activeIncidents: alertPolicies.filter((p: any) => p.state !== 'OK').length,
      },

      // Billing
      billing,

      // Status global
      status: recentErrors.length > 5 ? 'degraded' : 'healthy',
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Failed to fetch GCP metrics',
      message: error.message 
    }, { status: 500 });
  }
}
