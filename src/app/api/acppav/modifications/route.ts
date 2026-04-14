import { NextRequest, NextResponse } from "next/server";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

interface ModificationRequest {
  articleFile: string;
  demande: string;
  timestamp: string;
}

interface ModificationLog {
  id: string;
  articleFile: string;
  demande: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  appliedAt?: string;
  error?: string;
}

const PROJECTS_DIR = join(process.cwd(), '../projects/acppav');
const ARTICLES_DIR = join(PROJECTS_DIR, 'articles');
const LOGS_DIR = join(PROJECTS_DIR, 'data/modifications');

// Ensure directories exist
function ensureDir(path: string) {
  try {
    if (!existsSync(path)) {
      require('fs').mkdirSync(path, { recursive: true });
    }
  } catch (e) {}
}

// Smart rule-based modifications - Ultra-fast and free
function generateReplacement(demande: string, content: string): string | null {
  const demand = demande.toLowerCase();
  let modified = content;
  let hasChanges = false;
  
  console.log('Testing smart patterns for demand:', demande);
  
  // Smart pattern detection
  const patterns = [
    // Replace X by Y patterns
    { pattern: /remplacer "?([^"]+)"? par "?([^"]+)"?/i, action: 'replace' },
    { pattern: /changer "?([^"]+)"? en "?([^"]+)"?/i, action: 'replace' },
    { pattern: /modifier "?([^"]+)"? vers "?([^"]+)"?/i, action: 'replace' },
    
    // Add X patterns
    { pattern: /ajouter.*["']([^"']+)["']/i, action: 'add' },
    { pattern: /insérer.*["']([^"']+)["']/i, action: 'add' },
    
    // Remove X patterns  
    { pattern: /supprimer.*["']([^"']+)["']/i, action: 'remove' },
    { pattern: /enlever.*["']([^"']+)["']/i, action: 'remove' }
  ];
  
  for (const { pattern, action } of patterns) {
    const match = demande.match(pattern);
    console.log(`Pattern ${pattern} -> Match:`, match);
    if (match) {
      if (action === 'replace' && match[1] && match[2]) {
        const from = match[1];
        const to = match[2];
        const regex = new RegExp(from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (modified.match(regex)) {
          modified = modified.replace(regex, to);
          hasChanges = true;
          console.log(`Smart rule: Replace "${from}" with "${to}"`);
        }
      } else if (action === 'remove' && match[1]) {
        const toRemove = match[1];
        const regex = new RegExp(toRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (modified.match(regex)) {
          modified = modified.replace(regex, '');
          hasChanges = true;
          console.log(`Smart rule: Remove "${toRemove}"`);
        }
      } else if (action === 'add' && match[1]) {
        const toAdd = match[1];
        // Add to the end of first paragraph after frontmatter
        const lines = modified.split('\n');
        let inFrontmatter = false;
        let addedText = false;
        
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() === '---') {
            inFrontmatter = !inFrontmatter;
            continue;
          }
          
          if (!inFrontmatter && !addedText && lines[i].trim() && !lines[i].startsWith('#')) {
            lines[i] += ` ${toAdd}`;
            hasChanges = true;
            addedText = true;
            console.log(`Smart rule: Add "${toAdd}"`);
            break;
          }
        }
        
        if (addedText) {
          modified = lines.join('\n');
        }
      }
      break; // Use first matching pattern
    }
  }
  
  return hasChanges ? modified : null;
}

