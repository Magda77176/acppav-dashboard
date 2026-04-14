import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(req: NextRequest) {
  const exercise = req.nextUrl.searchParams.get('exercise') || '01-basics.py';
  const allowed = ['01-basics.py', '02-chains.py', '03-rag.py', '04-agent-tools.py'];
  
  if (!allowed.includes(exercise)) {
    return NextResponse.json({ error: 'Exercice invalide' }, { status: 400 });
  }

  try {
    const code = await readFile(
      join('/root/openclaw/formations/langchain-101', exercise), 
      'utf-8'
    );
    return NextResponse.json({ code, exercise });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
