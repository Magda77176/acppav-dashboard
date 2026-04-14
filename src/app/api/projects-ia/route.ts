import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";
import { join } from "path";

const execAsync = promisify(exec);

const PROJECTS_DIR = "/root/openclaw/projects";

export const dynamic = 'force-dynamic';

interface ProjectIA {
  id: string;
  name: string;
  path: string;
  hasAgent: boolean;
  hasMcp: boolean;
  hasWorkflow: boolean;
  hasDockerfile: boolean;
  hasCICD: boolean;
  hasTests: boolean;
  gitStatus: string;
  gitRemote: string | null;
  lastCommit: string | null;
  gcpService: string | null;
  gcpUrl: string | null;
  files: string[];
}

export async function GET() {
  try {
    const projects: ProjectIA[] = [];
    
    // Scan projects directory
    let entries: string[] = [];
    try {
      entries = await fs.readdir(PROJECTS_DIR);
    } catch {
      await fs.mkdir(PROJECTS_DIR, { recursive: true });
    }
    
    for (const entry of entries) {
      const projectPath = join(PROJECTS_DIR, entry);
      const stat = await fs.stat(projectPath);
      if (!stat.isDirectory()) continue;
      
      // Check for standard files
      const fileChecks = {
        agent: ["src/agent.py", "agent.py"],
        mcp: ["src/mcp_server.py", "mcp_server.py"],
        workflow: ["src/workflow.py", "workflow.py"],
        dockerfile: ["Dockerfile"],
        cicd: [".github/workflows/deploy.yml"],
        tests: ["tests/test_agent.py", "tests/"],
      };
      
      const hasFile = async (paths: string[]) => {
        for (const p of paths) {
          try { await fs.access(join(projectPath, p)); return true; } catch {}
        }
        return false;
      };
      
      // Git info
      let gitStatus = "no git";
      let gitRemote: string | null = null;
      let lastCommit: string | null = null;
      
      try {
        const status = await execAsync(`cd "${projectPath}" && git status --porcelain 2>/dev/null`);
        gitStatus = status.stdout.trim() ? "modified" : "clean";
        
        const remote = await execAsync(`cd "${projectPath}" && git remote get-url origin 2>/dev/null`);
        gitRemote = remote.stdout.trim() || null;
        
        const commit = await execAsync(`cd "${projectPath}" && git log -1 --format="%h %s" 2>/dev/null`);
        lastCommit = commit.stdout.trim() || null;
      } catch {}
      
      // List files
      let files: string[] = [];
      try {
        const ls = await execAsync(`cd "${projectPath}" && find . -maxdepth 3 -type f -not -path './.git/*' -not -path './node_modules/*' -not -path './__pycache__/*' | sort`);
        files = ls.stdout.trim().split('\n').filter(Boolean).map(f => f.replace('./', ''));
      } catch {}
      
      // Check GCP deployment
      let gcpService: string | null = null;
      let gcpUrl: string | null = null;
      // TODO: Check via gcloud CLI if service exists
      
      projects.push({
        id: entry,
        name: entry.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        path: projectPath,
        hasAgent: await hasFile(fileChecks.agent),
        hasMcp: await hasFile(fileChecks.mcp),
        hasWorkflow: await hasFile(fileChecks.workflow),
        hasDockerfile: await hasFile(fileChecks.dockerfile),
        hasCICD: await hasFile(fileChecks.cicd),
        hasTests: await hasFile(fileChecks.tests),
        gitStatus,
        gitRemote,
        lastCommit,
        gcpService,
        gcpUrl,
        files,
      });
    }
    
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error scanning projects:", error);
    return NextResponse.json({ error: "Failed to scan projects" }, { status: 500 });
  }
}

// POST: Initialize a new project from template
export async function POST(req: Request) {
  try {
    const { name, template = "template-agent" } = await req.json();
    
    if (!name || !/^[a-z0-9-]+$/.test(name)) {
      return NextResponse.json({ error: "Invalid project name (use lowercase, numbers, hyphens)" }, { status: 400 });
    }
    
    const projectPath = join(PROJECTS_DIR, name);
    const templatePath = join(PROJECTS_DIR, template);
    
    // Check template exists
    try { await fs.access(templatePath); } catch {
      return NextResponse.json({ error: `Template ${template} not found` }, { status: 404 });
    }
    
    // Check project doesn't exist
    try { await fs.access(projectPath); return NextResponse.json({ error: "Project already exists" }, { status: 409 }); } catch {}
    
    // Copy template
    await execAsync(`cp -r "${templatePath}" "${projectPath}"`);
    
    // Init git
    await execAsync(`cd "${projectPath}" && git init && git add -A && git commit -m "Init from template"`);
    
    return NextResponse.json({ success: true, project: name, path: projectPath });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
