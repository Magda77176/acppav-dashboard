import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_PATH = path.join(process.cwd(), "data", "candidatures.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return { runs: [], stats: { total_applied: 0, total_runs: 0, avg_per_run: 0, platforms: {}, responses_received: 0, interviews_scheduled: 0 } };
  }
}

function save(data: any) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  return NextResponse.json(load());
}

export async function POST(req: Request) {
  const body = await req.json();
  const data = load();

  if (body.action === "add_run") {
    data.runs.unshift(body.run);
    // Recalculate stats
    data.stats.total_runs = data.runs.length;
    data.stats.total_applied = data.runs.reduce((sum: number, r: any) =>
      sum + r.candidatures.filter((c: any) => c.status === "applied").length, 0
    );
    data.stats.avg_per_run = Math.round((data.stats.total_applied / data.stats.total_runs) * 10) / 10;
    save(data);
    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_run") {
    const idx = data.runs.findIndex((r: any) => r.id === body.runId);
    if (idx >= 0) {
      Object.assign(data.runs[idx], body.patch);
      save(data);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "run not found" }, { status: 404 });
  }

  if (body.action === "update_stats") {
    Object.assign(data.stats, body.stats);
    save(data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
