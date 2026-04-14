import { NextResponse } from "next/server";

// Real cron data from the gateway - updated by the agent
const CRONS_FILE = "/root/openclaw/mission-control/data/crons.json";
import { readFileSync, writeFileSync, existsSync } from "fs";

export async function GET() {
  try {
    if (existsSync(CRONS_FILE)) {
      const data = JSON.parse(readFileSync(CRONS_FILE, "utf-8"));
      return NextResponse.json(data);
    }
    return NextResponse.json([]);
  } catch {
    return NextResponse.json([]);
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    writeFileSync(CRONS_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to write" }, { status: 500 });
  }
}
