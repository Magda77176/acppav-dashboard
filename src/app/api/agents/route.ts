import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = path.resolve(process.cwd(), "..");

export async function GET() {
  const agentsDir = path.join(WORKSPACE, "agents");
  const skillsDir = path.join(WORKSPACE, "skills");

  // Read agents
  const agents = fs.readdirSync(agentsDir)
    .filter(d => {
      try { return fs.statSync(path.join(agentsDir, d)).isDirectory(); }
      catch { return false; }
    })
    .map(name => {
      const agentFile = path.join(agentsDir, name, "AGENT.md");
      const hasAgent = fs.existsSync(agentFile);
      let title = name;
      let mission = "";
      let lines = 0;
      let skills: string[] = [];
      let version = "—";

      if (hasAgent) {
        const content = fs.readFileSync(agentFile, "utf-8");
        lines = content.split("\n").length;
        
        const titleMatch = content.match(/^#\s+(.+)/m);
        if (titleMatch) title = titleMatch[1];

        const versionMatch = content.match(/v(\d+\.\d+)/i);
        if (versionMatch) version = `v${versionMatch[1]}`;

        const missionMatch = content.match(/##\s+(?:1\.\s+)?Mission\s*\n+([\s\S]*?)(?=\n##|\n---)/i);
        if (missionMatch) mission = missionMatch[1].trim().split("\n")[0].slice(0, 150);

        // Extract skills
        const skillMatches = content.matchAll(/`skills\/([^/]+)\//g);
        for (const m of skillMatches) {
          if (!skills.includes(m[1])) skills.push(m[1]);
        }
      }

      return { name, title, mission, lines, hasAgent, skills, version };
    })
    .sort((a, b) => b.lines - a.lines);

  // Count custom skills
  const customSkills = fs.readdirSync(skillsDir)
    .filter(d => !["alireza-skills", "anthropic-skills", "obra-superpowers", "scientific-skills", "wshobson-agents"].includes(d))
    .filter(d => {
      try { return fs.existsSync(path.join(skillsDir, d, "SKILL.md")); }
      catch { return false; }
    })
    .map(name => {
      const content = fs.readFileSync(path.join(skillsDir, name, "SKILL.md"), "utf-8");
      const titleMatch = content.match(/^#\s+(.+)/m);
      const lines = content.split("\n").length;
      
      // Find which agents use this skill
      const usedBy: string[] = [];
      const usedMatch = content.match(/##\s+Utilisé par\s*\n+([\s\S]*?)(?=\n##|$)/i);
      if (usedMatch) {
        const agentMatches = usedMatch[1].matchAll(/Agent\s+(\w[\w\s]*?)[\s(]/g);
        for (const m of agentMatches) usedBy.push(m[1].trim());
      }

      return { name, title: titleMatch?.[1] || name, lines, usedBy };
    });

  return NextResponse.json({ agents, skills: customSkills });
}
