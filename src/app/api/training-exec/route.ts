import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  const tmpFile = join('/tmp', `training-${randomUUID()}.py`);
  
  try {
    const { code } = await req.json();
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code manquant' }, { status: 400 });
    }
    
    // Security: block dangerous operations
    const blocked = ['os.system', 'subprocess', 'shutil.rmtree', '__import__', 'eval(', 'exec(', 'rm -rf'];
    for (const b of blocked) {
      if (code.includes(b)) {
        return NextResponse.json({ output: `❌ Opération bloquée: ${b}`, success: false });
      }
    }

    await writeFile(tmpFile, code, 'utf-8');

    const { stdout, stderr } = await execAsync(
      `cd /root/openclaw/formations/langchain-101 && source venv/bin/activate && python ${tmpFile} 2>&1`,
      { 
        timeout: 120000,
        shell: '/bin/bash',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      }
    );

    await unlink(tmpFile).catch(() => {});
    return NextResponse.json({ output: stdout + (stderr || ''), success: true });
  } catch (err: any) {
    await unlink(tmpFile).catch(() => {});
    return NextResponse.json({ 
      output: err.stdout || err.stderr || err.message || 'Erreur inconnue',
      success: false 
    });
  }
}
