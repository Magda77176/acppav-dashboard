import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir, stat, readFile } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

const BACKUP_DIR = '/root/openclaw/backups';
const OPENCLAW_ROOT = '/root/openclaw';

export async function GET() {
  try {
    // List existing backups
    const backups = [];
    
    try {
      const entries = await readdir(BACKUP_DIR);
      
      for (const entry of entries) {
        const backupPath = join(BACKUP_DIR, entry);
        const stats = await stat(backupPath);
        
        if (stats.isDirectory() && /^\d{4}-\d{2}-\d{2}-\d{6}$/.test(entry)) {
          // Check if tar.gz exists
          const tarPath = `${backupPath}.tar.gz`;
          let hasArchive = false;
          let archiveSize = 0;
          
          try {
            const tarStats = await stat(tarPath);
            hasArchive = true;
            archiveSize = tarStats.size;
          } catch {
            // Archive doesn't exist
          }
          
          backups.push({
            id: entry,
            date: entry,
            timestamp: stats.mtime,
            size: archiveSize,
            hasArchive,
            path: tarPath,
          });
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
      console.log('Backup directory does not exist yet');
    }
    
    return NextResponse.json({ 
      success: true, 
      backups: backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    });
  } catch (error) {
    console.error('Error listing backups:', error);
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
    const backupName = timestamp;
    const backupPath = join(BACKUP_DIR, backupName);
    
    // Create backup directory
    await execAsync(`mkdir -p "${backupPath}"`);
    
    // Copy ALL critical files — full system recovery
    const filesToBackup = [
      // Core config files
      { src: `${OPENCLAW_ROOT}/SOUL.md`, dest: 'SOUL.md' },
      { src: `${OPENCLAW_ROOT}/AGENTS.md`, dest: 'AGENTS.md' },
      { src: `${OPENCLAW_ROOT}/RULES.md`, dest: 'RULES.md' },
      { src: `${OPENCLAW_ROOT}/USER.md`, dest: 'USER.md' },
      { src: `${OPENCLAW_ROOT}/TOOLS.md`, dest: 'TOOLS.md' },
      { src: `${OPENCLAW_ROOT}/HEARTBEAT.md`, dest: 'HEARTBEAT.md' },
      { src: `${OPENCLAW_ROOT}/MEMORY.md`, dest: 'MEMORY.md' },
      { src: `${OPENCLAW_ROOT}/IDENTITY.md`, dest: 'IDENTITY.md' },
      { src: `${OPENCLAW_ROOT}/BOOTSTRAP.md`, dest: 'BOOTSTRAP.md' },
      // Sub-agents (AGENT.md + skills)
      { src: `${OPENCLAW_ROOT}/agents`, dest: 'agents' },
      // Memory — daily logs
      { src: `${OPENCLAW_ROOT}/memory`, dest: 'memory' },
      // Tools — custom scripts (scheduler, send-email, RAG, scrapers, etc.)
      { src: `${OPENCLAW_ROOT}/tools`, dest: 'tools' },
      // Twitter API scripts
      { src: `${OPENCLAW_ROOT}/twitter-api`, dest: 'twitter-api' },
      // Mission Control — full source + data + public assets
      { src: `${OPENCLAW_ROOT}/mission-control/src`, dest: 'mission-control/src' },
      { src: `${OPENCLAW_ROOT}/mission-control/public`, dest: 'mission-control/public' },
      { src: `${OPENCLAW_ROOT}/mission-control/data`, dest: 'mission-control/data' },
      { src: `${OPENCLAW_ROOT}/mission-control/package.json`, dest: 'mission-control/package.json' },
      { src: `${OPENCLAW_ROOT}/mission-control/tsconfig.json`, dest: 'mission-control/tsconfig.json' },
      { src: `${OPENCLAW_ROOT}/mission-control/next.config.ts`, dest: 'mission-control/next.config.ts' },
      { src: `${OPENCLAW_ROOT}/mission-control/tailwind.config.ts`, dest: 'mission-control/tailwind.config.ts' },
      { src: `${OPENCLAW_ROOT}/mission-control/postcss.config.mjs`, dest: 'mission-control/postcss.config.mjs' },
      // OpenClaw config
      { src: `/root/.openclaw/openclaw.json`, dest: 'config/openclaw.json' },
      { src: `${OPENCLAW_ROOT}/openclaw.json`, dest: 'config/openclaw-workspace.json' },
    ];
    
    // Qdrant RAG export (vector memory — 1700+ points)
    try {
      await execAsync(`mkdir -p "${backupPath}/qdrant"`);
      await execAsync(`curl -s http://localhost:6333/collections/jarvis_memory/points/scroll -H "Content-Type: application/json" -d '{"limit":2000,"with_payload":true,"with_vector":false}' > "${backupPath}/qdrant/jarvis_memory.json"`);
    } catch {
      console.log('Qdrant export failed, skipping');
    }
    
    // PM2 ecosystem config
    try {
      await execAsync(`pm2 save 2>/dev/null; cp /root/.pm2/dump.pm2 "${backupPath}/config/pm2-dump.json" 2>/dev/null || true`);
    } catch { console.log('PM2 dump failed, skipping'); }
    
    // Caddy config
    try {
      await execAsync(`mkdir -p "${backupPath}/config" && cp /etc/caddy/Caddyfile "${backupPath}/config/Caddyfile" 2>/dev/null || true`);
    } catch { console.log('Caddy config failed, skipping'); }
    
    // Crontab
    try {
      await execAsync(`crontab -l > "${backupPath}/config/crontab.txt" 2>/dev/null || true`);
    } catch { console.log('Crontab export failed, skipping'); }
    
    // Copy files and directories
    for (const file of filesToBackup) {
      try {
        await stat(file.src);
        const destPath = join(backupPath, file.dest);
        const destDir = destPath.split('/').slice(0, -1).join('/');
        await execAsync(`mkdir -p "${destDir}" && cp -r "${file.src}" "${destPath}"`);
      } catch {
        console.log(`File not found, skipping: ${file.src}`);
      }
    }
    
    // Create tar.gz archive
    const tarPath = `${backupPath}.tar.gz`;
    await execAsync(`cd "${BACKUP_DIR}" && tar -czf "${backupName}.tar.gz" "${backupName}"`);
    
    // Get archive size
    const stats = await stat(tarPath);
    
    return NextResponse.json({ 
      success: true, 
      backup: {
        id: backupName,
        date: backupName,
        size: stats.size,
        downloadUrl: `/api/backups/${backupName}/download`
      }
    });
  } catch (error) {
    console.error('Error creating backup:', error);
    return NextResponse.json({ error: 'Failed to create backup', details: error }, { status: 500 });
  }
}