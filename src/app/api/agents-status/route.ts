import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'data', 'office-state.json');
    const raw = readFileSync(dataPath, 'utf-8');
    const data = JSON.parse(raw);
    
    // Map agents with status
    const agents = (data.agents || []).map((a: any) => ({
      name: a.name,
      status: a.status,
      mood: a.mood,
      energy: a.energy || 80,
      icon: a.icon || a.emoji || '🤖',
      color: a.color || '#666',
      currentTask: a.currentTask || a.status,
      zone: a.currentZone || a.zone || 'bureau',
      lastActive: a.lastActive || new Date().toISOString(),
    }));

    return NextResponse.json({ 
      agents, 
      updatedAt: new Date().toISOString(),
      totalAgents: agents.length,
      activeCount: agents.filter((a: any) => !['idle', 'sleeping', 'playing'].includes(a.status)).length,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load agent data' }, { status: 500 });
  }
}
