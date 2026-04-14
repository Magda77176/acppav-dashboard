import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'data', 'tasks.json');
    const data = readFileSync(dataPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading tasks.json:', error);
    return NextResponse.json({ error: 'Failed to load tasks data' }, { status: 500 });
  }
}