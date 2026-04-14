import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promises as fs } from "fs";
import { promisify } from "util";
import { join } from "path";

const execAsync = promisify(exec);
const PROJECTS_DIR = "/root/openclaw/projects";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectPath = join(PROJECTS_DIR, id);
  
  try {
    await fs.access(projectPath);
  } catch {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  
  const { action } = await req.json();
  
  try {
    switch (action) {
      case "git-init": {
        await execAsync(`cd "${projectPath}" && git init && git add -A && git commit -m "Initial commit"`);
        return NextResponse.json({ success: true, action: "git-init" });
      }
      
      case "git-push": {
        const { remote } = await req.json().catch(() => ({ remote: null }));
        if (remote) {
          await execAsync(`cd "${projectPath}" && git remote add origin ${remote} 2>/dev/null || git remote set-url origin ${remote}`);
        }
        await execAsync(`cd "${projectPath}" && git add -A && git commit -m "Update $(date +%Y-%m-%d)" --allow-empty && git push -u origin main 2>&1`);
        return NextResponse.json({ success: true, action: "git-push" });
      }
      
      case "docker-build": {
        const result = await execAsync(`cd "${projectPath}" && docker build -t jarvis-${id}:latest . 2>&1`, { timeout: 120000 });
        return NextResponse.json({ success: true, action: "docker-build", output: result.stdout });
      }
      
      case "deploy-gcp": {
        const region = "europe-west1";
        const project = "jarvis-v2-488311";
        const image = `${region}-docker.pkg.dev/${project}/agents/${id}`;
        
        // Build, push, deploy
        const build = await execAsync(`cd "${projectPath}" && gcloud builds submit --tag ${image} --project ${project} 2>&1`, { timeout: 300000 });
        const deploy = await execAsync(`gcloud run deploy ${id} --image ${image} --region ${region} --project ${project} --platform managed --allow-unauthenticated=false 2>&1`, { timeout: 120000 });
        
        // Get URL
        const url = await execAsync(`gcloud run services describe ${id} --region ${region} --project ${project} --format 'value(status.url)' 2>/dev/null`);
        
        return NextResponse.json({
          success: true,
          action: "deploy-gcp",
          url: url.stdout.trim(),
          buildOutput: build.stdout.substring(0, 500),
        });
      }
      
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message || "Deploy failed",
      stderr: error.stderr?.substring(0, 500),
    }, { status: 500 });
  }
}
