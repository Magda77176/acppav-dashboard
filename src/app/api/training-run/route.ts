import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { exercise } = await req.json();
    
    const allowed = ['01-basics.py', '02-chains.py', '03-rag.py', '04-agent-tools.py'];
    if (!allowed.includes(exercise)) {
      return NextResponse.json({ error: 'Exercice invalide' }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(
      `cd /root/openclaw/formations/langchain-101 && source venv/bin/activate && python ${exercise} 2>&1`,
      { 
        timeout: 120000,
        shell: '/bin/bash',
        env: { ...process.env, PYTHONUNBUFFERED: '1' }
      }
    );

    return NextResponse.json({ output: stdout + (stderr || ''), success: true });
  } catch (err: any) {
    return NextResponse.json({ 
      output: err.stdout || err.stderr || err.message || 'Erreur inconnue',
      success: false 
    });
  }
}
