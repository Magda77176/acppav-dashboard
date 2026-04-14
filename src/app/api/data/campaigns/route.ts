import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const dataPath = join(process.cwd(), 'data', 'campaigns.json');
    const data = readFileSync(dataPath, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading campaigns.json:', error);
    return NextResponse.json({ error: 'Failed to load campaigns data' }, { status: 500 });
  }
}