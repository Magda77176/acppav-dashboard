import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

const ROOT = '/root/openclaw';

export async function POST(req: NextRequest) {
  try {
    const { path } = await req.json();
    const fullPath = join(ROOT, path);
    
    if (!fullPath.startsWith(ROOT) || !path.endsWith('.py')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }
    
    const code = await readFile(fullPath, 'utf-8');
    
    // Analyze the code structure
    const lines = code.split('\n');
    const imports: string[] = [];
    const functions: string[] = [];
    const classes: string[] = [];
    const comments: string[] = [];
    let hasMain = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
        imports.push(trimmed);
      }
      if (trimmed.startsWith('def ')) {
        const name = trimmed.match(/def\s+(\w+)/)?.[1] || '';
        functions.push(name);
      }
      if (trimmed.startsWith('class ')) {
        const name = trimmed.match(/class\s+(\w+)/)?.[1] || '';
        classes.push(name);
      }
      if (trimmed.startsWith('# ') && trimmed.length > 5) {
        comments.push(trimmed);
      }
      if (trimmed.includes('__main__')) hasMain = true;
    }
    
    // Identify LangChain/AI related patterns
    const patterns: string[] = [];
    if (code.includes('langchain')) patterns.push('🦜 LangChain');
    if (code.includes('anthropic') || code.includes('claude')) patterns.push('🤖 Anthropic/Claude');
    if (code.includes('openai') || code.includes('gpt')) patterns.push('🧠 OpenAI');
    if (code.includes('gemini') || code.includes('google')) patterns.push('💎 Google/Gemini');
    if (code.includes('qdrant') || code.includes('vector')) patterns.push('📐 Qdrant/Vectors');
    if (code.includes('ollama')) patterns.push('🦙 Ollama');
    if (code.includes('embedding')) patterns.push('📊 Embeddings');
    if (code.includes('requests') || code.includes('httpx') || code.includes('aiohttp')) patterns.push('🌐 HTTP/API');
    if (code.includes('selenium') || code.includes('playwright')) patterns.push('🌍 Browser automation');
    if (code.includes('smtp') || code.includes('email')) patterns.push('📧 Email');
    if (code.includes('pandas') || code.includes('csv')) patterns.push('📈 Data/CSV');
    if (code.includes('async') || code.includes('await')) patterns.push('⚡ Async');
    if (code.includes('FastAPI') || code.includes('flask')) patterns.push('🚀 Web framework');
    
    return NextResponse.json({
      analysis: {
        lines: lines.length,
        imports,
        functions,
        classes,
        comments: comments.slice(0, 10),
        hasMain,
        patterns,
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
