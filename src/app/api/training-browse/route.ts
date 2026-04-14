import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile, stat } from 'fs/promises';
import { join, relative } from 'path';

const ROOT = '/root/openclaw';
const SKIP = ['venv', '.next', 'node_modules', '__pycache__', '.git', '.openclaw'];

async function listPythonFiles(dir: string, depth = 0): Promise<any[]> {
  if (depth > 3) return [];
  const results: any[] = [];
  
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP.includes(entry.name)) continue;
      const full = join(dir, entry.name);
      
      if (entry.isDirectory() && depth < 3) {
        const sub = await listPythonFiles(full, depth + 1);
        if (sub.length > 0) {
          results.push({ name: entry.name, type: 'dir', path: relative(ROOT, full), children: sub });
        }
      } else if (entry.name.endsWith('.py')) {
        const s = await stat(full);
        results.push({ 
          name: entry.name, type: 'file', 
          path: relative(ROOT, full),
          size: s.size,
          modified: s.mtime.toISOString().split('T')[0]
        });
      }
    }
  } catch {}
  
  return results.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get('path');
  
  if (path) {
    // Read a specific file
    const fullPath = join(ROOT, path);
    if (!fullPath.startsWith(ROOT) || !path.endsWith('.py')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    try {
      const code = await readFile(fullPath, 'utf-8');
      const s = await stat(fullPath);
      return NextResponse.json({ code, path, size: s.size, modified: s.mtime.toISOString() });
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 404 });
    }
  }
  
  // List tree
  const tree = await listPythonFiles(ROOT);
  return NextResponse.json({ tree });
}
