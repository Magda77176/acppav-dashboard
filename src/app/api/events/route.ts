import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "agent-events.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return { events: [] };
  }
}

function save(data: any) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agent = searchParams.get("agent");
  const project = searchParams.get("project");
  const action = searchParams.get("action");
  const limit = parseInt(searchParams.get("limit") || "100");
  const since = searchParams.get("since"); // ISO timestamp

  let { events } = load();

  if (agent) events = events.filter((e: any) => e.agent === agent);
  if (project) events = events.filter((e: any) => e.project === project);
  if (action) events = events.filter((e: any) => e.action === action);
  if (since) events = events.filter((e: any) => e.timestamp >= since);

  // Sort newest first
  events.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));

  // Stats
  const stats = {
    total: events.length,
    by_agent: {} as Record<string, number>,
    by_action: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_project: {} as Record<string, number>,
  };
  for (const e of events) {
    stats.by_agent[e.agent] = (stats.by_agent[e.agent] || 0) + 1;
    stats.by_action[e.action] = (stats.by_action[e.action] || 0) + 1;
    stats.by_status[e.status] = (stats.by_status[e.status] || 0) + 1;
    stats.by_project[e.project] = (stats.by_project[e.project] || 0) + 1;
  }

  return NextResponse.json({ events: events.slice(0, limit), stats });
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();

  if (body.action === "log") {
    // Single event
    const event = {
      id: `evt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      agent: body.agent || "unknown",
      action: body.type || "action",
      project: body.project || "—",
      status: body.status || "info",
      summary: body.summary || "",
      details: body.details || {},
      verified: body.verified || false,
    };
    data.events.unshift(event);
    // Keep last 1000 events
    if (data.events.length > 1000) data.events = data.events.slice(0, 1000);
    save(data);
    return NextResponse.json({ ok: true, id: event.id });
  }

  if (body.action === "batch") {
    // Multiple events
    for (const evt of body.events || []) {
      data.events.unshift({
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: evt.timestamp || new Date().toISOString(),
        agent: evt.agent || "unknown",
        action: evt.type || "action",
        project: evt.project || "—",
        status: evt.status || "info",
        summary: evt.summary || "",
        details: evt.details || {},
        verified: evt.verified || false,
      });
    }
    if (data.events.length > 1000) data.events = data.events.slice(0, 1000);
    save(data);
    return NextResponse.json({ ok: true, count: (body.events || []).length });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
