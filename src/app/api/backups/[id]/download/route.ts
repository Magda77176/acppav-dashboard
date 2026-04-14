import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join } from 'path';

const BACKUP_DIR = '/root/openclaw/backups';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: backupId } = await params;
    const tarPath = join(BACKUP_DIR, `${backupId}.tar.gz`);
    
    // Check if file exists
    await stat(tarPath);
    
    // Read file
    const fileBuffer = await readFile(tarPath);
    
    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="openclaw-backup-${backupId}.tar.gz"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading backup:', error);
    return NextResponse.json({ error: 'Backup file not found' }, { status: 404 });
  }
}