// Apply text modifications to article
async function applyModification(articleFile: string, demande: string): Promise<void> {
  const filePath = join(ARTICLES_DIR, articleFile);
  
  if (!existsSync(filePath)) {
    throw new Error(`Article file not found: ${articleFile}`);
  }

  console.log(`📝 Applying modification to ${articleFile}: ${demande}`);

  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  let modified = false;

  // Parse modification request and apply
  const demand = demande.toLowerCase();

  // Pre-programmed rules (for backwards compatibility)
  if (demand.includes('secrétaire assistante médico-administrative') || 
      demand.includes('secretaire assistante medico-administrative')) {
    console.log('  → Applying legacy rule: secrétaire médicale replacement');
    
    content = content.replace(/secrétaire médicale/g, 'secrétaire assistante médico-administrative');
    content = content.replace(/Secrétaire médicale/g, 'Secrétaire assistante médico-administrative');
    content = content.replace(/SECRÉTAIRE MÉDICALE/g, 'SECRÉTAIRE ASSISTANTE MÉDICO-ADMINISTRATIVE');
    
    // Update frontmatter
    content = content.replace(
      /title: "([^"]*[Ss]ecrétaire médicale[^"]*)"/g, 
      (match, title) => `title: "${title.replace(/[Ss]ecrétaire médicale/g, 'secrétaire assistante médico-administrative')}"`
    );
    content = content.replace(
      /keyword: "([^"]*[Ss]ecrétaire médicale[^"]*)"/g,
      (match, kw) => `keyword: "${kw.replace(/[Ss]ecrétaire médicale/g, 'secrétaire assistante médico-administrative')}"`
    );
    content = content.replace(
      /meta_description: "([^"]*[Ss]ecrétaire médicale[^"]*)"/g,
      (match, desc) => `meta_description: "${desc.replace(/[Ss]ecrétaire médicale/g, 'secrétaire assistante médico-administrative')}"`
    );
    modified = true;
  }

  // If no legacy rules applied, try smart patterns
  if (content === originalContent) {
    console.log('  → Trying smart pattern detection...');
    const smartResult = generateReplacement(demande, content);
    if (smartResult) {
      content = smartResult;
      modified = true;
      console.log('  ✅ Smart pattern applied');
    }
  }

  if (!modified) {
    console.log('  ⚠️ No modifications could be applied');
    throw new Error('No modifications could be applied. For complex changes, use the EXPERT button to call the ACPPAV agent.');
  }

  // Write back the modified content
  writeFileSync(filePath, content);
  console.log(`  ✅ Modified ${articleFile} successfully`);
}

// Log modification
function logModification(log: ModificationLog): void {
  ensureDir(LOGS_DIR);
  const logFile = join(LOGS_DIR, `${log.id}.json`);
  writeFileSync(logFile, JSON.stringify(log, null, 2));
  
  // Update master log
  const masterLogFile = join(LOGS_DIR, 'all-modifications.json');
  let allLogs: ModificationLog[] = [];
  
  if (existsSync(masterLogFile)) {
    try {
      allLogs = JSON.parse(readFileSync(masterLogFile, 'utf-8'));
    } catch (e) {}
  }
  
  const existingIndex = allLogs.findIndex(l => l.id === log.id);
  if (existingIndex >= 0) {
    allLogs[existingIndex] = log;
  } else {
    allLogs.push(log);
  }
  
  writeFileSync(masterLogFile, JSON.stringify(allLogs, null, 2));
}

// POST: Apply modification
export async function POST(request: NextRequest) {
  try {
    const body: ModificationRequest = await request.json();
    const { articleFile, demande, timestamp } = body;

    const modId = `mod-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const log: ModificationLog = {
      id: modId,
      articleFile,
      demande,
      timestamp,
      status: 'pending'
    };
    
    logModification(log);

    try {
      // Apply the modification
      await applyModification(articleFile, demande);
      
      // Update log
      log.status = 'completed';
      log.appliedAt = new Date().toISOString();
      logModification(log);
      
      // Rebuild dashboard data
      try {
        await execAsync('cd ../../projects/acppav && node build-dashboard.js');
      } catch (e) {
        console.warn('Dashboard rebuild failed:', e);
      }
      
      return NextResponse.json({ 
        success: true, 
        modificationId: modId,
        message: `Modification appliquée: ${demande}`,
        articleFile 
      });

    } catch (error) {
      log.status = 'failed';
      log.error = error instanceof Error ? error.message : String(error);
      logModification(log);
      
      return NextResponse.json({ 
        success: false, 
        error: log.error 
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 400 });
  }
}

// GET: List modifications
export async function GET() {
  try {
    ensureDir(LOGS_DIR);
    const masterLogFile = join(LOGS_DIR, 'all-modifications.json');
    
    if (!existsSync(masterLogFile)) {
      return NextResponse.json([]);
    }
    
    const logs = JSON.parse(readFileSync(masterLogFile, 'utf-8'));
    return NextResponse.json(logs);
    
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}