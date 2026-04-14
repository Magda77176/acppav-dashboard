import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA = path.join(process.cwd(), "data");
const WORKSPACE = path.resolve(process.cwd(), "..");

function readJSON(file: string) {
  try { return JSON.parse(fs.readFileSync(path.join(DATA, file), "utf-8")); }
  catch { return []; }
}

function countCSV(file: string) {
  try {
    const lines = fs.readFileSync(file, "utf-8").trim().split("\n");
    return Math.max(0, lines.length - 1); // minus header
  } catch { return 0; }
}

function getAgents() {
  const agentsDir = path.join(WORKSPACE, "agents");
  try {
    return fs.readdirSync(agentsDir)
      .filter(d => fs.existsSync(path.join(agentsDir, d, "AGENT.md")))
      .map(name => {
        const content = fs.readFileSync(path.join(agentsDir, name, "AGENT.md"), "utf-8");
        const titleMatch = content.match(/^#\s+(.+)/m);
        const lines = content.split("\n").length;
        return { name, title: titleMatch?.[1] || name, lines };
      });
  } catch { return []; }
}

function getSkillsCount() {
  const skillsDir = path.join(WORKSPACE, "skills");
  try {
    return fs.readdirSync(skillsDir)
      .filter(d => !["alireza-skills", "anthropic-skills", "obra-superpowers", "scientific-skills", "wshobson-agents"].includes(d))
      .filter(d => fs.existsSync(path.join(skillsDir, d, "SKILL.md")))
      .length;
  } catch { return 0; }
}

function getMemoryToday() {
  const today = new Date().toISOString().split("T")[0];
  const file = path.join(WORKSPACE, "memory", `${today}.md`);
  try {
    const content = fs.readFileSync(file, "utf-8");
    return { exists: true, lines: content.split("\n").length, preview: content.slice(0, 200) };
  } catch { return { exists: false, lines: 0, preview: "" }; }
}

export async function GET() {
  const campaignsRaw = readJSON("campaigns.json");
  const tasksRaw = readJSON("tasks.json");
  const projectsRaw = readJSON("projects.json");
  
  // Handle both array and {key: [...]} formats
  const campaigns = Array.isArray(campaignsRaw) ? campaignsRaw : (campaignsRaw.campaigns || []);
  const tasks = Array.isArray(tasksRaw) ? tasksRaw : (tasksRaw.tasks || []);
  const projects = Array.isArray(projectsRaw) ? projectsRaw : (projectsRaw.projects || []);

  // Count prospects
  const photoCSV = path.join(WORKSPACE, "mission-control/data/photographes-prospects.csv");
  const photoCount = countCSV(photoCSV);

  // Campaign stats
  const campaignsDone = campaigns.filter((c: any) => c.status === "done").length;
  const campaignsPlanned = campaigns.filter((c: any) => c.status === "planned").length;
  const campaignsFailed = campaigns.filter((c: any) => c.status === "failed").length;

  // Email stats from campaigns
  let emailsSent = 0;
  let linkedinSent = 0;
  campaigns.forEach((c: any) => {
    if (c.status === "done") {
      if (c.type === "email" || c.id?.includes("photo") || c.id?.includes("mariage")) {
        emailsSent += c.sent || c.details?.sent || 0;
      }
      if (c.type === "linkedin" || c.id?.includes("li-")) {
        linkedinSent += c.sent || c.details?.sent || 0;
      }
    }
  });

  // Tasks
  const tasksDone = tasks.filter((t: any) => t.status === "done").length;
  const tasksBacklog = tasks.filter((t: any) => t.status === "backlog").length;
  const tasksInProgress = tasks.filter((t: any) => t.status === "in_progress").length;

  // Agents & Skills
  const agents = getAgents();
  const skillsCount = 17; // Hardcoded — custom skills count (updated manually)
  const memory = getMemoryToday();

  // Recent campaigns (last 10)
  const recentCampaigns = [...campaigns]
    .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 10)
    .map((c: any) => ({
      id: c.id,
      name: c.name || c.id,
      type: c.type,
      status: c.status,
      date: c.date,
      sent: c.sent || c.details?.sent || 0,
      result: c.result || null,
    }));

  return NextResponse.json({
    stats: {
      emailsSent,
      linkedinSent,
      photoProspects: photoCount,
      campaignsDone,
      campaignsPlanned,
      campaignsFailed,
      tasksDone,
      tasksBacklog,
      tasksInProgress,
      agentsCount: agents.length,
      skillsCount,
    },
    agents,
    recentCampaigns,
    projects: projects.slice(0, 10),
    memory,
  });
}
